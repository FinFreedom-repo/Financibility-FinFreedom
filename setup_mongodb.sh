#!/bin/bash

# MongoDB Setup Script for Financability Migration
# This script helps install and configure MongoDB for the Django migration

set -e

echo "🚀 MongoDB Setup for Financability Migration"
echo "============================================="
echo

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "📋 Detected OS: $OS"
echo

# Function to install MongoDB on Ubuntu/Debian
install_mongodb_ubuntu() {
    echo "📦 Installing MongoDB on Ubuntu/Debian..."
    
    # Import MongoDB public GPG key
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    
    # Create list file for MongoDB
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Update package database
    sudo apt-get update
    
    # Install MongoDB
    sudo apt-get install -y mongodb-org
    
    # Start MongoDB service
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    echo "✅ MongoDB installed and started on Ubuntu/Debian"
}

# Function to install MongoDB on macOS
install_mongodb_macos() {
    echo "📦 Installing MongoDB on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Add MongoDB tap
    brew tap mongodb/brew
    
    # Install MongoDB
    brew install mongodb-community
    
    # Start MongoDB service
    brew services start mongodb-community
    
    echo "✅ MongoDB installed and started on macOS"
}

# Function to check if MongoDB is running
check_mongodb_status() {
    echo "🔍 Checking MongoDB status..."
    
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
            echo "✅ MongoDB is running and accessible"
            return 0
        else
            echo "❌ MongoDB is installed but not running"
            return 1
        fi
    else
        echo "❌ MongoDB is not installed"
        return 1
    fi
}

# Function to install Python dependencies
install_python_deps() {
    echo "🐍 Installing Python dependencies..."
    
    if command -v pip &> /dev/null; then
        pip install -r requirements.txt
        echo "✅ Python dependencies installed"
    else
        echo "❌ pip is not installed. Please install pip first."
        exit 1
    fi
}

# Function to create MongoDB user (optional)
create_mongodb_user() {
    echo "👤 Creating MongoDB user (optional)..."
    
    read -p "Do you want to create a MongoDB user for authentication? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter MongoDB username: " mongodb_user
        read -s -p "Enter MongoDB password: " mongodb_password
        echo
        
        # Create user in admin database
        mongosh admin --eval "
            db.createUser({
                user: '$mongodb_user',
                pwd: '$mongodb_password',
                roles: [
                    { role: 'readWrite', db: 'financability_db' },
                    { role: 'dbAdmin', db: 'financability_db' }
                ]
            })
        "
        
        echo "✅ MongoDB user created"
        echo "📝 Add these environment variables to your deployment:"
        echo "   export MONGODB_USERNAME='$mongodb_user'"
        echo "   export MONGODB_PASSWORD='$mongodb_password'"
    fi
}

# Main installation logic
case $OS in
    "linux")
        if command -v apt-get &> /dev/null; then
            install_mongodb_ubuntu
        else
            echo "❌ Unsupported Linux distribution. Please install MongoDB manually."
            echo "   Visit: https://docs.mongodb.com/manual/installation/"
            exit 1
        fi
        ;;
    "macos")
        install_mongodb_macos
        ;;
    "windows")
        echo "❌ Windows installation not supported in this script."
        echo "   Please install MongoDB manually from:"
        echo "   https://www.mongodb.com/try/download/community"
        exit 1
        ;;
esac

# Wait a moment for MongoDB to start
echo "⏳ Waiting for MongoDB to start..."
sleep 3

# Check MongoDB status
if check_mongodb_status; then
    echo
    echo "🎉 MongoDB setup completed successfully!"
    echo
    echo "📋 Next steps:"
    echo "1. Install Python dependencies: pip install -r requirements.txt"
    echo "2. Run the migration script: cd backend && python migrate_to_mongodb.py"
    echo "3. Test your application: python manage.py runserver"
    echo
    echo "📚 For more information, see: MONGODB_MIGRATION_GUIDE.md"
else
    echo
    echo "❌ MongoDB setup failed. Please check the installation and try again."
    echo
    echo "🔧 Troubleshooting:"
    echo "1. Check if MongoDB service is running"
    echo "2. Verify MongoDB is listening on port 27017"
    echo "3. Check MongoDB logs for errors"
    exit 1
fi

# Optional: Create MongoDB user
create_mongodb_user

echo
echo "✨ Setup complete! You're ready to migrate to MongoDB." 