"""
Custom Authentication for MongoDB JWT Tokens
"""

from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth.models import AnonymousUser
from .mongodb_service import JWTAuthService, UserService


class MongoDBJWTAuthentication(authentication.BaseAuthentication):
    """Custom authentication class for MongoDB JWT tokens"""
    
    def authenticate(self, request):
        """Authenticate the request and return a two-tuple of (user, token)."""
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify token using our MongoDB JWT service
            jwt_service = JWTAuthService()
            payload = jwt_service.verify_token(token)
            
            if not payload:
                return None
            
            # Get user from MongoDB
            user_service = UserService()
            user_data = user_service.get_user_by_id(payload.get('user_id'))
            
            if not user_data:
                return None
            
            # Create a simple user object for Django
            user = MongoDBUser(user_data)
            
            return (user, token)
            
        except Exception as e:
            return None

class MongoDBUser:
    """Simple user object for MongoDB authentication"""
    
    def __init__(self, user_data):
        self.id = str(user_data.get('_id'))
        self.username = user_data.get('username')
        self.email = user_data.get('email')
        self.is_active = user_data.get('is_active', True)
        self.is_authenticated = True
        self.is_anonymous = False
        
        # Profile data
        profile = user_data.get('profile', {})
        self.first_name = profile.get('first_name', '')
        self.last_name = profile.get('last_name', '')
    
    def get_username(self):
        return self.username
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name
    
    def has_perm(self, perm, obj=None):
        return True 
    
    def has_perms(self, perm_list, obj=None):
        return True
    
    def has_module_perms(self, app_label):
        return True

def get_user_from_token(request):
    """Extract user from JWT token in request"""
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify token using our MongoDB JWT service
        jwt_service = JWTAuthService()
        payload = jwt_service.verify_token(token)
        
        if not payload:
            return None
        
        # Get user from MongoDB
        user_service = UserService()
        user_data = user_service.get_user_by_id(payload.get('user_id'))
        
        if not user_data:
            return None
        
        # Create a simple user object for Django
        user = MongoDBUser(user_data)
        
        return user
        
    except Exception as e:
        return None 