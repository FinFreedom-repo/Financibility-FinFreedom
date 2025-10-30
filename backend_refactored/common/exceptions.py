"""
Custom Exception Classes
"""


class MongoDBServiceError(Exception):
    """Base exception for MongoDB service errors"""
    pass


class UserNotFoundError(MongoDBServiceError):
    """Raised when user is not found"""
    pass


class InvalidCredentialsError(MongoDBServiceError):
    """Raised when credentials are invalid"""
    pass


class DuplicateUserError(MongoDBServiceError):
    """Raised when attempting to create a duplicate user"""
    pass


class ResourceNotFoundError(MongoDBServiceError):
    """Raised when a requested resource is not found"""
    pass


class UnauthorizedError(MongoDBServiceError):
    """Raised when user is not authorized to access a resource"""
    pass


class ValidationError(MongoDBServiceError):
    """Raised when data validation fails"""
    pass

