"""
Test script for Voice Financial Parser
Run this to verify the parser works correctly
"""
from voice_financial_parser import VoiceFinancialParser


def test_parser():
    """Test the voice financial parser with various inputs"""
    parser = VoiceFinancialParser()
    
    test_cases = [
        {
            'input': "I have a Chase checking account with $5,000",
            'expected': {
                'type': 'account',
                'category': 'checking',
                'amount': 5000.0,
            }
        },
        {
            'input': "I owe $3,000 on my Visa credit card at 18% interest",
            'expected': {
                'type': 'debt',
                'category': 'credit-card',
                'amount': 3000.0,
                'interest_rate': 18.0,
            }
        },
        {
            'input': "My savings account has $10,000 in it",
            'expected': {
                'type': 'account',
                'category': 'savings',
                'amount': 10000.0,
            }
        },
        {
            'input': "I have a mortgage with Wells Fargo for $250,000 at 3.5 percent",
            'expected': {
                'type': 'debt',
                'category': 'mortgage',
                'amount': 250000.0,
                'interest_rate': 3.5,
            }
        },
        {
            'input': "Student loan debt of fifteen thousand dollars",
            'expected': {
                'type': 'debt',
                'category': 'student-loan',
                # Amount won't be parsed without proper number word parsing
            }
        },
        {
            'input': "Capital One credit card with a balance of $1,500",
            'expected': {
                'type': 'debt',
                'category': 'credit-card',
                'amount': 1500.0,
            }
        },
        {
            'input': "Bank of America investment account with 25k",
            'expected': {
                'type': 'account',
                'category': 'investment',
                'amount': 25000.0,
            }
        },
        {
            'input': "I have 5 thousand dollars in my savings",
            'expected': {
                'type': 'account',
                'category': 'savings',
                'amount': 5000.0,
            }
        },
    ]
    
    print("=" * 100)
    print("VOICE FINANCIAL PARSER TEST SUITE")
    print("=" * 100)
    print()
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Input: \"{test['input']}\"")
        print("-" * 100)
        
        result = parser.parse_transcript(test['input'])
        
        print(f"Parsed Result:")
        print(f"  Type: {result['type']}")
        print(f"  Name: {result['name']}")
        print(f"  Amount: ${result['amount']}" if result['amount'] else "  Amount: NOT DETECTED")
        print(f"  Category: {result['category']}")
        print(f"  Interest Rate: {result['interest_rate']}%" if result['interest_rate'] else "  Interest Rate: None")
        print(f"  Confidence: {result['confidence'].upper()}")
        
        # Check expected values
        test_passed = True
        errors = []
        
        for key, expected_value in test['expected'].items():
            actual_value = result.get(key)
            if actual_value != expected_value:
                test_passed = False
                errors.append(f"  ❌ {key}: expected '{expected_value}', got '{actual_value}'")
        
        if test_passed:
            print(f"\n✅ TEST PASSED")
            passed += 1
        else:
            print(f"\n❌ TEST FAILED")
            for error in errors:
                print(error)
            failed += 1
        
        print("=" * 100)
    
    print(f"\n\n{'='*100}")
    print(f"TEST SUMMARY")
    print(f"{'='*100}")
    print(f"Total Tests: {len(test_cases)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_cases)*100):.1f}%")
    print(f"{'='*100}\n")
    
    return passed, failed


if __name__ == '__main__':
    test_parser()
