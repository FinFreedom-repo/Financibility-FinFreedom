#!/usr/bin/env python
"""
Script to list all users in the Django User table.
Run this script from the backend directory with: python list_users.py
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def list_users():
    """Print all users in the database with their basic information."""
    print("=" * 60)
    print("USERS IN DATABASE")
    print("=" * 60)
    
    users = User.objects.all().order_by('id')
    
    if not users.exists():
        print("No users found in the database.")
        return
    
    print(f"Total users: {users.count()}")
    print("-" * 60)
    
    for user in users:
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"First Name: {user.first_name}")
        print(f"Last Name: {user.last_name}")
        print(f"Date Joined: {user.date_joined}")
        print(f"Is Active: {user.is_active}")
        print(f"Is Staff: {user.is_staff}")
        print(f"Is Superuser: {user.is_superuser}")
        print("-" * 60)

if __name__ == "__main__":
    list_users() 