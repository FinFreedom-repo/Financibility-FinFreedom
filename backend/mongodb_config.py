#!/usr/bin/env python3
"""
MongoDB Configuration Management
Handles different environments and connection issues
"""

import os
import socket
from typing import Dict, Any, Optional

class MongoDBConfig:
    """MongoDB configuration manager for different environments"""
    
    # Production MongoDB Atlas Configuration
    PRODUCTION_CONFIG = {
        'uri': 'mongodb+srv://kraffay96:ToHkxcn2x8HeeW7L@financability-cluster.wghh7fu.mongodb.net/?retryWrites=true&w=majority&appName=financability-cluster',
        'database': 'financability_db',
        'options': {
            'serverSelectionTimeoutMS': 30000,
            'connectTimeoutMS': 30000,
            'socketTimeoutMS': 30000,
            'maxPoolSize': 100,
            'minPoolSize': 10,
            'maxIdleTimeMS': 300000,
            'waitQueueTimeoutMS': 30000,
            'retryWrites': True,
            'retryReads': True,
            'readPreference': 'primaryPreferred',
            'tls': True,
            'tlsAllowInvalidCertificates': False,
            'tlsAllowInvalidHostnames': False,
            'appName': 'FinancabilityApp-Production'
        }
    }
    
    # Development MongoDB Atlas Configuration (Fallback)
    DEVELOPMENT_CONFIG = {
        'uri': 'mongodb://kraffay96:ToHkxcn2x8HeeW7L@ac-nujzpj8-shard-00-00.wghh7fu.mongodb.net:27017/financability_db?ssl=true&authSource=admin&retryWrites=true&w=majority',
        'database': 'financability_db',
        'options': {
            'serverSelectionTimeoutMS': 30000,
            'connectTimeoutMS': 30000,
            'socketTimeoutMS': 30000,
            'maxPoolSize': 50,
            'minPoolSize': 5,
            'maxIdleTimeMS': 300000,
            'waitQueueTimeoutMS': 30000,
            'retryWrites': True,
            'retryReads': True,
            'readPreference': 'primaryPreferred',
            'tls': True,
            'tlsAllowInvalidCertificates': True,  # More permissive for development
            'tlsAllowInvalidHostnames': True,     # More permissive for development
            'appName': 'FinancabilityApp-Development'
        }
    }
    
    # Local MongoDB Configuration (Fallback)
    LOCAL_CONFIG = {
        'uri': 'mongodb://localhost:27017/financability_db',
        'database': 'financability_db',
        'options': {
            'serverSelectionTimeoutMS': 10000,
            'connectTimeoutMS': 10000,
            'socketTimeoutMS': 10000,
            'maxPoolSize': 20,
            'minPoolSize': 2,
            'maxIdleTimeMS': 300000,
            'waitQueueTimeoutMS': 10000,
            'retryWrites': True,
            'retryReads': True,
            'appName': 'FinancabilityApp-Local'
        }
    }
    
    @staticmethod
    def get_environment() -> str:
        """Determine the current environment"""
        env = os.getenv('DJANGO_ENV', 'development').lower()
        if env in ['production', 'prod']:
            return 'production'
        elif env in ['staging', 'stage']:
            return 'staging'
        else:
            return 'development'
    
    @staticmethod
    def test_connection(uri: str, options: Dict[str, Any]) -> bool:
        """Test MongoDB connection"""
        try:
            from pymongo import MongoClient
            client = MongoClient(uri, **options)
            client.admin.command('ping')
            client.close()
            return True
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False
    
    @staticmethod
    def get_optimal_config() -> Dict[str, Any]:
        """Get the best working MongoDB configuration"""
        environment = MongoDBConfig.get_environment()
        
        # Try configurations in order of preference
        configs = []
        
        if environment == 'production':
            configs = [
                ('production', MongoDBConfig.PRODUCTION_CONFIG),
                ('development', MongoDBConfig.DEVELOPMENT_CONFIG),
                ('local', MongoDBConfig.LOCAL_CONFIG)
            ]
        else:
            configs = [
                ('development', MongoDBConfig.DEVELOPMENT_CONFIG),
                ('production', MongoDBConfig.PRODUCTION_CONFIG),
                ('local', MongoDBConfig.LOCAL_CONFIG)
            ]
        
        # Test each configuration
        for config_name, config in configs:
            print(f"🔍 Testing {config_name} configuration...")
            if MongoDBConfig.test_connection(config['uri'], config['options']):
                print(f"✅ {config_name} configuration works!")
                return config
            else:
                print(f"❌ {config_name} configuration failed")
        
        # If all fail, return development config as fallback
        print("⚠️ All configurations failed, using development as fallback")
        return MongoDBConfig.DEVELOPMENT_CONFIG
    
    @staticmethod
    def get_connection_info() -> Dict[str, Any]:
        """Get detailed connection information"""
        config = MongoDBConfig.get_optimal_config()
        
        return {
            'uri': config['uri'],
            'database': config['database'],
            'options': config['options'],
            'environment': MongoDBConfig.get_environment(),
            'hostname': socket.gethostname(),
            'local_ip': socket.gethostbyname(socket.gethostname())
        }

# Health check and monitoring
class MongoDBHealthCheck:
    """MongoDB health monitoring"""
    
    @staticmethod
    def check_connection_health() -> Dict[str, Any]:
        """Comprehensive health check"""
        config = MongoDBConfig.get_optimal_config()
        
        try:
            from pymongo import MongoClient
            import time
            
            start_time = time.time()
            client = MongoClient(config['uri'], **config['options'])
            
            # Test basic connectivity
            ping_result = client.admin.command('ping')
            
            # Test database access
            db = client[config['database']]
            collections = db.list_collection_names()
            
            # Test write operation
            test_collection = db['health_check']
            test_doc = {'timestamp': time.time(), 'test': True}
            result = test_collection.insert_one(test_doc)
            test_collection.delete_one({'_id': result.inserted_id})
            
            client.close()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'collections_count': len(collections),
                'ping_result': ping_result,
                'config_used': config.get('appName', 'unknown')
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'config_used': config.get('appName', 'unknown')
            }

# Usage example
if __name__ == "__main__":
    print("🔧 MongoDB Configuration Test")
    print("=" * 50)
    
    config = MongoDBConfig.get_optimal_config()
    print(f"✅ Using configuration: {config.get('appName', 'unknown')}")
    print(f"📊 Database: {config['database']}")
    
    health = MongoDBHealthCheck.check_connection_health()
    print(f"🏥 Health Status: {health['status']}")
    
    if health['status'] == 'healthy':
        print(f"⏱️ Response Time: {health['response_time_ms']}ms")
        print(f"📁 Collections: {health['collections_count']}")
    else:
        print(f"❌ Error: {health['error']}") 