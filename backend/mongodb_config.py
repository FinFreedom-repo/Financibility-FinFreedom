#!/usr/bin/env python3
"""
Unified MongoDB Configuration Management
Handles all MongoDB connections, environments, and health monitoring
"""

import os
import logging
from typing import Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import time

logger = logging.getLogger(__name__)

class MongoDBConfig:
    """Unified MongoDB configuration manager for all environments"""

    @staticmethod
    def _get_env(name: str, default: Optional[str] = None) -> Optional[str]:
        """Get environment variable with optional default"""
        return os.getenv(name, default)

    @staticmethod
    def get_environment() -> str:
        """Determine the current environment"""
        env = MongoDBConfig._get_env('DJANGO_ENV', 'development').lower()
        if env in ('production', 'prod'):
            return 'production'
        if env in ('staging', 'stage'):
            return 'staging'
        return 'development'

    @staticmethod
    def _build_mongodb_uri() -> str:
        """Build MongoDB URI from environment configuration"""
        # Get the base URI from environment
        atlas_uri = MongoDBConfig._get_env('MONGODB_ATLAS_URI')
        
        if not atlas_uri:
            # Fallback to localhost for development
            logger.warning("MONGODB_ATLAS_URI not set, using localhost")
            return "mongodb://localhost:27017"
        
        # Ensure proper URI format
        if atlas_uri.startswith(('mongodb://', 'mongodb+srv://')):
            return atlas_uri
        else:
            return f"mongodb://{atlas_uri}"

    @staticmethod
    def get_database_name() -> str:
        """Get database name from environment"""
        return MongoDBConfig._get_env('MONGODB_NAME', 'financability_db')

    @staticmethod
    def get_connection_options() -> Dict[str, Any]:
        """Get MongoDB connection options based on environment"""
        env = MongoDBConfig.get_environment()
        
        # Base options for all environments - use sensible defaults
        base_options = {
            'serverSelectionTimeoutMS': 30000,
            'connectTimeoutMS': 10000,
            'socketTimeoutMS': 10000,
            'maxPoolSize': 50,
            'minPoolSize': 0,
            'maxIdleTimeMS': 300000,
            'appName': 'FinancabilityApp',
        }
        
        # Environment-specific options
        if env == 'production':
            base_options.update({
                'retryWrites': True,
                'retryReads': True,
                'readPreference': 'primaryPreferred',
            })
        elif env == 'staging':
            base_options.update({
                'retryWrites': True,
                'retryReads': True,
                'readPreference': 'primaryPreferred',
            })
        else:  # development
            base_options.update({
                'retryWrites': False,
                'retryReads': False,
            })
        
        return base_options

    @staticmethod
    def test_connection(uri: str, options: Dict[str, Any]) -> bool:
        """Test MongoDB connection by issuing a ping"""
        try:
            client = MongoClient(uri, **options)
            client.admin.command('ping')
            client.close()
            return True
        except Exception as e:
            logger.debug("Connection test failed: %s", e)
            return False

    @staticmethod
    def get_config() -> Dict[str, Any]:
        """Get complete MongoDB configuration"""
        uri = MongoDBConfig._build_mongodb_uri()
        database = MongoDBConfig.get_database_name()
        options = MongoDBConfig.get_connection_options()
        environment = MongoDBConfig.get_environment()
        
        # Test connection
        if MongoDBConfig.test_connection(uri, options):
            logger.info(f"MongoDB connection successful for {environment} environment")
        else:
            logger.warning(f"MongoDB connection test failed for {environment} environment, but proceeding with configuration")
        
        return {
            'uri': uri,
            'database': database,
            'options': options,
            'environment': environment
        }

    @staticmethod
    def get_client() -> MongoClient:
        """Get a MongoDB client instance"""
        config = MongoDBConfig.get_config()
        return MongoClient(config['uri'], **config['options'])

    @staticmethod
    def get_database():
        """Get the database instance"""
        config = MongoDBConfig.get_config()
        client = MongoDBConfig.get_client()
        return client[config['database']]


class MongoDBHealthCheck:
    """MongoDB health monitoring and diagnostics"""

    @staticmethod
    def check_connection_health() -> Dict[str, Any]:
        """Comprehensive health check"""
        config = MongoDBConfig.get_config()
        allow_write_test = False  # Disable write tests by default
        
        try:
            start_time = time.time()
            client = MongoDBConfig.get_client()

            # Test basic connectivity
            ping_result = client.admin.command('ping')

            # Test database access
            db = MongoDBConfig.get_database()
            collections = db.list_collection_names()

            write_test_result = None
            if allow_write_test:
                try:
                    test_collection = db.get_collection('_health_check')
                    test_doc = {'timestamp': time.time(), 'test': True}
                    result = test_collection.insert_one(test_doc)
                    test_collection.delete_one({'_id': result.inserted_id})
                    write_test_result = 'ok'
                except Exception as e:
                    write_test_result = f'write_test_failed: {e}'

            client.close()
            response_time = (time.time() - start_time) * 1000

            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'collections_count': len(collections),
                'ping_result': ping_result,
                'write_test': write_test_result,
                'environment': config['environment']
            }

        except Exception as e:
            logger.exception("Health check failed")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'environment': config['environment']
            }

    @staticmethod
    def get_connection_info() -> Dict[str, Any]:
        """Get connection information for debugging"""
        config = MongoDBConfig.get_config()
        return {
            'environment': config['environment'],
            'database': config['database'],
            'uri_masked': MongoDBConfig._mask_uri(config['uri']),
            'options': config['options']
        }

    @staticmethod
    def _mask_uri(uri: str) -> str:
        """Mask sensitive information in URI for logging"""
        if '@' in uri:
            # Mask password in URI
            parts = uri.split('@')
            if len(parts) == 2:
                user_pass = parts[0].split('//')[-1]
                if ':' in user_pass:
                    user = user_pass.split(':')[0]
                    return uri.replace(user_pass, f"{user}:***")
        return uri


# Django-specific configuration for compatibility
def get_django_mongodb_config() -> Dict[str, Any]:
    """Get MongoDB configuration in Django format"""
    config = MongoDBConfig.get_config()
    return {
        'ENGINE': 'djongo',
        'NAME': config['database'],
        'ENFORCE_SCHEMA': True,
        'CLIENT': {
            'host': config['uri'],
        }
    }


def get_mongodb_connection() -> Dict[str, str]:
    """Get MongoDB connection settings for mongoengine"""
    config = MongoDBConfig.get_config()
    return {
        'host': config['uri'],
        'db': config['database'],
    }


if __name__ == "__main__":
    # Configure logging for testing
    logging.basicConfig(level=logging.INFO)
    
    logger.info("MongoDB Configuration Test")
    
    config = MongoDBConfig.get_config()
    logger.info("Environment: %s", config['environment'])
    logger.info("Database: %s", config['database'])
    logger.info("App Name: %s", config['options'].get('appName'))

    health = MongoDBHealthCheck.check_connection_health()
    logger.info("Health Status: %s", health.get('status'))
    
    if health.get('status') == 'healthy':
        logger.info("Response Time: %sms", health.get('response_time_ms'))
        logger.info("Collections Count: %s", health.get('collections_count'))
    else:
        logger.error("Health Check Error: %s", health.get('error'))