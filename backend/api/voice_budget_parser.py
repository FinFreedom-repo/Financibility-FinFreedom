"""
Voice Budget Parser - AI-powered budget data extraction from natural language
"""
import re
import os
import json
from typing import Dict, Any, Optional
import requests


class VoiceBudgetParser:
    """Parse natural language budget input into structured budget data using Grok AI"""
    
    def __init__(self):
        self.grok_api_key = os.getenv('GROK_API_KEY')
        self.use_ai = bool(self.grok_api_key and self.grok_api_key != 'your_grok_api_key_here')
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

    def parse_transcript(self, transcript: str, streaming: bool = False) -> Dict[str, Any]:
        """
        Parse a voice transcript into structured budget data
        
        Args:
            transcript: Natural language budget description
            streaming: If True, optimize for partial/incomplete transcripts
            
        Returns:
            Dictionary with parsed budget data
        """
        # Try AI parsing first if available
        if self.use_ai:
            try:
                return self._parse_with_grok(transcript, streaming=streaming)
            except Exception as e:
                print(f"Grok AI parsing failed: {e}, falling back to regex")
        
        # Fallback to regex-based parsing
        return self._parse_with_regex(transcript)

    def _parse_with_grok(self, transcript: str, streaming: bool = False) -> Dict[str, Any]:
        """Parse using Grok AI
        
        Args:
            transcript: The voice transcript to parse
            streaming: If True, optimize for partial/incomplete transcripts
        """
        streaming_hint = ""
        if streaming:
            streaming_hint = """
IMPORTANT: This is a partial transcript (user is still speaking). 
- Extract whatever information is available so far
- Mark categories with 0 if not yet mentioned
- Be lenient with incomplete sentences
- Prioritize extracting amounts and category names first"""

        prompt = f"""Parse the following voice transcript about a monthly budget into structured JSON.

Transcript: "{transcript}"{streaming_hint}

Extract and return ONLY a valid JSON object with these exact fields:
{{
  "income": numeric monthly income value or 0,
  "expenses": {{
    "housing": amount or 0,
    "transportation": amount or 0,
    "food": amount or 0,
    "healthcare": amount or 0,
    "entertainment": amount or 0,
    "shopping": amount or 0,
    "travel": amount or 0,
    "education": amount or 0,
    "utilities": amount or 0,
    "childcare": amount or 0,
    "debt_payments": amount or 0,
    "others": amount or 0
  }},
  "savings": {{
    "emergency_fund": amount or 0,
    "retirement": amount or 0,
    "vacation": amount or 0
  }},
  "raw_transcript": original transcript
}}

Parsing Rules:
- Extract amounts flexibly: "$3,700", "3700", "thirty seven hundred"
- Match categories intelligently:
  * housing = rent, mortgage, housing, apartment
  * food = food, groceries, dining, restaurant
  * transportation = car, gas, transit, uber
  * utilities = electric, water, internet, phone
- Use 0 for categories not mentioned
- Return ONLY the JSON, no markdown formatting or explanation"""

        headers = {
            'Authorization': f'Bearer {self.grok_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a budget data extraction assistant. Return only valid JSON.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'model': 'grok-beta',
            'temperature': 0.1
        }
        
        response = requests.post(
            'https://api.x.ai/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Grok API error: {response.status_code} - {response.text}")
        
        result_text = response.json()['choices'][0]['message']['content'].strip()
        
        # Extract JSON from response (in case there's markdown formatting)
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()
        
        parsed_result = json.loads(result_text)
        return parsed_result

    def _parse_with_regex(self, transcript: str) -> Dict[str, Any]:
        """Fallback regex-based parsing"""
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
