# PCR Analysis

A fully automated real-time PCR (Put-Call Ratio) analysis platform for Indian stock market indices. Built with Vue 3, Quasar, TypeScript, Firebase Cloud Functions, and Firestore.

## 🚀 New: Automated Backend System

**Firebase Cloud Functions** now handle all data fetching automatically:
- ✅ Runs every 3 minutes from 9:15 AM to 3:30 PM IST
- ✅ Works regardless of whether users are online
- ✅ Stores data in Cloud Firestore for real-time updates
- ✅ Automatic weekend cleanup (keeps 7 days of data)
- ✅ Zero client-side burden - just subscribe to updates

**[Quick Start Guide](./QUICK_START.md)** | **[Full Backend Setup](./FIREBASE_BACKEND_SETUP.md)** | **[Deployment Guide](./DEPLOYMENT.md)**

## Features

### Authentication

- ✅ Firebase Google Authentication
- ✅ Secure user login/logout
- ✅ Session management

### Automated Backend (Firebase Cloud Functions) 🔥

- ✅ **Scheduled Auto-Fetch**
  - Runs at 9:15 AM IST (market open)
  - Continues every 3 minutes until 3:30 PM IST
  - Saves last trading session at 3:35 PM
  - Weekend cleanup every Sunday midnight
- ✅ **Cloud Firestore Database**
  - Real-time data synchronization
  - Stores 7 days of historical data
  - Automatic cleanup of old records
  - Works offline with cached data
- ✅ **Zero Client Load**
  - Backend handles all API calls
  - Clients just subscribe to Firestore
  - Works even when users are offline
  - Battery-friendly on mobile

### PCR Analysis

- ✅ **Live NSE Data Integration** 🔥
  - Real-time data from NSE India Option Chain API
  - Automatic fallback to mock data if API fails
  - Smart error handling and retry logic
- ✅ Real-time PCR calculation for major Indian indices
  - Nifty 50
  - Bank Nifty
  - Fin Nifty
  - Midcap Nifty
- ✅ **Precise Decimal Formatting** (2 decimal places)
  - PCR values: `1.23` (not `1.2345`)
  - Changes: `±0.05` (not `±0.0523`)
  - Clean, professional display
- ✅ Real-time updates via Firestore (no polling needed)
- ✅ Automatic expiry date calculation (current & next month)
- ✅ Comprehensive data display:
  - Call & Put Open Interest (OI)
  - Call & Put Volume
  - PCR ratio calculation
  - OI & Volume change tracking
  - Color-coded market indicators (Bullish/Bearish/Neutral)
  - **PCR Trend Indicators** 🔥
    - Visual arrows showing trend direction (↑ up, ↓ down)
    - Percentage change from previous reading
    - Color-coded trends (Green=Up, Red=Down, Grey=Neutral)
    - Displayed in table and dashboard cards
- ✅ Historical data tracking (last 50 records)
- ✅ Interactive data table with sorting
- ✅ Real-time dashboard with summary cards

### Market Schedule & Hours

- ✅ **Smart Market Detection**: Automatically detects market hours (9:15 AM - 3:30 PM IST)
- ✅ **Holiday Calendar**: Complete NSE India holiday calendar (2024-2025)
- ✅ **Weekend Detection**: Identifies weekends and non-trading days
- ✅ **Last Session Data**: Shows data from last trading session when market is closed
- ✅ **Data Persistence**: Stores last 7 days of trading data in browser
- ✅ **Auto-Resume**: Automatically starts fetching when market opens
- ✅ **Status Indicators**: Color-coded banners showing current market status
- ✅ **Next Session Info**: Displays next trading session date/time when market is closed

### Design & UX 🎨

- ✅ **Modern shadcn UI-inspired design**
  - Clean, professional aesthetics
  - Smooth animations and transitions
  - Gradient backgrounds and shadows
- ✅ **Fully Mobile-Responsive**
  - Optimized for Android/iOS
  - Touch-friendly interface (44px+ touch targets)
  - Works perfectly on 320px to 4K screens
- ✅ **Split-Screen Login** (Desktop)
  - Branding panel with features
  - Elegant login form
  - Animated elements
- ✅ **Professional Header**
  - User profile dropdown
  - LIVE market indicator with pulse animation
  - Copy user ID functionality
- ✅ **Custom Animations**
  - Floating icons
  - Fade-in effects
  - Scale transitions
  - Smooth scrolling

### Technical

- ✅ Vue 3 with Composition API
- ✅ TypeScript for type safety
- ✅ Quasar Framework for Material Design UI
- ✅ Vite for fast development
- ✅ PWA-ready (can be installed on Android/iOS)
- ✅ Custom CSS variables for theming
- ✅ Optimized bundle size (161KB gzipped)

## Prerequisites

- Node.js (v20.18.0 or higher recommended)
- npm or yarn
- Firebase project with Google Authentication enabled

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
3. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the Firebase configuration

