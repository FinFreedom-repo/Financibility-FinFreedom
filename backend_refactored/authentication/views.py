"""
Authentication Views
Login, Register, Profile Management, Settings
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from .services import UserService, JWTAuthService, SettingsService
from .authentication import MongoDBJWTAuthentication, get_user_from_token
from .permissions import MongoDBIsAuthenticated
from common.encoders import serialize_document

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """MongoDB-based login endpoint"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user_service = UserService()
        user = user_service.authenticate_user(username, password)
        
        if not user:
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        jwt_service = JWTAuthService()
        token_data = {
            'user_id': str(user['_id']),
            'username': user['username']
        }
        
        access_token = jwt_service.create_access_token(token_data)
        refresh_token = jwt_service.create_refresh_token(token_data)
        
        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'profile': user.get('profile', {})
            }
        }, status=status.HTTP_200_OK)
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Login error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """MongoDB-based user registration endpoint"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return Response({
                'error': 'Username, email, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user_service = UserService()
        user = user_service.create_user(username, email, password)
        
        # Generate JWT tokens
        jwt_service = JWTAuthService()
        token_data = {
            'user_id': str(user['_id']),
            'username': user['username']
        }
        
        access_token = jwt_service.create_access_token(token_data)
        refresh_token = jwt_service.create_refresh_token(token_data)
        
        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'profile': user.get('profile', {})
            }
        }, status=status.HTTP_201_CREATED)
        
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh JWT token endpoint"""
    try:
        data = json.loads(request.body)
        refresh = data.get('refresh')
        
        if not refresh:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify refresh token
        jwt_service = JWTAuthService()
        payload = jwt_service.verify_token(refresh)
        
        if not payload:
            return Response({
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate new access token
        token_data = {
            'user_id': payload.get('user_id'),
            'username': payload.get('username')
        }
        
        access_token = jwt_service.create_access_token(token_data)
        
        return Response({
            'access': access_token
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_profile(request):
    """Get user profile"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        user_service = UserService()
        user_data = user_service.get_user_by_id(user.id)
        
        if not user_data:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'user': serialize_document(user_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_profile(request):
    """Update user profile"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        profile_data = data.get('profile', {})
        
        user_service = UserService()
        success = user_service.update_user_profile(user.id, profile_data)
        
        if success:
            return Response({
                'message': 'Profile updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update profile'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_user_comprehensive(request):
    """Update user with comprehensive data"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        user_service = UserService()
        success = user_service.update_user_comprehensive(user.id, data)
        
        if success:
            return Response({
                'message': 'User updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Update user error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_user(request):
    """Delete user account"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        user_service = UserService()
        success = user_service.delete_user(user.id)
        
        if success:
            return Response({
                'message': 'User deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def upload_profile_image(request):
    """Upload user profile image"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if 'image' not in request.FILES:
            return Response({
                'error': 'No image file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        image_data = image_file.read()
        filename = image_file.name
        
        user_service = UserService()
        image_url = user_service.update_profile_image(user.id, image_data, filename)
        
        return Response({
            'message': 'Profile image uploaded successfully',
            'image_url': image_url
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Upload profile image error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def delete_profile_image(request):
    """Delete user profile image"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        user_service = UserService()
        success = user_service.delete_profile_image(user.id)
        
        if success:
            return Response({
                'message': 'Profile image deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to delete profile image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Delete profile image error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def get_settings(request):
    """Get user settings"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        settings_service = SettingsService()
        settings_data = settings_service.get_user_settings(user.id)
        
        return Response({
            'settings': settings_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get settings error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([MongoDBJWTAuthentication])
@permission_classes([MongoDBIsAuthenticated])
def update_settings(request):
    """Update user settings"""
    try:
        user = get_user_from_token(request)
        if not user:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        data = json.loads(request.body)
        
        settings_service = SettingsService()
        success = settings_service.update_user_settings(user.id, data)
        
        if success:
            return Response({
                'message': 'Settings updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to update settings'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update settings error: {e}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
