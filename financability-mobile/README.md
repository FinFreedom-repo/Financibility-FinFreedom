# Financability Mobile App

A React Native mobile application built with Expo that provides comprehensive financial management tools. This app consumes the same Django REST APIs as the web application, ensuring consistency across platforms.

## 🚀 Features

- **Authentication**: Secure JWT-based login and registration
- **Dashboard**: Financial overview and progress tracking
- **Accounts & Debts**: Manage financial accounts and debt tracking
- **Budget Management**: Monthly budget creation and tracking
- **Analytics**: Financial insights and reporting
- **Settings**: App customization and user preferences
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Offline Support**: Local data caching with AsyncStorage
- **Push Notifications**: Real-time alerts and reminders

## 🛠 Tech Stack

- **React Native** with **Expo** for cross-platform development
- **TypeScript** for type safety
- **React Navigation** for navigation (Stack, Tab, Drawer)
- **Axios** for API communication
- **AsyncStorage** for local data persistence
- **Expo Secure Store** for secure token storage
- **Expo Notifications** for push notifications
- **Expo Local Authentication** for biometric login

## 📱 Supported Platforms

- iOS (App Store)
- Android (Play Store)
- Web (PWA support)

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── common/         # Common components (Button, Input, Card, etc.)
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screens
│   ├── accounts/      # Account management screens
│   ├── budget/        # Budget screens
│   ├── analytics/     # Analytics screens
│   └── settings/      # Settings screens
├── navigation/         # Navigation configuration
├── services/          # API services and utilities
├── contexts/          # React contexts (Auth, Theme)
├── types/             # TypeScript type definitions
├── constants/         # App constants and configuration
├── theme/             # Theme configuration and utilities
└── utils/             # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financability-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your API configuration:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
   EXPO_PUBLIC_API_TIMEOUT=10000
   EXPO_PUBLIC_APP_NAME=Financability
   EXPO_PUBLIC_DEBUG=true
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on specific platforms**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔧 Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Husky** for git hooks (optional)

### API Integration

The app connects to the Django REST API backend. Make sure your backend is running on the configured URL (default: `http://localhost:8000`).

Key API endpoints:
- Authentication: `/api/mongodb/auth/mongodb/`
- Accounts: `/api/mongodb/accounts/`
- Debts: `/api/mongodb/debts/`
- Budget: `/api/mongodb/budgets/`
- Analytics: `/api/mongodb/dashboard/`

## 📦 Building for Production

### Android

1. **Build APK**
   ```bash
   expo build:android
   ```

2. **Build AAB (for Play Store)**
   ```bash
   expo build:android --type app-bundle
   ```

### iOS

1. **Build for App Store**
   ```bash
   expo build:ios
   ```

### EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for both platforms**
   ```bash
   eas build --platform all
   ```

## 🚀 Deployment

### App Store (iOS)

1. Build the app using EAS Build
2. Submit to App Store Connect
3. Configure app metadata and screenshots
4. Submit for review

### Play Store (Android)

1. Build the app using EAS Build
2. Upload to Google Play Console
3. Configure store listing
4. Submit for review

## 🔐 Security

- JWT tokens are stored securely using Expo Secure Store
- API communication uses HTTPS in production
- Biometric authentication support
- Secure token refresh mechanism

## 🎨 Theming

The app supports both light and dark themes with automatic system preference detection. Themes can be customized in `src/theme/index.ts`.

## 📱 Features Roadmap

- [ ] Push notifications
- [ ] Offline data synchronization
- [ ] Biometric authentication
- [ ] Data export/import
- [ ] Advanced analytics
- [ ] Goal tracking
- [ ] Investment tracking
- [ ] Bill reminders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@financability.com or create an issue in the repository.

## 🔗 Related Projects

- [Financability Web App](../frontend/) - React web application
- [Financability Backend](../backend/) - Django REST API backend

