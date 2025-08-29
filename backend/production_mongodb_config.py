"""
Production MongoDB Configuration
Optimized settings for production deployment with MongoDB Atlas
"""

import os
from typing import Dict, Any

# Production MongoDB Atlas Configuration
PRODUCTION_MONGODB_CONFIG = {
    # Connection timeouts - Production values
    'serverSelectionTimeoutMS': 30000,  # 30 seconds for server selection
    'connectTimeoutMS': 30000,          # 30 seconds for initial connection
    'socketTimeoutMS': 30000,           # 30 seconds for socket operations
    
    # Connection pool settings - Production optimized
    'maxPoolSize': 100,                 # Increased for production load
    'minPoolSize': 10,                  # Maintain minimum connections
    'maxIdleTimeMS': 300000,            # 5 minutes idle time
    'waitQueueTimeoutMS': 30000,        # 30 seconds wait for connection
    
    # Retry settings - Production resilience
    'retryWrites': True,
    'retryReads': True,
    
    # Read preference - Production consistency
    'readPreference': 'primaryPreferred',  # Prefer primary, fallback to secondary
    
    # SSL/TLS settings - Production security (corrected for Atlas)
    'tls': True,                        # Use TLS (modern parameter)
    'tlsAllowInvalidCertificates': True,   # Allow invalid certificates for development
    'tlsAllowInvalidHostnames': True,      # Allow invalid hostnames for development
    
    # Heartbeat settings - Production monitoring
    'heartbeatFrequencyMS': 10000,      # 10 seconds heartbeat
    'serverSelectionTryOnce': False,    # Keep trying to connect
    
    # Write concern - Production durability
    'w': 'majority',                    # Wait for majority of replica set
    'journal': True,                    # Wait for journal commit
    
    # Application name for monitoring
    'appName': 'FinancabilityApp'
}

# Environment-specific configurations
def get_mongodb_config(environment: str = 'production') -> Dict[str, Any]:
    """Get MongoDB configuration based on environment"""
    
    if environment == 'production':
        return PRODUCTION_MONGODB_CONFIG
    elif environment == 'staging':
        # Staging configuration - similar to production but with smaller pool
        staging_config = PRODUCTION_MONGODB_CONFIG.copy()
        staging_config.update({
            'maxPoolSize': 50,
            'minPoolSize': 5,
            'appName': 'FinancabilityApp-Staging'
        })
        return staging_config
    elif environment == 'development':
        # Development configuration - smaller timeouts and pool
        dev_config = PRODUCTION_MONGODB_CONFIG.copy()
        dev_config.update({
            'serverSelectionTimeoutMS': 10000,
            'connectTimeoutMS': 10000,
            'socketTimeoutMS': 10000,
            'maxPoolSize': 20,
            'minPoolSize': 2,
            'appName': 'FinancabilityApp-Dev'
        })
        return dev_config
    else:
        return PRODUCTION_MONGODB_CONFIG

# Connection health check settings
HEALTH_CHECK_CONFIG = {
    'max_retries': 3,
    'retry_delay': 5,
    'health_check_timeout': 5000,
    'health_check_interval': 30000  # 30 seconds
}

# Error handling and logging
ERROR_HANDLING_CONFIG = {
    'log_connection_errors': True,
    'log_ssl_errors': True,
    'log_timeout_errors': True,
    'enable_detailed_logging': True
}

# Performance monitoring
PERFORMANCE_CONFIG = {
    'enable_query_logging': False,  # Set to True for debugging
    'log_slow_queries': True,
    'slow_query_threshold_ms': 1000,
    'enable_connection_pool_monitoring': True
} 