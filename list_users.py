#!/usr/bin/env python3
"""
Script to list all users from the database.
"""
import os
import sys
import django

# Add the backend directory to the path
sys.path.append('/home/abdur-raffay/Documents/financability/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def list_users():
    """List all users in the database."""
    print("=== All Users in Database ===")
    users = User.objects.all()
    
    if not users:
        print("No users found in the database.")
        return
    
    print(f"Found {len(users)} users:")
    print("-" * 60)
    
    for user in users:
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Is Active: {user.is_active}")
        print(f"Date Joined: {user.date_joined}")
        print(f"Last Login: {user.last_login}")
        print("-" * 60)

if __name__ == "__main__":
    list_users()
