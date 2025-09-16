from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from .mongodb_service import BudgetService
from .mongodb_services import MongoFinancialStep, MongoAccount, MongoDebt, MongoBudget
from .mongodb_authentication import get_user_from_token
from decimal import Decimal
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class FinancialStepsView(APIView):
    """
    API view for calculating financial steps progress
    """
    
    def get(self, request):
        """
        Calculate financial steps progress for the authenticated user
        """
        try:
            # Get user from token
            user = get_user_from_token(request)
            
            if not user or not hasattr(user, 'id'):
                logger.warning("Authentication failed, returning test data")
                return Response(self.get_test_data(), status=status.HTTP_200_OK)
            
            user_id = user.id
            logger.info(f"Calculating financial steps for user: {user_id}")
            
            # Get user's financial data
            budget_service = BudgetService()
            from .mongodb_services import MongoDBService
            mongo_service = MongoDBService()
            
            accounts = mongo_service.get_user_accounts(user_id)
            debts = mongo_service.get_user_debts(user_id)
            budgets = budget_service.get_user_budgets(user_id)
            
            logger.info(f"Debts data for user {user_id}: {debts}")
            logger.info(f"Number of debts: {len(debts)}")
            
            # Get the most recent budget with Emergency Fund data
            budget = None
            if budgets:
                # Look for the most recent budget with Emergency Fund data
                for b in budgets:
                    savings_items = b.get('savings_items', [])
                    if savings_items and any(item.get('name') == 'Emergency Fund' for item in savings_items):
                        budget = b
                        break
                
                # If no budget with Emergency Fund found, use the most recent budget
                if not budget:
                    budget = budgets[0]
            
            logger.info(f"Budget data for user {user_id}: {budget}")
            if budget:
                logger.info(f"Budget savings_items: {getattr(budget, 'savings_items', [])}")
            
            # Calculate financial steps progress
            steps_data = self.calculate_financial_steps(accounts, debts, budget, user_id)
            
            logger.info(f"Financial steps result: {steps_data}")
            return Response(steps_data)
            
        except Exception as e:
            logger.error(f"Error calculating financial steps: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to calculate financial steps'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_test_data(self):
        """Return test data for financial steps"""
        test_accounts = [
            {'type': 'savings', 'balance': 1500},
            {'type': 'checking', 'balance': 500}
        ]
        
        test_debts = [
            {'type': 'credit_card', 'balance': 2500, 'rate': 0.18},
            {'type': 'student_loan', 'balance': 15000, 'rate': 0.05}
        ]
        
        test_budget = {
            'income': 6000,
            'housing': 1500,
            'utilities': 200,
            'food': 400,
            'transportation': 300,
            'debt_payments': 500,
            'other': 200
        }
        
        steps_data = self.calculate_financial_steps(test_accounts, test_debts, test_budget, 'test_user')
        return steps_data
    
    def calculate_financial_steps(self, accounts, debts, budget, user_id):
        """
        Calculate progress for each financial step
        """
        # Step 1: Emergency Fund ($2,000)
        emergency_fund_goal = Decimal('2000.00')
        emergency_fund_current = self.calculate_emergency_fund(budget)
        step1_progress = self.calculate_step_progress(emergency_fund_current, emergency_fund_goal)
        
        # Step 2: Pay off all debt (except house)
        total_debt = self.calculate_total_debt(debts)
        step2_progress = self.calculate_debt_progress(debts)
        
        # Step 3: 3-6 months of expenses in emergency fund
        monthly_expenses = self.calculate_monthly_expenses(budget)
        emergency_fund_goal_3_6_months = monthly_expenses * Decimal('6')  # 6 months
        step3_progress = self.calculate_step_progress(emergency_fund_current, emergency_fund_goal_3_6_months)
        
        # Step 4: Invest 15% of income in retirement
        monthly_income = self.calculate_monthly_income(budget)
        retirement_goal = monthly_income * Decimal('0.15')  # 15%
        retirement_current = self.calculate_retirement_contributions(accounts)
        step4_progress = self.calculate_step_progress(retirement_current, retirement_goal)
        
        # Step 5: Save for children's college fund (simplified - assume no children for now)
        step5_progress = {
            'completed': False,
            'progress': 0,
            'message': 'No children detected - step not applicable'
        }
        
        # Step 6: Pay off home early
        mortgage_balance = self.calculate_mortgage_balance(debts)
        step6_progress = self.calculate_mortgage_progress(mortgage_balance)
        
        # Determine current step
        current_step = self.determine_current_step([
            step1_progress, step2_progress, step3_progress, 
            step4_progress, step5_progress, step6_progress
        ])
        
        # Get current step progress details
        step_progress = self.get_current_step_details(current_step, [
            step1_progress, step2_progress, step3_progress,
            step4_progress, step5_progress, step6_progress
        ])
        
        return {
            'current_step': current_step,
            'step_progress': step_progress,
            'steps': {
                'step_1': step1_progress,
                'step_2': step2_progress,
                'step_3': step3_progress,
                'step_4': step4_progress,
                'step_5': step5_progress,
                'step_6': step6_progress
            }
        }
    
    def calculate_emergency_fund(self, budget):
        """Calculate current emergency fund from budget savings items"""
        emergency_fund = Decimal('0')
        if budget:
            # Handle both dictionary and object formats
            if isinstance(budget, dict):
                savings_items = budget.get('savings_items', []) or []
            else:
                savings_items = getattr(budget, 'savings_items', []) or []
            for item in savings_items:
                if isinstance(item, dict):
                    # Handle dictionary format
                    name = item.get('name', '').lower()
                    amount = item.get('amount', 0) or 0
                else:
                    # Handle object format
                    name = getattr(item, 'name', '').lower()
                    amount = getattr(item, 'amount', 0) or 0
                
                if 'emergency' in name or 'emergency fund' in name:
                    emergency_fund += Decimal(str(amount))
        return emergency_fund
    
    def calculate_total_debt(self, debts):
        """Calculate total debt excluding mortgage"""
        total_debt = Decimal('0')
        for debt in debts:
            debt_type = getattr(debt, 'debt_type', '') or ''
            if 'mortgage' not in debt_type.lower() and 'home' not in debt_type.lower():
                balance = getattr(debt, 'balance', 0) or 0
                total_debt += Decimal(str(balance))
        return total_debt
    
    def calculate_monthly_expenses(self, budget):
        """Calculate monthly expenses from budget"""
        if not budget:
            return Decimal('3000')  # Default estimate
        
        expense_fields = [
            'housing', 'debt_payments', 'transportation', 'utilities',
            'food', 'healthcare', 'entertainment', 'shopping',
            'travel', 'education', 'childcare', 'other'
        ]
        
        total_expenses = Decimal('0')
        for field in expense_fields:
            value = getattr(budget, field, 0) or 0
            total_expenses += Decimal(str(value))
        
        # Add additional expenses if any
        additional_items = getattr(budget, 'additional_items', []) or []
        for item in additional_items:
            if item.get('type') == 'expense':
                total_expenses += Decimal(str(item.get('amount', 0)))
        
        return total_expenses if total_expenses > 0 else Decimal('3000')
    
    def calculate_monthly_income(self, budget):
        """Calculate monthly income from budget"""
        if not budget:
            return Decimal('5000')  # Default estimate
        
        income = getattr(budget, 'income', 0) or 0
        return Decimal(str(income)) if income > 0 else Decimal('5000')
    
    def calculate_retirement_contributions(self, accounts):
        """Calculate current retirement contributions"""
        retirement_total = Decimal('0')
        for account in accounts:
            account_type = getattr(account, 'account_type', '') or ''
            if 'retirement' in account_type.lower() or '401k' in account_type.lower() or 'ira' in account_type.lower():
                balance = getattr(account, 'balance', 0) or 0
                retirement_total += Decimal(str(balance))
        return retirement_total
    
    def calculate_mortgage_balance(self, debts):
        """Calculate mortgage balance"""
        for debt in debts:
            debt_type = getattr(debt, 'debt_type', '') or ''
            if 'mortgage' in debt_type.lower() or 'home' in debt_type.lower():
                balance = getattr(debt, 'balance', 0) or 0
                return Decimal(str(balance))
        return Decimal('0')
    
    def calculate_step_progress(self, current, goal):
        """Calculate progress for a step"""
        if goal <= 0:
            return {
                'completed': True,
                'progress': 100,
                'message': 'Goal already achieved'
            }
        
        progress_percent = min((current / goal) * 100, 100)
        completed = progress_percent >= 100
        
        return {
            'completed': completed,
            'progress': float(progress_percent),
            'current_amount': float(current),
            'goal_amount': float(goal),
            'message': f'${current:,.2f} of ${goal:,.2f}'
        }
    
    def calculate_debt_progress(self, debts):
        """Calculate debt payoff progress"""
        non_mortgage_debts = []
        for debt in debts:
            # Handle both dictionary and object formats
            if isinstance(debt, dict):
                debt_type = debt.get('debt_type', '') or ''
                balance = debt.get('balance', 0) or 0
            else:
                debt_type = getattr(debt, 'debt_type', '') or ''
                balance = getattr(debt, 'balance', 0) or 0
            
            if 'mortgage' not in debt_type.lower() and 'home' not in debt_type.lower():
                non_mortgage_debts.append(debt)
        
        if not non_mortgage_debts:
            return {
                'completed': True,
                'progress': 100,
                'message': 'No non-mortgage debt found'
            }
        
        total_debt = Decimal('0')
        for debt in non_mortgage_debts:
            # Handle both dictionary and object formats
            if isinstance(debt, dict):
                balance = debt.get('balance', 0) or 0
            else:
                balance = getattr(debt, 'balance', 0) or 0
            total_debt += Decimal(str(balance))
        
        if total_debt <= 0:
            return {
                'completed': True,
                'progress': 100,
                'message': 'All debt paid off!'
            }
        
        # For debt, we show progress as amount remaining
        return {
            'completed': False,
            'progress': 0,  # Will be calculated based on payments made
            'current_debt': float(total_debt),
            'max_total_debt': float(total_debt),
            'message': f'${total_debt:,.2f} in debt remaining'
        }
    
    def calculate_mortgage_progress(self, mortgage_balance):
        """Calculate mortgage payoff progress"""
        if mortgage_balance <= 0:
            return {
                'completed': True,
                'progress': 100,
                'message': 'No mortgage debt'
            }
        
        return {
            'completed': False,
            'progress': 0,  # Will be calculated based on payments made
            'current_amount': float(mortgage_balance),
            'goal_amount': 0,  # Goal is to pay off completely
            'message': f'${mortgage_balance:,.2f} mortgage remaining'
        }
    
    def determine_current_step(self, step_progresses):
        """Determine which step the user is currently on"""
        for i, step in enumerate(step_progresses, 1):
            if not step['completed']:
                return i
        return 6  # All steps completed
    
    def get_current_step_details(self, current_step, step_progresses):
        """Get detailed progress for the current step"""
        if current_step > len(step_progresses):
            return {
                'completed': True,
                'progress': 100,
                'message': 'All steps completed!'
            }
        
        return step_progresses[current_step - 1]


@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def financial_steps_calculate_test(request):
    """
    Test endpoint for financial steps calculation (no authentication required)
    """
    try:
        # Use test data
        test_accounts = [
            {'type': 'savings', 'balance': 1500},
            {'type': 'checking', 'balance': 500}
        ]
        
        test_debts = [
            {'type': 'credit_card', 'balance': 2500, 'rate': 0.18},
            {'type': 'student_loan', 'balance': 15000, 'rate': 0.05}
        ]
        
        test_budget = {
            'income': 6000,
            'housing': 1500,
            'utilities': 200,
            'food': 400,
            'transportation': 300,
            'debt_payments': 500,
            'other': 200
        }
        
        # Create a temporary instance to use the calculation method
        view = FinancialStepsView()
        steps_data = view.calculate_financial_steps(test_accounts, test_debts, test_budget, 'test_user')
        
        return Response(steps_data)
        
    except Exception as e:
        logger.error(f"Error in test financial steps calculation: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to calculate test financial steps'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
