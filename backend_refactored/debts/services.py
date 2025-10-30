"""
Debt Services
Debt management operations
"""

from datetime import datetime
from typing import Dict, List, Optional
from bson import ObjectId
import logging

from common.database import get_collection

logger = logging.getLogger(__name__)


class DebtService:
    """Service for debt management operations"""
    
    def __init__(self):
        self.debts = get_collection('debts')
    
    def create_debt(self, user_id: str, debt_data: Dict) -> Dict:
        """Create a new debt"""
        try:
            debt_data.update({
                "user_id": str(user_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            result = self.debts.insert_one(debt_data)
            debt_data['_id'] = result.inserted_id
            return debt_data
            
        except Exception as e:
            logger.error(f"Error creating debt: {e}")
            raise
    
    def get_user_debts(self, user_id: str) -> List[Dict]:
        """Get all debts for a user"""
        try:
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
            return debts
        except Exception as e:
            logger.error(f"Error getting user debts: {e}")
            return []
    
    def get_debt_by_id(self, debt_id: str) -> Optional[Dict]:
        """Get debt by ID"""
        try:
            debt = self.debts.find_one({"_id": ObjectId(debt_id)})
            return debt
        except Exception as e:
            logger.error(f"Error getting debt by ID: {e}")
            return None
    
    def update_debt(self, debt_id: str, debt_data: Dict) -> bool:
        """Update debt"""
        try:
            debt_data["updated_at"] = datetime.utcnow()
            result = self.debts.update_one(
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
            result = self.debts.delete_one({"_id": ObjectId(debt_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting debt: {e}")
            return False

