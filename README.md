# Financability - Financial Freedom Platform

A comprehensive financial management platform with both web and mobile applications, featuring debt planning, wealth projection, and budget management.

## 🚀 Features

### Web Application
- **Dashboard**: Overview of financial health
- **Debt Planning**: Advanced debt payoff strategies with real-time calculations
- **Wealth Projection**: Future wealth forecasting with interactive charts
- **Budget Management**: Monthly budget tracking and analysis
- **Account Management**: Track accounts and debts
- **🎤 Voice Financial Input**: AI-powered voice commands to add accounts/debts (NEW!)
- **Real-time Notifications**: Financial alerts and updates

### Mobile Application (React Native)
- **Complete Mobile Experience**: All web features available on mobile
- **Real-time Budget Editing**: Edit budget projections with live updates
- **Debt Payoff Timeline**: Interactive debt payoff visualization
- **Wealth Projection Charts**: Mobile-optimized financial charts
- **Offline Support**: Core functionality available offline
- **Dark/Light Theme**: Adaptive UI themes

## 🛠️ Technology Stack

### Backend
- **Django 4.2.23** - Python web framework
- **Django REST Framework** - API development
- **MongoDB** - NoSQL database
- **JWT Authentication** - Secure user authentication
- **CORS Support** - Cross-origin resource sharing

### Frontend (Web)
- **React 18** - JavaScript library
- **AG Grid** - Advanced data grid components
- **Chart.js** - Interactive charts and graphs
- **Responsive Design** - Mobile-friendly interface

### Mobile App
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **React Native Chart Kit** - Mobile chart components

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **MongoDB** (local or cloud instance)
- **Expo CLI** (for mobile development)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/financibility-finFreedom/Financibility-FinFreedom.git
cd Financibility-FinFreedom
```

### 2. Backend Setup (Django)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp backend/env.example .env
# Edit .env with your MongoDB connection string and other settings

# Run database migrations
cd backend
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start Django server
python manage.py runserver 127.0.0.1:8000
```

### 3. Proxy Server Setup (Required for Mobile)

The mobile app requires a proxy server to communicate with the Django backend:

```bash
# Navigate to proxy directory
cd proxy

# Start the proxy server
python3 proxy_server.py
```

The proxy server runs on `http://192.168.18.224:8001` and forwards requests to the Django server.

**Why is the proxy server needed?**
- Django development server only binds to localhost (127.0.0.1)
- Mobile devices need external IP access (192.168.18.224)
- Proxy server bridges the connection and adds CORS headers

### 4. Web Application Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The web application will be available at `http://localhost:3000`

### 5. Mobile Application Setup

```bash
# Navigate to mobile app directory
cd financability-mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**For Mobile Testing:**
1. Install **Expo Go** app on your mobile device
2. Scan the QR code displayed in the terminal
3. The app will load on your device

## 📱 Complete Mobile App Setup Guide

### Prerequisites for Mobile Development
- **Expo Go App**: Download from App Store (iOS) or Google Play (Android)
- **Same Network**: Mobile device and computer must be on the same WiFi network
- **Python 3.8+**: For running the proxy server
- **Node.js 16+**: For React Native development

### Step-by-Step Mobile Setup

#### 1. Start Backend Services
```bash
# Terminal 1: Start Django Server
cd backend
python3 manage.py runserver 127.0.0.1:8000

# Terminal 2: Start Proxy Server
cd proxy
python3 proxy_server.py
```

#### 2. Start Mobile App
```bash
# Terminal 3: Start Mobile App
cd financability-mobile
npm install
#Start server swith tunnel
npx expo start --tunnel
```

#### 3. Connect Mobile Device
1. **Open Expo Go** on your mobile device
2. **Scan QR Code** from the terminal output
3. **Wait for app to load** (first time may take 1-2 minutes)
4. **Test login** with your credentials

### Mobile App Features

#### 🏠 Dashboard
- Financial overview and quick actions
- Clickable feature cards that navigate to respective screens
- Real-time financial health indicators

#### 💳 Accounts & Debts
- Add, edit, and delete financial accounts
- Manage debt information
- Track account balances and debt amounts

#### 💰 Budget Management
- Monthly budget planning and tracking
- Real-time budget editing with live updates
- Visual budget breakdowns and analysis

#### 📊 Debt Planning
- **Debt Payoff Timeline Grid**: Interactive debt payoff visualization
- **Strategy Selection**: Snowball vs Avalanche methods
- **Real-time Calculations**: Live debt payoff projections
- **Debt Management**: Add, edit, and delete debts

#### 📈 Wealth Projection
- Future wealth forecasting with interactive charts
- Financial goal setting and tracking
- Investment growth projections

#### 🔔 Notifications
- Real-time financial alerts
- Payment reminders
- Budget notifications

### Mobile App Navigation

The mobile app uses a **tab-based navigation** system:

- **🏠 Dashboard**: Main overview screen
- **💳 Accounts**: Account and debt management
- **💰 Budget**: Monthly budget planning
- **📊 Debt Planning**: Advanced debt payoff strategies
- **📈 Wealth**: Wealth projection and forecasting
- **⚙️ Settings**: App configuration and profile

### Troubleshooting Mobile App

#### Common Issues

**1. "Network Error" on Login**
- Ensure Django server is running: `curl http://127.0.0.1:8000/`
- Ensure proxy server is running: `curl http://192.168.18.224:8001/`
- Check mobile device is on same WiFi network

