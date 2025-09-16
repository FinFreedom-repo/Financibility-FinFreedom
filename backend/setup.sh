#!/bin/bash

echo "🚀 Financability Backend Setup"
echo "==============================="

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required"
    exit 1
fi

echo "✅ Prerequisites satisfied"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env file with your MongoDB Atlas credentials"
fi

# Setup backend
echo "🔧 Setting up backend..."

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔌 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🗄️  Running migrations..."
python3 manage.py migrate

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your MongoDB Atlas credentials"
echo "2. Start backend: source venv/bin/activate && python3 manage.py runserver"
echo ""
echo "🌐 Access points:"
echo "- Backend: http://localhost:8000"
echo ""
echo "💡 For full-stack development:"
echo "- Run this script from the root financability directory"
echo "- Use the root setup.sh for both frontend and backend" 