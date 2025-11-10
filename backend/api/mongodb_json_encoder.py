"""
Custom JSON Encoder for MongoDB ObjectId serialization
"""

import json
from bson import ObjectId
from datetime import datetime, date
from decimal import Decimal


class MongoDBJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB objects"""
    
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def mongodb_json_dumps(obj, **kwargs):
    """Custom JSON dumps function for MongoDB objects"""
    return json.dumps(obj, cls=MongoDBJSONEncoder, **kwargs)

def convert_objectid_to_str(data):
    """Recursively convert ObjectId objects to strings in data structures"""
    if isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, datetime):
        return data.isoformat()
    elif isinstance(data, date):
        return data.isoformat()
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data 