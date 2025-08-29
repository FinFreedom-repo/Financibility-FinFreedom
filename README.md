# Financability - Financial Management App

A comprehensive financial management application with Django REST API backend and React frontend, powered by MongoDB Atlas.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas Account

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd financability
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. MongoDB Atlas Setup
1. Create MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Add your IP to Network Access in Atlas dashboard
4. Update connection string in `backend/api/mongodb_service.py`

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

## 🔧 Environment Variables

Create `.env` file in backend directory:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/financability_db
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 📁 Project Structure
```
financability/
├── backend/          # Django REST API
├── frontend/         # React Application
└── requirements.txt  # Python dependencies
```

## 🐛 Common Issues

**MongoDB Connection Failed:**
- Check IP is whitelisted in MongoDB Atlas
- Verify connection string in `mongodb_service.py`

**Module Not Found:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

**Frontend Build Issues:**
- Check Node.js version (16+)
- Run `npm install` again
