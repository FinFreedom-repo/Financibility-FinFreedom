# Proxy Server for Mobile App Communication

This folder contains the proxy server components needed for the mobile app to communicate with the Django backend server.

## 📁 Files

- `proxy_server.py` - Main proxy server for mobile app communication
- `backend_proxy_server.py` - Alternative proxy server implementation
- `README.md` - This documentation file

## 🚀 Quick Start

### 1. Start Django Backend Server

```bash
# Navigate to backend directory
cd backend

# Start Django server
python3 manage.py runserver 127.0.0.1:8000
```

### 2. Start Proxy Server

```bash
# Navigate to proxy directory
cd proxy

# Start proxy server
python3 proxy_server.py
```

The proxy server will:
- Run on `http://192.168.18.224:8001`
- Forward requests to Django server at `http://127.0.0.1:8000`
- Add CORS headers for mobile app compatibility

## 🔧 Configuration

### Proxy Server Settings

The proxy server is configured with:
- **Port**: 8001
- **Host**: 0.0.0.0 (accessible from external devices)
- **Target**: http://127.0.0.1:8000 (Django server)
- **CORS**: Enabled for mobile app requests

### Mobile App Configuration

The mobile app is pre-configured to use:
- **API Base URL**: `http://192.168.18.224:8001`
- **All requests** are forwarded to Django backend
- **CORS headers** are automatically added

## 🧪 Testing

### Test Django Server
```bash
curl http://127.0.0.1:8000/
```

### Test Proxy Server
```bash
curl http://192.168.18.224:8001/
```

### Test API Endpoint
```bash
curl http://192.168.18.224:8001/api/mongodb/
```

## 📱 Mobile App Usage

1. **Start Django Server**: `python3 manage.py runserver 127.0.0.1:8000`
2. **Start Proxy Server**: `python3 proxy_server.py`
3. **Start Mobile App**: `cd financability-mobile && npx expo start`
4. **Scan QR Code** with Expo Go app

## 🚨 Troubleshooting

### Common Issues

**1. Proxy Server Not Responding**
- Check if Django server is running on port 8000
- Verify proxy server is running on port 8001
- Check firewall settings

**2. Mobile App Connection Issues**
- Ensure proxy server is accessible from mobile device
- Check IP address in mobile app configuration
- Verify CORS headers are being sent

**3. Port Already in Use**
- Kill existing processes: `pkill -f proxy_server.py`
- Use different port by modifying `PORT` variable

### Debug Commands

```bash
# Check running processes
ps aux | grep proxy_server

# Check port usage
netstat -tlnp | grep :8001

# Test connectivity
curl -v http://192.168.18.224:8001/
```

## 🔄 Alternative Proxy Server

If the main proxy server doesn't work, try the alternative:

```bash
python3 backend_proxy_server.py
```

## 📋 Requirements

- Python 3.8+
- Django server running on port 8000
- Network access to 192.168.18.224:8001

## 🎯 Purpose

The proxy server is essential for mobile app development because:
- Django development server binds to localhost only
- Mobile devices need external IP access
- CORS headers are required for cross-origin requests
- Provides a bridge between mobile app and Django backend

---

**Note**: This proxy server is only needed for development. In production, use proper web server configuration with CORS support.
