"""
Financial Health Score Calculator - Copilot Money style health scoring
"""

from typing import Dict, List
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class FinancialHealthScoreCalculator:
    """Calculate a comprehensive financial health score"""
    
    def __init__(self):
        pass
    
    def calculate_score(
        self,
        accounts: List[Dict],
        debts: List[Dict],
        budgets: List[Dict],
        transactions: List[Dict],
    ) -> Dict:
        """
        Calculate overall financial health score (0-100)
        
        Components:
        - Net Worth (25 points)
        - Savings Rate (20 points)
        - Debt-to-Income Ratio (20 points)
        - Emergency Fund (15 points)
        - Budget Adherence (10 points)
        - Spending Trends (10 points)
        
        Args:
            accounts: List of user accounts
            debts: List of user debts
            budgets: List of user budgets
            transactions: List of user transactions
            
        Returns:
            Dictionary with score and breakdown
        """
        try:
            score_breakdown = {}
            
            # 1. Net Worth Score (25 points)
            net_worth_score = self._calculate_net_worth_score(accounts, debts)
            score_breakdown['net_worth'] = net_worth_score
            
            # 2. Savings Rate Score (20 points)
            savings_rate_score = self._calculate_savings_rate_score(budgets, transactions)
            score_breakdown['savings_rate'] = savings_rate_score
            
            # 3. Debt-to-Income Ratio Score (20 points)
            debt_ratio_score = self._calculate_debt_ratio_score(debts, budgets)
            score_breakdown['debt_ratio'] = debt_ratio_score
            
            # 4. Emergency Fund Score (15 points)
            emergency_fund_score = self._calculate_emergency_fund_score(accounts, budgets)
            score_breakdown['emergency_fund'] = emergency_fund_score
            
            # 5. Budget Adherence Score (10 points)
            budget_adherence_score = self._calculate_budget_adherence_score(budgets, transactions)
            score_breakdown['budget_adherence'] = budget_adherence_score
            
            # 6. Spending Trends Score (10 points)
            spending_trends_score = self._calculate_spending_trends_score(transactions)
            score_breakdown['spending_trends'] = spending_trends_score
            
            # Calculate total score
            total_score = (
                net_worth_score['score'] +
                savings_rate_score['score'] +
                debt_ratio_score['score'] +
                emergency_fund_score['score'] +
                budget_adherence_score['score'] +
                spending_trends_score['score']
            )
            
            # Determine grade
            grade = self._get_grade(total_score)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(score_breakdown)
            
            return {
                'total_score': round(total_score, 1),
                'grade': grade,
                'breakdown': score_breakdown,
                'recommendations': recommendations,
                'calculated_at': datetime.now().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error calculating financial health score: {e}")
            return {
                'total_score': 0,
                'grade': 'N/A',
                'breakdown': {},
                'recommendations': [],
                'error': str(e),
            }
    
    def _calculate_net_worth_score(self, accounts: List[Dict], debts: List[Dict]) -> Dict:
        """Calculate net worth score (25 points max)"""
        try:
            total_assets = sum(float(acc.get('balance', 0)) for acc in accounts)
            total_debts = sum(float(debt.get('balance', debt.get('amount', 0))) for debt in debts)
            net_worth = total_assets - total_debts
            
            # Score based on net worth
            # Positive net worth is good
            if net_worth >= 100000:
                score = 25
                rating = 'excellent'
            elif net_worth >= 50000:
                score = 20
                rating = 'good'
            elif net_worth >= 10000:
                score = 15
                rating = 'fair'
            elif net_worth >= 0:
                score = 10
                rating = 'needs improvement'
            else:
                # Negative net worth
                score = max(0, 10 + (net_worth / 10000))  # Scale down from 10
                rating = 'poor'
            
            return {
                'score': max(0, score),
                'max_score': 25,
                'rating': rating,
                'net_worth': net_worth,
                'assets': total_assets,
                'liabilities': total_debts,
            }
        except Exception as e:
            logger.error(f"Error calculating net worth score: {e}")
            return {'score': 0, 'max_score': 25, 'rating': 'n/a', 'error': str(e)}
    
    def _calculate_savings_rate_score(self, budgets: List[Dict], transactions: List[Dict]) -> Dict:
        """Calculate savings rate score (20 points max)"""
        try:
            # Get recent budget (last month)
            if not budgets:
                return {'score': 0, 'max_score': 20, 'rating': 'n/a', 'savings_rate': 0}
            
            recent_budget = max(budgets, key=lambda b: (b.get('year', 0), b.get('month', 0)))
            
            income = float(recent_budget.get('income', 0)) + float(recent_budget.get('additional_income', 0))
            
            # Calculate expenses from budget
            expenses = recent_budget.get('expenses', {})
            total_expenses = sum(float(expenses.get(cat, 0)) for cat in expenses)
            
            if income == 0:
                return {'score': 0, 'max_score': 20, 'rating': 'n/a', 'savings_rate': 0}
            
            savings = income - total_expenses
            savings_rate = (savings / income) * 100
            
            # Score based on savings rate
            if savings_rate >= 30:
                score = 20
                rating = 'excellent'
            elif savings_rate >= 20:
                score = 16
                rating = 'good'
            elif savings_rate >= 10:
                score = 12
                rating = 'fair'
            elif savings_rate >= 5:
                score = 8
                rating = 'needs improvement'
            elif savings_rate >= 0:
                score = 4
                rating = 'poor'
            else:
                score = 0
                rating = 'critical'
            
            return {
                'score': score,
                'max_score': 20,
                'rating': rating,
                'savings_rate': round(savings_rate, 1),
                'monthly_savings': savings,
            }
        except Exception as e:
            logger.error(f"Error calculating savings rate score: {e}")
            return {'score': 0, 'max_score': 20, 'rating': 'n/a', 'savings_rate': 0}
    
    def _calculate_debt_ratio_score(self, debts: List[Dict], budgets: List[Dict]) -> Dict:
        """Calculate debt-to-income ratio score (20 points max)"""
        try:
            if not budgets:
                return {'score': 0, 'max_score': 20, 'rating': 'n/a', 'debt_ratio': 0}
            
            # Get recent budget
            recent_budget = max(budgets, key=lambda b: (b.get('year', 0), b.get('month', 0)))
            monthly_income = float(recent_budget.get('income', 0)) + float(recent_budget.get('additional_income', 0))
            
            if monthly_income == 0:
                return {'score': 0, 'max_score': 20, 'rating': 'n/a', 'debt_ratio': 0}
            
            # Calculate monthly debt payments (assume 3% of balance for non-mortgage)
            total_debt_payment = 0
            for debt in debts:
                debt_type = debt.get('debt_type', 'loan')
                balance = float(debt.get('balance', debt.get('amount', 0)))
                
                if debt_type == 'mortgage':
                    # Assume 30-year mortgage
                    total_debt_payment += balance * 0.005  # ~0.5% of balance
                else:
                    # Other debts: assume 3% of balance
                    total_debt_payment += balance * 0.03
            
            debt_ratio = (total_debt_payment / monthly_income) * 100
            
            # Score based on debt-to-income ratio
            if debt_ratio == 0:
                score = 20
                rating = 'excellent'
            elif debt_ratio <= 15:
                score = 18
                rating = 'excellent'
            elif debt_ratio <= 28:
                score = 15
                rating = 'good'
            elif debt_ratio <= 36:
                score = 12
                rating = 'fair'
            elif debt_ratio <= 50:
                score = 8
                rating = 'needs improvement'
            else:
                score = 4
                rating = 'poor'
            
            return {
                'score': score,
                'max_score': 20,
                'rating': rating,
                'debt_ratio': round(debt_ratio, 1),
                'monthly_debt_payment': total_debt_payment,
                'monthly_income': monthly_income,
            }
        except Exception as e:
            logger.error(f"Error calculating debt ratio score: {e}")
            return {'score': 0, 'max_score': 20, 'rating': 'n/a', 'debt_ratio': 0}
    
    def _calculate_emergency_fund_score(self, accounts: List[Dict], budgets: List[Dict]) -> Dict:
        """Calculate emergency fund score (15 points max)"""
        try:
            # Calculate liquid savings (checking + savings accounts)
            liquid_savings = sum(
                float(acc.get('balance', 0))
                for acc in accounts
                if acc.get('account_type') in ['checking', 'savings']
            )
            
            if not budgets:
                return {'score': 0, 'max_score': 15, 'rating': 'n/a', 'months_covered': 0}
            
            # Get recent budget
            recent_budget = max(budgets, key=lambda b: (b.get('year', 0), b.get('month', 0)))
            expenses = recent_budget.get('expenses', {})
            monthly_expenses = sum(float(expenses.get(cat, 0)) for cat in expenses)
            
            if monthly_expenses == 0:
                return {'score': 0, 'max_score': 15, 'rating': 'n/a', 'months_covered': 0}
            
            months_covered = liquid_savings / monthly_expenses
            
            # Score based on months of expenses covered
            if months_covered >= 6:
                score = 15
                rating = 'excellent'
            elif months_covered >= 3:
                score = 12
                rating = 'good'
            elif months_covered >= 1:
                score = 8
                rating = 'fair'
            elif months_covered >= 0.5:
                score = 4
                rating = 'needs improvement'
            else:
                score = 2
                rating = 'poor'
            
            return {
                'score': score,
                'max_score': 15,
                'rating': rating,
                'months_covered': round(months_covered, 1),
                'liquid_savings': liquid_savings,
                'monthly_expenses': monthly_expenses,
            }
        except Exception as e:
            logger.error(f"Error calculating emergency fund score: {e}")
            return {'score': 0, 'max_score': 15, 'rating': 'n/a', 'months_covered': 0}
    
    def _calculate_budget_adherence_score(self, budgets: List[Dict], transactions: List[Dict]) -> Dict:
        """Calculate budget adherence score (10 points max)"""
        try:
            # This is a simplified version - would need actual vs budgeted comparison
            # For now, just check if user has a budget
            if budgets:
                score = 10
                rating = 'good'
            else:
                score = 0
                rating = 'none'
            
            return {
                'score': score,
                'max_score': 10,
                'rating': rating,
            }
        except Exception as e:
            logger.error(f"Error calculating budget adherence score: {e}")
            return {'score': 0, 'max_score': 10, 'rating': 'n/a'}
    
    def _calculate_spending_trends_score(self, transactions: List[Dict]) -> Dict:
        """Calculate spending trends score (10 points max)"""
        try:
            # Analyze if spending is increasing or decreasing
            # This month vs last month
            today = datetime.now()
            this_month_start = today.replace(day=1)
            last_month_end = this_month_start - timedelta(days=1)
            last_month_start = last_month_end.replace(day=1)
            
            this_month_spending = sum(
                abs(float(t.get('amount', 0)))
                for t in transactions
                if t.get('date') and 
                datetime.strptime(t['date'], '%Y-%m-%d') >= this_month_start and
                float(t.get('amount', 0)) < 0
            )
            
            last_month_spending = sum(
                abs(float(t.get('amount', 0)))
                for t in transactions
                if t.get('date') and 
                last_month_start <= datetime.strptime(t['date'], '%Y-%m-%d') < this_month_start and
                float(t.get('amount', 0)) < 0
            )
            
            if last_month_spending == 0:
                return {'score': 5, 'max_score': 10, 'rating': 'n/a', 'trend': 'neutral'}
            
            change_percent = ((this_month_spending - last_month_spending) / last_month_spending) * 100
            
            if change_percent <= -10:
                score = 10
                rating = 'excellent'
                trend = 'decreasing'
            elif change_percent <= 0:
                score = 8
                rating = 'good'
                trend = 'stable'
            elif change_percent <= 10:
                score = 6
                rating = 'fair'
                trend = 'slight increase'
            elif change_percent <= 20:
                score = 4
                rating = 'needs improvement'
                trend = 'increasing'
            else:
                score = 2
                rating = 'poor'
                trend = 'rapidly increasing'
            
            return {
                'score': score,
                'max_score': 10,
                'rating': rating,
                'trend': trend,
                'change_percent': round(change_percent, 1),
            }
        except Exception as e:
            logger.error(f"Error calculating spending trends score: {e}")
            return {'score': 5, 'max_score': 10, 'rating': 'n/a', 'trend': 'neutral'}
    
    def _get_grade(self, score: float) -> str:
        """Get letter grade from score"""
        if score >= 90:
            return 'A+'
        elif score >= 85:
            return 'A'
        elif score >= 80:
            return 'A-'
        elif score >= 75:
            return 'B+'
        elif score >= 70:
            return 'B'
        elif score >= 65:
            return 'B-'
        elif score >= 60:
            return 'C+'
        elif score >= 55:
            return 'C'
        elif score >= 50:
            return 'C-'
        elif score >= 45:
            return 'D+'
        elif score >= 40:
            return 'D'
        else:
            return 'F'
    
    def _generate_recommendations(self, breakdown: Dict) -> List[str]:
        """Generate actionable recommendations based on score breakdown"""
        recommendations = []
        
        # Net Worth recommendations
        net_worth_data = breakdown.get('net_worth', {})
        if net_worth_data.get('rating') in ['poor', 'needs improvement']:
            if net_worth_data.get('net_worth', 0) < 0:
                recommendations.append('Focus on paying down debt to improve your net worth')
            else:
                recommendations.append('Build your savings to increase your net worth')
        
        # Savings Rate recommendations
        savings_data = breakdown.get('savings_rate', {})
        if savings_data.get('rating') in ['poor', 'needs improvement', 'fair']:
            recommendations.append(f'Aim to save at least 20% of your income (currently {savings_data.get("savings_rate", 0)}%)')
        
        # Debt Ratio recommendations
        debt_data = breakdown.get('debt_ratio', {})
        if debt_data.get('rating') in ['poor', 'needs improvement']:
            recommendations.append(f'Work on reducing your debt-to-income ratio (currently {debt_data.get("debt_ratio", 0)}%)')
        
        # Emergency Fund recommendations
        emergency_data = breakdown.get('emergency_fund', {})
        months = emergency_data.get('months_covered', 0)
        if months < 3:
            recommendations.append(f'Build an emergency fund to cover at least 3 months of expenses (currently {months:.1f} months)')
        
        # Spending Trends recommendations
        trends_data = breakdown.get('spending_trends', {})
        if trends_data.get('trend') in ['increasing', 'rapidly increasing']:
            recommendations.append('Your spending is increasing - review your budget and identify areas to cut back')
        
        return recommendations


# Singleton instance
financial_health_calculator = FinancialHealthScoreCalculator()
