"""
Test authentication endpoint for development
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .mongodb_service import JWTAuthService, UserService
import json

@api_view(['POST'])
@permission_classes([AllowAny])
def test_login(request):
    """
    Test login endpoint that returns a token for the test user
    """
    try:
        data = json.loads(request.body)
        username = data.get('username', 'testuser')
        password = data.get('password', 'testpass123')
        
        # For test purposes, accept any username/password or use defaults
        if username == 'testuser' and password == 'testpass123':
            # Get the actual test user from database
            user_service = UserService()
            user = user_service.get_user_by_username('testuser')
            
            if not user:
                return Response({
                    'error': 'Test user not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Generate JWT tokens for test user
            jwt_service = JWTAuthService()
            token_data = {
                'user_id': str(user['_id']),  # Use actual user ID
                'username': 'testuser'
            }
            
            access_token = jwt_service.create_access_token(token_data)
            refresh_token = jwt_service.create_refresh_token(token_data)
            
            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': str(user['_id']),
                    'username': 'testuser',
                    'email': 'test@example.com'
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials. Use testuser/testpass123'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'error': 'Login failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
