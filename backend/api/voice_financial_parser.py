"""
Voice Financial Parser - AI-powered financial data extraction from natural language
"""
import re
from typing import Dict, Any, Optional
from datetime import datetime


class VoiceFinancialParser:
    """Parse natural language input into structured financial data"""
    
    def __init__(self):
        # Account type keywords
        self.account_keywords = {
            'checking': ['checking', 'check', 'chk'],
            'savings': ['savings', 'save', 'sav'],
            'investment': ['investment', 'invest', 'brokerage', 'stock', 'portfolio', '401k', 'ira'],
            'retirement': ['retirement', 'retire', '401k', 'ira', 'roth', 'pension'],
            'other': ['account', 'bank'],
        }
        
        # Debt type keywords
        self.debt_keywords = {
            'credit-card': ['credit card', 'visa', 'mastercard', 'amex', 'discover', 'card'],
            'personal-loan': ['personal loan', 'loan'],
            'student-loan': ['student loan', 'student debt', 'tuition'],
            'auto-loan': ['auto loan', 'car loan', 'vehicle loan'],
            'mortgage': ['mortgage', 'home loan', 'house payment'],
            'other': ['debt', 'owe'],
        }
        
        # Financial institutions
        self.institutions = [
            'chase', 'bank of america', 'wells fargo', 'citi', 'citibank',
            'capital one', 'discover', 'american express', 'amex',
            'us bank', 'pnc', 'td bank', 'bbt', 'suntrust',
            'ally', 'charles schwab', 'fidelity', 'vanguard',
            'paypal', 'venmo', 'cash app',
        ]

    def parse_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Parse a voice transcript into structured financial data
        
        Args:
            transcript: Natural language financial description
            
        Returns:
            Dictionary with parsed financial data
        """
        transcript_lower = transcript.lower().strip()
        
        result = {
            'type': self._detect_type(transcript_lower),
            'name': self._extract_name(transcript, transcript_lower),
            'amount': self._extract_amount(transcript_lower),
            'category': None,
            'interest_rate': self._extract_interest_rate(transcript_lower),
            'effective_date': datetime.now().strftime('%Y-%m-%d'),
            'payoff_date': None,
            'notes': transcript,
            'confidence': 'medium',
        }
        
        # Determine category based on type
        if result['type'] == 'account':
            result['category'] = self._detect_account_category(transcript_lower)
        else:
            result['category'] = self._detect_debt_category(transcript_lower)
        
        # Extract payoff date for debts
        if result['type'] == 'debt':
            result['payoff_date'] = self._extract_date(transcript_lower, 'payoff')
        
        # Calculate confidence score
        result['confidence'] = self._calculate_confidence(result)
        
        return result

    def _detect_type(self, transcript: str) -> str:
        """Detect if this is an account (asset) or debt (liability)"""
        debt_indicators = ['owe', 'debt', 'loan', 'credit card', 'mortgage', 'borrowed', 'payment']
        account_indicators = ['have', 'account', 'balance', 'savings', 'checking', 'investment']
        
        debt_score = sum(1 for word in debt_indicators if word in transcript)
        account_score = sum(1 for word in account_indicators if word in transcript)
        
        return 'debt' if debt_score > account_score else 'account'

    def _detect_account_category(self, transcript: str) -> str:
        """Detect the account category from keywords"""
        for category, keywords in self.account_keywords.items():
            if any(keyword in transcript for keyword in keywords):
                return category
        return 'checking'  # Default

    def _detect_debt_category(self, transcript: str) -> str:
        """Detect the debt category from keywords"""
        for category, keywords in self.debt_keywords.items():
            if any(keyword in transcript for keyword in keywords):
                return category
        return 'credit-card'  # Default

    def _extract_name(self, transcript: str, transcript_lower: str) -> str:
        """Extract the account/debt name"""
        # Look for financial institutions
        for institution in self.institutions:
            if institution in transcript_lower:
                # Found an institution, use it as part of the name
                institution_title = institution.title()
                
                # Try to add the account/debt type
                if 'checking' in transcript_lower:
                    return f"{institution_title} Checking"
                elif 'savings' in transcript_lower:
                    return f"{institution_title} Savings"
                elif 'credit card' in transcript_lower or 'card' in transcript_lower:
                    return f"{institution_title} Credit Card"
                elif 'mortgage' in transcript_lower:
                    return f"{institution_title} Mortgage"
                else:
                    return institution_title
        
        # Try to extract name from patterns like "my [name] account"
        name_patterns = [
            r'(?:my |the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:account|card|loan)',
            r'(?:account|card|loan)(?: called| named)? ([A-Z][a-z]+(?: [A-Z][a-z]+)*)',
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, transcript)
            if match:
                return match.group(1)
        
        # Default names based on type
        if 'checking' in transcript_lower:
            return 'Checking Account'
        elif 'savings' in transcript_lower:
            return 'Savings Account'
        elif 'credit card' in transcript_lower:
            return 'Credit Card'
        elif 'mortgage' in transcript_lower:
            return 'Mortgage'
        elif 'loan' in transcript_lower:
            return 'Personal Loan'
        
        return 'Financial Account'

    def _extract_amount(self, transcript: str) -> Optional[float]:
        """Extract monetary amount from transcript"""
        # Word to number mapping
        word_to_num = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
            'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
            'million': 1000000
        }
        
        # Patterns for amounts
        patterns = [
            r'\$\s*([0-9,]+(?:\.[0-9]{2})?)',  # $5,000.00
            r'([0-9,]+(?:\.[0-9]{2})?)\s*dollars?',  # 5000 dollars
            r'([0-9]+)\s*thousand',  # 5 thousand
            r'([0-9]+)k',  # 5k
        ]
        
        for pattern in patterns:
            match = re.search(pattern, transcript)
            if match:
                amount_str = match.group(1).replace(',', '')
                
                # Handle thousands
                if 'thousand' in transcript or 'k' in transcript.lower():
                    return float(amount_str) * 1000
                
                return float(amount_str)
        
        # Try to parse word numbers (e.g., "fifteen thousand")
        words = transcript.lower().split()
        try:
            for i, word in enumerate(words):
                if word in word_to_num:
                    # Found a number word
                    num = word_to_num[word]
                    
                    # Check if next word is "thousand", "hundred", etc.
                    if i + 1 < len(words):
                        next_word = words[i + 1]
                        if next_word == 'thousand':
                            return float(num * 1000)
                        elif next_word == 'hundred':
                            return float(num * 100)
                        elif next_word == 'million':
                            return float(num * 1000000)
        except Exception:
            pass
        
        return None

    def _extract_interest_rate(self, transcript: str) -> Optional[float]:
        """Extract interest rate from transcript"""
        patterns = [
            r'([0-9.]+)\s*%',  # 5.5%
            r'([0-9.]+)\s*percent',  # 5.5 percent
            r'interest(?:\s+rate)?(?:\s+of)?\s+([0-9.]+)',  # interest rate of 5.5
            r'at\s+([0-9.]+)',  # at 5.5
        ]
        
        for pattern in patterns:
            match = re.search(pattern, transcript)
            if match:
                return float(match.group(1))
        
        return None

    def _extract_date(self, transcript: str, context: str = '') -> Optional[str]:
        """Extract dates from transcript"""
        # Simple date patterns (can be extended)
        patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # MM/DD/YYYY
            r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD
        ]
        
        for pattern in patterns:
            match = re.search(pattern, transcript)
            if match:
                # Convert to YYYY-MM-DD format
                groups = match.groups()
                if len(groups) == 3:
                    if len(groups[0]) == 4:  # YYYY-MM-DD
                        return f"{groups[0]}-{groups[1]:0>2}-{groups[2]:0>2}"
                    else:  # MM/DD/YYYY
                        return f"{groups[2]}-{groups[0]:0>2}-{groups[1]:0>2}"
        
        return None

    def _calculate_confidence(self, result: Dict[str, Any]) -> str:
        """Calculate confidence score based on extracted data"""
        score = 0
        
        if result['name'] and result['name'] != 'Financial Account':
            score += 1
        if result['amount']:
            score += 2  # Amount is most important
        if result['category']:
            score += 1
        if result['interest_rate']:
            score += 1
        
        if score >= 4:
            return 'high'
        elif score >= 2:
            return 'medium'
        else:
            return 'low'


# Example usage and test cases
if __name__ == '__main__':
    parser = VoiceFinancialParser()
    
    test_cases = [
        "I have a Chase checking account with $5,000",
        "I owe $3,000 on my Visa credit card at 18% interest",
        "My savings account has $10,000 in it",
        "I have a mortgage with Wells Fargo for $250,000 at 3.5 percent",
        "Student loan debt of fifteen thousand dollars",
        "Capital One credit card with a balance of $1,500",
    ]
    
    print("Testing Voice Financial Parser:\n")
    for test in test_cases:
        print(f"Input: {test}")
        result = parser.parse_transcript(test)
        print(f"Output: {result}")
        print("-" * 80)
