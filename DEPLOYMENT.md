# 🚀 Render Deployment Guide

This guide provides step-by-step instructions for deploying both the backend and frontend to Render.

## 📋 Prerequisites

- **Render Account**: Sign up at [render.com](https://render.com)
- **MongoDB Atlas**: Set up a MongoDB cluster
- **GitHub Repository**: `https://github.com/financibility-finFreedom/Financibility-FinFreedom.git`
- **Environment Variables**: Prepare all required environment variables

## 🔧 Backend Deployment (Django)

### Step 1: Prepare Backend for Deployment

1. **Verify Requirements**: Ensure `requirements.txt` is in the root directory
2. **Check Settings**: Verify `backend/backend/settings.py` has production configurations
3. **Static Files**: Ensure static files configuration is correct

### Step 2: Create Backend Service on Render

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Sign in to your account

2. **Create New Web Service**
   - Click **"New +"** button
   - Select **"Web Service"**

3. **Connect Repository**
   - Choose **"Build and deploy from a Git repository"**
   - Connect your GitHub account
   - Select repository: `financibility-finFreedom/Financibility-FinFreedom`
   - Click **"Connect"**

4. **Configure Backend Service**
   ```
   Name: financability-backend
   Environment: Python 3
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   Start Command: gunicorn backend.wsgi:application
   ```

5. **Set Environment Variables**
   ```
   SECRET_KEY: [Generate new secret key]
   DEBUG: False
   ALLOWED_HOSTS: financability-backend.onrender.com,financability-frontend.onrender.com
   MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/financability
   MONGODB_NAME: financability
   CORS_ALLOW_ALL_ORIGINS: False
   CORS_ALLOWED_ORIGINS: https://financability-frontend.onrender.com
   USE_MONGO_ACCOUNTS: True
   USE_MONGO_DEBTS: True
   USE_MONGO_BUDGET: True
   USE_MONGO_CATEGORIES: True
   USE_MONGO_TRANSACTIONS: True
   ```

6. **Deploy Backend**
   - Click **"Create Web Service"**
   - Wait for deployment to complete
   - Note the backend URL: `https://financability-backend.onrender.com`

## 🌐 Frontend Deployment (React)

### Step 1: Prepare Frontend for Deployment

1. **Verify Build**: Ensure `npm run build` works locally
2. **Check API URL**: Verify frontend points to backend URL
3. **Environment Variables**: Set up production environment variables
4. **SPA Routing**: Ensure proper configuration for Single Page Application routing

### Step 2: Create Frontend Service on Render

1. **Create New Static Site**
   - Click **"New +"** button
   - Select **"Static Site"**

2. **Connect Repository**
   - Choose **"Build and deploy from a Git repository"**
   - Select repository: `financibility-finFreedom/Financibility-FinFreedom`
   - Click **"Connect"**

3. **Configure Frontend Service**
   ```
   Name: financability-frontend
   Environment: Static
   Region: Choose closest to your users
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

4. **Set Environment Variables**
   ```
   REACT_APP_API_URL: https://financability-backend.onrender.com
   REACT_APP_ORGANIZATION: financibility-finFreedom
   ```

5. **Deploy Frontend**
   - Click **"Create Static Site"**
   - Wait for deployment to complete
   - Note the frontend URL: `https://financability-frontend.onrender.com`

## 🔄 Post-Deployment Configuration

### Step 1: Update CORS Settings

1. **Backend CORS Update**
   - Go to backend service settings
   - Update `CORS_ALLOWED_ORIGINS` to include frontend URL
   - Redeploy backend service

### Step 2: Test Deployment

1. **Test Backend API**
   ```bash
   curl https://financability-backend.onrender.com/api/mongodb/
   ```

2. **Test Frontend**
   - Visit `https://financability-frontend.onrender.com`
   - Test login functionality
   - Verify API calls work

### Step 3: Update Mobile App Configuration

1. **Update Mobile App API URL**
   - Edit `financability-mobile/app.json`
   - Change `apiBaseUrl` to production backend URL
   - Update `financability-mobile/src/constants/index.ts`

## 🚨 Troubleshooting

### Common Issues

**1. Backend Deployment Fails**
- Check build logs for Python dependencies
- Verify `requirements.txt` is in root directory
- Ensure `SECRET_KEY` is set

**2. Frontend Build Fails**
- Check build logs for npm errors
- Verify all dependencies are in `package.json`
- Ensure `REACT_APP_API_URL` is set correctly

**3. CORS Errors**
- Update `CORS_ALLOWED_ORIGINS` in backend
- Redeploy backend service
- Check browser console for specific CORS errors

**4. Database Connection Issues**
- Verify MongoDB Atlas connection string
- Check network access settings in MongoDB Atlas
- Ensure database user has proper permissions

**5. SPA Routing Issues (404 on refresh)**
- Ensure `_redirects` file is in `frontend/public/` directory
- Verify `404.html` file exists in `frontend/public/` directory
- Check that `routes` configuration is set in `frontend/render.yaml`
- Redeploy frontend service after adding routing files

### Debug Commands

```bash
# Test backend API
curl https://financability-backend.onrender.com/api/mongodb/

# Test CORS
curl -H "Origin: https://financability-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://financability-backend.onrender.com/api/mongodb/

# Check backend logs
# Go to Render dashboard > Backend service > Logs
```

## 📊 Monitoring and Maintenance

### 1. Monitor Services
- Check Render dashboard regularly
- Monitor service health and performance
- Set up alerts for service downtime

### 2. Update Deployments
- Push changes to main branch
- Render will automatically redeploy
- Monitor deployment logs for issues

### 3. Environment Variables
- Update environment variables as needed
- Redeploy services after changes
- Keep sensitive data secure

## 🔐 Security Considerations

### 1. Environment Variables
- Never commit sensitive data to repository
- Use Render's environment variable system
- Rotate secrets regularly

### 2. CORS Configuration
- Restrict CORS to specific domains
- Don't use `CORS_ALLOW_ALL_ORIGINS` in production
- Regularly review allowed origins

### 3. Database Security
- Use MongoDB Atlas security features
- Enable IP whitelisting
- Use strong authentication

## 📈 Performance Optimization

### 1. Backend Optimization
- Enable gzip compression
- Use CDN for static files
- Monitor database query performance

### 2. Frontend Optimization
- Enable static file compression
- Use CDN for assets
- Optimize bundle size

## 🎯 Production URLs

After successful deployment:
- **Frontend**: `https://financability-frontend.onrender.com`
- **Backend API**: `https://financability-backend.onrender.com`
- **API Documentation**: `https://financability-backend.onrender.com/api/mongodb/`

---

**Note**: This deployment guide assumes you have the necessary permissions and access to the organization repository. Make sure you're a member of the `financibility-finFreedom` organization with appropriate permissions.
