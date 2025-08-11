from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import date

def today():
    return date.today()

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
    effective_date = models.DateField(default=today, help_text="Date this balance is effective for")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    def save(self, *args, **kwargs):
        # Update existing record instead of creating new one
        super().save(*args, **kwargs)

    @classmethod
    def latest_for_user_and_name(cls, user, name):
        """Get the latest account record for a user and account name."""
        return cls.objects.filter(user=user, name=name).order_by('-effective_date', '-created_at').first()

class AccountAudit(models.Model):
    """Audit trail for account changes"""
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='audit_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    old_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    new_balance = models.DecimalField(max_digits=15, decimal_places=2)
    old_interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    new_interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    effective_date = models.DateField(help_text="Date this change is effective for")
    change_reason = models.CharField(max_length=200, blank=True, help_text="Reason for the change")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account.name} - {self.effective_date} - {self.new_balance}"

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
    effective_date = models.DateField(default=today, help_text="Date this transaction is effective for")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

    def save(self, *args, **kwargs):
        # Check if this is an update (not a new record)
        if self.pk:
            try:
                old_instance = Transaction.objects.get(pk=self.pk)
                # Create audit record if amount or description changed
                if (old_instance.amount != self.amount or 
                    old_instance.description != self.description):
                    TransactionAudit.objects.create(
                        transaction=self,
                        user=self.user,
                        old_amount=old_instance.amount,
                        new_amount=self.amount,
                        old_description=old_instance.description,
                        new_description=self.description,
                        effective_date=self.effective_date,
                        change_reason=f"Updated transaction: {self.description}"
                    )
            except Transaction.DoesNotExist:
                pass  # This shouldn't happen, but handle gracefully
        
        super().save(*args, **kwargs)

class TransactionAudit(models.Model):
    """Audit trail for transaction changes"""
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='audit_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    old_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_amount = models.DecimalField(max_digits=10, decimal_places=2)
    old_description = models.CharField(max_length=200, null=True, blank=True)
    new_description = models.CharField(max_length=200)
    effective_date = models.DateField(help_text="Date this change is effective for")
    change_reason = models.CharField(max_length=200, blank=True, help_text="Reason for the change")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction.description} - {self.effective_date} - {self.new_amount}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    age = models.IntegerField(null=True, blank=True)
    sex = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], null=True, blank=True)
    marital_status = models.CharField(max_length=20, choices=[('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')], null=True, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    effective_date = models.DateField(default=today, help_text="Date this balance is effective for")
    payoff_date = models.DateField(null=True, blank=True, help_text="Expected payoff date")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    def save(self, *args, **kwargs):
        # Update existing record instead of creating new one
        super().save(*args, **kwargs)

    @classmethod
    def latest_for_user_and_name(cls, user, name):
        """Get the latest debt record for a user and debt name."""
        return cls.objects.filter(user=user, name=name).order_by('-effective_date', '-created_at').first()

class DebtAudit(models.Model):
    """Audit trail for debt changes"""
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='audit_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    old_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    new_balance = models.DecimalField(max_digits=15, decimal_places=2)
    old_interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    new_interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    effective_date = models.DateField(help_text="Date this change is effective for")
    change_reason = models.CharField(max_length=200, blank=True, help_text="Reason for the change")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.debt.name} - {self.effective_date} - {self.new_balance}"

class FinancialStep(models.Model):
    STEP_CHOICES = [
        (1, 'Save $2,000 for your starter emergency fund'),
        (2, 'Pay off all debt (except the house) using the debt snowball'),
        (3, 'Save 3-6 months of expenses in a fully funded emergency fund'),
        (4, 'Invest 15% of your household income in retirement'),
        (5, 'Save for your children\'s college fund'),
        (6, 'Pay off your home early'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    current_step = models.IntegerField(choices=STEP_CHOICES, default=1)
    emergency_fund_goal = models.DecimalField(max_digits=15, decimal_places=2, default=2000.00)
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
            # Calculate emergency fund from ALL accounts (not just savings)
            all_accounts = self.user.accounts.all()
            self.emergency_fund_current = all_accounts.aggregate(
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
