"""
Voice Financial Views - API endpoints for voice-powered financial input
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from .voice_financial_parser import VoiceFinancialParser
from .voice_budget_parser import VoiceBudgetParser
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def parse_financial_voice(request):
    """
    Parse voice transcript into structured financial data using AI
    
    POST /api/mongodb/parse-financial-voice/
    
    Request body:
    {
        "transcript": "I have a Chase checking account with $5,000"
    }
    
    Response:
    {
        "type": "account",
        "name": "Chase Checking",
        "amount": 5000.0,
        "category": "checking",
        "interest_rate": null,
        "effective_date": "2024-02-09",
        "payoff_date": null,
        "notes": "I have a Chase checking account with $5,000",
        "confidence": "high"
    }
    """
    try:
        transcript = request.data.get('transcript', '')
        
        if not transcript or not transcript.strip():
            return Response(
                {'error': 'Transcript is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Parsing voice transcript for user {request.user.username}: {transcript[:100]}...")
        
        # Parse the transcript
        parser = VoiceFinancialParser()
        result = parser.parse_transcript(transcript)
        
        logger.info(f"Successfully parsed transcript. Type: {result['type']}, Confidence: {result['confidence']}")
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error parsing voice transcript: {str(e)}")
        return Response(
            {'error': f'Failed to parse transcript: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_voice_examples(request):
    """
    Get example phrases for voice input
    
    GET /api/mongodb/voice-examples/
    """
    examples = {
        'accounts': [
            "I have a Chase checking account with $5,000",
            "My savings account has ten thousand dollars",
            "Bank of America investment account with $25,000",
            "Fidelity retirement account with $100,000 at 7% growth",
        ],
        'debts': [
            "I owe $3,000 on my Visa credit card at 18% interest",
            "Capital One credit card balance is $1,500",
            "I have a student loan of $30,000 at 5.5 percent",
            "My mortgage with Wells Fargo is $250,000 at 3.5%",
            "Auto loan from Toyota Financial for $20,000",
        ],
        'tips': [
            "Speak clearly and mention the institution name if possible",
            "Include the amount with 'dollars' or using '$' symbol",
            "Mention the account or debt type (checking, credit card, etc.)",
            "Add interest rate if known (e.g., 'at 5%' or '5 percent')",
            "You can always edit the parsed information before saving",
        ]
    }
    
    return Response(examples, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def voice_quick_add(request):
    """
    Quick add account or debt from voice transcript
    Combines parsing and creation in one step
    
    POST /api/mongodb/voice-quick-add/
    """
    try:
        transcript = request.data.get('transcript', '')
        
        if not transcript or not transcript.strip():
            return Response(
                {'error': 'Transcript is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse the transcript
        parser = VoiceFinancialParser()
        parsed = parser.parse_transcript(transcript)
        
        # Validate that we have minimum required data
        if not parsed['amount']:
            return Response(
                {
                    'error': 'Could not extract amount from transcript',
                    'suggestion': 'Please mention an amount, e.g., "$5,000" or "five thousand dollars"',
                    'parsed': parsed
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import here to avoid circular imports
        from .mongodb_service import MongoDBService
        
        mongo_service = MongoDBService()
        
        # Prepare data for MongoDB
        financial_data = {
            'user_id': str(request.user.id),
            'name': parsed['name'],
            'balance': float(parsed['amount']),
            'interest_rate': float(parsed['interest_rate']) if parsed['interest_rate'] else 0.0,
            'effective_date': parsed['effective_date'],
        }
        
        # Create account or debt based on type
        if parsed['type'] == 'account':
            financial_data['account_type'] = parsed['category'] or 'checking'
            result = mongo_service.create_account(financial_data)
            message = f"✅ Account '{parsed['name']}' added successfully"
        else:
            financial_data['debt_type'] = parsed['category'] or 'credit-card'
            if parsed['payoff_date']:
                financial_data['payoff_date'] = parsed['payoff_date']
            result = mongo_service.create_debt(financial_data)
            message = f"✅ Debt '{parsed['name']}' added successfully"
        
        logger.info(f"Voice quick-add successful for user {request.user.username}: {parsed['name']}")
        
        return Response({
            'success': True,
            'message': message,
            'data': result,
            'parsed': parsed
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error in voice quick-add: {str(e)}")
        return Response(
            {'error': f'Failed to add financial data: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def parse_budget_voice(request):
    """
    Parse budget voice transcript into structured budget data using AI
    
    POST /api/mongodb/parse-budget-voice/
    
    Request body:
    {
        "transcript": "My monthly income is $5,000, I spend $1,500 on rent and $400 on food"
    }
    
    Response:
    {
        "income": 5000.0,
        "expenses": {
            "housing": 1500.0,
            "food": 400.0
        },
        "savings": {},
        "raw_transcript": "..."
    }
    """
    try:
        transcript = request.data.get('transcript', '')
        
        if not transcript or not transcript.strip():
            return Response(
                {'error': 'Transcript is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Parsing budget transcript for user {request.user.username}: {transcript[:100]}...")
        
        # Parse the transcript
        parser = VoiceBudgetParser()
        result = parser.parse_transcript(transcript)
        
        logger.info(f"Successfully parsed budget transcript. Income: ${result.get('income', 0)}, Expenses: {len(result.get('expenses', {}))}")
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error parsing budget transcript: {str(e)}")
        return Response(
            {'error': f'Failed to parse budget transcript: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
