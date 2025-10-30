"""
Transaction Services
Transaction management operations
"""

from datetime import datetime
from typing import Dict, List, Optional
from bson import ObjectId
import logging

from common.database import get_collection

logger = logging.getLogger(__name__)


class TransactionService:
    """Service for transaction management operations"""
    
    def __init__(self):
        self.transactions = get_collection('transactions')
    
    def create_transaction(self, user_id: str, transaction_data: Dict) -> Dict:
        """Create a new transaction"""
        try:
            transaction_data.update({
                "user_id": str(user_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            result = self.transactions.insert_one(transaction_data)
            transaction_data['_id'] = result.inserted_id
            return transaction_data
            
        except Exception as e:
            logger.error(f"Error creating transaction: {e}")
            raise
    
    def get_user_transactions(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get all transactions for a user"""
        try:
            transactions = list(self.transactions.find(
                {"user_id": str(user_id)}
            ).sort("created_at", -1).limit(limit))
            return transactions
        except Exception as e:
            logger.error(f"Error getting user transactions: {e}")
            return []
    
    def get_transaction_by_id(self, transaction_id: str) -> Optional[Dict]:
        """Get transaction by ID"""
        try:
            transaction = self.transactions.find_one({"_id": ObjectId(transaction_id)})
            return transaction
        except Exception as e:
            logger.error(f"Error getting transaction by ID: {e}")
            return None
    
    def update_transaction(self, transaction_id: str, transaction_data: Dict) -> bool:
        """Update transaction"""
        try:
            transaction_data["updated_at"] = datetime.utcnow()
            result = self.transactions.update_one(
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
            result = self.transactions.delete_one({"_id": ObjectId(transaction_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting transaction: {e}")
            return False

