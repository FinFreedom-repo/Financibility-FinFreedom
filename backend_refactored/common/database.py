"""
Unified MongoDB Database Connection
Provides a singleton MongoDB service for all apps
"""

import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from django.conf import settings

logger = logging.getLogger(__name__)


class MongoDBConnection:
    """Singleton MongoDB connection manager"""
    
    _instance: Optional['MongoDBConnection'] = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBConnection, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self.connect()
    
    def connect(self):
        """Connect to MongoDB using unified configuration"""
        try:
            from mongodb_config import MongoDBConfig
            
            config = MongoDBConfig.get_config()
            mongodb_uri = config['uri']
            db_name = config['database']
            options = config['options']
            
            self._client = MongoClient(mongodb_uri, **options)
            self._db = self._client[db_name]
            
            # Test connection
            self._client.admin.command('ping')
            logger.info(f"✅ MongoDB connected to database: {db_name}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    @property
    def client(self) -> MongoClient:
        """Get MongoDB client"""
        if self._client is None:
            self.connect()
        return self._client
    
    @property
    def db(self) -> Database:
        """Get MongoDB database"""
        if self._db is None:
            self.connect()
        return self._db
    
    def get_collection(self, collection_name: str):
        """Get a specific collection"""
        return self.db[collection_name]
    
    def close(self):
        """Close MongoDB connection"""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("MongoDB connection closed")


# Global database instance
def get_db() -> Database:
    """Get database instance"""
    return MongoDBConnection().db


def get_collection(collection_name: str):
    """Get a specific collection"""
    return MongoDBConnection().get_collection(collection_name)

