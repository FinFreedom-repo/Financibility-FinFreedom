#!/usr/bin/env python3
"""
Update MongoDB User Passwords
Updates existing MongoDB users with proper bcrypt password hashing
"""

import os
import sys
import django
import bcrypt

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.mongodb_service import UserService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_user_passwords():
    """Update MongoDB user passwords with proper bcrypt hashing"""
    
    # Define user passwords (you can change these)
    user_passwords = {
        "meDurrani": "12245678",
        "testuser_qa": "testpass123",
        "hmm": "hmm123",
        "Iftakhar": "1donHEX@GON"
    }
    
    user_service = UserService()
    
    for username, password in user_passwords.items():
        try:
            # Hash password with bcrypt
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            # Update user in MongoDB
            result = user_service.db.users.update_one(
                {"username": username},
                {"$set": {"password_hash": password_hash.decode('utf-8')}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated password for user: {username}")
            else:
                logger.warning(f"User not found or password already updated: {username}")
                
        except Exception as e:
            logger.error(f"Error updating password for {username}: {e}")
    
    logger.info("Password update completed!")

def test_authentication():
    """Test authentication for all users"""
    user_service = UserService()
    
    test_users = [
        ("meDurrani", "12245678"),
        ("testuser_qa", "testpass123"),
        ("hmm", "hmm123"),
        ("Iftakhar", "1donHEX@GON")
    ]
    
    for username, password in test_users:
        try:
            user = user_service.authenticate_user(username, password)
            if user:
                logger.info(f"✅ Authentication successful for: {username}")
            else:
                logger.error(f"❌ Authentication failed for: {username}")
        except Exception as e:
            logger.error(f"❌ Authentication error for {username}: {e}")

def main():
    """Main function"""
    print("🔐 MongoDB Password Update Tool")
    print("=" * 50)
    
    # Update passwords
    print("Updating user passwords...")
    update_user_passwords()
    
    # Test authentication
    print("\nTesting authentication...")
    test_authentication()
    
    print("\n🎉 Password update completed!")

if __name__ == "__main__":
    main() 