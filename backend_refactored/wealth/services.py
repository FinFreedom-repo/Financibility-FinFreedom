"""
Wealth Services
Wealth projection settings management
"""

from datetime import datetime
from typing import Dict, Optional
from bson import ObjectId
import logging

from common.database import get_collection

logger = logging.getLogger(__name__)


class WealthProjectionSettingsService:
    """Service for wealth projection settings management"""
    
    def __init__(self):
        self.settings = get_collection('wealth_projection_settings')
    
    def get_settings(self, user_id: str) -> Dict:
        """Get wealth projection settings for a user"""
        try:
            settings = self.settings.find_one({"user_id": str(user_id)})
            return settings if settings else {}
        except Exception as e:
            logger.error(f"Error getting wealth projection settings: {e}")
            return {}
    
    def save_settings(self, user_id: str, settings_data: Dict) -> Dict:
        """Save or update wealth projection settings"""
        try:
            # Check if settings exist
            existing_settings = self.settings.find_one({"user_id": str(user_id)})
            
            if existing_settings:
                # Update existing settings
                settings_data["updated_at"] = datetime.utcnow()
                self.settings.update_one(
                    {"user_id": str(user_id)},
                    {"$set": settings_data}
                )
                updated_settings = self.settings.find_one({"user_id": str(user_id)})
                return updated_settings
            else:
                # Create new settings
                settings_data.update({
                    "user_id": str(user_id),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                result = self.settings.insert_one(settings_data)
                settings_data['_id'] = result.inserted_id
                return settings_data
            
        except Exception as e:
            logger.error(f"Error saving wealth projection settings: {e}")
            raise
    
    def delete_settings(self, user_id: str) -> bool:
        """Delete wealth projection settings for a user"""
        try:
            result = self.settings.delete_one({"user_id": str(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting wealth projection settings: {e}")
            return False