### 3. Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

```bash
cp .env.example .env
```

Then fill in your Firebase configuration values in `.env`:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/              # Vue components
│   ├── HomePage.vue        # Main dashboard (authenticated users)
│   ├── LoginPage.vue       # Login page with Google sign-in
│   ├── PCRDashboard.vue    # PCR analysis dashboard
│   ├── PCRAnalysisTable.vue # Data table with color indicators
│   └── IndexSelector.vue   # Index selection toggle
├── composables/            # Vue composables
│   └── usePCRAnalysis.ts  # PCR analysis logic & background updates
├── firebase/               # Firebase configuration
│   └── config.ts          # Firebase initialization
├── services/               # Business logic services
│   ├── auth.ts            # Authentication service
│   └── marketData.ts      # Market data fetching & processing
├── types/                  # TypeScript type definitions
│   └── market.ts          # Market data types & interfaces
├── utils/                  # Utility functions
│   └── expiryCalculator.ts # Options expiry date calculations
├── App.vue                 # Root component
└── main.ts                 # Application entry point
```

## PCR Analysis Features

### What is PCR?

PCR (Put-Call Ratio) is a key indicator used in options trading:

- **PCR = Put OI / Call OI**
- **PCR > 1.2**: Bullish sentiment (more puts suggest hedging against upside)
- **PCR < 0.8**: Bearish sentiment (more calls suggest downside expectation)
- **PCR 0.8-1.2**: Neutral sentiment

### Color Indicators

The application uses color coding to make market sentiment instantly visible:

- 🟢 **Green (Bullish)**: PCR > 1.2, increasing OI
- 🔴 **Red (Bearish)**: PCR < 0.8, decreasing OI
- 🟠 **Orange (Neutral)**: PCR between 0.8 and 1.2

### Background Updates

The PCR data is automatically fetched every 3 minutes in the background, ensuring you always have the latest market information without manual refreshes.

### Expiry Dates

Options expire on the last Thursday of each month. The application automatically calculates:

- **Current Expiry**: This month's expiry (or next month if current has passed)
- **Next Expiry**: Following month's expiry

## Authentication Flow

1. User lands on the login page
2. Clicks "Sign in with Google"
3. Google OAuth popup appears
4. After successful authentication, PCR dashboard loads
5. Background data updates start automatically
6. User can switch between indices and view real-time data

## API Integration

✅ **Live NSE API is now integrated!** The application fetches real-time data from NSE India Option Chain API with automatic fallback to mock data if the API fails.

### Implementation Details

The app now uses **live NSE data** with these features:
- ✅ Real-time option chain data from `nseindia.com/api/option-chain-indices`
- ✅ Automatic parsing of Call/Put Open Interest and Volume
- ✅ Smart fallback to mock data if API is unreachable
- ✅ Proper headers to prevent NSE blocking
- ✅ Error handling and retry logic

### CORS Handling

NSE API may block browser requests due to CORS. **See [LIVE_API_SETUP.md](./LIVE_API_SETUP.md) for:**
- CORS proxy setup (development)
- Backend proxy implementation (production)
- Troubleshooting guide
- Alternative data providers

### Quick Test

```bash
# During market hours (9:15 AM - 3:30 PM IST)
npm run dev

# Check browser console for:
✅ "Successfully parsed NSE data" - Live API working
⚠️ "Using fallback" - CORS blocked, using mock data
```

For detailed setup instructions, see **[LIVE_API_SETUP.md](./LIVE_API_SETUP.md)**

## Technologies Used

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Quasar** - Material Design component framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Firebase** - Authentication and backend services
- **Firebase Authentication** - Google OAuth integration

## Documentation

- **[API_INTEGRATION.md](./API_INTEGRATION.md)** - Guide for integrating real NSE API data
- **[MARKET_SCHEDULE.md](./MARKET_SCHEDULE.md)** - Detailed documentation on market hours, holidays, and data persistence
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature documentation (PCR Trend Indicators, etc.)
- **[DESIGN_IMPROVEMENTS.md](./DESIGN_IMPROVEMENTS.md)** - Design system, mobile optimization, and shadcn UI implementation

## Building for Android

This Quasar application can be easily deployed as an Android app:

### 1. Add Capacitor Mode

```bash
quasar mode add capacitor
```

### 2. Build for Android

```bash
quasar build -m capacitor -T android
```

### 3. Run on Device/Emulator

```bash
quasar dev -m capacitor -T android
```

### Requirements:

- Android Studio installed
- Android SDK configured
- Java JDK 11+

### Recommended Plugins:

- **@capacitor/status-bar** - Control Android status bar
- **@capacitor/keyboard** - Handle keyboard better
- **@capacitor/network** - Check connection status
- **@capacitor/push-notifications** - Enable push notifications

## License

This project is for educational and personal use.
