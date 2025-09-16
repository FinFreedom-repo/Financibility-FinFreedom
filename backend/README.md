# Financability Backend

Django REST API backend for the Financability financial management application.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB Atlas Account

### 1. Setup Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration
Create `.env` file in the backend directory:
```bash
cp env.example .env
```

Update `.env` with your MongoDB Atlas credentials:
```bash
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_NAME=financability_db
SECRET_KEY=your-secret-key-here
DEBUG=false
ALLOWED_HOSTS=your-domain.com,localhost,127.0.0.1
```

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Start Development Server
```bash
python manage.py runserver
```

## 🔧 API Endpoints

### Authentication
- `POST /api/mongodb/auth/mongodb/login/` - User login
- `POST /api/mongodb/auth/mongodb/register/` - User registration
- `POST /api/mongodb/auth/mongodb/refresh/` - Token refresh

### Accounts & Debts
- `GET /api/accounts-debts/` - List all accounts and debts
- `POST /api/accounts-debts/` - Create new account/debt
- `PUT /api/accounts-debts/{id}/` - Update account/debt
- `DELETE /api/accounts-debts/{id}/` - Delete account/debt

### Dashboard
- `GET /api/dashboard/` - Get dashboard data

### Financial Planning
- `GET /api/financial-steps/` - Get financial planning steps
- `GET /api/debt-planning/` - Get debt planning data
- `GET /api/wealth-projection/` - Get wealth projection data

### Expense Analysis
- `GET /api/expense-analyzer/` - Get expense analysis data

## 🗄️ Database

This backend uses MongoDB Atlas for data storage. The application includes:
- Custom MongoDB authentication system
- JWT token-based authentication
- MongoDB-specific models and serializers

## 🚀 Production Deployment

For production deployment on Render:

1. Set environment variables in Render dashboard
2. The application will automatically use gunicorn as the WSGI server
3. Static files are served using whitenoise
4. MongoDB connection is configured via environment variables

## 📁 Project Structure

```
backend/
├── api/                    # Main API app
│   ├── models.py          # MongoDB models
│   ├── mongodb_*.py       # MongoDB-specific views and services
│   └── ...
├── budget/                # Budget management app
├── backend/               # Django project settings
│   ├── settings.py        # Main settings
│   ├── mongodb_settings.py # MongoDB configuration
│   └── ...
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── setup.sh              # Setup script
└── README.md             # This file
```

## 🐛 Common Issues

**MongoDB Connection Failed:**
- Check IP is whitelisted in MongoDB Atlas
- Verify connection string in `.env` file
- Ensure MongoDB Atlas cluster is running

**Module Not Found:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

**CORS Issues:**
- Check `CORS_ALLOW_ALL_ORIGINS` setting in settings.py
- Verify frontend URL is in `ALLOWED_HOSTS`
