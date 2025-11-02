"""
Authentication Services
User management and JWT token operations
"""

import os
import bcrypt
import jwt
import hashlib
import uuid
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from bson import ObjectId
from django.conf import settings
import logging

from common.database import get_collection
from common.exceptions import (
    UserNotFoundError, InvalidCredentialsError, 
    DuplicateUserError, ValidationError
)

logger = logging.getLogger(__name__)


class UserService:
    """Service for user management operations"""
    
    def __init__(self):
        self.users = get_collection('users')
    
    def create_user(self, username: str, email: str, password: str) -> Dict:
        """Create a new user"""
        try:
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            user_data = {
                "username": username,
                "email": email,
                "password_hash": password_hash.decode('utf-8'),
                "is_active": True,
                "date_joined": datetime.utcnow(),
                "last_login": None,
                "profile": {
                    "first_name": "",
                    "last_name": "",
                    "avatar": ""
                }
            }
            
            result = self.users.insert_one(user_data)
            user_data['_id'] = result.inserted_id
            
            # Remove password hash from response
            user_data.pop('password_hash', None)
            return user_data
            
        except Exception as e:
            if 'duplicate key' in str(e).lower():
                raise DuplicateUserError("Username or email already exists")
            logger.error(f"Error creating user: {e}")
            raise
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user with username and password"""
        try:
            user = self.users.find_one({"username": username, "is_active": True})
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                # Update last login
                self.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"last_login": datetime.utcnow()}}
                )
                
                # Remove password hash from response
                user.pop('password_hash', None)
                return user
            
            return None
            
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            try:
                user_id_obj = ObjectId(user_id)
            except:
                user_id_obj = user_id
            
            user = self.users.find_one({"_id": user_id_obj})
            if user:
                user.pop('password_hash', None)
            return user
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        try:
            user = self.users.find_one({"username": username})
            if user:
                user.pop('password_hash', None)
            return user
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None
    
    def update_user_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Update user profile"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": {"profile": profile_data}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False
    
    def update_username(self, user_id: str, new_username: str) -> bool:
        """Update user username"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if username already exists
            existing_user = self.users.find_one({"username": new_username})
            if existing_user and str(existing_user['_id']) != str(user_id):
                raise DuplicateUserError("Username already exists")
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": {"username": new_username}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating username: {e}")
            raise
    
    def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user password"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": {"password_hash": password_hash.decode('utf-8')}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating password: {e}")
            return False
    
    def update_email(self, user_id: str, new_email: str) -> bool:
        """Update user email"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if email already exists
            existing_user = self.users.find_one({"email": new_email})
            if existing_user and str(existing_user['_id']) != str(user_id):
                raise DuplicateUserError("Email already exists")
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": {"email": new_email}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating email: {e}")
            raise
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user and all associated data"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
                
            # Delete all user's accounts, debts, budgets, and transactions
            get_collection('accounts').delete_many({"user_id": str(user_id)})
            get_collection('debts').delete_many({"user_id": str(user_id)})
            get_collection('budgets').delete_many({"user_id": str(user_id)})
            get_collection('transactions').delete_many({"user_id": str(user_id)})

            result = self.users.delete_one({"_id": user_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    def update_user_comprehensive(self, user_id: str, user_data: Dict) -> bool:
        """Update user with comprehensive data"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            update_data = {}

            if 'profile' in user_data:
                update_data['profile'] = user_data['profile']

            if 'username' in user_data: 
                existing_user = self.users.find_one({"username": user_data['username']})
                if existing_user and str(existing_user['_id']) != str(user_id):
                    raise DuplicateUserError("Username already exists")
                update_data['username'] = user_data['username']
            
            if 'email' in user_data:
                existing_user = self.users.find_one({"email": user_data['email']})
                if existing_user and str(existing_user['_id']) != str(user_id):
                    raise DuplicateUserError("Email already exists")
                update_data['email'] = user_data['email']
            
            if 'password' in user_data:
                password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
                update_data['password_hash'] = password_hash.decode('utf-8')
            
            if not update_data:
                return False
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user comprehensively: {e}")
            raise
    
    def update_profile_image(self, user_id: str, image_data: bytes, filename: str) -> str:
        """Update user profile image and return the image URL"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Generate unique filename
            file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
            unique_filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            
            # Store image as base64 in profile
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            image_url = f"data:image/{file_extension};base64,{image_base64}"
            
            # Update user profile with image
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": {"profile.avatar": image_url}}
            )
            
            if result.modified_count > 0:
                return image_url
            else:
                raise Exception("Failed to update profile image")
                
        except Exception as e:
            logger.error(f"Error updating profile image: {e}")
            raise
    
    def delete_profile_image(self, user_id: str) -> bool:
        """Delete user profile image"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$unset": {"profile.avatar": ""}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting profile image: {e}")
            return False




