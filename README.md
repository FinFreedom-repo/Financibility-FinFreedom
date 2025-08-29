# Financability - Financial Management Application

A comprehensive financial management application with Django REST API backend and React frontend, powered by MongoDB Atlas.


### 2. Configure MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Get your connection string
4. Edit `.env` file with your credentials:
```bash
MONGODB_ATLAS_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_NAME=financability_db
SECRET_KEY=your_django_secret_key_here
DEBUG=true
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 3. Start the Application
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python3 manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm start
```

### 4. Access Your App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB Atlas Account (free)

## 🔧 Manual Setup (if setup.sh fails)

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
python3 manage.py migrate
python3 manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

**MongoDB connection issues?**
- Check `.env` file has correct `MONGODB_ATLAS_URI`
- Verify IP is whitelisted in MongoDB Atlas
- Ensure database user has correct permissions

**Module not found errors?**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
