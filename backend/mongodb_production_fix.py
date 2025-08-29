"""
Production Fix for MongoDB Atlas SSL Handshake Issues
"""

# Production MongoDB Configuration
PRODUCTION_CONFIG = {
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
    'tlsAllowInvalidCertificates': True,
    'tlsAllowInvalidHostnames': True,
    'heartbeatFrequencyMS': 10000,
    'serverSelectionTryOnce': False,
    'w': 'majority',
    'journal': True,
    'appName': 'FinancabilityApp'
}

# Quick fix for SSL handshake issues
def get_production_mongodb_uri(base_uri):
    """Add production parameters to MongoDB URI"""
    if '?' in base_uri:
        return f"{base_uri}&retryWrites=true&w=majority&ssl=true"
    else:
        return f"{base_uri}?retryWrites=true&w=majority&ssl=true" 