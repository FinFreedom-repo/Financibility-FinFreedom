# Remote Development Setup

## For iOS in New York while you're in Pakistan

### Option 1: Use Deployed Backend (Recommended)
The mobile app is now configured to use the deployed backend at `https://financability-backend.onrender.com`. This is the easiest solution.

### Option 2: Use ngrok for Local Development

If you want to test with your local development server:

1. **Install ngrok**:
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   npm install -g ngrok
   ```

2. **Start your Django backend**:
   ```bash
   cd backend
   python manage.py runserver 127.0.0.1:8000
   ```

3. **Start ngrok tunnel**:
   ```bash
   ngrok http 8000
   ```

4. **Update mobile app configuration**:
   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Update `financability-mobile/app.json`:
     ```json
     "apiBaseUrl": "https://abc123.ngrok.io"
     ```
   - Update `financability-mobile/src/constants/index.ts`:
     ```typescript
     return Constants.expoConfig?.extra?.apiBaseUrl || 'https://abc123.ngrok.io';
     ```

5. **Restart the mobile app**:
   ```bash
   cd financability-mobile
   npx expo start --clear
   ```

### Option 3: Use Cloud Development Environment

1. **GitHub Codespaces** or **Gitpod**:
   - Push your code to GitHub
   - Open in Codespaces/Gitpod
   - Run the backend there
   - Use the public URL

2. **Railway** or **Heroku**:
   - Deploy your backend to Railway/Heroku
   - Use the public URL

### Option 4: Use VPN

1. **Set up a VPN server** in Pakistan
2. **Connect from New York** to Pakistan VPN
3. **Use local IP addresses** as before

## Current Configuration

The app is now configured to use the deployed backend:
- **Backend URL**: `https://financability-backend.onrender.com`
- **No proxy server needed**
- **Works from anywhere in the world**

## Testing

1. **Start the mobile app**:
   ```bash
   cd financability-mobile
   npx expo start
   ```

2. **Scan QR code** with Expo Go app on iOS device in New York

3. **Test the connection**:
   - Try logging in
   - Check if data loads
   - Test debt planning functionality

## Troubleshooting

### If you get network errors:
1. Check if the backend is running on Render
2. Verify the URL is correct
3. Check CORS settings in Django backend
4. Ensure the backend allows requests from mobile apps

### If you need to switch back to local development:
1. Change `apiBaseUrl` back to your local IP
2. Make sure your local server is accessible
3. Use ngrok if needed

## Security Notes

- The deployed backend is publicly accessible
- Make sure your Django settings are secure
- Use HTTPS in production
- Consider rate limiting for public APIs








