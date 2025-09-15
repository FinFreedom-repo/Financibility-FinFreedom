#!/bin/bash

echo "🚀 Financability Full-Stack Setup"
echo "=================================="

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required"
    exit 1
fi

echo "✅ Prerequisites satisfied"

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file..."
    cp backend/env.example backend/.env
    echo "✅ Created .env file"
    echo "⚠️  Please edit backend/.env file with your MongoDB Atlas credentials"
fi

# Setup backend
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔌 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt --break-system-packages

echo "🗄️  Running migrations..."
python3 manage.py migrate

cd ..

# Setup frontend
echo "🔧 Setting up frontend..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env file with your MongoDB Atlas credentials"
echo "2. Start backend: cd backend && source venv/bin/activate && python3 manage.py runserver"
echo "3. Start frontend: cd frontend && npm start"
echo ""
echo "🌐 Access points:"
echo "- Backend: http://localhost:8000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "🚀 For Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Set environment variables in Render dashboard:"
echo "   - MONGODB_ATLAS_URI: Your MongoDB Atlas connection string"
echo "   - SECRET_KEY: A secure secret key"
echo "4. Deploy using the root render.yaml configuration"
