# Testing Guide - Live NSE API & Decimal Formatting

## Quick Test Checklist

### ✅ 1. Build Verification
```bash
npm run build
```
**Expected**: Build completes successfully with no errors
**Status**: ✅ Verified

### ✅ 2. Dev Server
```bash
npm run dev
```
**Expected**: Server starts on localhost:5173 or 5174
**Status**: ✅ Verified

### 3. Visual Verification

#### Decimal Formatting Test
1. Start the app: `npm run dev`
2. Login with Google
3. Check PCR Dashboard card
4. **Verify**: PCR shows 2 decimals (e.g., `1.23` not `1.2345`)
5. **Verify**: Trend shows 2 decimals (e.g., `+0.05` not `+0.0523`)

#### Component Checklist

**PCR Dashboard Card** (`src/components/PCRDashboard.vue:87`)
- [ ] PCR value shows 2 decimals: `1.23`
- [ ] Trend change shows 2 decimals: `±0.05`
- [ ] Percentage shows 2 decimals: `±3.25%`

**PCR Analysis Table** (`src/components/PCRAnalysisTable.vue:36`)
- [ ] PCR column shows 2 decimals in chips
- [ ] All historical records formatted correctly
- [ ] Trend indicators show 2 decimals

### 4. Live API Testing (Market Hours Only)

#### Prerequisites
- **Time**: 9:15 AM - 3:30 PM IST (Indian market hours)
- **Day**: Monday - Friday (not holidays)
- **Network**: Internet connection required

#### Test Procedure
```bash
# 1. Start dev server
npm run dev

# 2. Open browser DevTools
# Press F12 or Cmd+Option+I

# 3. Go to Console tab

# 4. Login and select an index (e.g., NIFTY)

# 5. Check console output
```

#### Expected Console Output

**Scenario A: Live API Success**
```
✅ No errors
✅ Data updates every 3 minutes
✅ PCR values look realistic (0.8-1.5 range)
```

**Scenario B: CORS Blocked (Expected)**
```
⚠️ CORS error in console
⚠️ "Failed to fetch live NSE data, using fallback"
⚠️ Mock data is used (PCR values change gradually)
```

**Scenario C: Outside Market Hours**
```
ℹ️ "Market is closed"
ℹ️ Shows last trading session data
ℹ️ No API calls made
```

### 5. Network Tab Verification

#### Steps
```bash
# 1. Open DevTools > Network tab
# 2. Filter: "option-chain"
# 3. Refresh page after login
# 4. Check for API calls
```

#### Expected Results

**During Market Hours**:
- [ ] Request to `nseindia.com/api/option-chain-indices?symbol=NIFTY`
- [ ] Status: Either `200 OK` or `CORS error` (both acceptable)
- [ ] Headers include User-Agent and Referer

**Outside Market Hours**:
- [ ] No API calls (app knows market is closed)
- [ ] Shows cached data from localStorage

### 6. Decimal Precision Test

#### Manual Verification
```javascript
// Open browser console and run:
const testValue = 1.23456789
console.log('Test:', testValue.toFixed(2)) // Should show "1.23"

// Check actual PCR value from app state:
// Navigate to Vue DevTools > Components > PCRDashboard
// Look at latestPCR.pcr value
```

#### Expected Values
- **PCR**: Always 2 decimals (e.g., `1.23`, `0.95`, `1.10`)
- **PCR Change**: Always 2 decimals (e.g., `0.05`, `-0.03`, `0.00`)
- **Percentage**: Always 2 decimals (e.g., `3.25%`, `-2.10%`)

### 7. Data Flow Test

#### Test Live Data Fetching
```bash
# 1. Login and select NIFTY
# 2. Open Console
# 3. Wait 3 minutes
# 4. New data should appear
```

#### Verify Data Updates
- [ ] Timestamp changes every 3 minutes
- [ ] PCR value may change slightly
- [ ] Historical table adds new row (max 50 rows)
- [ ] Summary cards update with new data

### 8. Error Handling Test

#### Simulate Network Failure
```bash
# 1. Open DevTools > Network tab
# 2. Set throttling to "Offline"
# 3. Refresh page
# 4. App should still work with cached data
```

