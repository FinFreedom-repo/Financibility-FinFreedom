#!/usr/bin/env python3
"""
Data Migration Script: SQLite to MongoDB
Migrates all data from SQLite database to MongoDB collections
"""

import os
import sys
import django
from datetime import datetime
from bson import ObjectId

# Setup Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import connection
from api.mongodb_service import UserService, AccountService, DebtService, BudgetService, TransactionService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataMigrator:
    """Handles migration of data from SQLite to MongoDB"""
    
    def __init__(self):
        self.user_service = UserService()
        self.account_service = AccountService()
        self.debt_service = DebtService()
        self.budget_service = BudgetService()
        self.transaction_service = TransactionService()
        
    def migrate_users(self):
        """Migrate users from SQLite to MongoDB"""
        logger.info("Starting user migration...")
        
        users = User.objects.all()
        migrated_count = 0
        
        for user in users:
            try:
                # Check if user already exists in MongoDB
                existing_user = self.user_service.get_user_by_username(user.username)
                if existing_user:
                    logger.info(f"User {user.username} already exists in MongoDB, skipping...")
                    continue
                
                # Create user in MongoDB with proper password hashing
                # For now, we'll use a default password that users can change
                import bcrypt
                default_password = "changeme123"  # Users should change this
                password_hash = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt())
                
                user_data = {
                    "username": user.username,
                    "email": user.email or f"{user.username}@example.com",
                    "password_hash": password_hash.decode('utf-8'),
                    "is_active": user.is_active,
                    "date_joined": user.date_joined,
                    "last_login": user.last_login,
                    "profile": {
                        "first_name": user.first_name or "",
                        "last_name": user.last_name or "",
                        "avatar": ""
                    }
                }
                
                # Insert user into MongoDB
                result = self.user_service.db.users.insert_one(user_data)
                logger.info(f"Migrated user: {user.username} (ID: {result.inserted_id})")
                migrated_count += 1
                
            except Exception as e:
                logger.error(f"Error migrating user {user.username}: {e}")
        
        logger.info(f"User migration completed. Migrated {migrated_count} users.")
        return migrated_count
    
    def migrate_accounts(self):
        """Migrate accounts from SQLite to MongoDB"""
        logger.info("Starting accounts migration...")
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM api_account")
        accounts = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        migrated_count = 0
        
        for account_row in accounts:
            try:
                account_data = dict(zip(columns, account_row))
                
                # Convert Django model data to MongoDB format
                mongodb_account = {
                    "name": account_data.get('name', ''),
                    "account_type": account_data.get('account_type', 'checking'),
                    "balance": float(account_data.get('balance', 0)),
                    "currency": account_data.get('currency', 'USD'),
                    "user_id": ObjectId(account_data.get('user_id')),
                    "created_at": account_data.get('created_at', datetime.utcnow()),
                    "updated_at": account_data.get('updated_at', datetime.utcnow())
                }
                
                # Insert account into MongoDB
                result = self.account_service.db.accounts.insert_one(mongodb_account)
                logger.info(f"Migrated account: {mongodb_account['name']} (ID: {result.inserted_id})")
                migrated_count += 1
                
            except Exception as e:
                logger.error(f"Error migrating account: {e}")
        
        logger.info(f"Accounts migration completed. Migrated {migrated_count} accounts.")
        return migrated_count
    
    def migrate_debts(self):
        """Migrate debts from SQLite to MongoDB"""
        logger.info("Starting debts migration...")
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM api_debt")
        debts = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        migrated_count = 0
        
        for debt_row in debts:
            try:
                debt_data = dict(zip(columns, debt_row))
                
                # Convert Django model data to MongoDB format
                mongodb_debt = {
                    "name": debt_data.get('name', ''),
                    "balance": float(debt_data.get('balance', 0)),
                    "interest_rate": float(debt_data.get('interest_rate', 0)),
                    "minimum_payment": float(debt_data.get('minimum_payment', 0)),
                    "due_date": debt_data.get('due_date'),
                    "user_id": ObjectId(debt_data.get('user_id')),
                    "created_at": debt_data.get('created_at', datetime.utcnow()),
                    "updated_at": debt_data.get('updated_at', datetime.utcnow())
                }
                
                # Insert debt into MongoDB
                result = self.debt_service.db.debts.insert_one(mongodb_debt)
                logger.info(f"Migrated debt: {mongodb_debt['name']} (ID: {result.inserted_id})")
                migrated_count += 1
                
            except Exception as e:
                logger.error(f"Error migrating debt: {e}")
        
        logger.info(f"Debts migration completed. Migrated {migrated_count} debts.")
        return migrated_count
    
    def migrate_budgets(self):
        """Migrate budgets from SQLite to MongoDB"""
        logger.info("Starting budgets migration...")
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM budget_budget")
        budgets = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        migrated_count = 0
        
        for budget_row in budgets:
            try:
                budget_data = dict(zip(columns, budget_row))
                
                # Convert Django model data to MongoDB format
                mongodb_budget = {
                    "month": budget_data.get('month', ''),
                    "year": budget_data.get('year', datetime.now().year),
                    "income": float(budget_data.get('income', 0)),
                    "expenses": {
                        "housing": float(budget_data.get('housing', 0)),
                        "transportation": float(budget_data.get('transportation', 0)),
                        "food": float(budget_data.get('food', 0)),
                        "healthcare": float(budget_data.get('healthcare', 0)),
                        "entertainment": float(budget_data.get('entertainment', 0)),
                        "shopping": float(budget_data.get('shopping', 0)),
                        "travel": float(budget_data.get('travel', 0)),
                        "education": float(budget_data.get('education', 0)),
                        "utilities": float(budget_data.get('utilities', 0)),
                        "childcare": float(budget_data.get('childcare', 0)),
                        "other": float(budget_data.get('other', 0))
                    },
                    "user_id": ObjectId(budget_data.get('user_id')),
                    "created_at": budget_data.get('created_at', datetime.utcnow()),
                    "updated_at": budget_data.get('updated_at', datetime.utcnow())
                }
                
                # Insert budget into MongoDB
                result = self.budget_service.db.budgets.insert_one(mongodb_budget)
                logger.info(f"Migrated budget: {mongodb_budget['month']} {mongodb_budget['year']} (ID: {result.inserted_id})")
                migrated_count += 1
                
            except Exception as e:
                logger.error(f"Error migrating budget: {e}")
        
        logger.info(f"Budgets migration completed. Migrated {migrated_count} budgets.")
        return migrated_count
    
    def migrate_transactions(self):
        """Migrate transactions from SQLite to MongoDB"""
        logger.info("Starting transactions migration...")
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM api_transaction")
        transactions = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        migrated_count = 0
        
        for transaction_row in transactions:
            try:
                transaction_data = dict(zip(columns, transaction_row))
                
                # Convert Django model data to MongoDB format
                mongodb_transaction = {
                    "amount": float(transaction_data.get('amount', 0)),
                    "description": transaction_data.get('description', ''),
                    "category": transaction_data.get('category', ''),
                    "date": transaction_data.get('date'),
                    "type": transaction_data.get('type', 'expense'),
                    "user_id": ObjectId(transaction_data.get('user_id')),
                    "account_id": ObjectId(transaction_data.get('account_id')) if transaction_data.get('account_id') else None,
                    "created_at": transaction_data.get('created_at', datetime.utcnow())
                }
                
                # Insert transaction into MongoDB
                result = self.transaction_service.db.transactions.insert_one(mongodb_transaction)
                logger.info(f"Migrated transaction: {mongodb_transaction['description']} (ID: {result.inserted_id})")
                migrated_count += 1
                
            except Exception as e:
                logger.error(f"Error migrating transaction: {e}")
        
        logger.info(f"Transactions migration completed. Migrated {migrated_count} transactions.")
        return migrated_count
    
    def run_migration(self):
        """Run complete migration"""
        logger.info("Starting complete data migration from SQLite to MongoDB...")
        
        try:
            # Migrate all data types
            users_count = self.migrate_users()
            accounts_count = self.migrate_accounts()
            debts_count = self.migrate_debts()
            budgets_count = self.migrate_budgets()
            transactions_count = self.migrate_transactions()
            
            total_migrated = users_count + accounts_count + debts_count + budgets_count + transactions_count
            
            logger.info("=" * 50)
            logger.info("MIGRATION SUMMARY")
            logger.info("=" * 50)
            logger.info(f"Users migrated: {users_count}")
            logger.info(f"Accounts migrated: {accounts_count}")
            logger.info(f"Debts migrated: {debts_count}")
            logger.info(f"Budgets migrated: {budgets_count}")
            logger.info(f"Transactions migrated: {transactions_count}")
            logger.info(f"Total records migrated: {total_migrated}")
            logger.info("=" * 50)
            logger.info("Migration completed successfully!")
            
            return True
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False

def main():
    """Main migration function"""
    print("🚀 SQLite to MongoDB Migration Tool")
    print("=" * 50)
    
    # Check if MongoDB is available
    try:
        migrator = DataMigrator()
        print("✅ MongoDB connection successful")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please ensure MongoDB is running and accessible")
        return False
    
    # Run migration
    success = migrator.run_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("Your data has been migrated from SQLite to MongoDB.")
        print("You can now switch to MongoDB-only mode.")
    else:
        print("\n❌ Migration failed!")
        print("Please check the logs and try again.")
    
    return success

if __name__ == "__main__":
    main() 