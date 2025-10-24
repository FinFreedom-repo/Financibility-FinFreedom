"""
MongoDB Service Layer - Replaces Django ORM for MongoDB operations
"""

import os
import bcrypt
import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError, ConnectionFailure
from bson import ObjectId
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MongoDBService:
    """MongoDB service for handling all database operations"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBService, cls).__new__(cls)
            # Initialize the instance here
            cls._instance.client = None
            cls._instance.db = None
            cls._instance.connect()
        return cls._instance
    
    def __init__(self):
        # No need to do anything in __init__ since initialization is done in __new__
        pass
    
    def connect(self):
        """Connect to MongoDB using unified configuration"""
        try:
            # Import unified MongoDB configuration
            from mongodb_config import MongoDBConfig
            
            # Get configuration from unified config
            config = MongoDBConfig.get_config()
            mongodb_uri = config['uri']
            db_name = config['database']
            options = config['options']
            
            # MongoDB connection using unified configuration
            self.client = MongoClient(mongodb_uri, **options)
            
            # Test the connection with retry mechanism
            self._test_connection_with_retry()
            logger.info("Connected to MongoDB successfully")
            
            self.db = self.client[db_name]
            
            # Create indexes for better performance
            self._create_indexes()
            
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            # Provide detailed error analysis for production debugging
            if "SSL handshake failed" in str(e):
                logger.error("SSL handshake timeout detected. This may be due to:")
                logger.error("1. Network connectivity issues")
                logger.error("2. Firewall blocking MongoDB Atlas")
                logger.error("3. DNS resolution problems")
                logger.error("4. Atlas cluster maintenance")
            elif "No replica set members match selector" in str(e):
                logger.error("MongoDB Atlas replica set issue detected. This may be temporary.")
                logger.error("Check your Atlas cluster status at https://cloud.mongodb.com")
            elif "timeout" in str(e).lower():
                logger.error("Connection timeout detected. Possible causes:")
                logger.error("1. Slow network connection")
                logger.error("2. Atlas cluster under heavy load")
                logger.error("3. Firewall/proxy interference")
            raise
        except Exception as e:
            logger.error(f"Unexpected MongoDB connection error: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            raise
    
    def _test_connection_with_retry(self, max_retries=3, retry_delay=5):
        """Test MongoDB connection with retry mechanism for production resilience"""
        import time
        
        for attempt in range(max_retries):
            try:
                # Test connection with simple ping (no timeout parameter)
                self.client.admin.command('ping')
                logger.info(f"MongoDB connection test successful on attempt {attempt + 1}")
                return True
            except Exception as e:
                logger.warning(f"MongoDB connection test failed on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error("All MongoDB connection attempts failed")
                    raise ConnectionFailure(f"Failed to connect to MongoDB after {max_retries} attempts: {e}")
    
    def check_connection_health(self):
        """Check if MongoDB connection is healthy - for production monitoring"""
        try:
            # Quick ping test
            self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.warning(f"MongoDB health check failed: {e}")
            return False
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Check if indexes already exist to avoid recreating them
            existing_indexes = self.db.users.list_indexes()
            if len(list(existing_indexes)) > 1:  # More than just _id index
                logger.info("Database indexes already exist, skipping creation")
                return
            
            # Users collection indexes
            self.db.users.create_index("username", unique=True)
            self.db.users.create_index("email", unique=True)
            
            # Accounts collection indexes
            self.db.accounts.create_index("user_id")
            self.db.accounts.create_index([("user_id", 1), ("name", 1)])
            
            # Debts collection indexes
            self.db.debts.create_index("user_id")
            self.db.debts.create_index([("user_id", 1), ("name", 1)])
            
            # Budgets collection indexes
            self.db.budgets.create_index("user_id")
            self.db.budgets.create_index([("user_id", 1), ("month", 1), ("year", 1)], unique=True)
            
            # Transactions collection indexes
            self.db.transactions.create_index("user_id")
            self.db.transactions.create_index("account_id")
            self.db.transactions.create_index("date")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

class UserService(MongoDBService):
    """Service for user management operations"""
    
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
            
            result = self.db.users.insert_one(user_data)
            user_data['_id'] = result.inserted_id
            
            # Remove password hash from response
            user_data.pop('password_hash', None)
            return user_data
            
        except DuplicateKeyError:
            raise ValueError("Username or email already exists")
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user with username and password"""
        try:
            user = self.db.users.find_one({"username": username, "is_active": True})
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                # Update last login
                self.db.users.update_one(
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
            # Handle both ObjectId and string user IDs
            try:
                user_id_obj = ObjectId(user_id)
            except:
                user_id_obj = user_id
            
            user = self.db.users.find_one({"_id": user_id_obj})
            if user:
                user.pop('password_hash', None)
            return user
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        try:
            user = self.db.users.find_one({"username": username})
            if user:
                user.pop('password_hash', None)
            return user
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None
    
    def update_user_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Update user profile"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.db.users.update_one(
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
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if username already exists
            existing_user = self.db.users.find_one({"username": new_username})
            if existing_user and str(existing_user['_id']) != str(user_id):
                raise ValueError("Username already exists")
            
            result = self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"username": new_username}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating username: {e}")
            return False
    
    def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user password"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Hash the new password
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            
            result = self.db.users.update_one(
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
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if email already exists
            existing_user = self.db.users.find_one({"email": new_email})
            if existing_user and str(existing_user['_id']) != str(user_id):
                raise ValueError("Email already exists")
            
            result = self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"email": new_email}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating email: {e}")
            return False
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user and all associated data"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Delete user's accounts
            self.db.accounts.delete_many({"user_id": user_id})
            
            # Delete user's debts
            self.db.debts.delete_many({"user_id": user_id})
            
            # Delete user's budgets
            self.db.budgets.delete_many({"user_id": user_id})
            
            # Delete user's transactions
            self.db.transactions.delete_many({"user_id": user_id})
            
            # Finally delete the user
            result = self.db.users.delete_one({"_id": user_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    def update_user_comprehensive(self, user_id: str, user_data: Dict) -> bool:
        """Update user with comprehensive data including profile, username, email, etc."""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            update_data = {}
            
            # Handle profile data
            if 'profile' in user_data:
                update_data['profile'] = user_data['profile']
            
            # Handle username update
            if 'username' in user_data:
                # Check if username already exists
                existing_user = self.db.users.find_one({"username": user_data['username']})
                if existing_user and str(existing_user['_id']) != str(user_id):
                    raise ValueError("Username already exists")
                update_data['username'] = user_data['username']
            
            # Handle email update
            if 'email' in user_data:
                # Check if email already exists
                existing_user = self.db.users.find_one({"email": user_data['email']})
                if existing_user and str(existing_user['_id']) != str(user_id):
                    raise ValueError("Email already exists")
                update_data['email'] = user_data['email']
            
            # Handle password update
            if 'password' in user_data:
                password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
                update_data['password_hash'] = password_hash.decode('utf-8')
            
            if not update_data:
                return False
            
            result = self.db.users.update_one(
                {"_id": user_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user comprehensively: {e}")
            return False
    
    def update_profile_image(self, user_id: str, image_data: bytes, filename: str) -> str:
        """Update user profile image and return the image URL"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Generate unique filename
            import uuid
            import base64
            file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
            unique_filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            
            # Store image as base64 in profile
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            image_url = f"data:image/{file_extension};base64,{image_base64}"
            
            # Update user profile with image
            result = self.db.users.update_one(
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
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Remove avatar from profile
            result = self.db.users.update_one(
                {"_id": user_id},
                {"$unset": {"profile.avatar": ""}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting profile image: {e}")
            return False

class SettingsService(MongoDBService):
    """Service for user settings management"""
    
    def get_user_settings(self, user_id: str) -> Dict:
        """Get user settings"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            user = self.db.users.find_one({"_id": user_id})
            if not user:
                return self.get_default_settings()
            
            # Return user settings or default settings
            return user.get('settings', self.get_default_settings())
            
        except Exception as e:
            logger.error(f"Error getting user settings: {e}")
            return self.get_default_settings()
    
    def update_user_settings(self, user_id: str, settings_data: Dict) -> bool:
        """Update user settings"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Get existing settings or use defaults
            existing_settings = self.get_user_settings(user_id)
            updated_settings = {**existing_settings, **settings_data}
            
            # Update the user document with settings
            result = self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"settings": updated_settings}}
            )
            
            # Return True if document was found (even if no changes were made)
            return result.matched_count > 0
            
        except Exception as e:
            logger.error(f"Error updating user settings: {e}")
            return False
    
    def get_default_settings(self) -> Dict:
        """Get default settings"""
        return {
            "theme": "light",
            "payment_plan": "basic",
            "notifications": {
                "email": True,
                "push": False,
                "sms": False
            },
            "language": "en",
            "timezone": "UTC"
        }

class NotificationService(MongoDBService):
    """Service for managing user notifications"""
    
    def _to_object_id(self, user_id: str):
        """Convert string to ObjectId"""
        if isinstance(user_id, str):
            return ObjectId(user_id)
        return user_id
    
    def create_notification(self, user_id: str, notification_data: Dict) -> Optional[str]:
        """Create a new notification for a user"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            notification = {
                "user_id": user_id,
                "type": notification_data.get("type", "general"),
                "title": notification_data.get("title", ""),
                "message": notification_data.get("message", ""),
                "priority": notification_data.get("priority", "medium"),
                "is_read": False,
                "data": notification_data.get("data", {}),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.db.notifications.insert_one(notification)
            logger.info(f"Created notification {result.inserted_id} for user {user_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None

    def create_user_notification_bundle(self, user_id: str, messages: List[Dict]) -> Optional[str]:
        """Create a single notification bundle for a user with multiple messages"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if user already has a notification bundle
            existing = self.db.notifications.find_one({"user_id": user_id, "type": "bundle"})
            
            if existing:
                # Update existing bundle
                result = self.db.notifications.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "messages": messages,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                logger.info(f"Updated notification bundle for user {user_id}")
                return str(existing["_id"])
            else:
                # Create new bundle
                notification_bundle = {
                    "user_id": user_id,
                    "type": "bundle",
                    "title": "Your Notifications",
                    "messages": messages,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = self.db.notifications.insert_one(notification_bundle)
                logger.info(f"Created notification bundle {result.inserted_id} for user {user_id}")
                return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating notification bundle: {e}")
            return None
    
    def get_user_notifications(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get all notifications for a user"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            notifications = list(self.db.notifications.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit))
            
            # Process notifications and expand bundles
            processed_notifications = []
            
            for notification in notifications:
                notification["_id"] = str(notification["_id"])
                notification["user_id"] = str(notification["user_id"])
                
                # If it's a bundle, expand the messages
                if notification.get("type") == "bundle" and "messages" in notification:
                    # Convert bundle to individual notifications for frontend compatibility
                    bundle_messages = notification.get("messages", [])
                    
                    for i, message in enumerate(bundle_messages):
                        expanded_notification = {
                            "_id": f"{notification['_id']}_{i}",
                            "user_id": notification["user_id"],
                            "type": message.get("type", "general"),
                            "title": message.get("title", ""),
                            "message": message.get("message", ""),
                            "priority": message.get("priority", "medium"),
                            "is_read": message.get("is_read", False),
                            "data": message.get("data", {}),
                            "created_at": notification["created_at"].isoformat(),
                            "updated_at": notification["updated_at"].isoformat()
                        }
                        processed_notifications.append(expanded_notification)
                else:
                    # Regular notification - format timestamps
                    notification["created_at"] = notification["created_at"].isoformat()
                    notification["updated_at"] = notification["updated_at"].isoformat()
                    processed_notifications.append(notification)
            
            return processed_notifications
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Get all notifications for the user
            notifications = list(self.db.notifications.find({"user_id": user_id}))
            
            unread_count = 0
            
            for notification in notifications:
                if notification.get("type") == "bundle":
                    # Count unread messages in bundle
                    messages = notification.get("messages", [])
                    for message in messages:
                        if not message.get("is_read", False):
                            unread_count += 1
                else:
                    # Count individual notifications
                    if not notification.get("is_read", False):
                        unread_count += 1
            
            return unread_count
            
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0
    
    def mark_as_read(self, user_id: str, notification_id: str) -> bool:
        """Mark a specific notification as read"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if it's a bundle message (format: bundle_id_message_index)
            if '_' in notification_id and not ObjectId.is_valid(notification_id):
                bundle_id, message_index = notification_id.split('_', 1)
                return self._mark_bundle_message_as_read(user_id, bundle_id, int(message_index))
            else:
                # Handle individual notification
                if isinstance(notification_id, str):
                    notification_id = ObjectId(notification_id)
                
                result = self.db.notifications.update_one(
                    {
                        "_id": notification_id,
                        "user_id": user_id
                    },
                    {
                        "$set": {
                            "is_read": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    logger.info(f"Marked notification {notification_id} as read for user {user_id}")
                    return True
                else:
                    logger.warning(f"Notification {notification_id} not found or already read for user {user_id}")
                    return False
                
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False

    def mark_as_unread(self, user_id: str, notification_id: str) -> bool:
        """Mark a specific notification as unread"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Check if it's a bundle message (format: bundle_id_message_index)
            if '_' in notification_id and not ObjectId.is_valid(notification_id):
                bundle_id, message_index = notification_id.split('_', 1)
                return self._mark_bundle_message_as_unread(user_id, bundle_id, int(message_index))
            else:
                # Handle individual notification
                if isinstance(notification_id, str):
                    notification_id = ObjectId(notification_id)
                
                result = self.db.notifications.update_one(
                    {
                        "_id": notification_id,
                        "user_id": user_id
                    },
                    {
                        "$set": {
                            "is_read": False,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    logger.info(f"Marked notification {notification_id} as unread for user {user_id}")
                    return True
                else:
                    logger.warning(f"Notification {notification_id} not found or already unread for user {user_id}")
                    return False
                
        except Exception as e:
            logger.error(f"Error marking notification as unread: {e}")
            return False

    def _mark_bundle_message_as_read(self, user_id: str, bundle_id: str, message_index: int) -> bool:
        """Mark a specific message within a bundle as read"""
        try:
            if isinstance(bundle_id, str):
                bundle_id = ObjectId(bundle_id)
            
            # Update the specific message in the bundle
            result = self.db.notifications.update_one(
                {
                    "_id": bundle_id,
                    "user_id": user_id,
                    "type": "bundle"
                },
                {
                    "$set": {
                        f"messages.{message_index}.is_read": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"Marked message {message_index} in bundle {bundle_id} as read for user {user_id}")
                return True
            else:
                logger.warning(f"Bundle message not found for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error marking bundle message as read: {e}")
            return False

    def _mark_bundle_message_as_unread(self, user_id: str, bundle_id: str, message_index: int) -> bool:
        """Mark a specific message within a bundle as unread"""
        try:
            if isinstance(bundle_id, str):
                bundle_id = ObjectId(bundle_id)
            
            # Update the specific message in the bundle
            result = self.db.notifications.update_one(
                {
                    "_id": bundle_id,
                    "user_id": user_id,
                    "type": "bundle"
                },
                {
                    "$set": {
                        f"messages.{message_index}.is_read": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"Marked message {message_index} in bundle {bundle_id} as unread for user {user_id}")
                return True
            else:
                logger.warning(f"Bundle message not found for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error marking bundle message as unread: {e}")
            return False
    
    def mark_all_as_read(self, user_id: str) -> bool:
        """Mark all notifications as read for a user"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Mark individual notifications as read
            result = self.db.notifications.update_many(
                {
                    "user_id": user_id,
                    "is_read": False,
                    "type": {"$ne": "bundle"}
                },
                {
                    "$set": {
                        "is_read": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Mark all messages in bundles as read
            bundles = self.db.notifications.find({
                "user_id": user_id,
                "type": "bundle"
            })
            
            for bundle in bundles:
                messages = bundle.get("messages", [])
                for i, message in enumerate(messages):
                    messages[i]["is_read"] = True
                
                self.db.notifications.update_one(
                    {"_id": bundle["_id"]},
                    {
                        "$set": {
                            "messages": messages,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
            logger.info(f"Marked all notifications as read for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return False
    
    def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a specific notification"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            if isinstance(notification_id, str):
                notification_id = ObjectId(notification_id)
            
            result = self.db.notifications.delete_one({
                "_id": notification_id,
                "user_id": user_id
            })
            
            if result.deleted_count > 0:
                logger.info(f"Deleted notification {notification_id} for user {user_id}")
                return True
            else:
                logger.warning(f"Notification {notification_id} not found for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return False
    
    def create_budget_alert(self, user_id: str, category: str, spent: float, limit: float) -> Optional[str]:
        """Create a budget alert notification"""
        percentage = round((spent / limit) * 100)
        priority = "high" if percentage >= 90 else "medium" if percentage >= 80 else "low"
        
        notification_data = {
            "type": "budget_alert",
            "title": "Budget Alert",
            "message": f"You've spent {percentage}% of your {category} budget",
            "priority": priority,
            "data": {
                "category": category,
                "spent": spent,
                "limit": limit,
                "percentage": percentage
            }
        }
        
        return self.create_notification(user_id, notification_data)
    
    def create_debt_reminder(self, user_id: str, debt_name: str, due_date: str, amount: float) -> Optional[str]:
        """Create a debt reminder notification"""
        days_until_due = max(0, (datetime.fromisoformat(due_date) - datetime.utcnow()).days)
        priority = "high" if days_until_due <= 1 else "medium" if days_until_due <= 3 else "low"
        
        notification_data = {
            "type": "debt_reminder",
            "title": "Debt Payment Due",
            "message": f"Payment for '{debt_name}' is due in {days_until_due} days",
            "priority": priority,
            "data": {
                "debt_name": debt_name,
                "due_date": due_date,
                "amount": amount,
                "days_until_due": days_until_due
            }
        }
        
        return self.create_notification(user_id, notification_data)
    
    def create_savings_milestone(self, user_id: str, goal: str, progress: float, target: float) -> Optional[str]:
        """Create a savings milestone notification"""
        percentage = round((progress / target) * 100)
        
        notification_data = {
            "type": "financial_insight",
            "title": "Savings Milestone",
            "message": f"Congratulations! You've reached {percentage}% of your {goal} goal",
            "priority": "low",
            "data": {
                "goal": goal,
                "progress": progress,
                "target": target,
                "percentage": percentage
            }
        }
        
        return self.create_notification(user_id, notification_data)

class WealthProjectionSettingsService(MongoDBService):
    """Service for managing wealth projection settings"""
    
    def get_settings(self, user_id: str) -> Dict:
        """Get wealth projection settings for a user"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            settings = self.db.wealth_projection_settings.find_one({"user_id": user_id})
            if settings:
                # Convert ObjectId to string for JSON serialization
                settings['_id'] = str(settings['_id'])
                settings['user_id'] = str(settings['user_id'])
            return settings
            
        except Exception as e:
            logger.error(f"Error getting wealth projection settings: {e}")
            return None
    
    def save_settings(self, user_id: str, settings_data: Dict) -> Dict:
        """Save or update wealth projection settings"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            # Add timestamps
            now = datetime.utcnow()
            settings_data['user_id'] = user_id
            settings_data['updated_at'] = now
            
            # Try to find existing settings
            existing = self.db.wealth_projection_settings.find_one({"user_id": user_id})
            
            if existing:
                # Update existing settings
                settings_data['created_at'] = existing.get('created_at', now)
                result = self.db.wealth_projection_settings.update_one(
                    {"user_id": user_id},
                    {"$set": settings_data}
                )
                if result.modified_count > 0:
                    # Return updated settings
                    updated = self.db.wealth_projection_settings.find_one({"user_id": user_id})
                    updated['_id'] = str(updated['_id'])
                    updated['user_id'] = str(updated['user_id'])
                    return updated
            else:
                # Create new settings
                settings_data['created_at'] = now
                result = self.db.wealth_projection_settings.insert_one(settings_data)
                if result.inserted_id:
                    # Return created settings
                    created = self.db.wealth_projection_settings.find_one({"_id": result.inserted_id})
                    created['_id'] = str(created['_id'])
                    created['user_id'] = str(created['user_id'])
                    return created
            
            return None
            
        except Exception as e:
            logger.error(f"Error saving wealth projection settings: {e}")
            return None
    
    def delete_settings(self, user_id: str) -> bool:
        """Delete wealth projection settings for a user"""
        try:
            # Ensure user_id is properly converted to ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.db.wealth_projection_settings.delete_one({"user_id": user_id})
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting wealth projection settings: {e}")
            return False

class AccountService(MongoDBService):
    """Service for account management operations"""
    
    def __init__(self):
        super().__init__()  # Call parent __init__
    
    def create_account(self, user_id: str, account_data: Dict) -> Dict:
        """Create a new account"""
        try:
            account_data.update({
                "user_id": ObjectId(user_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            result = self.db.accounts.insert_one(account_data)
            account_data['_id'] = result.inserted_id
            return account_data
            
        except Exception as e:
            logger.error(f"Error creating account: {e}")
            raise
    
    def get_user_accounts(self, user_id: str) -> List[Dict]:
        """Get all accounts for a user"""
        try:
            # Use projection to only fetch needed fields
            accounts = list(self.db.accounts.find(
                {"user_id": ObjectId(user_id)},
                {
                    "_id": 1,
                    "name": 1,
                    "type": 1,
                    "balance": 1,
                    "currency": 1,
                    "created_at": 1,
                    "updated_at": 1
                }
            ).sort("created_at", -1))  # Sort by creation date
            return accounts
        except Exception as e:
            logger.error(f"Error getting user accounts: {e}")
            return []
    
    def get_account_by_id(self, account_id: str) -> Optional[Dict]:
        """Get account by ID"""
        try:
            account = self.db.accounts.find_one({"_id": ObjectId(account_id)})
            return account
        except Exception as e:
            logger.error(f"Error getting account by ID: {e}")
            return None
    
    def update_account(self, account_id: str, account_data: Dict) -> bool:
        """Update account"""
        try:
            account_data["updated_at"] = datetime.utcnow()
            result = self.db.accounts.update_one(
                {"_id": ObjectId(account_id)},
                {"$set": account_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating account: {e}")
            return False
    
    def delete_account(self, account_id: str) -> bool:
        """Delete account"""
        try:
            result = self.db.accounts.delete_one({"_id": ObjectId(account_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting account: {e}")
            return False
    
    def get_user_accounts_and_debts_summary(self, user_id: str) -> Dict:
        """Get both accounts and debts for a user in a single optimized call"""
        try:
            # Use aggregation pipeline for better performance
            pipeline = [
                {
                    "$facet": {
                        "accounts": [
                            {"$match": {"user_id": ObjectId(user_id)}},
                            {"$project": {
                                "_id": 1,
                                "name": 1,
                                "type": 1,
                                "balance": 1,
                                "currency": 1,
                                "created_at": 1,
                                "updated_at": 1
                            }},
                            {"$sort": {"created_at": -1}}
                        ],
                        "debts": [
                            {"$match": {"user_id": ObjectId(user_id)}},
                            {"$project": {
                                "_id": 1,
                                "name": 1,
                                "debt_type": 1,
                                "amount": 1,
                                "balance": 1,
                                "interest_rate": 1,
                                "effective_date": 1,
                                "created_at": 1,
                                "updated_at": 1
                            }},
                            {"$sort": {"created_at": -1}}
                        ]
                    }
                }
            ]
            
            # Execute aggregation on both collections
            accounts_result = list(self.db.accounts.aggregate(pipeline))
            debts_result = list(self.db.debts.aggregate(pipeline))
            
            return {
                "accounts": accounts_result[0]["accounts"] if accounts_result else [],
                "debts": debts_result[0]["debts"] if debts_result else []
            }
            
        except Exception as e:
            logger.error(f"Error getting user accounts and debts summary: {e}")
            return {"accounts": [], "debts": []}

class DebtService(MongoDBService):
    """Service for debt management operations"""
    
    def __init__(self):
        super().__init__()  # Call parent __init__
    
    def create_debt(self, user_id: str, debt_data: Dict) -> Dict:
        """Create a new debt"""
        try:
            debt_data.update({
                "user_id": ObjectId(user_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            result = self.db.debts.insert_one(debt_data)
            debt_data['_id'] = result.inserted_id
            return debt_data
            
        except Exception as e:
            logger.error(f"Error creating debt: {e}")
            raise
    
    def get_user_debts(self, user_id: str) -> List[Dict]:
        """Get all debts for a user"""
        try:
            # Use projection to only fetch needed fields
            debts = list(self.db.debts.find(
                {"user_id": ObjectId(user_id)},
                {
                    "_id": 1,
                    "name": 1,
                    "debt_type": 1,
                    "amount": 1,
                    "balance": 1,
                    "interest_rate": 1,
                    "effective_date": 1,
                    "created_at": 1,
                    "updated_at": 1
                }
            ).sort("created_at", -1))  # Sort by creation date
            return debts
        except Exception as e:
            logger.error(f"Error getting user debts: {e}")
            return []
    
    def get_debt_by_id(self, debt_id: str) -> Optional[Dict]:
        """Get debt by ID"""
        try:
            debt = self.db.debts.find_one({"_id": ObjectId(debt_id)})
            return debt
        except Exception as e:
            logger.error(f"Error getting debt by ID: {e}")
            return None
    
    def update_debt(self, debt_id: str, debt_data: Dict) -> bool:
        """Update debt"""
        try:
            debt_data["updated_at"] = datetime.utcnow()
            result = self.db.debts.update_one(
                {"_id": ObjectId(debt_id)},
                {"$set": debt_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating debt: {e}")
            return False
    
    def delete_debt(self, debt_id: str) -> bool:
        """Delete debt"""
        try:
            result = self.db.debts.delete_one({"_id": ObjectId(debt_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting debt: {e}")
            return False

class BudgetService(MongoDBService):
    """Service for budget management operations"""
    
    def __init__(self):
        super().__init__()  # Call parent __init__
    
    def create_budget(self, user_id: str, budget_data: Dict) -> Dict:
        """Create a new budget with all required fields"""
        try:
            logger.info(f"Creating budget for user {user_id} with data: {budget_data}")
            
            # Ensure all required fields are present with default values
            default_budget = {
                "income": 0.0,
                "additional_income": 0.0,
                "additional_income_items": [],
                "expenses": {
                    "housing": 0.0,
                    "debt_payments": 0.0,
                    "transportation": 0.0,
                    "food": 0.0,
                    "healthcare": 0.0,
                    "entertainment": 0.0,
                    "shopping": 0.0,
                    "travel": 0.0,
                    "education": 0.0,
                    "utilities": 0.0,
                    "childcare": 0.0,
                    "others": 0.0
                },
                "additional_items": [],
                "savings_items": [],
                "manually_edited_categories": []
            }
            
            # Merge provided data with defaults
            if "expenses" in budget_data and isinstance(budget_data["expenses"], dict):
                default_budget["expenses"].update(budget_data["expenses"])
            
            # Update other fields
            for key in ["income", "additional_income", "additional_income_items", "additional_items", "savings_items", "manually_edited_categories"]:
                if key in budget_data:
                    default_budget[key] = budget_data[key]
            
            # Add month and year
            default_budget.update({
                "month": budget_data.get("month"),
                "year": budget_data.get("year")
            })
            
            logger.info(f"Processed budget data: {default_budget}")
            
            # Check if budget already exists for this user, month, and year
            existing_budget = self.db.budgets.find_one({
                "user_id": ObjectId(user_id),
                "month": default_budget.get("month"),
                "year": default_budget.get("year")
            })
            
            if existing_budget:
                # Update existing budget instead of creating new one
                logger.info(f"Updating existing budget {existing_budget['_id']}")
                default_budget.update({
                    "user_id": ObjectId(user_id),
                    "updated_at": datetime.utcnow()
                })
                
                result = self.db.budgets.update_one(
                    {"_id": existing_budget["_id"]},
                    {"$set": default_budget}
                )
                
                if result.modified_count > 0:
                    # Return the updated budget
                    updated_budget = self.db.budgets.find_one({"_id": existing_budget["_id"]})
                    logger.info(f"Budget updated successfully: {updated_budget}")
                    return updated_budget
                else:
                    raise Exception("Failed to update existing budget")
            else:
                # Create new budget
                logger.info("Creating new budget")
                default_budget.update({
                    "user_id": ObjectId(user_id),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                
                result = self.db.budgets.insert_one(default_budget)
                default_budget['_id'] = result.inserted_id
                logger.info(f"Budget created successfully: {default_budget}")
                return default_budget
            
        except Exception as e:
            logger.error(f"Error creating budget: {e}")
            raise
    
    def get_user_budgets(self, user_id: str) -> List[Dict]:
        """Get all budgets for a user, returning the most recent budget for each month"""
        try:
            # Handle both ObjectId and string user IDs
            try:
                user_id_obj = ObjectId(user_id)
            except:
                user_id_obj = user_id
            
            # Get all budgets for the user, ordered by creation date (newest first)
            all_budgets = list(self.db.budgets.find({"user_id": user_id_obj}).sort("created_at", -1))
            
            # Group budgets by month/year and keep only the most recent one for each
            unique_budgets = {}
            for budget in all_budgets:
                month_key = f"{budget.get('month')}_{budget.get('year')}"
                if month_key not in unique_budgets:
                    unique_budgets[month_key] = budget
            
            # Convert back to list and sort by month/year
            budgets = list(unique_budgets.values())
            budgets.sort(key=lambda x: (x.get('year', 0), x.get('month', 0)))
            
            return budgets
        except Exception as e:
            logger.error(f"Error getting user budgets: {e}")
            return []
    
    def get_budget_by_id(self, budget_id: str) -> Optional[Dict]:
        """Get budget by ID"""
        try:
            budget = self.db.budgets.find_one({"_id": ObjectId(budget_id)})
            return budget
        except Exception as e:
            logger.error(f"Error getting budget by ID: {e}")
            return None
    
    def get_budget_by_month_year(self, user_id: str, month: int, year: int) -> Optional[Dict]:
        """Get budget for a specific month and year"""
        try:
            budget = self.db.budgets.find_one({
                "user_id": ObjectId(user_id),
                "month": month,
                "year": year
            })
            return budget
        except Exception as e:
            logger.error(f"Error getting budget by month/year: {e}")
            return None
    
    def update_budget(self, budget_id: str, budget_data: Dict) -> bool:
        """Update budget with all required fields"""
        try:
            logger.info(f"Updating budget {budget_id} with data: {budget_data}")
            
            # First check if the budget exists
            existing_budget = self.db.budgets.find_one({"_id": ObjectId(budget_id)})
            if not existing_budget:
                logger.error(f"Budget {budget_id} not found")
                return False
            
            logger.info(f"Found existing budget: {existing_budget}")
            
            # Ensure all required fields are present with default values
            default_budget = {
                "income": 0.0,
                "additional_income": 0.0,
                "additional_income_items": [],
                "expenses": {
                    "housing": 0.0,
                    "debt_payments": 0.0,
                    "transportation": 0.0,
                    "food": 0.0,
                    "healthcare": 0.0,
                    "entertainment": 0.0,
                    "shopping": 0.0,
                    "travel": 0.0,
                    "education": 0.0,
                    "utilities": 0.0,
                    "childcare": 0.0,
                    "others": 0.0
                },
                "additional_items": [],
                "savings_items": [],
                "manually_edited_categories": []
            }
            
            # Merge provided data with defaults
            if "expenses" in budget_data and isinstance(budget_data["expenses"], dict):
                default_budget["expenses"].update(budget_data["expenses"])
            
            # Update other fields (but NOT month and year to avoid duplicate key errors)
            for key in ["income", "additional_income", "additional_income_items", "additional_items", "savings_items", "manually_edited_categories"]:
                if key in budget_data:
                    default_budget[key] = budget_data[key]
            
            # DO NOT update month and year for existing budgets to prevent duplicate key errors
            # The month and year should remain constant for an existing budget
            # Only set updated_at timestamp
            default_budget["updated_at"] = datetime.utcnow()
            
            logger.info(f"Processed update data: {default_budget}")
            
            result = self.db.budgets.update_one(
                {"_id": ObjectId(budget_id)},
                {"$set": default_budget}
            )
            
            # Check if the update operation was successful (even if no changes were made)
            success = result.matched_count > 0
            logger.info(f"Budget update result: {success}, matched count: {result.matched_count}, modified count: {result.modified_count}")
            
            if success:
                logger.info(f"Budget {budget_id} updated successfully")
            else:
                logger.error(f"Budget {budget_id} update failed - no matching document found")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating budget: {e}")
            return False
    
    def delete_budget(self, budget_id: str) -> bool:
        """Delete budget"""
        try:
            result = self.db.budgets.delete_one({"_id": ObjectId(budget_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting budget: {e}")
            return False
    
    def update_budget_field(self, user_id: str, month: int, year: int, category: str, value: float) -> Optional[Dict]:
        """Update a specific field in a budget (optimized for batch updates)"""
        try:
            logger.info(f"Updating budget field: {category} = {value} for {month}/{year}")
            
            # Find existing budget
            existing_budget = self.db.budgets.find_one({
                "user_id": ObjectId(user_id),
                "month": month,
                "year": year
            })
            
            if existing_budget:
                # Update existing budget
                update_data = {"updated_at": datetime.utcnow()}
                
                # Handle income fields
                if category.lower() == 'income':
                    update_data["income"] = value
                elif category.lower() == 'additional_income':
                    update_data["additional_income"] = value
                # Handle expense fields
                elif category.lower() in ['housing', 'transportation', 'food', 'healthcare', 
                                        'entertainment', 'shopping', 'travel', 'education', 
                                        'utilities', 'childcare', 'others']:
                    update_data["expenses." + category.lower()] = value
                # Handle savings
                elif category.lower() == 'savings':
                    # For savings, we might need to handle this differently
                    # For now, we'll add it as an additional field
                    update_data["savings"] = value
                else:
                    logger.warning(f"Unknown category: {category}")
                    return None
                
                result = self.db.budgets.update_one(
                    {"_id": existing_budget["_id"]},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    # Return updated budget
                    updated_budget = self.db.budgets.find_one({"_id": existing_budget["_id"]})
                    return updated_budget
                else:
                    return existing_budget
            else:
                # Create new budget with this field
                logger.info(f"Creating new budget for {month}/{year} with {category} = {value}")
                
                new_budget = {
                    "user_id": ObjectId(user_id),
                    "month": month,
                    "year": year,
                    "income": 0.0,
                    "additional_income": 0.0,
                    "expenses": {
                        "housing": 0.0,
                        "transportation": 0.0,
                        "food": 0.0,
                        "healthcare": 0.0,
                        "entertainment": 0.0,
                        "shopping": 0.0,
                        "travel": 0.0,
                        "education": 0.0,
                        "utilities": 0.0,
                        "childcare": 0.0,
                        "others": 0.0
                    },
                    "additional_items": [],
                    "savings_items": [],
                    "manually_edited_categories": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                # Set the specific field
                if category.lower() == 'income':
                    new_budget["income"] = value
                elif category.lower() == 'additional_income':
                    new_budget["additional_income"] = value
                elif category.lower() in ['housing', 'transportation', 'food', 'healthcare', 
                                        'entertainment', 'shopping', 'travel', 'education', 
                                        'utilities', 'childcare', 'others']:
                    new_budget["expenses"][category.lower()] = value
                elif category.lower() == 'savings':
                    new_budget["savings"] = value
                
                result = self.db.budgets.insert_one(new_budget)
                new_budget['_id'] = result.inserted_id
                return new_budget
                
        except Exception as e:
            logger.error(f"Error updating budget field: {e}")
            return None
    
    def update_income_with_additional(self, user_id: str, month: int, year: int, total_income: float, additional_income: float) -> Optional[Dict]:
        """Update income with specific additional income preservation (for propagation)"""
        try:
            logger.info(f"Updating income with additional: total={total_income}, additional={additional_income} for {month}/{year}")
            
            # Calculate primary income
            primary_income = max(0, total_income - additional_income)
            
            # Find existing budget
            existing_budget = self.db.budgets.find_one({
                "user_id": ObjectId(user_id),
                "month": month,
                "year": year
            })
            
            if existing_budget:
                # Update existing budget
                update_data = {
                    "income": primary_income,
                    "additional_income": additional_income,
                    "updated_at": datetime.utcnow()
                }
                
                result = self.db.budgets.update_one(
                    {"_id": existing_budget["_id"]},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    # Return updated budget
                    updated_budget = self.db.budgets.find_one({"_id": existing_budget["_id"]})
                    return updated_budget
                else:
                    return existing_budget
            else:
                # Create new budget with this income split
                logger.info(f"Creating new budget for {month}/{year} with income split")
                
                new_budget = {
                    "user_id": ObjectId(user_id),
                    "month": month,
                    "year": year,
                    "income": primary_income,
                    "additional_income": additional_income,
                    "expenses": {
                        "housing": 0.0,
                        "transportation": 0.0,
                        "food": 0.0,
                        "healthcare": 0.0,
                        "entertainment": 0.0,
                        "shopping": 0.0,
                        "travel": 0.0,
                        "education": 0.0,
                        "utilities": 0.0,
                        "childcare": 0.0,
                        "others": 0.0
                    },
                    "additional_items": [],
                    "savings_items": [],
                    "manually_edited_categories": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = self.db.budgets.insert_one(new_budget)
                new_budget['_id'] = result.inserted_id
                return new_budget
                
        except Exception as e:
            logger.error(f"Error updating income with additional: {e}")
            return None

class TransactionService(MongoDBService):
    """Service for transaction management operations"""
    
    def __init__(self):
        super().__init__()  # Call parent __init__
    
    def create_transaction(self, user_id: str, transaction_data: Dict) -> Dict:
        """Create a new transaction"""
        try:
            transaction_data.update({
                "user_id": ObjectId(user_id),
                "created_at": datetime.utcnow()
            })
            
            result = self.db.transactions.insert_one(transaction_data)
            transaction_data['_id'] = result.inserted_id
            return transaction_data
            
        except Exception as e:
            logger.error(f"Error creating transaction: {e}")
            raise
    
    def get_user_transactions(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get all transactions for a user"""
        try:
            transactions = list(self.db.transactions.find(
                {"user_id": ObjectId(user_id)}
            ).sort("date", -1).limit(limit))
            return transactions
        except Exception as e:
            logger.error(f"Error getting user transactions: {e}")
            return []
    
    def get_transaction_by_id(self, transaction_id: str) -> Optional[Dict]:
        """Get transaction by ID"""
        try:
            transaction = self.db.transactions.find_one({"_id": ObjectId(transaction_id)})
            return transaction
        except Exception as e:
            logger.error(f"Error getting transaction by ID: {e}")
            return None
    
    def update_transaction(self, transaction_id: str, transaction_data: Dict) -> bool:
        """Update transaction"""
        try:
            result = self.db.transactions.update_one(
                {"_id": ObjectId(transaction_id)},
                {"$set": transaction_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating transaction: {e}")
            return False
    
    def delete_transaction(self, transaction_id: str) -> bool:
        """Delete transaction"""
        try:
            result = self.db.transactions.delete_one({"_id": ObjectId(transaction_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting transaction: {e}")
            return False

class JWTAuthService:
    """Service for JWT token management"""
    
    def __init__(self):
        # Use JWT-specific secret key that changes on server restart
        try:
            from django.conf import settings
            self.secret_key = getattr(settings, 'JWT_SECRET_KEY', settings.SECRET_KEY)
        except:
            # Fallback to environment variables if Django is not configured
            self.secret_key = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY', 'your-secret-key-here'))
        
        self.algorithm = 'HS256'
        self.access_token_expire_minutes = 60  # 1 hour for better user experience
        self.token_usage_tracker = {}  # Track token usage times
    
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
        expire = datetime.utcnow() + timedelta(days=7)  # 7 days
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token with usage tracking and 30-minute inactivity timeout"""
        try:
            # First check if token is valid JWT
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check if token has been used before
            current_time = datetime.utcnow()
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            if token_hash in self.token_usage_tracker:
                # Check if 5 minutes have passed since last usage
                last_used = self.token_usage_tracker[token_hash]
                time_since_last_use = current_time - last_used
                
                if time_since_last_use.total_seconds() > 1800:  # 30 minutes = 1800 seconds
                    logger.info(f"Token expired due to 30-minute inactivity: {token_hash[:8]}...")
                    # Remove expired token from tracker
                    del self.token_usage_tracker[token_hash]
                    return None
            else:
                # New token, add to tracker
                self.token_usage_tracker[token_hash] = current_time
            
            # Update last used time
            self.token_usage_tracker[token_hash] = current_time
            
            # Clean up old tokens (older than 10 minutes) to prevent memory leaks
            self._cleanup_old_tokens()
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.PyJWTError as e:
            logger.error(f"JWT error: {e}")
            return None
    
    def _cleanup_old_tokens(self):
        """Clean up tokens older than 10 minutes to prevent memory leaks"""
        current_time = datetime.utcnow()
        expired_tokens = []
        
        for token_hash, last_used in self.token_usage_tracker.items():
            if (current_time - last_used).total_seconds() > 600:  # 10 minutes
                expired_tokens.append(token_hash)
        
        for token_hash in expired_tokens:
            del self.token_usage_tracker[token_hash]
    
    def invalidate_token(self, token: str):
        """Invalidate a specific token"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        if token_hash in self.token_usage_tracker:
            del self.token_usage_tracker[token_hash]
    
    def clear_all_tokens(self):
        """Clear all token usage tracking (call on server restart)"""
        self.token_usage_tracker.clear()
        logger.info("All token usage tracking cleared") 