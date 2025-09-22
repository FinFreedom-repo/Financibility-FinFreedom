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
        # Condition: No debt AND Accounts sum > 6 × expenses
        monthly_expenses = self.calculate_monthly_expenses(budget)
        total_accounts = self.calculate_total_accounts(accounts)
        has_no_debt = total_debt <= 0
        accounts_sufficient = total_accounts > (monthly_expenses * Decimal('6'))
        
        print(f"DEBUG Step 3: monthly_expenses={monthly_expenses}, total_accounts={total_accounts}, has_no_debt={has_no_debt}, accounts_sufficient={accounts_sufficient}")
        logger.info(f"Step 3 Debug: monthly_expenses={monthly_expenses}, total_accounts={total_accounts}, has_no_debt={has_no_debt}, accounts_sufficient={accounts_sufficient}")
        
        if has_no_debt and accounts_sufficient:
            # Step 3 is ACTIVE - user meets the conditions
            step3_progress = {
                'completed': True,
                'progress': 100,
                'message': 'Step 3 active: No debt and sufficient accounts'
            }
        else:
            step3_progress = {
                'completed': False,
                'progress': 0,
                'message': f'Step 3 inactive: Requires no debt AND accounts > 6× expenses (need ${monthly_expenses * Decimal("6"):,.2f}, have ${total_accounts:,.2f})'
            }
        
        # Step 4: Invest 15% of income in retirement
        # Condition: Net savings + additional savings > 0.15 × monthly income
        monthly_income = self.calculate_monthly_income(budget)
        net_savings = self.calculate_net_savings(budget)
        additional_savings = self.calculate_additional_savings(budget)
        total_savings = net_savings + additional_savings
        savings_threshold = monthly_income * Decimal('0.15')
        
        print(f"DEBUG Step 4: monthly_income={monthly_income}, net_savings={net_savings}, additional_savings={additional_savings}, total_savings={total_savings}, savings_threshold={savings_threshold}")
        logger.info(f"Step 4 Debug: monthly_income={monthly_income}, net_savings={net_savings}, additional_savings={additional_savings}, total_savings={total_savings}, savings_threshold={savings_threshold}")
        
        if total_savings > savings_threshold:
            # Step 4 is ACTIVE - user meets the conditions
            step4_progress = {
                'completed': True,
                'progress': 100,
                'message': 'Step 4 active: Sufficient savings for retirement investment'
            }
        else:
            step4_progress = {
                'completed': False,
                'progress': 0,
                'message': f'Step 4 inactive: Need ${savings_threshold:,.2f} in savings (currently ${total_savings:,.2f})'
            }
        
        # Step 5: Save for children's college fund
        college_fund_savings = self.calculate_college_fund_savings(budget)
        if college_fund_savings > 0:
            step5_progress = {
                'completed': True,
                'progress': 100,
                'message': f'Step 5 active: ${college_fund_savings:,.2f} saved for children\'s college fund'
            }
        else:
            step5_progress = {
                'completed': False,
                'progress': 0,
                'message': 'Step 5 inactive: No college fund savings detected'
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
            if isinstance(budget, dict):
                value = budget.get(field, 0) or 0
            else:
                value = getattr(budget, field, 0) or 0
            total_expenses += Decimal(str(value))
        
        # Add additional expenses if any
        if isinstance(budget, dict):
            additional_items = budget.get('additional_items', []) or []
        else:
            additional_items = getattr(budget, 'additional_items', []) or []
        for item in additional_items:
            if item.get('type') == 'expense':
                total_expenses += Decimal(str(item.get('amount', 0)))
        
        return total_expenses if total_expenses > 0 else Decimal('3000')
    
    def calculate_monthly_income(self, budget):
        """Calculate monthly income from budget"""
        if not budget:
            return Decimal('5000')  # Default estimate
        
        if isinstance(budget, dict):
            income = budget.get('income', 0) or 0
            additional_income = budget.get('additional_income', 0) or 0
        else:
            income = getattr(budget, 'income', 0) or 0
            additional_income = getattr(budget, 'additional_income', 0) or 0
        
        total_income = income + additional_income
        return Decimal(str(total_income)) if total_income > 0 else Decimal('5000')
    
    def calculate_retirement_contributions(self, accounts):
        """Calculate current retirement contributions"""
        retirement_total = Decimal('0')
        for account in accounts:
            account_type = getattr(account, 'account_type', '') or ''
            if 'retirement' in account_type.lower() or '401k' in account_type.lower() or 'ira' in account_type.lower():
                balance = getattr(account, 'balance', 0) or 0
                retirement_total += Decimal(str(balance))
        return retirement_total
    
    def calculate_total_accounts(self, accounts):
        """Calculate total account balances"""
        total = Decimal('0')
        for account in accounts:
            if isinstance(account, dict):
                balance = account.get('balance', 0) or 0
            else:
                balance = getattr(account, 'balance', 0) or 0
            total += Decimal(str(balance))
        return total
    
    def calculate_net_savings(self, budget):
        """Calculate net savings from budget"""
        if not budget:
            return Decimal('0')
        
        # Calculate total income
        if isinstance(budget, dict):
            income = budget.get('income', 0) or 0
            additional_income = budget.get('additional_income', 0) or 0
        else:
            income = getattr(budget, 'income', 0) or 0
            additional_income = getattr(budget, 'additional_income', 0) or 0
        
        total_income = Decimal(str(income + additional_income))
        
        # Calculate total expenses
        expense_fields = [
            'housing', 'debt_payments', 'transportation', 'utilities',
            'food', 'healthcare', 'entertainment', 'shopping',
            'travel', 'education', 'childcare', 'other'
        ]
        
        total_expenses = Decimal('0')
        for field in expense_fields:
            if isinstance(budget, dict):
                value = budget.get(field, 0) or 0
            else:
                value = getattr(budget, field, 0) or 0
            total_expenses += Decimal(str(value))
        
        # Add additional expenses if any
        if isinstance(budget, dict):
            additional_items = budget.get('additional_items', []) or []
        else:
            additional_items = getattr(budget, 'additional_items', []) or []
        for item in additional_items:
            if item.get('type') == 'expense':
                total_expenses += Decimal(str(item.get('amount', 0)))
        
        return total_income - total_expenses
    
    def calculate_additional_savings(self, budget):
        """Calculate additional savings from budget savings items"""
        if not budget:
            return Decimal('0')
        
        additional_savings = Decimal('0')
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
            
            # Exclude emergency fund from additional savings
            if 'emergency' not in name and 'emergency fund' not in name:
                additional_savings += Decimal(str(amount))
        
        return additional_savings
    
    def calculate_college_fund_savings(self, budget):
        """Calculate college fund savings from budget savings items"""
        if not budget:
            return Decimal('0')
        
        college_fund_savings = Decimal('0')
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
            
            # Check for college fund related names
            if any(keyword in name for keyword in ['college', 'children', 'child', 'education fund', 'college fund']):
                college_fund_savings += Decimal(str(amount))
        
        return college_fund_savings
    
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
        """Determine which step the user is currently on (independent steps)"""
        # Find the first incomplete step that is active (not inactive)
        for i, step in enumerate(step_progresses, 1):
            if not step['completed'] and 'inactive' not in step.get('message', '').lower():
                return i
        return 6  # All active steps completed
    
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
