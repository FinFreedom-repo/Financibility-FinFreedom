#!/usr/bin/env python3
"""
Create Test Users in MongoDB
Creates test users for MongoDB authentication testing
"""

import bcrypt
from datetime import datetime
from api.mongodb_service import UserService

def create_test_users():
    """Create test users in MongoDB"""
    print("🔐 Creating Test Users in MongoDB")
    print("=" * 50)
    
    # Test user data
    test_users = [
        {
            "username": "meDurrani",
            "email": "meDurrani@test.com",
            "password": "12245678"
        },
        {
            "username": "testuser_qa",
            "email": "testuser@qa.com",
            "password": "testpass123"
        },
        {
            "username": "hmm",
            "email": "hmm@test.com",
            "password": "hmm123"
        },
        {
            "username": "Iftakhar",
            "email": "iftakhar@example.com",
            "password": "1donHEX@GON"
        }
    ]
    
    user_service = UserService()
    
    for user_data in test_users:
        try:
            # Hash password
            password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Create user document
            user_doc = {
                "username": user_data['username'],
                "email": user_data['email'],
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
            
            # Insert user into MongoDB
            result = user_service.db.users.insert_one(user_doc)
            print(f"✅ Created user: {user_data['username']} (ID: {result.inserted_id})")
            
        except Exception as e:
            print(f"❌ Error creating user {user_data['username']}: {e}")
    
    print("\n🧪 Testing Authentication...")
    print("=" * 30)
    
    # Test authentication for each user
    for user_data in test_users:
        try:
            user = user_service.authenticate_user(user_data['username'], user_data['password'])
            if user:
                print(f"✅ Authentication successful for: {user_data['username']}")
            else:
                print(f"❌ Authentication failed for: {user_data['username']}")
        except Exception as e:
            print(f"❌ Authentication error for {user_data['username']}: {e}")
    
    print("\n🎉 Test user creation completed!")

if __name__ == "__main__":
    create_test_users() 