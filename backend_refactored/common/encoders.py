"""
JSON Encoding Utilities
Handles MongoDB ObjectId and other special types for JSON serialization
"""

from bson import ObjectId
from datetime import datetime, date
from decimal import Decimal
from typing import Any, Dict, List, Union


def convert_objectid_to_str(data: Any) -> Any:
    """
    Recursively convert MongoDB ObjectId to string for JSON serialization
    
    Args:
        data: Data to convert (dict, list, or primitive)
    
    Returns:
        Data with ObjectId converted to strings
    """
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data


def serialize_document(document: Dict[str, Any]) -> Dict[str, Any]:
    """
    Serialize a MongoDB document for API response
    
    Args:
        document: MongoDB document
    
    Returns:
        Serialized document ready for JSON response
    """
    if document is None:
        return None
    
    serialized = convert_objectid_to_str(document)
    
    # Convert _id to id for cleaner API
    if '_id' in serialized:
        serialized['id'] = serialized.pop('_id')
    
    return serialized


def serialize_documents(documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Serialize a list of MongoDB documents
    
    Args:
        documents: List of MongoDB documents
    
    Returns:
        List of serialized documents
    """
    return [serialize_document(doc) for doc in documents]

