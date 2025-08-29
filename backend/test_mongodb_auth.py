#!/usr/bin/env python3
"""
Test MongoDB Authentication
Debug script to test MongoDB authentication functionality
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.mongodb_service import UserService, JWTAuthService
from api.mongodb_auth_views import MongoDBAuthViews

def test_mongodb_auth():
    """Test MongoDB authentication"""
    print("🧪 Testing MongoDB Authentication")
    print("=" * 40)
    
    # Test 1: Check if users exist
    print("\n1. Checking users in database...")
    user_service = UserService()
    users = list(user_service.db.users.find())
    print(f"Found {len(users)} users in database")
    for user in users:
        print(f"  - {user['username']} ({user['email']})")
    
    # Test 2: Test authentication
    print("\n2. Testing authentication...")
    test_username = "meDurrani"
    test_password = "12245678"
    
    try:
        user = user_service.authenticate_user(test_username, test_password)
        if user:
            print(f"✅ Authentication successful for {test_username}")
            print(f"  User ID: {user['_id']}")
            print(f"  Email: {user['email']}")
        else:
            print(f"❌ Authentication failed for {test_username}")
    except Exception as e:
        print(f"❌ Authentication error: {e}")
    
    # Test 3: Test JWT token creation
    print("\n3. Testing JWT token creation...")
    if user:
        try:
            jwt_service = JWTAuthService()
            token_data = {
                'user_id': str(user['_id']),
                'username': user['username']
            }
            
            access_token = jwt_service.create_access_token(token_data)
            refresh_token = jwt_service.create_refresh_token(token_data)
            
            print(f"✅ JWT tokens created successfully")
            print(f"  Access token: {access_token[:50]}...")
            print(f"  Refresh token: {refresh_token[:50]}...")
            
            # Test token verification
            payload = jwt_service.verify_token(access_token)
            if payload:
                print(f"✅ Token verification successful")
                print(f"  User ID: {payload.get('user_id')}")
                print(f"  Username: {payload.get('username')}")
            else:
                print(f"❌ Token verification failed")
                
        except Exception as e:
            print(f"❌ JWT error: {e}")
    
    # Test 4: Test static method call
    print("\n4. Testing static method call...")
    try:
        # Create a mock request object
        class MockRequest:
            def __init__(self):
                self.body = b'{"username": "meDurrani", "password": "12245678"}'
                self.headers = {}
        
        mock_request = MockRequest()
        response = MongoDBAuthViews.login(mock_request)
        print(f"✅ Static method call successful")
        print(f"  Response status: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Static method call error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_mongodb_auth() 