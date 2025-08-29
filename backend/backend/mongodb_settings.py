"""
MongoDB configuration settings for the Django backend.
This file provides MongoDB Atlas configuration using mongoengine.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# MongoDB Atlas Configuration - PRIMARY CONFIGURATION
MONGODB_ATLAS_URI = 'mongodb+srv://kraffay96:ToHkxcn2x8HeeW7L@financability-cluster.wghh7fu.mongodb.net/?retryWrites=true&w=majority&appName=financability-cluster'
MONGODB_NAME = 'financability_db'

# MongoDB Configuration for Django (using djongo)
MONGODB_CONFIG = {
    'ENGINE': 'djongo',
    'NAME': MONGODB_NAME,
    'ENFORCE_SCHEMA': True,
    'CLIENT': {
        'host': MONGODB_ATLAS_URI,
    }
}

# MongoDB connection settings for mongoengine (used by migration scripts and API)
MONGODB_CONNECTION = {
    'host': MONGODB_ATLAS_URI,
    'db': MONGODB_NAME,
} 