class JWTAuthService:
    """Service for JWT token management"""
    
    def __init__(self):
        try:
            self.secret_key = getattr(settings, 'JWT_SECRET_KEY', settings.SECRET_KEY)
        except:
            self.secret_key = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY', 'your-secret-key-here'))
            
        self.algorithm = 'HS256'
        self.access_token_expire_minutes = 60  # 1 hour
        self.token_usage_tracker = {}
    
    def create_access_token(self, data: Dict) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token with usage tracking and 30-minute inactivity timeout"""
        try:
            # Decode JWT
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check token activity
            current_time = datetime.utcnow()
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            if token_hash in self.token_usage_tracker:
                last_used = self.token_usage_tracker[token_hash]
                time_since_last_use = current_time - last_used
                
                if time_since_last_use.total_seconds() > 1800:  # 30 minutes
                    logger.info(f"Token expired due to 30-minute inactivity")
                    del self.token_usage_tracker[token_hash]
                    return None
            
            # Update last used time
            self.token_usage_tracker[token_hash] = current_time
            
            # Clean up old tokens
            self._cleanup_old_tokens()
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.PyJWTError as e:
            logger.error(f"JWT error: {e}")
            return None
    
    def _cleanup_old_tokens(self):
        """Clean up tokens older than 10 minutes"""
        current_time = datetime.utcnow()
        expired_tokens = [
            token_hash for token_hash, last_used in self.token_usage_tracker.items()
            if (current_time - last_used).total_seconds() > 600
        ]
        
        for token_hash in expired_tokens:
            del self.token_usage_tracker[token_hash]
    
    def invalidate_token(self, token: str):
        """Invalidate a specific token"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        if token_hash in self.token_usage_tracker:
            del self.token_usage_tracker[token_hash]
    
    def clear_all_tokens(self):
        """Clear all token usage tracking"""
        self.token_usage_tracker.clear()
        logger.info("All token usage tracking cleared")


class SettingsService:
    """Service for user settings management"""
    
    def __init__(self):
        self.users = get_collection('users')
    
    def get_user_settings(self, user_id: str) -> Dict:
        """Get user settings"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            user = self.users.find_one({"_id": user_id})
            if not user:
                return self.get_default_settings()
            
            return user.get('settings', self.get_default_settings())
            
        except Exception as e:
            logger.error(f"Error getting user settings: {e}")
            return self.get_default_settings()
    
    def update_user_settings(self, user_id: str, settings_data: Dict) -> bool:
        """Update user settings"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            existing_settings = self.get_user_settings(user_id)
            updated_settings = {**existing_settings, **settings_data}
            
            result = self.users.update_one(
                {"_id": user_id},
                {"$set": {"settings": updated_settings}}
            )
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating user settings: {e}")
            return False
    
    def get_default_settings(self) -> Dict:
        """Get default user settings"""
        return {
            "theme": "light",
            "currency": "USD",
            "language": "en",
            "notifications": {
                "email": True,
                "push": True,
                "sms": False
            },
            "privacy": {
                "profile_visibility": "private",
                "data_sharing": False
            }
        }

