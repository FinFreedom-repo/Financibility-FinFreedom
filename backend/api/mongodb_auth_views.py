"""
MongoDB-based Authentication Views
Replaces Django's default authentication with MongoDB-based system
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
import logging
import os


from .mongodb_service import UserService, JWTAuthService, SettingsService

logger = logging.getLogger(__name__)

class MongoDBAuthViews:
    """MongoDB-based authentication views"""
    
    def __init__(self):
        self.user_service = UserService()
        self.jwt_service = JWTAuthService()
    
    @staticmethod
    @api_view(['POST'])
    @permission_classes([AllowAny])
    def login(request):
        """MongoDB-based login endpoint"""
        try:
            # Use request.data which DRF automatically parses, or fallback to request.body
            if hasattr(request, 'data') and request.data:
                data = request.data
            else:
                # Fallback: manually parse request.body (decode bytes if needed)
                body_str = request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body
                data = json.loads(body_str) if body_str else {}
            
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return Response({
                    'error': 'Username and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Authenticate user using MongoDB
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
                    'onboarding_complete': user.get('onboarding_complete', False),
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
    
    @staticmethod
    @api_view(['POST'])
    @permission_classes([AllowAny])
    def register(request):
        """MongoDB-based user registration endpoint"""
        try:
            # Use request.data which DRF automatically parses, or fallback to request.body
            if hasattr(request, 'data') and request.data:
                data = request.data
            else:
                # Fallback: manually parse request.body (decode bytes if needed)
                body_str = request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body
                data = json.loads(body_str) if body_str else {}
            
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if not username or not email or not password:
                return Response({
                    'error': 'Username, email, and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user in MongoDB
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
                    'onboarding_complete': user.get('onboarding_complete', False),
                    'profile': user.get('profile', {})
                }
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['POST'])
    @permission_classes([AllowAny])
    def refresh_token(request):
        """Refresh JWT token endpoint"""
        try:
            data = json.loads(request.body)
            refresh_token = data.get('refresh')
            
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify refresh token
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(refresh_token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired refresh token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate new access token
            token_data = {
                'user_id': payload.get('user_id'),
                'username': payload.get('username')
            }
            
            new_access_token = jwt_service.create_access_token(token_data)
            
            return Response({
                'access': new_access_token
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['GET'])
    def get_profile(request):
        """Get user profile endpoint"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get user from MongoDB
            user_service = UserService()
            user = user_service.get_user_by_id(payload.get('user_id'))
            
            if not user:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'user': {
                    'id': str(user['_id']),
                    'username': user['username'],
                    'email': user['email'],
                    'onboarding_complete': user.get('onboarding_complete', False),
                    'profile': user.get('profile', {}),
                    'date_joined': user.get('date_joined'),
                    'last_login': user.get('last_login')
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get profile error: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error details: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response({
                'error': 'Internal server error',
                'details': str(e) if os.getenv('DJANGO_ENV') == 'development' else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    @permission_classes([AllowAny])
    def update_profile(request):
        """Update user profile endpoint"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            profile_data = data.get('profile', {})
            
            # Update user profile in MongoDB
            user_service = UserService()
            success = user_service.update_user_profile(payload.get('user_id'), profile_data)
            
            if not success:
                return Response({
                    'error': 'Failed to update profile'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'message': 'Profile updated successfully'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update profile error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    def complete_onboarding(request):
        """Mark onboarding as complete"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Update onboarding_complete flag
            user_service = UserService()
            success = user_service.update_onboarding_complete(payload.get('user_id'), True)
            
            if not success:
                return Response({
                    'error': 'Failed to update onboarding status'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'message': 'Onboarding marked as complete'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Complete onboarding error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    @permission_classes([AllowAny])
    def update_user_comprehensive(request):
        """Update user comprehensively (profile, username, email, password)"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            
            # Update user comprehensively in MongoDB
            user_service = UserService()
            try:
                success = user_service.update_user_comprehensive(payload.get('user_id'), data)
                
                if not success:
                    return Response({
                        'error': 'Failed to update user'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                return Response({
                    'message': 'User updated successfully'
                }, status=status.HTTP_200_OK)
                
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update user comprehensive error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['DELETE'])
    @permission_classes([AllowAny])
    def delete_user(request):
        """Delete user account and all associated data"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Delete user and all associated data
            user_service = UserService()
            success = user_service.delete_user(payload.get('user_id'))
            
            if not success:
                return Response({
                    'error': 'Failed to delete user'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'message': 'User account deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Delete user error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['POST'])
    def upload_profile_image(request):
        """Upload user profile image"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if image file is present
            if 'image' not in request.FILES:
                return Response({
                    'error': 'No image file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            image_file = request.FILES['image']
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if image_file.content_type not in allowed_types:
                return Response({
                    'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response({
                    'error': 'File size too large. Maximum size is 5MB.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Read image data
            image_data = image_file.read()
            
            # Update profile image
            user_service = UserService()
            image_url = user_service.update_profile_image(
                payload.get('user_id'), 
                image_data, 
                image_file.name
            )
            
            return Response({
                'message': 'Profile image uploaded successfully',
                'image_url': image_url
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Upload profile image error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['DELETE'])
    def delete_profile_image(request):
        """Delete user profile image"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Delete profile image
            user_service = UserService()
            success = user_service.delete_profile_image(payload.get('user_id'))
            
            if not success:
                return Response({
                    'error': 'Failed to delete profile image'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'message': 'Profile image deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Delete profile image error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['GET'])
    def get_settings(request):
        """Get user settings endpoint"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get user settings from MongoDB
            settings_service = SettingsService()
            settings = settings_service.get_user_settings(payload.get('user_id'))
            
            return Response(settings, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Get settings error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    @api_view(['PUT'])
    def update_settings(request):
        """Update user settings endpoint"""
        try:
            # Extract user ID from JWT token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'error': 'Authorization header required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            token = auth_header.split(' ')[1]
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            data = json.loads(request.body)
            
            # Update user settings in MongoDB
            settings_service = SettingsService()
            success = settings_service.update_user_settings(payload.get('user_id'), data)
            
            if not success:
                return Response({
                    'error': 'Failed to update settings'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Return updated settings
            updated_settings = settings_service.get_user_settings(payload.get('user_id'))
            return Response(updated_settings, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update settings error: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create view functions for URL routing
@csrf_exempt
def mongodb_login(request):
    """MongoDB login view function"""
    return MongoDBAuthViews.login(request)

@csrf_exempt
def mongodb_register(request):
    """MongoDB register view function"""
    return MongoDBAuthViews.register(request)

@csrf_exempt
def mongodb_refresh_token(request):
    """MongoDB refresh token view function"""
    return MongoDBAuthViews.refresh_token(request)

@csrf_exempt
def mongodb_get_profile(request):
    """MongoDB get profile view function"""
    return MongoDBAuthViews.get_profile(request)

@csrf_exempt
def mongodb_update_profile(request):
    """MongoDB update profile view function"""
    return MongoDBAuthViews.update_profile(request)

@csrf_exempt
def mongodb_complete_onboarding(request):
    """MongoDB complete onboarding view function"""
    return MongoDBAuthViews.complete_onboarding(request)

@csrf_exempt
def mongodb_update_user_comprehensive(request):
    """MongoDB update user comprehensive view function"""
    return MongoDBAuthViews.update_user_comprehensive(request)

@csrf_exempt
def mongodb_delete_user(request):
    """MongoDB delete user view function"""
    return MongoDBAuthViews.delete_user(request)

@csrf_exempt
def mongodb_upload_profile_image(request):
    """MongoDB upload profile image view function"""
    return MongoDBAuthViews.upload_profile_image(request)

@csrf_exempt
def mongodb_delete_profile_image(request):
    """MongoDB delete profile image view function"""
    return MongoDBAuthViews.delete_profile_image(request)

@csrf_exempt
def mongodb_get_settings(request):
    """MongoDB get settings view function"""
    return MongoDBAuthViews.get_settings(request)

@csrf_exempt
def mongodb_update_settings(request):
    """MongoDB update settings view function"""
    return MongoDBAuthViews.update_settings(request) 