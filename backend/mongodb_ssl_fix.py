#!/usr/bin/env python3
"""
MongoDB Atlas SSL Connection Fix
Comprehensive solution for SSL handshake issues
"""

import os
import sys
import ssl
import socket
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import urllib.parse

def test_network_connectivity():
    """Test basic network connectivity to MongoDB Atlas"""
    print("🔍 Testing network connectivity...")
    
    # Test DNS resolution
    try:
        hostname = "financability-cluster.wghh7fu.mongodb.net"
        ip = socket.gethostbyname(hostname)
        print(f"✅ DNS resolution successful: {hostname} -> {ip}")
    except socket.gaierror as e:
        print(f"❌ DNS resolution failed: {e}")
        return False
    
    # Test port connectivity
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex(('financability-cluster.wghh7fu.mongodb.net', 27017))
        sock.close()
        
        if result == 0:
            print("✅ Port 27017 is reachable")
        else:
            print(f"❌ Port 27017 is not reachable (error code: {result})")
            return False
    except Exception as e:
        print(f"❌ Network connectivity test failed: {e}")
        return False
    
    return True

def test_connection_strings():
    """Test multiple connection string variations"""
    print("\n🔍 Testing different connection string configurations...")
    
    # Original connection string
    original_uri = "mongodb+srv://kraffay96:ToHkxcn2x8HeeW7L@financability-cluster.wghh7fu.mongodb.net/?retryWrites=true&w=majority&appName=financability-cluster"
    
    # Alternative connection strings to try
    connection_strings = [
        {
            "name": "Original with minimal config",
            "uri": original_uri,
            "options": {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 10000,
                "socketTimeoutMS": 10000,
                "retryWrites": True
            }
        },
        {
            "name": "With TLS insecure",
            "uri": original_uri,
            "options": {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 10000,
                "socketTimeoutMS": 10000,
                "tls": True,
                "tlsInsecure": True,
                "retryWrites": True
            }
        },
        {
            "name": "With explicit SSL context",
            "uri": original_uri,
            "options": {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 10000,
                "socketTimeoutMS": 10000,
                "tls": True,
                "tlsAllowInvalidCertificates": True,
                "tlsAllowInvalidHostnames": True,
                "retryWrites": True
            }
        },
        {
            "name": "Direct connection (no SRV)",
            "uri": "mongodb://kraffay96:ToHkxcn2x8HeeW7L@ac-nujzpj8-shard-00-00.wghh7fu.mongodb.net:27017,ac-nujzpj8-shard-00-01.wghh7fu.mongodb.net:27017,ac-nujzpj8-shard-00-02.wghh7fu.mongodb.net:27017/financability_db?ssl=true&replicaSet=atlas-14b8sh-shard-0&authSource=admin&retryWrites=true&w=majority",
            "options": {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 10000,
                "socketTimeoutMS": 10000,
                "retryWrites": True
            }
        }
    ]
    
    for config in connection_strings:
        print(f"\n📋 Testing: {config['name']}")
        try:
            client = MongoClient(config['uri'], **config['options'])
            result = client.admin.command('ping')
            print(f"✅ SUCCESS: {config['name']}")
            print(f"   Response: {result}")
            client.close()
            return config
        except Exception as e:
            print(f"❌ FAILED: {config['name']}")
            print(f"   Error: {str(e)[:200]}...")
    
    return None

def check_atlas_cluster_status():
    """Provide guidance on checking Atlas cluster status"""
    print("\n🔍 Atlas Cluster Status Check:")
    print("1. Visit: https://cloud.mongodb.com")
    print("2. Navigate to your cluster: 'financability-cluster'")
    print("3. Check if the cluster is:")
    print("   - Active (not paused)")
    print("   - Running (not suspended)")
    print("   - Accessible from your IP")
    print("4. Verify Network Access settings:")
    print("   - Add your current IP to IP Access List")
    print("   - Or set to 'Allow Access from Anywhere' (0.0.0.0/0)")
    print("5. Check Database Access:")
    print("   - Verify user 'kraffay96' exists and is active")
    print("   - Check if password is correct")

def main():
    """Main function to diagnose and fix MongoDB connection issues"""
    print("=" * 60)
    print("🔥 MongoDB Atlas SSL Connection Diagnostic Tool")
    print("=" * 60)
    
    # Test network connectivity
    if not test_network_connectivity():
        print("\n❌ Network connectivity issues detected!")
        print("Please check your internet connection and firewall settings.")
        return
    
    # Test different connection configurations
    working_config = test_connection_strings()
    
    if working_config:
        print(f"\n✅ SUCCESS! Found working configuration: {working_config['name']}")
        print("\n📝 To fix your application, update your MongoDB service with:")
        print("=" * 50)
        print(f"URI: {working_config['uri']}")
        print("Options:", working_config['options'])
        print("=" * 50)
    else:
        print("\n❌ All connection attempts failed!")
        print("\n🔧 Recommended actions:")
        print("1. Check your MongoDB Atlas cluster status")
        print("2. Verify your connection string and credentials")
        print("3. Check network access and firewall settings")
        print("4. Contact MongoDB Atlas support if issues persist")
        
        check_atlas_cluster_status()

if __name__ == "__main__":
    main() 