"""
Smart Transaction Service - AI-powered transaction categorization and insights
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class SmartTransactionService:
    """Service for AI-powered transaction categorization and insights"""
    
    # Keyword-based categorization rules
    CATEGORY_KEYWORDS = {
        'Dining & Food': [
            'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'burger',
            'pizza', 'sushi', 'bar', 'pub', 'bistro', 'diner', 'grill', 'kitchen',
            'doordash', 'uber eats', 'grubhub', 'postmates', 'delivery', 'takeout'
        ],
        'Groceries': [
            'grocery', 'supermarket', 'walmart', 'target', 'costco', 'safeway',
            'whole foods', 'trader joe', 'kroger', 'publix', 'aldi', 'food lion',
            'market', 'produce', 'fresh'
        ],
        'Transportation': [
            'uber', 'lyft', 'taxi', 'gas', 'fuel', 'shell', 'chevron', 'exxon',
            'bp', 'mobil', 'parking', 'metro', 'train', 'bus', 'transit', 'toll'
        ],
        'Shopping': [
            'amazon', 'ebay', 'store', 'shop', 'retail', 'mall', 'outlet',
            'clothing', 'fashion', 'apparel', 'nike', 'adidas', 'gap', 'h&m',
            'zara', 'forever 21', 'ross', 'tj maxx', 'marshalls'
        ],
        'Entertainment': [
            'movie', 'cinema', 'theater', 'netflix', 'hulu', 'disney', 'spotify',
            'apple music', 'youtube', 'game', 'steam', 'playstation', 'xbox',
            'concert', 'show', 'ticket', 'amusement', 'park', 'entertainment'
        ],
        'Bills & Utilities': [
            'electric', 'power', 'water', 'gas', 'utility', 'internet', 'cable',
            'phone', 'mobile', 'verizon', 'at&t', 't-mobile', 'sprint', 'comcast',
            'spectrum', 'xfinity', 'bill payment', 'auto pay'
        ],
        'Healthcare': [
            'pharmacy', 'cvs', 'walgreens', 'rite aid', 'hospital', 'medical',
            'doctor', 'dental', 'dentist', 'clinic', 'health', 'medicine',
            'prescription', 'rx', 'urgent care'
        ],
        'Travel': [
            'hotel', 'motel', 'airbnb', 'flight', 'airline', 'delta', 'united',
            'american airlines', 'southwest', 'jet blue', 'booking', 'expedia',
            'rental car', 'hertz', 'enterprise', 'avis', 'travel'
        ],
        'Education': [
            'school', 'university', 'college', 'tuition', 'education', 'course',
            'class', 'book', 'textbook', 'udemy', 'coursera', 'learning'
        ],
        'Subscriptions': [
            'subscription', 'monthly', 'annual', 'recurring', 'membership',
            'premium', 'pro', 'plus'
        ],
        'Income': [
            'salary', 'payroll', 'direct deposit', 'deposit', 'payment received',
            'transfer from', 'reimbursement', 'refund', 'income'
        ],
    }
    
    def __init__(self):
        pass
    
    def categorize_transaction(self, description: str, amount: float, merchant: Optional[str] = None) -> str:
        """
        Automatically categorize a transaction based on description and merchant
        
        Args:
            description: Transaction description
            amount: Transaction amount (positive for income, negative for expense)
            merchant: Optional merchant name
            
        Returns:
            Category name
        """
        # Income detection
        if amount > 0:
            search_text = f"{description.lower()} {merchant.lower() if merchant else ''}"
            if any(keyword in search_text for keyword in self.CATEGORY_KEYWORDS['Income']):
                return 'Income'
        
        # Search text
        search_text = f"{description.lower()} {merchant.lower() if merchant else ''}"
        
        # Score each category
        scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if category == 'Income':
                continue
            score = sum(1 for keyword in keywords if keyword in search_text)
            if score > 0:
                scores[category] = score
        
        # Return category with highest score
        if scores:
            return max(scores, key=scores.get)
        
        return 'Other'
    
    def detect_recurring_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """
        Detect recurring transactions (subscriptions, bills)
        
        Args:
            transactions: List of transaction dictionaries
            
        Returns:
            List of detected recurring transactions with metadata
        """
        # Group transactions by normalized description
        grouped = defaultdict(list)
        for t in transactions:
            normalized = self._normalize_description(t.get('description', ''))
            grouped[normalized].append(t)
        
        recurring = []
        for description, trans_list in grouped.items():
            if len(trans_list) < 2:
                continue
            
            # Sort by date
            trans_list.sort(key=lambda x: x.get('date', ''))
            
            # Check if amounts are similar
            amounts = [float(t.get('amount', 0)) for t in trans_list]
            avg_amount = sum(amounts) / len(amounts)
            amount_variance = sum(abs(a - avg_amount) for a in amounts) / len(amounts)
            
            # If amount variance is low (similar amounts)
            if amount_variance < avg_amount * 0.1:  # 10% variance threshold
                # Check date intervals
                dates = [datetime.strptime(t.get('date', ''), '%Y-%m-%d') for t in trans_list if t.get('date')]
                if len(dates) >= 2:
                    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                    avg_interval = sum(intervals) / len(intervals)
                    
                    # Detect frequency
                    frequency = None
                    if 25 <= avg_interval <= 35:
                        frequency = 'monthly'
                    elif 85 <= avg_interval <= 95:
                        frequency = 'quarterly'
                    elif 175 <= avg_interval <= 185:
                        frequency = 'semi-annually'
                    elif 350 <= avg_interval <= 380:
                        frequency = 'annually'
                    elif 6 <= avg_interval <= 8:
                        frequency = 'weekly'
                    elif 13 <= avg_interval <= 15:
                        frequency = 'bi-weekly'
                    
                    if frequency:
                        recurring.append({
                            'description': description,
                            'amount': avg_amount,
                            'frequency': frequency,
                            'last_date': trans_list[-1].get('date'),
                            'next_estimated_date': self._estimate_next_date(dates[-1], avg_interval),
                            'category': trans_list[-1].get('category', 'Other'),
                            'transaction_count': len(trans_list),
                        })
        
        return recurring
    
    def generate_spending_insights(self, transactions: List[Dict], previous_transactions: Optional[List[Dict]] = None) -> Dict:
        """
        Generate spending insights and comparisons
        
        Args:
            transactions: Current period transactions
            previous_transactions: Previous period transactions for comparison
            
        Returns:
            Dictionary of insights
        """
        insights = {
            'total_spent': 0,
            'total_income': 0,
            'net': 0,
            'by_category': {},
            'top_categories': [],
            'top_merchants': [],
            'comparisons': {},
            'alerts': [],
        }
        
        # Calculate current period stats
        category_spending = defaultdict(float)
        merchant_spending = defaultdict(float)
        
        for t in transactions:
            amount = float(t.get('amount', 0))
            category = t.get('category', 'Other')
            merchant = t.get('merchant', t.get('description', 'Unknown'))
            
            if amount < 0:  # Expense
                insights['total_spent'] += abs(amount)
                category_spending[category] += abs(amount)
                merchant_spending[merchant] += abs(amount)
            else:  # Income
                insights['total_income'] += amount
        
        insights['net'] = insights['total_income'] - insights['total_spent']
        insights['by_category'] = dict(category_spending)
        
        # Top categories
        insights['top_categories'] = sorted(
            category_spending.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Top merchants
        insights['top_merchants'] = sorted(
            merchant_spending.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Comparisons with previous period
        if previous_transactions:
            prev_spending = sum(abs(float(t.get('amount', 0))) for t in previous_transactions if float(t.get('amount', 0)) < 0)
            prev_category_spending = defaultdict(float)
            
            for t in previous_transactions:
                amount = float(t.get('amount', 0))
                if amount < 0:
                    category = t.get('category', 'Other')
                    prev_category_spending[category] += abs(amount)
            
            # Overall comparison
            if prev_spending > 0:
                change = ((insights['total_spent'] - prev_spending) / prev_spending) * 100
                insights['comparisons']['overall'] = {
                    'change_percent': round(change, 1),
                    'change_amount': insights['total_spent'] - prev_spending,
                    'direction': 'up' if change > 0 else 'down',
                }
                
                # Alert if spending increased significantly
                if change > 20:
                    insights['alerts'].append({
                        'type': 'warning',
                        'message': f'Your spending increased by {round(change, 1)}% compared to last period',
                    })
            
            # Category comparisons
            insights['comparisons']['by_category'] = {}
            for category, current_amount in category_spending.items():
                prev_amount = prev_category_spending.get(category, 0)
                if prev_amount > 0:
                    change = ((current_amount - prev_amount) / prev_amount) * 100
                    insights['comparisons']['by_category'][category] = {
                        'change_percent': round(change, 1),
                        'change_amount': current_amount - prev_amount,
                        'direction': 'up' if change > 0 else 'down',
                    }
                    
                    # Alert for significant category increases
                    if change > 50 and current_amount > 100:
                        insights['alerts'].append({
                            'type': 'info',
                            'message': f'Your {category} spending increased by {round(change, 1)}%',
                        })
        
        return insights
    
    def suggest_budget_categories(self, transactions: List[Dict]) -> Dict[str, float]:
        """
        Suggest budget amounts based on spending history
        
        Args:
            transactions: List of transaction dictionaries
            
        Returns:
            Dictionary of suggested budget amounts by category
        """
        # Calculate average spending by category over the period
        category_totals = defaultdict(list)
        
        # Group by month
        monthly_data = defaultdict(lambda: defaultdict(float))
        for t in transactions:
            amount = float(t.get('amount', 0))
            if amount >= 0:  # Skip income
                continue
            
            date_str = t.get('date', '')
            if not date_str:
                continue
            
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d')
                month_key = f"{date.year}-{date.month:02d}"
                category = t.get('category', 'Other')
                monthly_data[month_key][category] += abs(amount)
            except:
                continue
        
        # Calculate averages and add buffer
        suggestions = {}
        for month, categories in monthly_data.items():
            for category, amount in categories.items():
                category_totals[category].append(amount)
        
        for category, amounts in category_totals.items():
            if amounts:
                avg = sum(amounts) / len(amounts)
                # Add 20% buffer for flexibility
                suggested = avg * 1.2
                suggestions[category] = round(suggested, 2)
        
        return suggestions
    
    def detect_unusual_transactions(self, transactions: List[Dict], user_history: List[Dict]) -> List[Dict]:
        """
        Detect unusual transactions based on user history
        
        Args:
            transactions: Recent transactions to check
            user_history: Historical transactions for comparison
            
        Returns:
            List of unusual transactions with reasons
        """
        unusual = []
        
        # Calculate typical spending by category
        category_stats = defaultdict(lambda: {'amounts': [], 'avg': 0, 'std': 0})
        
        for t in user_history:
            amount = abs(float(t.get('amount', 0)))
            category = t.get('category', 'Other')
            category_stats[category]['amounts'].append(amount)
        
        # Calculate stats
        for category, stats in category_stats.items():
            amounts = stats['amounts']
            if amounts:
                avg = sum(amounts) / len(amounts)
                variance = sum((x - avg) ** 2 for x in amounts) / len(amounts)
                std = variance ** 0.5
                stats['avg'] = avg
                stats['std'] = std
        
        # Check recent transactions
        for t in transactions:
            amount = abs(float(t.get('amount', 0)))
            category = t.get('category', 'Other')
            
            if category in category_stats:
                stats = category_stats[category]
                if stats['std'] > 0:
                    # Z-score: how many standard deviations from mean
                    z_score = (amount - stats['avg']) / stats['std']
                    
                    if z_score > 2:  # More than 2 standard deviations
                        unusual.append({
                            'transaction': t,
                            'reason': f'Unusually large {category} transaction',
                            'typical_amount': stats['avg'],
                            'z_score': round(z_score, 2),
                        })
        
        return unusual
    
    def _normalize_description(self, description: str) -> str:
        """Normalize transaction description for grouping"""
        # Remove numbers, dates, and special characters
        normalized = re.sub(r'[0-9#*]', '', description.lower())
        # Remove common words
        normalized = re.sub(r'\b(purchase|payment|transaction|auth|pending)\b', '', normalized)
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        return normalized.strip()
    
    def _estimate_next_date(self, last_date: datetime, interval_days: int) -> str:
        """Estimate next transaction date"""
        next_date = last_date + timedelta(days=interval_days)
        return next_date.strftime('%Y-%m-%d')
    
    def extract_merchant_name(self, description: str) -> str:
        """Extract merchant name from transaction description"""
        # Remove common prefixes and suffixes
        cleaned = re.sub(r'^(purchase|payment|debit card|pos|online|mobile)\s+', '', description.lower())
        cleaned = re.sub(r'\s+(purchase|payment|auth|pending)$', '', cleaned)
        
        # Get first few words (usually merchant name)
        words = cleaned.split()[:3]
        merchant = ' '.join(words).title()
        
        return merchant if merchant else description


# Singleton instance
smart_transaction_service = SmartTransactionService()
