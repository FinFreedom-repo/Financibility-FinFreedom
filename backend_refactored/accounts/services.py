"""
Account Services
Account management operations
"""

from datetime import datetime
from typing import Dict, List, Optional
from bson import ObjectId
import logging

from common.database import get_collection

logger = logging.getLogger(__name__)


class AccountService:
    """Service for account management operations"""
    
    def __init__(self):
        self.accounts = get_collection('accounts')
        self.debts = get_collection('debts')
    
    def create_account(self, user_id: str, account_data: Dict) -> Dict:
        """Create a new account"""
        try:
            account_data.update({
                "user_id": str(user_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            result = self.accounts.insert_one(account_data)
            account_data['_id'] = result.inserted_id
            return account_data
            
        except Exception as e:
            logger.error(f"Error creating account: {e}")
            raise
    
    def get_user_accounts(self, user_id: str) -> List[Dict]:
        """Get all accounts for a user"""
        try:
            accounts = list(self.accounts.find(
                {"user_id": str(user_id)},
                {
                    "_id": 1,
                    "name": 1,
                    "type": 1,
                    "balance": 1,
                    "currency": 1,
                    "created_at": 1,
                    "updated_at": 1
                }
            ).sort("created_at", -1))
            return accounts
        except Exception as e:
            logger.error(f"Error getting user accounts: {e}")
            return []
    
    def get_account_by_id(self, account_id: str) -> Optional[Dict]:
        """Get account by ID"""
        try:
            account = self.accounts.find_one({"_id": ObjectId(account_id)})
            return account
        except Exception as e:
            logger.error(f"Error getting account by ID: {e}")
            return None
    
    def update_account(self, account_id: str, account_data: Dict) -> bool:
        """Update account"""
        try:
            account_data["updated_at"] = datetime.utcnow()
            result = self.accounts.update_one(
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
            result = self.accounts.delete_one({"_id": ObjectId(account_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting account: {e}")
            return False
    
    def get_user_accounts_and_debts_summary(self, user_id: str) -> Dict:
        """Get both accounts and debts for a user"""
        try:
            accounts = list(self.accounts.find(
                {"user_id": str(user_id)},
                {
                    "_id": 1,
                    "name": 1,
                    "type": 1,
                    "balance": 1,
                    "currency": 1,
                    "created_at": 1,
                    "updated_at": 1
                }
            ).sort("created_at", -1))
            
            debts = list(self.debts.find(
                {"user_id": str(user_id)},
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
            ).sort("created_at", -1))
            
            return {
                "accounts": accounts,
                "debts": debts
            }
            
        except Exception as e:
            logger.error(f"Error getting user accounts and debts summary: {e}")
            return {"accounts": [], "debts": []}

