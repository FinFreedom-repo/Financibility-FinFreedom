"""
MongoDB configuration settings for the Django backend.
This file provides flexible MongoDB configuration options using mongoengine.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# MongoDB Configuration for mongoengine
MONGODB_CONFIG = {
    'ENGINE': 'django.db.backends.sqlite3',  # Keep SQLite for Django ORM compatibility
    'NAME': BASE_DIR / 'db.sqlite3',
}

# MongoDB connection settings for 
MONGODB_CONNECTION = {
    'host': os.getenv('MONGODB_HOST', 'localhost'),
    'port': int(os.getenv('MONGODB_PORT', 27017)),
    'db': os.getenv('MONGODB_NAME', 'financability_db'),
}

# MongoDB Atlas Configuration (for cloud deployment)
if os.getenv('MONGODB_ATLAS_URI'):
    MONGODB_CONNECTION = {
        'host': os.getenv('MONGODB_ATLAS_URI'),
        'db': os.getenv('MONGODB_NAME', 'financability_db'),
    }

# Development configuration (local MongoDB)
if os.getenv('DJANGO_ENV') == 'development':
    MONGODB_CONNECTION = {
        'host': 'localhost',
        'port': 27017,
        'db': 'financability_db_dev',
    } 