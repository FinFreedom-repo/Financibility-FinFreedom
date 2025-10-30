# Financibility Backend - Refactored

A clean, well-organized Django REST API backend for the Financibility financial management application.

## 🏗️ Architecture

This is a **properly refactored** Django application with clear separation of concerns.

### Apps Structure

- **authentication/** - User authentication, JWT tokens, profile management
- **accounts/** - Financial accounts management
- **debts/** - Debt tracking and payoff planning (snowball/avalanche)
- **budgets/** - Monthly budget management
- **transactions/** - Transaction tracking
- **wealth/** - Wealth projection calculations
- **notifications/** - User notification system
- **dashboard/** - Aggregated financial dashboard
- **analytics/** - Expense analysis and insights
- **common/** - Shared utilities (database, encoders, exceptions)

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- MongoDB Atlas account (or local MongoDB)
- Virtual environment

### Installation

```bash
# Navigate to backend_refactored folder
cd backend_refactored

# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Set environment variables
export MONGODB_ATLAS_URI="your_mongodb_connection_string"
export SECRET_KEY="your_secret_key"

# Run server
python manage.py runserver 0.0.0.0:8000
```

## 📚 API Documentation

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for complete API documentation and testing instructions.

## 🔧 Configuration

### Environment Variables

Create a `.env` file or export these variables:

```bash
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_NAME=financability_db
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Database

Uses MongoDB Atlas with the following collections:

- users
- accounts
- debts
- budgets
- transactions
- notifications
- wealth_projection_settings

## 📖 Project Structure

```
backend_refactored/
├── backend/              # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── authentication/       # Auth app
│   ├── services.py
│   ├── views.py
│   ├── urls.py
│   ├── authentication.py
│   └── permissions.py
├── accounts/            # Accounts app
│   ├── services.py
│   ├── views.py
│   └── urls.py
├── debts/               # Debts app
│   ├── services.py
│   ├── calculators.py
│   ├── views.py
│   └── urls.py
├── budgets/             # Budgets app
├── transactions/        # Transactions app
├── wealth/              # Wealth projection app
├── notifications/       # Notifications app
├── dashboard/           # Dashboard app
├── analytics/           # Analytics app
├── common/              # Shared utilities
│   ├── database.py
│   ├── encoders.py
│   ├── exceptions.py
│   └── middleware.py
├── manage.py
├── mongodb_config.py
└── requirements.txt
```

## 🎯 Key Features

### Clean Architecture

- Each feature in its own Django app
- Services handle business logic
- Views handle HTTP requests/responses
- Clear separation of concerns

### MongoDB Integration

- Custom MongoDB connection singleton
- Optimized queries with projections
- Proper ObjectId handling
- JSON serialization utilities

### Authentication

- JWT-based authentication
- Custom MongoDB user model
- Token refresh mechanism
- Profile management

### Financial Features

- Debt payoff planning (snowball/avalanche strategies)
- Wealth projection with multiple scenarios
- Monthly budget tracking
- Transaction management
- Financial dashboard

## 🔐 Security

- JWT token authentication
- CORS configuration
- Environment-based secrets
- MongoDB connection security

## 📝 Development

### Adding a New Feature

1. Create a new Django app:

   ```bash
   python manage.py startapp feature_name
   ```

2. Add `services.py` for business logic
3. Add `views.py` for API endpoints
4. Add `urls.py` for URL routing
5. Update `backend/settings.py` INSTALLED_APPS
6. Update `backend/urls.py` to include your app's URLs

### Code Style

- Follow Django best practices
- Use type hints where possible
- Keep views thin, services fat
- Document complex business logic

## 🧪 Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions.

## 📊 Migration from Old Backend

This refactored backend replaces the old monolithic `api/` app structure:

**Before:** 1 app with 6,880 lines across 23 files
**After:** 9 apps with clean separation (~200-400 lines per file)

## 🤝 Contributing

1. Keep apps focused and single-purpose
2. Put shared utilities in `common/`
3. Use services for business logic
4. Keep views simple (request/response handling only)
5. Write docstrings for all functions

## 📄 License

[Your License Here]

## 👥 Authors

Financibility Team

---

**Status:** ✅ Fully refactored and ready for use
