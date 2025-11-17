"""
Health Check and Server Info Endpoints
"""

from django.http import JsonResponse
import os
from datetime import datetime


def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({"status": "healthy", "message": "MongoDB API is running"})


def server_info(request):
    """Server information including startup timestamp"""
    startup_time = os.getenv('SERVER_STARTUP_TIME', datetime.now().isoformat())
    return JsonResponse({
        "status": "running",
        "startup_time": startup_time,
        "current_time": datetime.now().isoformat()
    })

