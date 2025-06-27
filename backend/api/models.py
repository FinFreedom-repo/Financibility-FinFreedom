from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Account(models.Model):
    ACCOUNT_TYPES = [
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('investment', 'Investment'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='checking')
    balance = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
        ('TRANSFER', 'Transfer'),
    ]

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    date = models.DateField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    age = models.IntegerField(null=True, blank=True)
    sex = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], null=True, blank=True)
    marital_status = models.CharField(max_length=20, choices=[('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')], null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class Debt(models.Model):
    DEBT_TYPES = [
        ('credit-card', 'Credit Card'),
        ('personal-loan', 'Personal Loan'),
        ('student-loan', 'Student Loan'),
        ('auto-loan', 'Auto Loan'),
        ('mortgage', 'Mortgage'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    name = models.CharField(max_length=100)
    debt_type = models.CharField(max_length=20, choices=DEBT_TYPES, default='credit-card')
    balance = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"

class FinancialStep(models.Model):
    STEP_CHOICES = [
        (1, 'Save $1,000 for your starter emergency fund'),
        (2, 'Pay off all debt (except the house) using the debt snowball'),
        (3, 'Save 3-6 months of expenses in a fully funded emergency fund'),
        (4, 'Invest 15% of your household income in retirement'),
        (5, 'Save for your children\'s college fund'),
        (6, 'Pay off your home early'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    current_step = models.IntegerField(choices=STEP_CHOICES, default=1)
    emergency_fund_goal = models.DecimalField(max_digits=15, decimal_places=2, default=1000.00)
    emergency_fund_current = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    monthly_expenses = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    retirement_contribution_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    has_children = models.BooleanField(default=False)
    college_fund_goal = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    college_fund_current = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    mortgage_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Step {self.current_step}"

    def sync_with_user_data(self):
        """Sync financial step data with user's actual accounts and debts."""
        try:
            # Calculate emergency fund from savings accounts
            savings_accounts = self.user.accounts.filter(account_type='savings')
            self.emergency_fund_current = savings_accounts.aggregate(
                total=models.Sum('balance')
            )['total'] or Decimal('0.00')
            
            # Calculate mortgage balance
            mortgage_debts = self.user.debts.filter(debt_type='mortgage')
            self.mortgage_balance = mortgage_debts.aggregate(
                total=models.Sum('balance')
            )['total'] or Decimal('0.00')
            
            # Calculate college fund from investment accounts (if applicable)
            if self.has_children:
                investment_accounts = self.user.accounts.filter(account_type='investment')
                self.college_fund_current = investment_accounts.aggregate(
                    total=models.Sum('balance')
                )['total'] or Decimal('0.00')
            
            self.save()
        except Exception as e:
            # If there's an error, just continue with current values
            pass

    def calculate_step_progress(self):
        """Calculate progress for the current step and determine if user should move to next step."""
        try:
            # First sync with user data
            self.sync_with_user_data()
            
            # Step 1: Emergency Fund ($1,000)
            if self.current_step == 1:
                if self.emergency_fund_current >= self.emergency_fund_goal:
                    self.current_step = 2
                    self.save()
                    return {'completed': True, 'next_step': 2}
                return {
                    'completed': False,
                    'progress': min((self.emergency_fund_current / self.emergency_fund_goal) * 100, 100),
                    'current_amount': self.emergency_fund_current,
                    'goal_amount': self.emergency_fund_goal
                }
            
            # Step 2: Pay off all debt (except mortgage)
            elif self.current_step == 2:
                total_debt = self.user.debts.exclude(debt_type='mortgage').aggregate(
                    total=models.Sum('balance')
                )['total'] or Decimal('0.00')
                
                if total_debt <= 0:
                    self.current_step = 3
                    self.save()
                    return {'completed': True, 'next_step': 3}
                return {
                    'completed': False,
                    'progress': 0,  # Can't easily calculate debt payoff progress without historical data
                    'current_debt': total_debt,
                    'goal_amount': 0
                }
            
            # Step 3: 3-6 months emergency fund
            elif self.current_step == 3:
                if self.monthly_expenses > 0:
                    target_emergency = self.monthly_expenses * 6  # 6 months
                    if self.emergency_fund_current >= target_emergency:
                        self.current_step = 4
                        self.save()
                        return {'completed': True, 'next_step': 4}
                    return {
                        'completed': False,
                        'progress': min((self.emergency_fund_current / target_emergency) * 100, 100),
                        'current_amount': self.emergency_fund_current,
                        'goal_amount': target_emergency
                    }
                return {
                    'completed': False,
                    'progress': 0,
                    'message': 'Please set your monthly expenses to calculate emergency fund goal'
                }
            
            # Step 4: Invest 15% in retirement
            elif self.current_step == 4:
                if self.retirement_contribution_percent >= 15:
                    self.current_step = 5
                    self.save()
                    return {'completed': True, 'next_step': 5}
                return {
                    'completed': False,
                    'progress': min((self.retirement_contribution_percent / 15) * 100, 100),
                    'current_percent': self.retirement_contribution_percent,
                    'goal_percent': 15
                }
            
            # Step 5: College fund (if applicable)
            elif self.current_step == 5:
                if not self.has_children:
                    self.current_step = 6
                    self.save()
                    return {'completed': True, 'next_step': 6, 'skipped': True}
                
                if self.college_fund_current >= self.college_fund_goal and self.college_fund_goal > 0:
                    self.current_step = 6
                    self.save()
                    return {'completed': True, 'next_step': 6}
                return {
                    'completed': False,
                    'progress': min((self.college_fund_current / self.college_fund_goal) * 100, 100) if self.college_fund_goal > 0 else 0,
                    'current_amount': self.college_fund_current,
                    'goal_amount': self.college_fund_goal
                }
            
            # Step 6: Pay off mortgage
            elif self.current_step == 6:
                if self.mortgage_balance <= 0:
                    return {'completed': True, 'final_step': True}
                return {
                    'completed': False,
                    'progress': 0,  # Can't easily calculate mortgage payoff progress
                    'current_mortgage': self.mortgage_balance,
                    'goal_amount': 0
                }
            
            return {'completed': False, 'error': 'Invalid step'}
        except Exception as e:
            # Return a safe default response if there's an error
            return {
                'completed': False,
                'progress': 0,
                'error': 'Unable to calculate progress',
                'message': 'There was an error calculating your financial step progress'
            }
