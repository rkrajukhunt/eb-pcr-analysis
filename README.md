# EB PCR Analysis

A Vue 3 + Quasar + TypeScript application with Firebase Google Authentication.

## Features

- ✅ Vue 3 with TypeScript
- ✅ Quasar Framework for UI components
- ✅ Firebase Authentication
- ✅ Google Sign-In
- ✅ Vite for fast development

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
├── components/          # Vue components
│   ├── HomePage.vue    # Home page (authenticated users)
│   └── LoginPage.vue   # Login page with Google sign-in
├── firebase/           # Firebase configuration
│   └── config.ts       # Firebase initialization
├── services/           # Business logic services
│   └── auth.ts         # Authentication service
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## Authentication Flow

1. User lands on the login page
2. Clicks "Sign in with Google"
3. Google OAuth popup appears
4. After successful authentication, user is redirected to the home page
5. User info is displayed on the home page
6. User can sign out using the "Sign Out" button

## Technologies Used

- **Vue 3** - Progressive JavaScript framework
- **Quasar** - Vue.js framework for building responsive apps
- **TypeScript** - Typed superset of JavaScript
- **Vite** - Next generation frontend tooling
- **Firebase** - Backend-as-a-Service platform
- **Firebase Authentication** - Drop-in authentication solution
