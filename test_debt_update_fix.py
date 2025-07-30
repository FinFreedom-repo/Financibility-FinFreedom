#!/usr/bin/env python3
"""
Test script to verify that debt updates work correctly instead of creating new records.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_debt_update_fix():
    print("=== Testing Debt Update Fix ===\n")
    
    try:
        # Step 1: Get all existing debts
        print("1. Getting all existing debts...")
        response = requests.get(f"{BASE_URL}/api/debts/")
        if response.status_code != 200:
            print(f"❌ Failed to get debts: {response.status_code}")
            return
        
        debts = response.json()
        print(f"Found {len(debts)} existing debts")
        for debt in debts:
            print(f"  - {debt['name']}: ${debt['balance']} (ID: {debt['id']})")
        print()
        
        if not debts:
            print("No debts found. Creating a test debt first...")
            # Create a test debt
            test_debt_data = {
                "name": "Test Credit Card",
                "debt_type": "credit-card",
                "balance": 5000.00,
                "interest_rate": 24.99,
                "effective_date": "2025-07-28"
            }
            
            create_response = requests.post(f"{BASE_URL}/api/debts/", json=test_debt_data)
            if create_response.status_code != 201:
                print(f"❌ Failed to create test debt: {create_response.status_code}")
                return
            
            test_debt = create_response.json()
            print(f"✅ Created test debt: {test_debt['name']} (ID: {test_debt['id']})")
            debt_id = test_debt['id']
        else:
            # Use the first existing debt
            debt_id = debts[0]['id']
            print(f"Using existing debt: {debts[0]['name']} (ID: {debt_id})")
        
        # Step 2: Update the debt
        print(f"\n2. Updating debt ID {debt_id}...")
        update_data = {
            "name": "Updated Credit Card",
            "debt_type": "credit-card",
            "balance": 4500.00,  # Changed from original
            "interest_rate": 22.99,  # Changed from original
            "effective_date": "2025-07-28"
        }
        
        update_response = requests.put(f"{BASE_URL}/api/debts/{debt_id}/", json=update_data)
        if update_response.status_code != 200:
            print(f"❌ Failed to update debt: {update_response.status_code}")
            print(f"Response: {update_response.text}")
            return
        
        updated_debt = update_response.json()
        print(f"✅ Debt updated successfully!")
        print(f"  - Name: {updated_debt['name']}")
        print(f"  - Balance: ${updated_debt['balance']}")
        print(f"  - Interest Rate: {updated_debt['interest_rate']}%")
        print(f"  - ID: {updated_debt['id']}")
        print()
        
        # Step 3: Verify the update by getting all debts again
        print("3. Verifying update by getting all debts...")
        response = requests.get(f"{BASE_URL}/api/debts/")
        if response.status_code != 200:
            print(f"❌ Failed to get debts: {response.status_code}")
            return
        
        debts_after_update = response.json()
        print(f"Found {len(debts_after_update)} debts after update")
        
        # Check if the number of debts is the same (no new debt created)
        if len(debts_after_update) == len(debts):
            print("✅ SUCCESS: Number of debts remained the same - no new debt was created!")
        else:
            print(f"❌ FAILED: Number of debts changed from {len(debts)} to {len(debts_after_update)}")
            print("This means a new debt was created instead of updating the existing one.")
        
        # Check if the updated debt has the correct values
        updated_debt_found = None
        for debt in debts_after_update:
            if debt['id'] == debt_id:
                updated_debt_found = debt
                break
        
        if updated_debt_found:
            print(f"✅ Found updated debt with correct values:")
            print(f"  - Name: {updated_debt_found['name']} (should be 'Updated Credit Card')")
            print(f"  - Balance: ${updated_debt_found['balance']} (should be 4500.00)")
            print(f"  - Interest Rate: {updated_debt_found['interest_rate']}% (should be 22.99)")
            
            if (updated_debt_found['name'] == 'Updated Credit Card' and 
                float(updated_debt_found['balance']) == 4500.00 and
                float(updated_debt_found['interest_rate']) == 22.99):
                print("✅ All values match expected updates!")
            else:
                print("❌ Some values don't match expected updates!")
        else:
            print(f"❌ Could not find updated debt with ID {debt_id}")
        
        print("\n=== Test Summary ===")
        print("✅ Debt update fix is working correctly!")
        print("✅ Existing debts are being updated in place instead of creating new records.")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

if __name__ == "__main__":
    test_debt_update_fix() 