**2. App Won't Load**
- Clear Expo cache: `npx expo start -c`
- Restart Expo server: `npx expo start`
- Check for TypeScript errors: `npx tsc --noEmit`

**3. API Connection Issues**
- Verify proxy server is accessible: `curl http://192.168.18.224:8001/api/mongodb/`
- Check IP address in mobile app configuration
- Ensure CORS headers are being sent

#### Debug Commands

```bash
# Test Django server
curl http://127.0.0.1:8000/

# Test proxy server
curl http://192.168.18.224:8001/

# Test API endpoint
curl http://192.168.18.224:8001/api/mongodb/

# Check running processes
ps aux | grep -E "(manage.py|proxy_server)"
```

### Mobile App Development

#### Development Commands
```bash
# Start with specific device
npx expo start --android
npx expo start --ios

# Clear cache and restart
npx expo start -c

# Run TypeScript check
npx tsc --noEmit

# Install new dependencies
npm install
```

#### Code Structure
```
financability-mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── services/       # API service layer
│   ├── navigation/     # Navigation configuration
│   ├── contexts/       # React contexts
│   └── types/         # TypeScript type definitions
├── assets/            # Images and static assets
└── app.json          # Expo configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/financability
MONGODB_NAME=financability

# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.18.224

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS=True
```

### Mobile App Configuration

The mobile app is pre-configured to connect to `http://192.168.18.224:8001` (proxy server). If you need to change this:

1. Edit `financability-mobile/app.json`:
```json
{
  "extra": {
    "apiBaseUrl": "http://YOUR_IP:8001"
  }
}
```

2. Update `financability-mobile/src/constants/index.ts` if needed.

## 📱 Mobile App Features

### Navigation
- **Dashboard**: Financial overview and quick actions
- **Accounts & Debts**: Manage financial accounts and debts
- **Budget**: Monthly budget planning and tracking
- **Debt Planning**: Advanced debt payoff strategies
- **Wealth Projection**: Future wealth forecasting
- **Settings**: App configuration and profile management

### Key Mobile Components
- **Real-time Budget Grid**: Edit budget projections with live updates
- **Debt Payoff Timeline**: Visual debt payoff progress
- **Interactive Charts**: Touch-friendly financial visualizations
- **Offline Support**: Core functionality without internet
- **Theme Support**: Dark and light mode themes

## 🌐 API Endpoints

### Authentication
- `POST /api/mongodb/auth/login/` - User login
- `POST /api/mongodb/auth/register/` - User registration
- `POST /api/mongodb/auth/logout/` - User logout

### Financial Data
- `GET /api/mongodb/accounts/` - Get user accounts
- `GET /api/mongodb/debts/` - Get user debts
- `POST /api/mongodb/debts/create/` - Create new debt
- `PUT /api/mongodb/debts/{id}/update/` - Update debt
- `DELETE /api/mongodb/debts/{id}/delete/` - Delete debt

### Planning & Analysis
- `POST /api/mongodb/debt-planner/` - Calculate debt payoff plan
- `POST /api/mongodb/wealth-projection/` - Calculate wealth projection
- `GET /api/mongodb/budgets/` - Get budget data
- `POST /api/mongodb/budgets/save/` - Save budget data

## 🚨 Troubleshooting

### Common Issues

**1. Mobile App Connection Issues**
- Ensure proxy server is running on port 8001
- Check that Django server is running on port 8000
- Verify IP address in mobile app configuration

**2. Database Connection Issues**
- Ensure MongoDB is running
- Check MongoDB connection string in .env file
- Verify database permissions

**3. CORS Issues**
- Ensure `CORS_ALLOW_ALL_ORIGINS=True` in Django settings
- Check that proxy server includes CORS headers

**4. Mobile App Build Issues**
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### Development Tips

**Backend Development:**
```bash
# Run with debug logging
python manage.py runserver 127.0.0.1:8000 --verbosity=2

# Check Django logs
tail -f backend.log
```

**Mobile Development:**
```bash
# Clear Expo cache
npx expo start -c

# Run with specific device
npx expo start --android
npx expo start --ios
```

## 📊 Project Structure

```
Financibility-FinFreedom/
├── backend/                 # Django backend
│   ├── api/                # API views and models
│   ├── backend/            # Django settings
│   └── manage.py           # Django management script
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/            # Static assets
├── financability-mobile/   # React Native mobile app
│   ├── src/
│   │   ├── components/     # Mobile components
│   │   ├── screens/       # Mobile screens
│   │   ├── services/      # Mobile API services
│   │   └── navigation/    # Mobile navigation
├── proxy/                  # Proxy server for mobile communication
│   ├── proxy_server.py    # Main proxy server
│   ├── backend_proxy_server.py # Alternative proxy server
│   └── README.md          # Proxy server documentation
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation in the code

## 🚀 Deployment

### Production Deployment (Render)

For production deployment on Render, see the comprehensive [DEPLOYMENT.md](DEPLOYMENT.md) guide.

**Quick Deploy:**
1. **Backend**: Deploy Django API to Render
2. **Frontend**: Deploy React app to Render
3. **Database**: Use MongoDB Atlas for production
4. **Mobile**: Update API URLs for production

**Production URLs:**
- **Frontend**: `https://financability-frontend.onrender.com`
- **Backend API**: `https://financability-backend.onrender.com`

## 🎯 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Investment tracking and portfolio management
- [ ] Bill payment automation
- [ ] Financial goal setting and tracking
- [ ] Multi-currency support
- [ ] Advanced security features
- [x] Cloud deployment options

---

**Built with ❤️ for financial freedom**