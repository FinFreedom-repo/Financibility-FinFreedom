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

- Python 3.8+
- Node.js 16+
- MongoDB

## Quick Start

### 1. Setup MongoDB
```bash
chmod +x setup_mongodb.sh
./setup_mongodb.sh
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
python3 manage.py migrate
python3 manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

<<<<<<< debt-planning-page
## Access Points

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Admin**: http://localhost:8000/admin

## API Endpoints
=======
### 5. Run the Backend Server
```bash
python3 manage.py runserver
```
>>>>>>> master

The backend will be available at: **http://localhost:8000**

## Project Structure

```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Frontend Development Server
```bash
npm start
