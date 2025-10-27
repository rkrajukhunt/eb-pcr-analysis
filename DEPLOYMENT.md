# Deployment Guide - Production Setup

## Overview

This guide covers deploying the PCR Analysis application to Firebase with automated backend data fetching.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Firebase Cloud Platform                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐     ┌─────────────────────────────┐   │
│  │  Cloud Functions   │────▶│   Cloud Firestore DB        │   │
│  │  (Auto Scheduler)  │     │   (PCR Data Storage)        │   │
│  └────────────────────┘     └─────────────────────────────┘   │
│           │                              │                      │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            Firebase Hosting (Static Site)              │   │
│  │            https://your-app.web.app                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Real-time updates
                            │
                            ▼
                    ┌───────────────┐
                    │  End Users    │
                    │  (Web/Mobile) │
                    └───────────────┘
```

---

## Prerequisites

### 1. Firebase Account
- Create account at [Firebase Console](https://console.firebase.google.com/)
- **Upgrade to Blaze Plan** (pay-as-you-go, required for Cloud Functions)
  - Don't worry: Free tier covers this app completely ($0/month expected)

### 2. Firebase CLI
```bash
npm install -g firebase-tools@latest
```

### 3. Verify Installation
```bash
firebase --version
# Should show: 13.0.0 or higher
```

---

## Deployment Steps

### Step 1: Login to Firebase
```bash
firebase login

# This opens browser for Google sign-in
# Grant Firebase CLI access to your account
```

### Step 2: Create Firebase Project

**Option A: Via Console (Recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `eb-pcr-analysis` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

**Option B: Via CLI**
```bash
firebase projects:create eb-pcr-analysis --display-name "EB PCR Analysis"
```

### Step 3: Initialize Firebase in Project
```bash
cd eb-pcr-analysis

firebase init

# Select services (use spacebar to select):
# ✓ Functions: Configure Cloud Functions
# ✓ Firestore: Configure Firestore database
# ✓ Hosting: Configure hosting

# Follow prompts:
# - Select: Use an existing project → eb-pcr-analysis
# - Firestore rules: firestore.rules (default)
# - Firestore indexes: firestore.indexes.json (default)
# - Functions language: TypeScript
# - ESLint: No
# - Install dependencies: Yes
# - Hosting public directory: dist
# - Single-page app: Yes
# - GitHub automatic builds: No
```

### Step 4: Install Dependencies

**Frontend:**
```bash
npm install
```

**Cloud Functions:**
```bash
cd functions
npm install
cd ..
```

### Step 5: Configure Environment Variables

**Frontend (.env):**
```bash
cp .env.example .env

# Edit .env with Firebase credentials
# Get from: Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 6: Enable Required APIs

In Firebase Console:

**A. Enable Authentication**
1. Go to **Authentication**
2. Click "Get Started"
3. Select "Google" sign-in provider
4. Enable it
5. Add authorized domain: `your-project.web.app`

**B. Enable Firestore**
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Select location: `asia-south1` (Mumbai) or closest to you
5. Click "Enable"

**C. Enable Cloud Functions**
- Already enabled when you create Blaze plan

### Step 7: Build Frontend
```bash
npm run build

# This creates dist/ directory with production build
```

### Step 8: Deploy Everything
```bash
# Deploy all services at once
firebase deploy

# This deploys:
# - Cloud Functions (5 functions)
# - Firestore rules
# - Hosting (static site)
```

**Expected output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/eb-pcr-analysis
Hosting URL: https://eb-pcr-analysis.web.app

Functions:
- fetchPCRData(asia-south1)
- marketOpenFetch(asia-south1)
- saveLastTradingSession(asia-south1)
- cleanupOldData(asia-south1)
- triggerPCRFetch(asia-south1)
```

---

## Verification

### 1. Check Hosting
```bash
# Open your app
open https://YOUR-PROJECT-ID.web.app

# Should show login page
# Login with Google
# Should show PCR Dashboard
```

### 2. Check Cloud Functions
```bash
# List deployed functions
firebase functions:list

# Should show:
# fetchPCRData
# marketOpenFetch
# saveLastTradingSession
# cleanupOldData
# triggerPCRFetch
```

### 3. Check Firestore Rules
```bash
# Test in Firebase Console
# Go to: Firestore Database > Rules
# Should show rules from firestore.rules
```

### 4. Trigger Test Function
```bash
# Get function URL
firebase functions:config:get

# Trigger manual fetch
curl https://asia-south1-YOUR-PROJECT-ID.cloudfunctions.net/triggerPCRFetch

# Should return:
# {"success":true,"message":"PCR data fetch completed","timestamp":"..."}
```

### 5. Check Firestore Data
1. Go to Firebase Console > Firestore Database
2. Check `pcr_data` collection
3. Should see documents for each index after first fetch

---

## Monitoring

### Real-time Logs
```bash
# View all logs
firebase functions:log --follow

