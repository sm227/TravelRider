# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
TravelRider is a React Native Expo app for delivery management with Korean UI text. It's a mobile application for delivery drivers with authentication, camera functionality, and navigation features.

## Architecture & Structure

### Key Technologies
- **React Native 0.81.4** with **Expo ~54.0.6**
- **Expo Router** for file-based routing and navigation
- **TypeScript** with strict mode enabled
- **React Navigation** for tab and stack navigation
- **AsyncStorage** for local data persistence
- **Axios** for HTTP requests

### Directory Structure
- `app/` - Main application screens using Expo Router file-based routing
  - `(tabs)/` - Tab navigation screens (index, delivery, profile)
  - `auth/` - Authentication screens
  - `camera/` - Camera-related screens
  - `_layout.tsx` - Root layout with navigation configuration
- `components/` - Reusable React components
  - `ui/` - Base UI components (collapsible, icon-symbol)
- `contexts/` - React Context providers
  - `AuthContext.tsx` - Authentication state management
- `constants/` - App-wide constants (theme.ts)
- `hooks/` - Custom React hooks
- `assets/` - Static assets (images, icons)

### Authentication System
The app uses a custom AuthContext with:
- Demo accounts for testing:
  - `driver@travelrider.com` / `password123`
  - `kakao@demo.com` / `kakao_demo`
- JWT token storage in AsyncStorage
- Automatic token refresh and validation
- API base URL: `http://localhost:8080/api`

### Navigation Structure
- Root Stack Navigator with:
  - Tab Navigator (main app screens)
  - Authentication screens
  - Camera modal screens
- Uses `expo-router` with file-based routing
- Dark theme configuration by default

## Development Commands

### Basic Commands
- `npm start` - Start Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start web version
- `npm run lint` - Run ESLint

### Project Management
- `npm run reset-project` - Reset to blank app template

### Installation
```bash
npm install
```

## Configuration Files
- `app.json` - Expo app configuration with Korean app name "TravelRider - 배달 관리"
- `eslint.config.js` - ESLint configuration using expo/flat config
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*`)
- `expo-env.d.ts` - Expo TypeScript environment declarations

## Key Features
- Korean delivery management interface
- Camera integration for delivery photos
- Location services support
- Haptic feedback integration
- Kakao Login integration
- Cross-platform support (iOS, Android, Web)