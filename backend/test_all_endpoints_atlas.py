#!/usr/bin/env python3
"""
Comprehensive MongoDB Atlas Endpoints Test Suite
Tests all CRUD operations for Accounts, Debts, Monthly Budget, Debt Planning, Profile, Dashboard, and Wealth Projector
"""

import sys
import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class AtlasEndpointTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/mongodb"
        self.session = requests.Session()
        self.test_user_token = None
        self.test_user_id = None
        self.created_objects = {
            'accounts': [],
            'debts': [],
            'budgets': [],
            'transactions': []
        }
        
    def print_section(self, title):
        """Print a section header"""
        print(f"\n{'='*60}")
        print(f"🔍 {title}")
        print(f"{'='*60}")
        
    def print_test(self, test_name, result, details=""):
        """Print test result"""
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
            
    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.test_user_token:
            headers['Authorization'] = f'Bearer {self.test_user_token}'
            
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None
            
    def test_health_check(self):
        """Test API health check"""
        self.print_section("Health Check")
        
        response = self.make_request('GET', '/', auth_required=False)
        if response and response.status_code == 200:
            data = response.json()
            self.print_test("Health Check", True, f"Status: {data.get('status', 'unknown')}")
            return True
        else:
            self.print_test("Health Check", False, f"Status code: {response.status_code if response else 'No response'}")
            return False
            
    def test_authentication(self):
        """Test user authentication endpoints"""
        self.print_section("Authentication Tests")
        
        # Test user registration
        register_data = {
            "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = self.make_request('POST', '/auth/mongodb/register/', register_data, auth_required=False)
        if response and response.status_code in [200, 201]:
            self.print_test("User Registration", True, "User created successfully")
            register_success = True
        else:
            self.print_test("User Registration", False, f"Status: {response.status_code if response else 'No response'}")
            register_success = False
            
        # Test user login
        login_data = {
            "username": register_data["username"],
            "password": register_data["password"]
        }
        
        response = self.make_request('POST', '/auth/mongodb/login/', login_data, auth_required=False)
        if response and response.status_code == 200:
            data = response.json()
            self.test_user_token = data.get('access')  # Fixed: was 'access_token', should be 'access'
            user_data = data.get('user', {})
            self.test_user_id = user_data.get('id')
            self.print_test("User Login", True, f"Token received: {bool(self.test_user_token)}, User ID: {self.test_user_id}")
            login_success = True
        else:
            self.print_test("User Login", False, f"Status: {response.status_code if response else 'No response'}")
            login_success = False
            
        # Test profile retrieval
        if self.test_user_token:
            response = self.make_request('GET', '/auth/mongodb/profile/')
            if response and response.status_code == 200:
                profile_data = response.json()
                self.print_test("Get Profile", True, f"Username: {profile_data.get('username', 'unknown')}")
                profile_success = True
            else:
                self.print_test("Get Profile", False, f"Status: {response.status_code if response else 'No response'}")
                profile_success = False
        else:
            self.print_test("Get Profile", False, "No auth token available")
            profile_success = False
            
        return register_success and login_success and profile_success
        
    def test_accounts_crud(self):
        """Test Accounts CRUD operations"""
        self.print_section("Accounts CRUD Tests")
        
        if not self.test_user_token:
            self.print_test("Accounts Tests", False, "No authentication token")
            return False
            
        # Create Account
        account_data = {
            "name": f"Test Checking Account {datetime.now().strftime('%H%M%S')}",
            "type": "checking",
            "balance": 5000.00,
            "currency": "USD",
            "description": "Test account for Atlas testing"
        }
        
        response = self.make_request('POST', '/accounts/create/', account_data)
        if response and response.status_code in [200, 201]:
            created_response = response.json()
            # Account data is nested under 'account' key
            account_data_response = created_response.get('account', created_response)
            account_id = account_data_response.get('_id') or account_data_response.get('id')
            self.created_objects['accounts'].append(account_id)
            self.print_test("Create Account", True, f"ID: {account_id}")
            create_success = True
        else:
            self.print_test("Create Account", False, f"Status: {response.status_code if response else 'No response'}")
            create_success = False
            account_id = None
            
        # Read Accounts
        response = self.make_request('GET', '/accounts/')
        if response and response.status_code == 200:
            accounts = response.json()
            account_count = len(accounts) if isinstance(accounts, list) else len(accounts.get('accounts', []))
            self.print_test("Read Accounts", True, f"Found {account_count} accounts")
            read_success = True
        else:
            self.print_test("Read Accounts", False, f"Status: {response.status_code if response else 'No response'}")
            read_success = False
            
        # Update Account
        if account_id:
            update_data = {
                "name": f"Updated Test Account {datetime.now().strftime('%H%M%S')}",
                "balance": 6000.00
            }
            response = self.make_request('PUT', f'/accounts/{account_id}/update/', update_data)
            if response and response.status_code == 200:
                self.print_test("Update Account", True, "Account updated successfully")
                update_success = True
            else:
                self.print_test("Update Account", False, f"Status: {response.status_code if response else 'No response'}")
                update_success = False
        else:
            self.print_test("Update Account", False, "No account ID available")
            update_success = False
            
        return create_success and read_success and update_success
        
    def test_debts_crud(self):
        """Test Debts CRUD operations"""
        self.print_section("Debts CRUD Tests")
        
        if not self.test_user_token:
            self.print_test("Debts Tests", False, "No authentication token")
            return False
            
        # Create Debt
        debt_data = {
            "name": f"Test Credit Card {datetime.now().strftime('%H%M%S')}",
            "debt_type": "credit_card",
            "amount": 3000.00,
            "balance": 2500.00,
            "interest_rate": 18.5,
            "minimum_payment": 75.00,
            "effective_date": datetime.now().isoformat()
        }
        
        response = self.make_request('POST', '/debts/create/', debt_data)
        if response and response.status_code in [200, 201]:
            created_response = response.json()
            # Debt data is nested under 'debt' key
            debt_data_response = created_response.get('debt', created_response)
            debt_id = debt_data_response.get('_id') or debt_data_response.get('id')
            self.created_objects['debts'].append(debt_id)
            self.print_test("Create Debt", True, f"ID: {debt_id}")
            create_success = True
        else:
            self.print_test("Create Debt", False, f"Status: {response.status_code if response else 'No response'}")
            create_success = False
            debt_id = None
            
        # Read Debts
        response = self.make_request('GET', '/debts/')
        if response and response.status_code == 200:
            debts = response.json()
            debt_count = len(debts) if isinstance(debts, list) else len(debts.get('debts', []))
            self.print_test("Read Debts", True, f"Found {debt_count} debts")
            read_success = True
        else:
            self.print_test("Read Debts", False, f"Status: {response.status_code if response else 'No response'}")
            read_success = False
            
        # Update Debt
        if debt_id:
            update_data = {
                "balance": 2300.00,
                "minimum_payment": 80.00
            }
            response = self.make_request('PUT', f'/debts/{debt_id}/update/', update_data)
            if response and response.status_code == 200:
                self.print_test("Update Debt", True, "Debt updated successfully")
                update_success = True
            else:
                self.print_test("Update Debt", False, f"Status: {response.status_code if response else 'No response'}")
                update_success = False
        else:
            self.print_test("Update Debt", False, "No debt ID available")
            update_success = False
            
        return create_success and read_success and update_success
        
    def test_budget_crud(self):
        """Test Monthly Budget CRUD operations"""
        self.print_section("Monthly Budget CRUD Tests")
        
        if not self.test_user_token:
            self.print_test("Budget Tests", False, "No authentication token")
            return False
            
        # Create Budget
        budget_data = {
            "month": datetime.now().strftime('%Y-%m'),
            "income": 7500.00,
            "housing": 2000.00,
            "transportation": 500.00,
            "food": 600.00,
            "utilities": 300.00,
            "entertainment": 400.00,
            "healthcare": 300.00,
            "debt_payments": 800.00,
            "shopping": 200.00,
            "travel": 300.00,
            "education": 100.00,
            "childcare": 0.00,
            "other": 200.00
        }
        
        response = self.make_request('POST', '/budgets/create/', budget_data)
        if response and response.status_code in [200, 201]:
            created_response = response.json()
            # Budget data is nested under 'budget' key
            budget_data_response = created_response.get('budget', created_response)
            budget_id = budget_data_response.get('_id') or budget_data_response.get('id')
            self.created_objects['budgets'].append(budget_id)
            self.print_test("Create Budget", True, f"ID: {budget_id}")
            create_success = True
        else:
            self.print_test("Create Budget", False, f"Status: {response.status_code if response else 'No response'}")
            create_success = False
            budget_id = None
            
        # Read Budgets
        response = self.make_request('GET', '/budgets/')
        if response and response.status_code == 200:
            budgets = response.json()
            budget_count = len(budgets) if isinstance(budgets, list) else len(budgets.get('budgets', []))
            self.print_test("Read Budgets", True, f"Found {budget_count} budgets")
            read_success = True
        else:
            self.print_test("Read Budgets", False, f"Status: {response.status_code if response else 'No response'}")
            read_success = False
            
        # Test Get Month Budget
        current_date = datetime.now()
        month_param = f"?year={current_date.year}&month={current_date.strftime('%m')}"
        response = self.make_request('GET', f'/budgets/get-month/{month_param}')
        if response and response.status_code == 200:
            month_budget = response.json()
            self.print_test("Get Month Budget", True, f"Month: {month_budget.get('month', 'unknown')}")
            month_success = True
        else:
            self.print_test("Get Month Budget", False, f"Status: {response.status_code if response else 'No response'}")
            month_success = False
            
        # Test Save Month Budget
        save_budget_data = {
            "month": datetime.now().strftime('%Y-%m'),
            "budgets": [budget_data]
        }
        response = self.make_request('POST', '/budgets/save-month/', save_budget_data)
        if response and response.status_code in [200, 201]:
            self.print_test("Save Month Budget", True, "Budget saved successfully")
            save_success = True
        else:
            self.print_test("Save Month Budget", False, f"Status: {response.status_code if response else 'No response'}")
            save_success = False
            
        return create_success and read_success and month_success and save_success
        
    def test_debt_planning(self):
        """Test Debt Planning functionality"""
        self.print_section("Debt Planning Tests")
        
        if not self.test_user_token:
            self.print_test("Debt Planning Tests", False, "No authentication token")
            return False
            
        # Test Debt Planner with test endpoint (no auth required)
        debt_planner_data = {
            "debts": [
                {
                    "name": "Credit Card 1",
                    "balance": 5000,
                    "rate": 0.18,
                    "minimum_payment": 150
                },
                {
                    "name": "Personal Loan",
                    "balance": 10000,
                    "rate": 0.12,
                    "minimum_payment": 300
                }
            ],
            "strategy": "snowball",
            "monthly_budget_data": [
                {
                    "month": "2024-01",
                    "net_savings": 500
                },
                {
                    "month": "2024-02", 
                    "net_savings": 600
                }
            ]
        }
        
        response = self.make_request('POST', '/debt-planner-test/', debt_planner_data, auth_required=False)
        if response and response.status_code == 200:
            planner_result = response.json()
            total_months = planner_result.get('total_months_to_debt_free', 0)
            self.print_test("Debt Planner (Test)", True, f"Debt free in {total_months} months")
            test_success = True
        else:
            self.print_test("Debt Planner (Test)", False, f"Status: {response.status_code if response else 'No response'}")
            test_success = False
            
        # Test authenticated debt planner
        response = self.make_request('POST', '/debt-planner/', debt_planner_data)
        if response and response.status_code == 200:
            planner_result = response.json()
            total_months = planner_result.get('total_months_to_debt_free', 0)
            self.print_test("Debt Planner (Auth)", True, f"Debt free in {total_months} months")
            auth_success = True
        else:
            self.print_test("Debt Planner (Auth)", False, f"Status: {response.status_code if response else 'No response'}")
            auth_success = False
            
        return test_success and auth_success
        
    def test_transactions_crud(self):
        """Test Transactions CRUD operations"""
        self.print_section("Transactions CRUD Tests")
        
        if not self.test_user_token:
            self.print_test("Transactions Tests", False, "No authentication token")
            return False
            
        # Create Transaction
        transaction_data = {
            "amount": 250.00,
            "description": f"Test Transaction {datetime.now().strftime('%H%M%S')}",
            "category": "groceries",
            "transaction_type": "expense",
            "date": datetime.now().isoformat()
        }
        
        response = self.make_request('POST', '/transactions/create/', transaction_data)
        if response and response.status_code in [200, 201]:
            created_response = response.json()
            # Transaction data is nested under 'transaction' key
            transaction_data_response = created_response.get('transaction', created_response)
            transaction_id = transaction_data_response.get('_id') or transaction_data_response.get('id')
            self.created_objects['transactions'].append(transaction_id)
            self.print_test("Create Transaction", True, f"ID: {transaction_id}")
            create_success = True
        else:
            self.print_test("Create Transaction", False, f"Status: {response.status_code if response else 'No response'}")
            create_success = False
            transaction_id = None
            
        # Read Transactions
        response = self.make_request('GET', '/transactions/')
        if response and response.status_code == 200:
            transactions = response.json()
            transaction_count = len(transactions) if isinstance(transactions, list) else len(transactions.get('transactions', []))
            self.print_test("Read Transactions", True, f"Found {transaction_count} transactions")
            read_success = True
        else:
            self.print_test("Read Transactions", False, f"Status: {response.status_code if response else 'No response'}")
            read_success = False
            
        return create_success and read_success
        
    def test_settings(self):
        """Test Settings functionality"""
        self.print_section("Settings Tests")
        
        if not self.test_user_token:
            self.print_test("Settings Tests", False, "No authentication token")
            return False
            
        # Get Settings
        response = self.make_request('GET', '/settings/')
        if response and response.status_code == 200:
            settings = response.json()
            self.print_test("Get Settings", True, f"Settings retrieved")
            get_success = True
        else:
            self.print_test("Get Settings", False, f"Status: {response.status_code if response else 'No response'}")
            get_success = False
            
        # Update Settings
        settings_data = {
            "theme": "dark",
            "currency": "USD",
            "notifications": True,
            "auto_save": True
        }
        
        response = self.make_request('PUT', '/settings/update/', settings_data)
        if response and response.status_code == 200:
            self.print_test("Update Settings", True, "Settings updated successfully")
            update_success = True
        else:
            self.print_test("Update Settings", False, f"Status: {response.status_code if response else 'No response'}")
            update_success = False
            
        return get_success and update_success
        
    def test_dashboard_summary(self):
        """Test Dashboard-like summary functionality using accounts/debts summary"""
        self.print_section("Dashboard Summary Tests")
        
        if not self.test_user_token:
            self.print_test("Dashboard Tests", False, "No authentication token")
            return False
            
        # Create some test data first
        account_data = {
            "name": "Dashboard Test Account",
            "type": "savings",
            "balance": 10000.00,
            "currency": "USD"
        }
        
        debt_data = {
            "name": "Dashboard Test Debt",
            "debt_type": "credit_card",
            "amount": 5000.00,
            "balance": 3000.00,
            "interest_rate": 15.0,
            "minimum_payment": 100.00,
            "effective_date": datetime.now().isoformat()
        }
        
        # Create test account and debt
        account_response = self.make_request('POST', '/accounts/create/', account_data)
        debt_response = self.make_request('POST', '/debts/create/', debt_data)
        
        # Test summary-like functionality by getting all accounts and debts
        accounts_response = self.make_request('GET', '/accounts/')
        debts_response = self.make_request('GET', '/debts/')
        
        if (accounts_response and accounts_response.status_code == 200 and 
            debts_response and debts_response.status_code == 200):
            
            accounts_data = accounts_response.json()
            debts_data = debts_response.json()
            
            accounts_list = accounts_data if isinstance(accounts_data, list) else accounts_data.get('accounts', [])
            debts_list = debts_data if isinstance(debts_data, list) else debts_data.get('debts', [])
            
            total_assets = sum(acc.get('balance', 0) for acc in accounts_list)
            total_debts = sum(debt.get('balance', 0) for debt in debts_list)
            net_worth = total_assets - total_debts
            
            self.print_test("Dashboard Summary", True, f"Assets: ${total_assets:,.2f}, Debts: ${total_debts:,.2f}, Net Worth: ${net_worth:,.2f}")
            
            # Cleanup test data
            if account_response and account_response.status_code in [200, 201]:
                account_data_resp = account_response.json().get('account', {})
                account_id = account_data_resp.get('_id')
                if account_id:
                    self.make_request('DELETE', f'/accounts/{account_id}/delete/')
                    
            if debt_response and debt_response.status_code in [200, 201]:
                debt_data_resp = debt_response.json().get('debt', {})
                debt_id = debt_data_resp.get('_id')
                if debt_id:
                    self.make_request('DELETE', f'/debts/{debt_id}/delete/')
            
            return True
        else:
            self.print_test("Dashboard Summary", False, "Failed to retrieve accounts/debts data")
            return False
        
    def test_wealth_projector(self):
        """Test Wealth Projector functionality using the calculation function"""
        self.print_section("Wealth Projector Tests")
        
        try:
            # Import the wealth projection function
            from api.wealth_projection import calculate_wealth_projection
            
            # Test data for wealth projection
            projection_data = {
                "age": 30,
                "maxAge": 65,
                "startWealth": 50000,
                "debt": 25000,
                "debtInterest": 6.5,
                "assetInterest": 7.0,
                "inflation": 3.0,
                "taxRate": 22.0,
                "annualContributions": 12000,
                "checkingInterest": 4.0
            }
            
            # Calculate projection
            projection_result = calculate_wealth_projection(projection_data)
            
            if projection_result and len(projection_result) > 0:
                years_projected = len(projection_result)
                final_wealth = projection_result[-1].get('wealth', 0) if projection_result else 0
                self.print_test("Wealth Projection Calculation", True, f"{years_projected} years projected, final wealth: ${final_wealth:,.2f}")
                return True
            else:
                self.print_test("Wealth Projection Calculation", False, "No projection data returned")
                return False
                
        except Exception as e:
            self.print_test("Wealth Projection Calculation", False, f"Error: {str(e)}")
            return False
            
    def cleanup_test_data(self):
        """Clean up created test data"""
        self.print_section("Cleanup Test Data")
        
        if not self.test_user_token:
            self.print_test("Cleanup", False, "No authentication token")
            return
            
        cleanup_success = True
        
        # Delete created accounts
        for account_id in self.created_objects['accounts']:
            response = self.make_request('DELETE', f'/accounts/{account_id}/delete/')
            if response and response.status_code in [200, 204]:
                self.print_test(f"Delete Account {account_id}", True, "Account deleted")
            else:
                self.print_test(f"Delete Account {account_id}", False, f"Status: {response.status_code if response else 'No response'}")
                cleanup_success = False
                
        # Delete created debts
        for debt_id in self.created_objects['debts']:
            response = self.make_request('DELETE', f'/debts/{debt_id}/delete/')
            if response and response.status_code in [200, 204]:
                self.print_test(f"Delete Debt {debt_id}", True, "Debt deleted")
            else:
                self.print_test(f"Delete Debt {debt_id}", False, f"Status: {response.status_code if response else 'No response'}")
                cleanup_success = False
                
        # Delete created budgets
        for budget_id in self.created_objects['budgets']:
            response = self.make_request('DELETE', f'/budgets/{budget_id}/delete/')
            if response and response.status_code in [200, 204]:
                self.print_test(f"Delete Budget {budget_id}", True, "Budget deleted")
            else:
                self.print_test(f"Delete Budget {budget_id}", False, f"Status: {response.status_code if response else 'No response'}")
                cleanup_success = False
                
        # Delete created transactions
        for transaction_id in self.created_objects['transactions']:
            response = self.make_request('DELETE', f'/transactions/{transaction_id}/delete/')
            if response and response.status_code in [200, 204]:
                self.print_test(f"Delete Transaction {transaction_id}", True, "Transaction deleted")
            else:
                self.print_test(f"Delete Transaction {transaction_id}", False, f"Status: {response.status_code if response else 'No response'}")
                cleanup_success = False
                
        return cleanup_success
        
    def run_all_tests(self):
        """Run all endpoint tests"""
        print("🔥 MongoDB Atlas Comprehensive Endpoint Testing")
        print("="*80)
        
        results = {}
        
        # Test each component
        results['health_check'] = self.test_health_check()
        results['authentication'] = self.test_authentication()
        results['accounts'] = self.test_accounts_crud()
        results['debts'] = self.test_debts_crud()
        results['budget'] = self.test_budget_crud()
        results['debt_planning'] = self.test_debt_planning()
        results['transactions'] = self.test_transactions_crud()
        results['settings'] = self.test_settings()
        results['dashboard'] = self.test_dashboard_summary()
        results['wealth_projector'] = self.test_wealth_projector()
        
        # Cleanup
        results['cleanup'] = self.cleanup_test_data()
        
        # Print summary
        self.print_section("Test Results Summary")
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
            
        print(f"\n📊 Overall Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! MongoDB Atlas integration is fully functional!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    """Main test function"""
    # Check if Django server is running
    tester = AtlasEndpointTester()
    
    print("🔍 Starting MongoDB Atlas endpoint testing...")
    print("Make sure Django server is running on http://localhost:8000")
    print()
    
    try:
        return tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n❌ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Testing failed with error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())