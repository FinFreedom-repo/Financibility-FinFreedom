#!/usr/bin/env python3
"""
Test script to check authentication flow
"""

import requests
import json

def test_auth_flow():
    """Test authentication flow"""
    
    print("🔍 Testing Authentication Flow...")
    
    # 1. Test login
    print("\n1. Testing Login...")
    try:
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = requests.post(
            'http://localhost:8000/api/mongodb/auth/mongodb/login/',
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access')
            refresh_token = data.get('refresh')
            print("✅ Login successful!")
            print(f"Access token: {access_token[:50]}..." if access_token else "No access token")
            print(f"Refresh token: {refresh_token[:50]}..." if refresh_token else "No refresh token")
            
            # 2. Test authenticated request
            print("\n2. Testing Authenticated Request...")
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test saving a budget with authentication
            test_budget = {
                "month": 9,
                "year": 2025,
                "income": 12000,
                "additional_income": 0,
                "expenses": {
                    "housing": 30,
                    "transportation": 30,
                    "food": 30,
                    "healthcare": 30,
                    "entertainment": 30,
                    "shopping": 30,
                    "travel": 30,
                    "education": 30,
                    "utilities": 30,
                    "childcare": 30,
                    "debt_payments": 30,
                    "others": 30
                },
                "additional_items": [],
                "savings_items": [
                    {"name": "Emergency", "amount": 230}
                ]
            }
            
            response = requests.post(
                'http://localhost:8000/api/mongodb/budgets/save-month/',
                json=test_budget,
                headers=headers
            )
            
            print(f"Save Status: {response.status_code}")
            if response.status_code in [200, 201]:
                print("✅ Budget saved successfully with authentication!")
                print(f"Response: {response.json()}")
            else:
                print(f"❌ Save failed: {response.text}")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Auth error: {e}")

if __name__ == "__main__":
    test_auth_flow() 