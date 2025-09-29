# Financability - Financial Freedom Platform

A comprehensive financial management platform with both web and mobile applications, featuring debt planning, wealth projection, and budget management.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (running locally or cloud instance)
- **Expo CLI** (for mobile development)

### 🏃‍♂️ Quick Run Commands

**For Website Only:**
```bash
# Terminal 1: Backend
cd backend && pip install -r requirements.txt && python manage.py runserver

# Terminal 2: Frontend  
cd frontend && npm install && npm start
```

**For Mobile App:**
```bash
# Terminal 1: Backend
cd backend && pip install -r requirements.txt && python manage.py runserver 127.0.0.1:8000

# Terminal 2: Proxy Server
cd backend && python proxy_server.py

# Terminal 3: Mobile App
cd financability-mobile && npm install && npx expo start
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AbdurRaffay123/Financibility-FinFreedom.git
   cd Financibility-FinFreedom
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   pip install -r requirements.txt
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   
   # Install mobile dependencies
   cd ../financability-mobile
   npm install
   ```

## 🌐 Running the Website

### Backend Setup
1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB connection string and other settings
   ```

3. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start the Django server**
   ```bash
   python manage.py runserver
   ```
   The backend will be available at `http://127.0.0.1:8000`

### Frontend Setup
1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Start the React development server**
   ```bash
   npm start
   ```
   The website will be available at `http://localhost:3000`

## 📱 Running the Mobile App

### Prerequisites for Mobile
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go app** on your mobile device (iOS/Android)

### Mobile App Setup
1. **Navigate to mobile directory**
   ```bash
   cd financability-mobile
   ```

2. **Start the Expo development server**
   ```bash
   npx expo start
   ```

3. **Run on device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

### Mobile-Backend Connection
The mobile app is configured to connect to the backend at `http://192.168.18.224:8001`. 

**For local development:**
1. **Start the Django backend:**
   ```bash
   cd backend
   python manage.py runserver 127.0.0.1:8000
   ```

2. **Start the proxy server (in a new terminal):**
   ```bash
   cd backend
   python proxy_server.py
   ```

3. **Start the mobile app:**
   ```bash
   cd financability-mobile
   npx expo start
   ```

**Why the proxy server is needed:**
- Django's development server only binds to `127.0.0.1:8000` (localhost)
- Mobile devices run on different IP addresses and cannot access localhost
- The proxy server runs on `0.0.0.0:8001` and forwards requests to Django
- This allows mobile devices to connect to the backend through the proxy

## 🏗️ Project Structure

```
Financibility-FinFreedom/
├── backend/                 # Django backend API
│   ├── api/                # API views and models
│   ├── backend/            # Django settings
│   ├── budget/             # Budget management app
│   ├── manage.py           # Django management
│   └── requirements.txt    # Python dependencies
├── frontend/               # React web application
│   ├── public/             # Static assets
│   ├── src/                # React components
│   └── package.json        # Node dependencies
├── financability-mobile/   # React Native mobile app
│   ├── src/                # Mobile components
│   ├── assets/             # Mobile assets
│   └── package.json       # Mobile dependencies
└── README.md              # This file
```

## 🔧 Key Features

### Web Application
- **Dashboard**: Financial overview and navigation
- **Debt Planning**: Interactive debt payoff strategies with real-time calculations
- **Wealth Projection**: Future wealth forecasting with charts
- **Budget Management**: Monthly budget tracking and analysis
- **Account Management**: Bank accounts and debt tracking

### Mobile Application
- **Native Mobile Experience**: Optimized for iOS and Android
- **Real-time Sync**: Seamless data synchronization with web platform
- **Offline Support**: Core functionality works without internet
- **Push Notifications**: Financial alerts and reminders
- **Biometric Authentication**: Secure login with fingerprint/face ID

### Backend API
- **RESTful API**: Comprehensive API for all financial operations
- **MongoDB Integration**: Scalable document-based data storage
- **Real-time Calculations**: Advanced financial algorithms
- **Authentication**: Secure user management and session handling

## 🛠️ Development

### Backend Development
```bash
cd backend
python manage.py runserver
```

### Frontend Development
```bash
cd frontend
npm start
```

### Mobile Development
```bash
cd financability-mobile
npx expo start
```

## 📊 API Endpoints

### Authentication
- `POST /api/mongodb/auth/login/` - User login
- `POST /api/mongodb/auth/register/` - User registration
- `POST /api/mongodb/auth/logout/` - User logout

### Financial Data
- `GET /api/mongodb/accounts/` - Get user accounts
- `GET /api/mongodb/debts/` - Get user debts
- `POST /api/mongodb/debt-planner/` - Calculate debt payoff plan
- `GET /api/mongodb/wealth-projection/` - Get wealth projections

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/financability
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.18.224
```

## 🚀 Deployment

### Backend Deployment
- Configure production database
- Set `DEBUG=False` in settings
- Use production WSGI server (Gunicorn)
- Configure static file serving

### Frontend Deployment
- Build production bundle: `npm run build`
- Deploy to static hosting (Netlify, Vercel, etc.)

### Mobile Deployment
- Build for production: `expo build:android` or `expo build:ios`
- Deploy to app stores

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in each component's README
- Review the API documentation in the backend

---

**Built with ❤️ for financial freedom and empowerment**