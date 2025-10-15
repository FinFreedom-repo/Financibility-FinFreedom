# Financability Project Setup Requirements

## 🐍 Python Dependencies

### Backend Requirements (`requirements.txt`)
```bash
# Core Django
Django==4.2.23
djangorestframework==3.14.0
djangorestframework-simplejwt==5.5.1
django-cors-headers==4.3.0

# MongoDB
pymongo==4.8.0
mongoengine==0.29.1
dnspython==2.7.0
certifi>=2024.8.30

# Authentication
bcrypt==4.3.0
PyJWT==2.10.1

# Data Analysis & AI
pandas>=2.0.0
openai>=1.0.0
numpy>=1.24.0

# Utilities
python-dotenv==1.0.0
requests==2.31.0

# Production
gunicorn>=21.0.0
whitenoise>=6.5.0
dj-database-url>=2.0.0

# Development & Testing
pytest>=7.0.0
pytest-django>=4.5.0
```

## 📱 Mobile App Dependencies

### Node.js Requirements (`package.json`)
```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.0.2",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-native-community/datetimepicker": "^8.4.5",
    "@react-navigation/bottom-tabs": "^7.4.7",
    "@react-navigation/drawer": "^7.5.8",
    "@react-navigation/native": "^7.1.17",
    "@react-navigation/stack": "^7.4.8",
    "axios": "^1.12.2",
    "expo": "~54.0.10",
    "expo-constants": "^18.0.9",
    "expo-image-picker": "^17.0.8",
    "expo-linear-gradient": "^15.0.7",
    "expo-local-authentication": "^17.0.7",
    "expo-notifications": "^0.32.11",
    "expo-secure-store": "^15.0.7",
    "expo-status-bar": "~3.0.8",
    "react": "19.1.0",
    "react-native": "0.81.4",
    "react-native-chart-kit": "^6.12.0",
    "react-native-safe-area-context": "^5.6.1",
    "react-native-screens": "^4.16.0",
    "react-native-svg": "^15.13.0",
    "react-native-vector-icons": "^10.3.0",
    "victory-native": "^41.20.1"
  }
}
```

## 🛠️ System Requirements

### Python
- **Python 3.8+** (recommended: Python 3.11+)
- **pip** (Python package manager)

### Node.js
- **Node.js 18+** (recommended: Node.js 20+)
- **npm** or **yarn** package manager

### Mobile Development
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go app** on mobile device
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## 🌐 Environment Variables

### Backend Environment (`.env`)
```bash
# MongoDB Atlas Configuration
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_NAME=financability_db

# Django Settings
SECRET_KEY=your_secure_secret_key_here
DEBUG=false
ALLOWED_HOSTS=your-backend-domain.onrender.com,localhost,127.0.0.1

# OpenAI API (for expense analysis)
OPENAI_API_KEY=your_openai_api_key_here
```

### Mobile App Environment
```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://financability-backend.onrender.com
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_APP_NAME=Financability
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

## 📦 Installation Commands

### Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver 127.0.0.1:8000
```

### Mobile App Setup
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# For tunnel mode (global access)
npx expo start --tunnel
```

### Proxy Server Setup
```bash
# No additional dependencies needed
# Uses Python standard library only
python3 proxy/proxy_server.py
```

## 🚀 Quick Start Commands

### Full Development Setup
```bash
# Terminal 1: Backend
cd backend && python manage.py runserver 127.0.0.1:8000

# Terminal 2: Mobile App (with tunnel for global access)
cd financability-mobile && npx expo start --tunnel

# Terminal 3: Proxy Server (optional, if not using tunnel)
cd proxy && python3 proxy_server.py
```

## 🔧 Troubleshooting

### Common Issues
1. **Python version mismatch**: Ensure Python 3.8+
2. **Node.js version**: Ensure Node.js 18+
3. **MongoDB connection**: Check MongoDB Atlas URI
4. **Network issues**: Use `--tunnel` flag for global access
5. **CORS errors**: Backend is configured for all origins

### Dependencies Check
```bash
# Check Python packages
pip list

# Check Node.js packages
npm list

# Check system requirements
python --version
node --version
npm --version
```

## 📋 Deployment Requirements

### Render Deployment
- **Backend**: Uses `requirements.txt` from root directory
- **Frontend**: Static site deployment
- **Environment Variables**: Set in Render dashboard

### Mobile App Distribution
- **Expo Go**: For development testing
- **EAS Build**: For production builds
- **App Store/Play Store**: For distribution

## 🎯 Production Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] MongoDB Atlas connected
- [ ] CORS properly configured
- [ ] Static files collected
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] API endpoints tested
- [ ] Mobile app builds successfully
- [ ] Cross-platform compatibility verified




