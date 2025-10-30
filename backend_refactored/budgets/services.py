"""
Budget Services
Budget management operations
"""

from datetime import datetime
from typing import Dict, List, Optional
from bson import ObjectId
import logging

from common.database import get_collection

logger = logging.getLogger(__name__)


class BudgetService:
    """Service for budget management operations"""
    
    def __init__(self):
        self.budgets = get_collection('budgets')
    
    def create_budget(self, user_id: str, budget_data: Dict) -> Dict:
        """Create a new budget with all required fields"""
        try:
            logger.info(f"Creating budget for user {user_id}")
            
            # Default budget structure
            default_budget = {
                "income": 0.0,
                "additional_income": 0.0,
                "additional_income_items": [],
                "expenses": {
                    "housing": 0.0,
                    "debt_payments": 0.0,
                    "transportation": 0.0,
                    "food": 0.0,
                    "healthcare": 0.0,
                    "entertainment": 0.0,
                    "shopping": 0.0,
                    "travel": 0.0,
                    "education": 0.0,
                    "utilities": 0.0,
                    "childcare": 0.0,
                    "others": 0.0
                },
                "additional_items": [],
                "savings_items": [],
                "manually_edited_categories": []
            }
            
            # Merge provided data with defaults
            if "expenses" in budget_data and isinstance(budget_data["expenses"], dict):
                default_budget["expenses"].update(budget_data["expenses"])
            
            for key in ["income", "additional_income", "additional_income_items", "additional_items", "savings_items", "manually_edited_categories"]:
                if key in budget_data:
                    default_budget[key] = budget_data[key]
            
            # Add month and year
            default_budget.update({
                "month": budget_data.get("month"),
                "year": budget_data.get("year")
            })
            
            # Check if budget already exists
            existing_budget = self.budgets.find_one({
                "user_id": str(user_id),
                "month": default_budget.get("month"),
                "year": default_budget.get("year")
            })
            
            if existing_budget:
                # Update existing budget
                default_budget.update({
                    "user_id": str(user_id),
                    "updated_at": datetime.utcnow()
                })
                
                self.budgets.update_one(
                    {"_id": existing_budget["_id"]},
                    {"$set": default_budget}
                )
                
                updated_budget = self.budgets.find_one({"_id": existing_budget["_id"]})
                return updated_budget
            else:
                # Create new budget
                default_budget.update({
                    "user_id": str(user_id),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                
                result = self.budgets.insert_one(default_budget)
                default_budget['_id'] = result.inserted_id
                return default_budget
            
        except Exception as e:
            logger.error(f"Error creating budget: {e}")
            raise
    
    def get_user_budgets(self, user_id: str) -> List[Dict]:
        """Get all budgets for a user"""
        try:
            all_budgets = list(self.budgets.find({"user_id": str(user_id)}).sort("created_at", -1))
            
            # Group by month/year and keep most recent
            unique_budgets = {}
            for budget in all_budgets:
                month_key = f"{budget.get('month')}_{budget.get('year')}"
                if month_key not in unique_budgets:
                    unique_budgets[month_key] = budget
            
            budgets = list(unique_budgets.values())
            budgets.sort(key=lambda x: (x.get('year', 0), x.get('month', 0)))
            
            return budgets
        except Exception as e:
            logger.error(f"Error getting user budgets: {e}")
            return []
    
    def get_budget_by_id(self, budget_id: str) -> Optional[Dict]:
        """Get budget by ID"""
        try:
            budget = self.budgets.find_one({"_id": ObjectId(budget_id)})
            return budget
        except Exception as e:
            logger.error(f"Error getting budget by ID: {e}")
            return None
    
    def get_budget_by_month_year(self, user_id: str, month: int, year: int) -> Optional[Dict]:
        """Get budget for a specific month and year"""
        try:
            budget = self.budgets.find_one({
                "user_id": str(user_id),
                "month": month,
                "year": year
            })
            return budget
        except Exception as e:
            logger.error(f"Error getting budget by month/year: {e}")
            return None
    
    def update_budget(self, budget_id: str, budget_data: Dict) -> bool:
        """Update budget"""
        try:
            existing_budget = self.budgets.find_one({"_id": ObjectId(budget_id)})
            if not existing_budget:
                return False
            
            # Default structure
            default_budget = {
                "income": 0.0,
                "additional_income": 0.0,
                "additional_income_items": [],
                "expenses": {
                    "housing": 0.0,
                    "debt_payments": 0.0,
                    "transportation": 0.0,
                    "food": 0.0,
                    "healthcare": 0.0,
                    "entertainment": 0.0,
                    "shopping": 0.0,
                    "travel": 0.0,
                    "education": 0.0,
                    "utilities": 0.0,
                    "childcare": 0.0,
                    "others": 0.0
                },
                "additional_items": [],
                "savings_items": [],
                "manually_edited_categories": []
            }
            
            # Merge data
            if "expenses" in budget_data and isinstance(budget_data["expenses"], dict):
                default_budget["expenses"].update(budget_data["expenses"])
            
            for key in ["income", "additional_income", "additional_income_items", "additional_items", "savings_items", "manually_edited_categories"]:
                if key in budget_data:
                    default_budget[key] = budget_data[key]
            
            default_budget["updated_at"] = datetime.utcnow()
            
            result = self.budgets.update_one(
                {"_id": ObjectId(budget_id)},
                {"$set": default_budget}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating budget: {e}")
            return False
    
    def delete_budget(self, budget_id: str) -> bool:
        """Delete budget"""
        try:
            result = self.budgets.delete_one({"_id": ObjectId(budget_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting budget: {e}")
            return False

