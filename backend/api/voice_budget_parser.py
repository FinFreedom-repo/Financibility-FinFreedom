"""
Voice Budget Parser - AI-powered budget data extraction from natural language
"""
import re
from typing import Dict, Any, Optional


class VoiceBudgetParser:
    """Parse natural language budget input into structured budget data"""
    
    def __init__(self):
        # Budget category keywords
        self.expense_keywords = {
            'housing': ['rent', 'mortgage', 'housing', 'apartment', 'house payment'],
            'transportation': ['car', 'gas', 'transportation', 'uber', 'lyft', 'transit', 'subway', 'bus', 'vehicle'],
            'food': ['food', 'groceries', 'grocery', 'restaurant', 'dining', 'eating'],
            'healthcare': ['healthcare', 'health', 'medical', 'doctor', 'insurance', 'medicine'],
            'entertainment': ['entertainment', 'movies', 'concerts', 'streaming', 'netflix', 'spotify'],
            'shopping': ['shopping', 'clothes', 'clothing', 'amazon'],
            'travel': ['travel', 'vacation', 'trip', 'flight', 'hotel'],
            'education': ['education', 'tuition', 'school', 'courses', 'classes'],
            'utilities': ['utilities', 'electric', 'water', 'internet', 'phone', 'cable'],
            'childcare': ['childcare', 'daycare', 'babysitter', 'nanny', 'kids'],
            'debt_payments': ['debt', 'loan payment', 'credit card payment', 'minimum payment'],
            'others': ['other', 'miscellaneous', 'misc'],
        }
        
        # Savings keywords
        self.savings_keywords = {
            'emergency_fund': ['emergency', 'emergency fund', 'savings'],
            'retirement': ['retirement', '401k', 'ira', 'roth', 'pension'],
            'vacation': ['vacation', 'vacation fund', 'travel savings'],
        }
        
        # Income keywords
        self.income_keywords = ['income', 'salary', 'paycheck', 'earn', 'make']

    def parse_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Parse a voice transcript into structured budget data
        
        Args:
            transcript: Natural language budget description
            
        Returns:
            Dictionary with parsed budget data
        """
        transcript_lower = transcript.lower().strip()
        
        result = {
            'income': 0,
            'expenses': {},
            'savings': {},
            'raw_transcript': transcript,
        }
        
        # Extract income
        income = self._extract_income(transcript_lower)
        if income:
            result['income'] = income
        
        # Extract expenses by category
        for category, keywords in self.expense_keywords.items():
            amount = self._extract_category_amount(transcript_lower, keywords)
            if amount:
                result['expenses'][category] = amount
        
        # Extract savings
        for category, keywords in self.savings_keywords.items():
            amount = self._extract_category_amount(transcript_lower, keywords)
            if amount:
                result['savings'][category] = amount
        
        return result

    def _extract_income(self, transcript: str) -> Optional[float]:
        """Extract income amount from transcript"""
        # Look for patterns like "income is $5000" or "I make $5000" or "my salary is $5000"
        income_patterns = [
            r'(?:income|salary|paycheck|earn|make)(?:\s+is|\s+of)?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)',
            r'(?:income|salary|paycheck|earn|make)(?:\s+is|\s+of)?\s+([0-9,]+)\s*(?:dollars?|k)',
        ]
        
        for pattern in income_patterns:
            match = re.search(pattern, transcript)
            if match:
                amount_str = match.group(1).replace(',', '')
                if 'k' in transcript.lower():
                    return float(amount_str) * 1000
                return float(amount_str)
        
        # Look for "monthly income" at the beginning
        match = re.search(r'(?:^|\s)([0-9,]+(?:\.[0-9]{2})?)\s*(?:dollars?\s+)?(?:monthly\s+)?income', transcript)
        if match:
            amount_str = match.group(1).replace(',', '')
            return float(amount_str)
        
        return None

    def _extract_category_amount(self, transcript: str, keywords: list) -> Optional[float]:
        """Extract amount for a specific category"""
        # Build a pattern that looks for amounts near category keywords
        for keyword in keywords:
            # Pattern: keyword ... amount or amount ... keyword
            patterns = [
                rf'{keyword}(?:\s+(?:is|costs?|are|of))?\s*\$?\s*([0-9,]+(?:\.[0-9]{2})?)',
                rf'{keyword}(?:\s+(?:is|costs?|are|of))?\s+([0-9,]+)\s*(?:dollars?|k)',
                rf'\$?\s*([0-9,]+(?:\.[0-9]{2})?)\s*(?:for|on)\s+{keyword}',
                rf'([0-9,]+)\s*(?:dollars?|k)\s*(?:for|on)\s+{keyword}',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, transcript)
                if match:
                    amount_str = match.group(1).replace(',', '')
                    if 'k' in transcript.lower() and keyword in transcript[max(0, match.start()-20):match.end()+20].lower():
                        return float(amount_str) * 1000
                    return float(amount_str)
        
        return None

    def parse_multiple_items(self, transcript: str) -> Dict[str, Any]:
        """
        Parse transcript that may contain multiple budget items
        Example: "I spend $1500 on rent, $400 on food, and $300 on transportation"
        """
        result = self.parse_transcript(transcript)
        
        # Additional parsing for compound statements
        # Split by commas and "and"
        parts = re.split(r',|\s+and\s+', transcript.lower())
        
        for part in parts:
            # Try to extract from each part
            for category, keywords in self.expense_keywords.items():
                if not result['expenses'].get(category):
                    amount = self._extract_category_amount(part, keywords)
                    if amount:
                        result['expenses'][category] = amount
        
        return result


# Example usage and test cases
if __name__ == '__main__':
    parser = VoiceBudgetParser()
    
    test_cases = [
        "My monthly income is $5,000",
        "I spend $1,500 on rent and $400 on food",
        "Transportation costs $300, utilities are $200",
        "I save $500 for emergencies and $300 for retirement",
        "Healthcare is $150, entertainment is $100",
        "My income is $6000, rent is $1800, groceries $500, and car payment $400",
    ]
    
    print("=" * 100)
    print("VOICE BUDGET PARSER TEST SUITE")
    print("=" * 100)
    print()
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Input: \"{test}\"")
        print("-" * 100)
        
        result = parser.parse_transcript(test)
        
        print(f"Parsed Result:")
        if result['income'] > 0:
            print(f"  Income: ${result['income']}")
        
        if result['expenses']:
            print(f"  Expenses:")
            for category, amount in result['expenses'].items():
                print(f"    - {category}: ${amount}")
        
        if result['savings']:
            print(f"  Savings:")
            for category, amount in result['savings'].items():
                print(f"    - {category}: ${amount}")
        
        if result['income'] == 0 and not result['expenses'] and not result['savings']:
            print("  No budget items detected")
        
        print("=" * 100)
