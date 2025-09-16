# Financability - Financial Management App

A comprehensive financial management application with Django REST API backend and React frontend, powered by MongoDB Atlas. This application helps users manage their accounts, debts, budgets, and financial planning.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas Account

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd financability
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup (Alternative)

#### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env with your MongoDB Atlas credentials
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. MongoDB Atlas Setup
1. Create MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Add your IP to Network Access in Atlas dashboard
4. Update connection string in `backend/.env`

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## 🚀 Render Deployment

This project is configured for easy deployment on Render with a single `render.yaml` file.

### 1. Prepare for Deployment
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy on Render
1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` file
3. Set the following environment variables in Render dashboard:
   - `MONGODB_ATLAS_URI`: Your MongoDB Atlas connection string
   - `SECRET_KEY`: A secure secret key (generate with Django's `get_random_secret_key()`)

### 3. Environment Variables
The following environment variables are required for production:

**Backend Service:**
- `MONGODB_ATLAS_URI`: MongoDB Atlas connection string
- `MONGODB_NAME`: Database name (default: financability_db)
- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to `false` for production
- `ALLOWED_HOSTS`: Your backend domain

**Frontend Service:**
- `REACT_APP_API_URL`: Backend API URL (automatically set)

## 📁 Project Structure

```
financability/
├── backend/                    # Django REST API
│   ├── api/                   # Main API app
│   │   ├── models.py          # MongoDB models
│   │   ├── mongodb_*.py       # MongoDB-specific views and services
│   │   └── ...
│   ├── budget/                # Budget management app
│   ├── backend/               # Django project settings
│   │   ├── settings.py        # Main settings
│   │   ├── mongodb_settings.py # MongoDB configuration
│   │   └── ...
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── setup.sh              # Backend setup script
│   ├── env.example           # Environment variables template
│   └── README.md             # Backend documentation
├── frontend/                   # React Application
│   ├── public/                # Static assets
│   ├── src/                   # React source code
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── services/          # API services
│   │   └── ...
│   ├── package.json           # Node.js dependencies
│   ├── render.yaml           # Frontend-specific Render config
│   └── ...
├── render.yaml                # Root Render configuration
├── setup.sh                  # Full-stack setup script
└── README.md                 # This file
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

This application uses MongoDB Atlas for data storage with the following features:
- Custom MongoDB authentication system
- JWT token-based authentication
- MongoDB-specific models and serializers
- Real-time data synchronization

## 🎨 Frontend Features

- **Modern UI**: Built with React and Material-UI
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live data synchronization
- **Interactive Charts**: Financial data visualization
- **User Authentication**: Secure login and registration
- **Theme Support**: Customizable UI themes

## 🔒 Security Features

- JWT token-based authentication
- CORS protection
- Environment variable configuration
- MongoDB Atlas secure connection
- Input validation and sanitization

## 🐛 Common Issues

**MongoDB Connection Failed:**
- Check IP is whitelisted in MongoDB Atlas
- Verify connection string in `.env` file
- Ensure MongoDB Atlas cluster is running

**Module Not Found:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` (backend)
- Run `npm install` (frontend)

**CORS Issues:**
- Check `CORS_ALLOW_ALL_ORIGINS` setting in settings.py
- Verify frontend URL is in `ALLOWED_HOSTS`

**Render Deployment Issues:**
- Ensure all environment variables are set in Render dashboard
- Check build logs for dependency issues
- Verify MongoDB Atlas IP whitelist includes Render's IP ranges

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Happy Financial Planning! 💰**