#### Expected Behavior
- [ ] No crash or blank screen
- [ ] Shows last cached data from localStorage
- [ ] Error message displayed (optional)
- [ ] Falls back to mock data for updates

### 9. CORS Proxy Test (Optional)

#### Using CORS Proxy
```typescript
// Edit src/services/marketData.ts line 111:
const proxyUrl = 'https://corsproxy.io/?'
const url = `${proxyUrl}https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`

// Rebuild and test
npm run dev
```

#### Expected Result
- [ ] Console shows successful API calls
- [ ] Real NSE data appears (realistic OI values)
- [ ] No CORS errors

### 10. Production Build Test

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open http://localhost:4173
# Test all features again
```

#### Production Checklist
- [ ] Build completes without warnings
- [ ] Bundle size reasonable (~125KB gzipped)
- [ ] All features work in preview mode
- [ ] PCR formatting correct in production

---

## Test Results Template

### Environment
- **Date**: _______
- **Time**: _______
- **Market Status**: [ ] Open [ ] Closed
- **Browser**: _______
- **OS**: _______

### Build & Server
- [ ] `npm run build` - Success
- [ ] `npm run dev` - Success
- [ ] Server accessible on localhost

### Visual Tests
- [ ] Dashboard PCR shows 2 decimals
- [ ] Table PCR shows 2 decimals
- [ ] Trend indicators show 2 decimals
- [ ] All percentages show 2 decimals

### API Tests
- [ ] API calls attempted (market hours)
- [ ] Fallback works correctly
- [ ] Market hours detection works
- [ ] 3-minute updates working

### Data Tests
- [ ] PCR values in realistic range (0.5-2.0)
- [ ] Open Interest values look realistic
- [ ] Timestamps updating correctly
- [ ] Historical data persisting

### Error Handling
- [ ] Offline mode handled gracefully
- [ ] CORS errors handled with fallback
- [ ] Invalid data handled correctly
- [ ] No console errors (except expected CORS)

### Performance
- [ ] App loads in < 3 seconds
- [ ] UI responsive on interactions
- [ ] No memory leaks (check DevTools Performance)
- [ ] Background updates don't freeze UI

---

## Common Issues & Solutions

### Issue: "CORS policy blocked"
**Solution**: This is expected! The app will use fallback mock data. See LIVE_API_SETUP.md for CORS proxy setup.

### Issue: PCR shows 4 decimals instead of 2
**Solution**: Clear browser cache and rebuild:
```bash
npm run build
# Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
```

### Issue: No data appears
**Solution**:
1. Check if you're logged in
2. Check if market is open
3. Check localStorage has data: `localStorage.getItem('eb_pcr_indices_data')`

### Issue: "NSE API error: 403"
**Solution**: Expected if calling directly from browser. Fallback will work.

### Issue: Data not updating every 3 minutes
**Solution**:
1. Check console for errors
2. Verify market is open (9:15 AM - 3:30 PM IST)
3. Check `usePCRAnalysis.ts` interval is running

---

## Automated Test Script (Future Enhancement)

```javascript
// test-pcr-formatting.js
const tests = [
  { input: 1.23456, expected: '1.23', name: 'Basic rounding' },
  { input: 0.999, expected: '1.00', name: 'Round up' },
  { input: 1.234, expected: '1.23', name: 'Round down' },
  { input: 0.005, expected: '0.01', name: 'Small value round up' },
]

tests.forEach(test => {
  const result = Number(test.input.toFixed(2)).toString()
  const pass = result === test.expected
  console.log(`${pass ? '✅' : '❌'} ${test.name}: ${result} === ${test.expected}`)
})
```

Run with: `node test-pcr-formatting.js`

---

## Manual Testing Schedule

### During Development
- Test decimal formatting after every component change
- Verify API integration during market hours daily
- Check error handling weekly

### Before Deployment
- Full test suite (all 10 tests above)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile testing (iOS, Android)
- Performance profiling

### In Production
- Monitor console errors daily
- Check API success rate
- Verify data accuracy vs. NSE website
- User feedback review

---

**Happy Testing! 🧪**
