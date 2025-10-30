"""
Custom Middleware
"""

import logging

logger = logging.getLogger(__name__)


class CustomCorsMiddleware:
    """
    Custom CORS middleware for additional CORS handling
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add custom CORS headers if needed
        if request.method == 'OPTIONS':
            response['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response['Access-Control-Allow-Credentials'] = 'true'
        
        return response

