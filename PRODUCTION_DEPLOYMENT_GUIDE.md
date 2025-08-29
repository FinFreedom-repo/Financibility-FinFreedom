# Production Deployment Guide - MongoDB Atlas

## SSL Handshake Timeout Resolution

### Problem Analysis
The SSL handshake timeout errors you're experiencing are common in production environments and can be caused by:

1. **Network Connectivity Issues**
2. **Firewall/Proxy Interference**
3. **DNS Resolution Problems**
4. **Atlas Cluster Maintenance**
5. **Insufficient Connection Pool Settings**

### Production-Grade Solution Implemented

#### 1. Enhanced MongoDB Connection Configuration
- **Increased Timeouts**: 30 seconds for all connection operations
- **Optimized Connection Pool**: 100 max connections, 10 min connections
- **Production Read Preference**: `primaryPreferred` for better availability
- **Enhanced SSL Settings**: Proper SSL configuration for Atlas
- **Retry Mechanisms**: Automatic retry for failed operations

#### 2. Connection Health Monitoring
- **Health Check Method**: `check_connection_health()` for monitoring
- **Retry Logic**: Exponential backoff for connection failures
- **Detailed Error Logging**: Specific error analysis for debugging

#### 3. Environment-Specific Configurations
- **Production**: High performance, large connection pool
- **Staging**: Medium performance, moderate connection pool
- **Development**: Lower performance, smaller connection pool

### Production Deployment Steps

#### 1. Environment Variables
```bash
# Required for production
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_NAME=financability_db
DJANGO_ENV=production

# Optional for monitoring
MONGODB_APP_NAME=FinancabilityApp
MONGODB_LOG_LEVEL=INFO
```

#### 2. Server Requirements
- **Minimum RAM**: 2GB (4GB recommended)
- **CPU**: 2 cores minimum
- **Network**: Stable internet connection
- **Firewall**: Allow MongoDB Atlas ports (27017, 27018, 27019)

#### 3. Production Server Setup
```bash
# Install required packages
sudo apt update
sudo apt install python3-pip python3-venv nginx

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DJANGO_ENV=production
export MONGODB_ATLAS_URI="your_atlas_uri"
export MONGODB_NAME="financability_db"

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test MongoDB connection
python manage.py shell -c "from api.mongodb_service import MongoDBService; MongoDBService().check_connection_health()"
```

#### 4. Gunicorn Configuration
Create `gunicorn.conf.py`:
```python
# Gunicorn configuration for production
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
preload_app = True
```

#### 5. Nginx Configuration
Create `/etc/nginx/sites-available/financability`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /static/ {
        alias /path/to/your/staticfiles/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### Monitoring and Maintenance

#### 1. Health Checks
```python
# Add to your monitoring system
from api.mongodb_service import MongoDBService

def check_mongodb_health():
    try:
        mongo_service = MongoDBService()
        return mongo_service.check_connection_health()
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
        return False
```

#### 2. Log Monitoring
Monitor these log patterns:
- `SSL handshake failed`
- `Connection timeout`
- `No replica set members match selector`

#### 3. Performance Monitoring
- Monitor connection pool usage
- Track query performance
- Monitor Atlas cluster metrics

### Troubleshooting Production Issues

#### 1. SSL Handshake Timeouts
```bash
# Check network connectivity
ping ac-nujzpj8-shard-00-02.wghh7fu.mongodb.net

# Test DNS resolution
nslookup ac-nujzpj8-shard-00-02.wghh7fu.mongodb.net

# Check firewall rules
sudo ufw status
```

#### 2. Connection Pool Exhaustion
- Monitor connection pool metrics
- Increase `maxPoolSize` if needed
- Check for connection leaks

#### 3. Atlas Cluster Issues
- Check Atlas cluster status
- Monitor cluster metrics
- Contact MongoDB support if needed

### Performance Optimization

#### 1. Connection Pool Tuning
```python
# Adjust based on your load
maxPoolSize = 100  # Increase for high load
minPoolSize = 10   # Maintain minimum connections
maxIdleTimeMS = 300000  # 5 minutes
```

#### 2. Query Optimization
- Use indexes effectively
- Monitor slow queries
- Optimize aggregation pipelines

#### 3. Caching Strategy
- Implement Redis caching for frequently accessed data
- Cache user sessions
- Cache expensive queries

### Security Considerations

#### 1. Network Security
- Use VPC peering if possible
- Implement IP whitelisting
- Use SSL/TLS encryption

#### 2. Authentication
- Use strong passwords
- Implement JWT token rotation
- Monitor authentication logs

#### 3. Data Protection
- Regular backups
- Data encryption at rest
- Access control and auditing

### Backup and Recovery

#### 1. MongoDB Atlas Backups
- Enable automated backups
- Test backup restoration
- Document recovery procedures

#### 2. Application Backups
- Backup configuration files
- Backup static files
- Backup database migrations

### Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas connection tested
- [ ] SSL certificates configured
- [ ] Firewall rules updated
- [ ] Nginx configuration tested
- [ ] Gunicorn configuration optimized
- [ ] Health checks implemented
- [ ] Monitoring setup complete
- [ ] Backup strategy in place
- [ ] Security measures implemented
- [ ] Performance testing completed
- [ ] Documentation updated

### Support and Resources

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB Support**: Available with Atlas plans
- **Community Forums**: MongoDB Community
- **Status Page**: https://status.mongodb.com/

This configuration should resolve your SSL handshake timeout issues and provide a robust, production-ready MongoDB Atlas connection. 