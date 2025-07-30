# Financability

A comprehensive financial management application with a Django REST API backend and React frontend.

## Project Structure

```
financability/
├── backend/                 # Django REST API backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── backend/            # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── api/               # API endpoints
│   ├── budget/            # Budget management app
│   ├── models/            # Database models
│   └── schemas/           # Data schemas
├── frontend/              # React frontend
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── App.js
└── requirements.txt       # Backend dependencies
```

## Prerequisites

- **Python 3.8+** (Python 3.12.3 recommended)
- **Node.js 16+** and npm
- **Git**

## Backend Setup (Django REST API)

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python3 -m venv venv
```

### 3. Activate Virtual Environment
```bash
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 4. Install Dependencies
```bash
pip install -r ../requirements.txt
```

### 5. Run the Backend Server
```bash
python3 manage.py runserver
```

The backend will be available at: **http://localhost:8000**

## Frontend Setup (React)

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Frontend Development Server
```bash
npm start
