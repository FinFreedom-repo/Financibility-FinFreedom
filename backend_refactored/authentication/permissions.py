"""
Custom Permission Classes
"""

from rest_framework.permissions import BasePermission
from .authentication import MongoDBUser


class MongoDBIsAuthenticated(BasePermission):
    """
    Custom permission class for MongoDB authentication.
    Allows access only to authenticated users with MongoDBUser objects.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            isinstance(request.user, MongoDBUser) and 
            request.user.is_authenticated
        )