# View specific function
firebase functions:log --only fetchPCRData --follow

# During market hours, you should see:
# ⏰ Scheduled PCR data fetch triggered
# 📊 Market is open, fetching PCR data...
# ✅ PCR data fetch completed for all indices
```

### Usage Dashboard
1. Go to Firebase Console
2. Navigate to **Usage and billing**
3. View:
   - Function invocations
   - Compute time
   - Network egress
   - Firestore operations

---

## Cost Optimization

### Current Setup (Optimized)

**Functions:**
- Region: `asia-south1` (cheapest for India)
- Memory: 256MB (default)
- Timeout: 60s (default)
- Instances: Auto-scale (0-10)

**Estimated Monthly Cost**: $0 (within free tier)

### Free Tier Limits

| Resource | Free Tier | Expected Usage | Status |
|----------|-----------|----------------|--------|
| Function invocations | 2M/month | ~2K/month | ✅ 0.1% used |
| Compute GB-seconds | 400K/month | ~20K/month | ✅ 5% used |
| Firestore reads | 50K/day | ~500/day | ✅ 1% used |
| Firestore writes | 20K/day | ~200/day | ✅ 1% used |
| Hosting bandwidth | 10GB/month | ~100MB/month | ✅ 1% used |

### If You Exceed Free Tier

**Unlikely, but if it happens:**
- Functions: $0.40 per million invocations
- Compute: $0.0000025 per GB-second
- Firestore reads: $0.06 per 100K
- Firestore writes: $0.18 per 100K

**Max expected cost**: <$1/month even with heavy usage

---

## Update & Redeploy

### Update Frontend Only
```bash
# Make changes to src/
npm run build
firebase deploy --only hosting
```

### Update Functions Only
```bash
# Make changes to functions/src/
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Update Firestore Rules Only
```bash
# Edit firestore.rules
firebase deploy --only firestore:rules
```

### Update Everything
```bash
npm run build
firebase deploy
```

---

## Environment-Specific Configs

### Development
```bash
# Use local emulators
firebase emulators:start

# This starts:
# - Functions emulator
# - Firestore emulator
# - Hosting emulator
```

### Staging (Optional)
```bash
# Create staging project
firebase projects:create eb-pcr-staging

# Switch to staging
firebase use staging

# Deploy to staging
firebase deploy
```

### Production
```bash
# Switch to production
firebase use production

# Deploy to production
firebase deploy
```

---

## CI/CD Setup (GitHub Actions)

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install
          cd functions && npm install

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: eb-pcr-analysis
```

---

## Rollback

### Rollback Functions
```bash
# View deployment history
firebase functions:list

# Rollback to previous version
firebase functions:rollback fetchPCRData
```

### Rollback Hosting
```bash
# View hosting releases
firebase hosting:channel:list

# Rollback to previous release
firebase hosting:rollback
```

---

## Security Checklist

Before going live:

- [ ] Firestore rules deployed and tested
- [ ] Environment variables not committed to git
- [ ] Firebase API keys restricted (optional, but recommended)
- [ ] CORS configured for hosting domain
- [ ] Authentication providers configured
- [ ] Billing alerts set up in GCP

### Set Billing Alerts

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **Billing** > **Budgets & Alerts**
4. Create budget: $5/month
5. Set alert at 50%, 90%, 100%

---

## Troubleshooting

### Deployment Fails

**Error**: "Functions deploy failed"
```bash
# Check Node version
node --version  # Should be 20+

# Rebuild functions
cd functions
rm -rf node_modules lib
npm install
npm run build
cd ..

# Try again
firebase deploy --only functions
```

### Functions Not Running

**Check logs:**
```bash
firebase functions:log

# Look for errors
```

**Common issues:**
- Market is closed (functions only run 9:15-3:30 IST)
- Timezone misconfiguration
- NSE API blocking (fallback should work)

### Hosting Shows Old Version

**Solution:**
```bash
# Clear CDN cache
firebase hosting:channel:deploy preview

# Or force refresh in browser (Ctrl+Shift+R)
```

---

## Support & Resources

- **Firebase Status**: https://status.firebase.google.com/
- **Firebase Support**: https://firebase.google.com/support
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/firebase
- **Firebase Discord**: https://discord.gg/firebase

---

## Summary

✅ **One-time setup**: ~15 minutes
✅ **Future deploys**: ~2 minutes (`firebase deploy`)
✅ **Cost**: $0/month (free tier)
✅ **Reliability**: 99.95% uptime SLA
✅ **Scalability**: Auto-scales to millions of users
✅ **Maintenance**: Minimal (auto-updates, auto-cleanup)

**Your PCR Analysis app is now production-ready and running 24/7! 🚀**
