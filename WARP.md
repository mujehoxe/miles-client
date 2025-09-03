# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Miles Client is a React Native mobile application built with Expo SDK 51, designed for lead management and CRM functionality. The app features a modern stack with TypeScript, NativeWind (Tailwind CSS for React Native), and a comprehensive set of custom hooks and components.

## Development Commands

### Setup and Installation
```bash
npm install
```

### Development
```bash
# Start development server
npm start
# or
expo start

# Run on specific platforms
npm run android       # Run on Android device/emulator
npm run ios           # Run on iOS device/simulator  
npm run web           # Run in web browser

# Development with specific Expo clients
expo start --dev-client    # For development builds
```

### Building and Deployment
```bash
# EAS Build commands (check eas.json for build profiles)
eas build --profile development        # Development build
eas build --profile development-simulator  # iOS simulator build
eas build --profile preview           # Preview build
eas build --profile production        # Production build

# Submit to app stores
eas submit --profile production
```

### Testing and Quality
```bash
npm run test          # Run Jest tests with watch mode
npm run lint          # Run Expo linting
```

### Utility Commands
```bash
npm run reset-project # Reset project structure (moves starter code)
```

### Platform-Specific Development
```bash
# iOS
npx pod-install      # Install CocoaPods dependencies

# Android
# Use Android Studio or ensure Android SDK is properly configured
```

## Architecture Overview

### Project Structure
The app follows a well-organized directory structure:

- **`app/`** - File-based routing using Expo Router
  - `_layout.tsx` - Root layout with authentication and navigation
  - `(tabs)/` - Tab-based navigation structure
  - `lead-details/[id].tsx` - Dynamic route for lead details
- **`components/`** - Reusable UI components organized by functionality
- **`hooks/`** - Custom React hooks for business logic
- **`services/`** - API services and data management
- **`utils/`** - Utility functions and constants
- **`constants/`** - App-wide constants including colors
- **`modules/`** - Custom Expo modules (expo-countdown-notification)

### Key Architectural Patterns

#### Authentication & State Management
- JWT-based authentication with automatic token refresh
- Secure storage using `expo-secure-store`
- User context (`UserContext`) provides authentication state throughout the app
- Automatic token validation on app state changes

#### Navigation
- **Expo Router** with file-based routing
- Tab navigation for main sections (Leads, Location)
- Stack navigation for detailed views
- Deep linking support with custom URL scheme

#### Data Management
- Custom hooks pattern for business logic separation:
  - `useLeadsData` - Manages leads fetching, pagination, and filter options
  - `useFilters` - Handles filter state and operations
  - `usePagination` - Manages pagination logic
  - `useLeadsSelection` - Handles multi-select functionality
  - `useSearchDebounce` - Debounced search functionality

#### API Architecture
- Centralized API service (`services/api.ts`) with:
  - Standardized authentication headers
  - Token validation and refresh logic
  - Type-safe interfaces for requests/responses
  - Error handling with user feedback

#### Styling System
- **NativeWind** (Tailwind CSS for React Native)
- Custom color palette (`miles` theme in `tailwind.config.js`)
- Consistent design system across components

### Key Features

#### Lead Management
- Card-based lead display with real-time updates
- Advanced filtering (status, source, agents, date ranges, tags)
- Debounced search across multiple data fields
- Multi-select operations
- Status and source updates with validation
- Comment system with update descriptions

#### Real-time Features
- Push notifications via OneSignal
- Background location tracking
- Real-time lead updates
- Server-sent events for live data

#### Platform-Specific Integrations
- **iOS/Android**: Native notification extensions
- **Maps**: React Native Maps integration
- **Communications**: Phone calls and WhatsApp integration
- **Background Processing**: Expo TaskManager for background operations

### Environment Configuration

The app uses environment-specific configuration through EAS Build:
- `EXPO_PUBLIC_BASE_URL` - Backend API base URL
- Different build profiles for development, preview, and production
- OneSignal integration for push notifications

### Custom Modules

The app includes a custom Expo module:
- **expo-countdown-notification** - Custom notification functionality
- Located in `modules/expo-countdown-notification/`
- Built with Expo Module API

### Performance Considerations

- Debounced search to reduce API calls
- Pagination for large datasets
- Image loading optimization with error handling
- Efficient state management with custom hooks
- Background processing for location and notifications

## Development Guidelines

### Authentication Flow
Always check authentication state before API calls. The app automatically handles token refresh, but failed authentication should redirect to login.

### API Integration
Use the centralized `services/api.ts` for all API calls. It includes:
- Automatic authentication headers
- Token validation
- Error handling
- Type safety

### State Management
Prefer custom hooks for complex state logic rather than prop drilling. Each hook should have a single responsibility.

### Component Development
- Use TypeScript interfaces for all props
- Implement proper error boundaries
- Follow the established styling patterns with NativeWind
- Ensure accessibility features are included

### Testing
- Jest is configured for testing
- Limited test coverage exists - expand as needed
- Test business logic in hooks separately from UI components

### Build Process
- Use EAS Build for all builds
- Different profiles for development, preview, and production
- Ensure environment variables are properly configured

### Push Notifications
OneSignal is integrated for push notifications. Configuration is in `app.json` and environment variables.

### Background Processing
Location tracking and other background tasks use Expo TaskManager. Ensure proper permissions are requested.
