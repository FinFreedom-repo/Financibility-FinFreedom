# Financability - Financial Freedom Platform

A comprehensive financial management platform with both web and mobile applications, featuring debt planning, wealth projection, and budget management.

## 🚀 Features

### Web Application
- **Dashboard**: Overview of financial health
- **Debt Planning**: Advanced debt payoff strategies with real-time calculations
- **Wealth Projection**: Future wealth forecasting with interactive charts
- **Budget Management**: Monthly budget tracking and analysis
- **Account Management**: Track accounts and debts
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
git clone https://github.com/AbdurRaffay123/Financibility-FinFreedom.git
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
# In a new terminal, start the proxy server
python proxy_server.py
```

The proxy server runs on `http://192.168.18.224:8001` and forwards requests to the Django server.

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
│   └── proxy_server.py     # Mobile proxy server
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

## 🎯 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Investment tracking and portfolio management
- [ ] Bill payment automation
- [ ] Financial goal setting and tracking
- [ ] Multi-currency support
- [ ] Advanced security features
- [ ] Cloud deployment options

---

**Built with ❤️ for financial freedom**