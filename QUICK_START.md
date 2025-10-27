# Quick Start Guide - Firebase Backend PCR Analysis

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 20+ installed
- Firebase account (free)
- Firebase CLI installed globally

### Step 1: Clone & Install
```bash
git clone <your-repo>
cd eb-pcr-analysis
npm install
cd functions
npm install
cd ..
```

### Step 2: Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Select:
# ✓ Functions
# ✓ Firestore
# ✓ Hosting
```

### Step 3: Configure Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your Firebase credentials
# Get from: Firebase Console > Project Settings
```

### Step 4: Deploy Backend
```bash
# Deploy Cloud Functions + Firestore rules
firebase deploy --only functions,firestore:rules

# Wait for deployment to complete (~2-3 minutes)
```

### Step 5: Run Frontend
```bash
npm run dev

# Open http://localhost:5173
# Login with Google
# Data will appear automatically!
```

---

## ✅ Verification

### Check if Functions are Running
```bash
firebase functions:log --only fetchPCRData

# During market hours (9:15 AM - 3:30 PM IST), you should see:
# "📊 Market is open, fetching PCR data..."
```

### Check Firestore Data
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your project
3. Go to **Firestore Database**
4. Check `pcr_data` collection
5. You should see: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY

### Test Manual Trigger
```bash
# Trigger function manually (for testing outside market hours)
curl https://asia-south1-YOUR-PROJECT-ID.cloudfunctions.net/triggerPCRFetch
```

---

## 🎯 How It Works

```
9:15 AM IST → Cloud Function starts fetching data
    ↓
Every 3 min → Fetch NSE data for all indices
    ↓
Store in    → Cloud Firestore
    ↓
Push to     → All connected clients (real-time!)
    ↓
3:30 PM IST → Market closes, fetching stops
    ↓
3:35 PM IST → Save last trading session
    ↓
Sunday 12AM → Cleanup old data (keep last 7 days)
```

---

## 🎨 Frontend Changes

**OLD Code** (localStorage + client-side fetching):
```vue
<script setup>
import { usePCRAnalysis } from '@/composables/usePCRAnalysis'
</script>
```

**NEW Code** (Firestore + Cloud Functions):
```vue
<script setup>
import { usePCRFirestore } from '@/composables/usePCRFirestore'
</script>
```

That's it! No other changes needed. 🎉

---

## 💰 Cost

**Free Tier Includes**:
- 2M function invocations/month
- 400K GB-seconds compute
- 50K Firestore reads/day
- 20K Firestore writes/day

**This App Uses**:
- ~2K function invocations/month
- ~20K GB-seconds/month
- ~2K Firestore reads/day
- ~200 Firestore writes/day

**Result**: $0/month (well within free tier) ✅

---

## 🆘 Troubleshooting

### Functions not running?
```bash
# Check deployment status
firebase functions:list

# View logs
firebase functions:log
```

### No data in Firestore?
- Wait until 9:15 AM IST (market open)
- Or trigger manually: `curl <function-url>`
- Check logs: `firebase functions:log`

### Frontend not updating?
- Ensure user is logged in (Firestore requires auth)
- Check browser console for errors
- Verify Firestore rules are deployed

---

## 📚 Full Documentation

- **[FIREBASE_BACKEND_SETUP.md](./FIREBASE_BACKEND_SETUP.md)** - Complete backend setup
- **[LIVE_API_SETUP.md](./LIVE_API_SETUP.md)** - NSE API integration
- **[README.md](./README.md)** - Main project documentation

---

## 🎉 You're Done!

Your PCR Analysis app is now running on autopilot:
- ✅ Automatic data fetching during market hours
- ✅ Real-time updates to all users
- ✅ No client-side burden
- ✅ Works even when users are offline
- ✅ Free hosting on Firebase

**Enjoy your automated PCR analysis! 📊🚀**
