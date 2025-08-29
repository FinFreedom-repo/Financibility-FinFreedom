#!/usr/bin/env python3
"""
MongoDB Atlas Connection Test Script
This script tests MongoDB Atlas connectivity with proper SSL/TLS configuration.
"""

import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_direct_connection():
    """Test direct MongoDB Atlas connection"""
    try:
        import pymongo
        from pymongo import MongoClient
        
        print(f"🔍 Testing Direct MongoDB Atlas Connection")
        print(f"PyMongo version: {pymongo.__version__}")
        
        # MongoDB Atlas URI
        uri = 'mongodb+srv://kraffay96:ToHkxcn2x8HeeW7L@financability-cluster.wghh7fu.mongodb.net/?retryWrites=true&w=majority&appName=financability-cluster'
        
        # Create client with proper Atlas settings
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            retryWrites=True
        )
        
        # Test connection
        result = client.admin.command('ping')
        print("✅ Direct connection: SUCCESS")
        
        # List databases
        dbs = client.list_database_names()
        print(f"✅ Available databases: {dbs}")
        
        # Test read/write
        db = client['financability_db']
        test_collection = db['connection_test']
        
        test_doc = {
            'test_type': 'direct_connection',
            'timestamp': datetime.now(),
            'status': 'success'
        }
        
        result = test_collection.insert_one(test_doc)
        print(f"✅ Write test: SUCCESS (ID: {result.inserted_id})")
        
        # Read back
        found_doc = test_collection.find_one({'_id': result.inserted_id})
        print(f"✅ Read test: SUCCESS (Status: {found_doc['status']})")
        
        # Cleanup
        test_collection.delete_one({'_id': result.inserted_id})
        print("✅ Cleanup: SUCCESS")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Direct connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_service_connection():
    """Test MongoDB service connection"""
    try:
        from api.mongodb_service import MongoDBService
        
        print(f"\n🔍 Testing MongoDB Service Connection")
        
        # Create service instance
        service = MongoDBService()
        service.connect()
        print("✅ Service connection: SUCCESS")
        
        # Health check
        is_healthy = service.check_connection_health()
        print(f"✅ Health check: {'HEALTHY' if is_healthy else 'UNHEALTHY'}")
        
        # Test operations
        if hasattr(service, 'db'):
            test_collection = service.db['service_connection_test']
            test_doc = {
                'test_type': 'service_connection',
                'timestamp': datetime.now(),
                'status': 'success'
            }
            
            result = test_collection.insert_one(test_doc)
            print(f"✅ Service write test: SUCCESS (ID: {result.inserted_id})")
            
            # Cleanup
            test_collection.delete_one({'_id': result.inserted_id})
            print("✅ Service cleanup: SUCCESS")
        
        return True
        
    except Exception as e:
        print(f"❌ Service connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all connection tests"""
    print("=" * 60)
    print("🔥 MongoDB Atlas Connection Test Suite")
    print("=" * 60)
    
    # Test direct connection
    direct_success = test_direct_connection()
    
    # Test service connection
    service_success = test_service_connection()
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    print(f"Direct Connection: {'✅ PASS' if direct_success else '❌ FAIL'}")
    print(f"Service Connection: {'✅ PASS' if service_success else '❌ FAIL'}")
    
    if direct_success and service_success:
        print("\n🎉 ALL TESTS PASSED! MongoDB Atlas is fully operational!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
        return 1

if __name__ == "__main__":
    exit(main())