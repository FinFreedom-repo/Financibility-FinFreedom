"""
Smart Transaction API Views - Enhanced transaction features
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
import logging
from datetime import datetime, timedelta

from .mongodb_service import TransactionService
from .smart_transaction_service import smart_transaction_service
from .mongodb_auth_views import get_user_from_token

logger = logging.getLogger(__name__)

transaction_service = TransactionService()


@csrf_exempt
@api_view(['POST'])
def auto_categorize_transaction(request):
    """Auto-categorize a transaction based on description"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        description = request.data.get('description', '')
        amount = float(request.data.get('amount', 0))
        merchant = request.data.get('merchant')
        
        if not description:
            return Response(
                {'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Auto-categorize
        category = smart_transaction_service.categorize_transaction(
            description, amount, merchant
        )
        
        # Extract merchant if not provided
        if not merchant:
            merchant = smart_transaction_service.extract_merchant_name(description)
        
        return Response({
            'category': category,
            'merchant': merchant,
        })
    
    except Exception as e:
        logger.error(f"Error auto-categorizing transaction: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['GET'])
def detect_recurring_transactions(request):
    """Detect recurring transactions for the user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Get all user transactions
        transactions = transaction_service.get_user_transactions(user_id)
        
        # Convert ObjectId to string for JSON serialization
        transactions = [{
            **t,
            'id': str(t.get('_id', '')),
            '_id': str(t.get('_id', '')),
        } for t in transactions]
        
        # Detect recurring
        recurring = smart_transaction_service.detect_recurring_transactions(transactions)
        
        return Response({
            'recurring_transactions': recurring,
            'count': len(recurring),
        })
    
    except Exception as e:
        logger.error(f"Error detecting recurring transactions: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['GET'])
def get_spending_insights(request):
    """Get spending insights for the user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Get period parameter (default: current month)
        period = request.GET.get('period', 'month')  # month, week, year
        compare = request.GET.get('compare', 'true').lower() == 'true'
        
        # Calculate date range
        today = datetime.now()
        if period == 'week':
            start_date = today - timedelta(days=7)
            prev_start_date = start_date - timedelta(days=7)
            prev_end_date = start_date
        elif period == 'year':
            start_date = today.replace(month=1, day=1)
            prev_start_date = start_date - timedelta(days=365)
            prev_end_date = start_date
        else:  # month
            start_date = today.replace(day=1)
            if today.month == 1:
                prev_start_date = today.replace(year=today.year-1, month=12, day=1)
            else:
                prev_start_date = today.replace(month=today.month-1, day=1)
            prev_end_date = start_date
        
        # Get transactions
        all_transactions = transaction_service.get_user_transactions(user_id)
        
        # Filter current period
        current_transactions = [
            t for t in all_transactions
            if t.get('date') and datetime.strptime(t['date'], '%Y-%m-%d') >= start_date
        ]
        
        # Filter previous period if comparing
        previous_transactions = []
        if compare:
            previous_transactions = [
                t for t in all_transactions
                if t.get('date') and 
                prev_start_date <= datetime.strptime(t['date'], '%Y-%m-%d') < prev_end_date
            ]
        
        # Generate insights
        insights = smart_transaction_service.generate_spending_insights(
            current_transactions,
            previous_transactions if compare else None
        )
        
        return Response({
            'period': period,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'insights': insights,
        })
    
    except Exception as e:
        logger.error(f"Error getting spending insights: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['GET'])
def suggest_budget(request):
    """Suggest budget amounts based on spending history"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Get transactions from last 3 months
        three_months_ago = datetime.now() - timedelta(days=90)
        transactions = transaction_service.get_user_transactions(user_id)
        
        # Filter last 3 months
        recent_transactions = [
            t for t in transactions
            if t.get('date') and datetime.strptime(t['date'], '%Y-%m-%d') >= three_months_ago
        ]
        
        # Generate suggestions
        suggestions = smart_transaction_service.suggest_budget_categories(recent_transactions)
        
        return Response({
            'suggested_budgets': suggestions,
            'based_on_months': 3,
        })
    
    except Exception as e:
        logger.error(f"Error suggesting budget: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['GET'])
def detect_unusual_transactions(request):
    """Detect unusual transactions"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Get all transactions
        all_transactions = transaction_service.get_user_transactions(user_id)
        
        # Split into recent (last 7 days) and history
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent = [
            t for t in all_transactions
            if t.get('date') and datetime.strptime(t['date'], '%Y-%m-%d') >= seven_days_ago
        ]
        history = [
            t for t in all_transactions
            if t.get('date') and datetime.strptime(t['date'], '%Y-%m-%d') < seven_days_ago
        ]
        
        # Detect unusual
        unusual = smart_transaction_service.detect_unusual_transactions(recent, history)
        
        return Response({
            'unusual_transactions': unusual,
            'count': len(unusual),
        })
    
    except Exception as e:
        logger.error(f"Error detecting unusual transactions: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['GET'])
def get_transaction_tags(request):
    """Get all unique tags used by the user"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Get all transactions
        transactions = transaction_service.get_user_transactions(user_id)
        
        # Extract unique tags
        tags = set()
        for t in transactions:
            if t.get('tags'):
                tags.update(t['tags'])
        
        return Response({
            'tags': sorted(list(tags)),
            'count': len(tags),
        })
    
    except Exception as e:
        logger.error(f"Error getting transaction tags: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['GET'])
def search_transactions(request):
    """Search transactions with advanced filters"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = str(user['_id'])
        
        # Get search parameters
        query = request.GET.get('q', '').lower()
        category = request.GET.get('category')
        min_amount = request.GET.get('min_amount')
        max_amount = request.GET.get('max_amount')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        tags = request.GET.get('tags', '').split(',') if request.GET.get('tags') else []
        
        # Get all transactions
        transactions = transaction_service.get_user_transactions(user_id)
        
        # Apply filters
        filtered = transactions
        
        if query:
            filtered = [
                t for t in filtered
                if query in t.get('description', '').lower() or
                   query in t.get('merchant', '').lower() or
                   query in t.get('notes', '').lower()
            ]
        
        if category:
            filtered = [t for t in filtered if t.get('category') == category]
        
        if min_amount:
            filtered = [t for t in filtered if abs(float(t.get('amount', 0))) >= float(min_amount)]
        
        if max_amount:
            filtered = [t for t in filtered if abs(float(t.get('amount', 0))) <= float(max_amount)]
        
        if start_date:
            filtered = [
                t for t in filtered
                if t.get('date') and t['date'] >= start_date
            ]
        
        if end_date:
            filtered = [
                t for t in filtered
                if t.get('date') and t['date'] <= end_date
            ]
        
        if tags:
            filtered = [
                t for t in filtered
                if t.get('tags') and any(tag in t['tags'] for tag in tags)
            ]
        
        # Convert ObjectId to string
        filtered = [{
            **t,
            'id': str(t.get('_id', '')),
            '_id': str(t.get('_id', '')),
            'user_id': str(t.get('user_id', '')),
        } for t in filtered]
        
        return Response({
            'transactions': filtered,
            'count': len(filtered),
        })
    
    except Exception as e:
        logger.error(f"Error searching transactions: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
