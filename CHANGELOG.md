# Changelog

## [v1.1.0] - 2025-10-27

### 🎉 Major Features Added

#### Live NSE API Integration
- **Real-time data fetching** from NSE India Option Chain API
- **Endpoint**: `https://www.nseindia.com/api/option-chain-indices?symbol={INDEX}`
- **Smart fallback**: Automatically uses mock data if API fails
- **Proper headers**: Configured to prevent NSE blocking
- **Error handling**: Comprehensive try-catch with logging

#### Decimal Formatting (2 Decimal Places)
- **PCR values**: Now display as `1.23` instead of `1.2345`
- **PCR changes**: Now display as `±0.05` instead of `±0.0523`
- **Consistent formatting** across all components
- **Using toFixed(2)**: Clean, professional display

### 📝 Files Modified

#### Core Services
- **src/services/marketData.ts**
  - Line 10-12: Updated `calculatePCR()` to use `.toFixed(2)`
  - Line 47: Updated `calculatePCRTrend()` to use `.toFixed(2)`
  - Lines 99-128: Added `fetchNSEOptionChain()` function for API calls
  - Lines 130-177: Added `parseNSEData()` function to parse NSE response
  - Lines 179-199: Updated `fetchPCRData()` with live API integration and fallback

#### Components
- **src/components/PCRDashboard.vue**
  - Line 87: Added `.toFixed(2)` to PCR display in dashboard card

- **src/components/PCRAnalysisTable.vue**
  - Line 36: Added `.toFixed(2)` to PCR display in table

- **src/components/TrendIndicator.vue**
  - Line 68: Changed from `.toFixed(4)` to `.toFixed(2)` for trend values

#### Documentation
- **README.md**
  - Added Live NSE Data Integration section
  - Added Precise Decimal Formatting feature
  - Updated API Integration section with new implementation details
  - Added links to LIVE_API_SETUP.md

- **LIVE_API_SETUP.md** (NEW)
  - Comprehensive guide for NSE API integration
  - CORS handling solutions (3 options)
  - NSE API response structure documentation
  - Production deployment checklist
  - Troubleshooting guide

- **CHANGELOG.md** (NEW)
  - This file tracking all changes

### 🔧 Technical Details

#### NSE API Implementation

**Headers Used**:
```typescript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/option-chain'
}
```

**Data Parsing Logic**:
- Iterates through `data.records.data` array
- Aggregates all Call Open Interest (CE.openInterest)
- Aggregates all Put Open Interest (PE.openInterest)
- Calculates PCR = Total Put OI / Total Call OI
- Includes trend calculations with previous data

**Fallback Mechanism**:
```typescript
try {
  // Fetch live NSE data
  const nseData = await fetchNSEOptionChain(symbol)
  return parseNSEData(nseData, previousData)
} catch (error) {
  // Use mock data if API fails
  return generateMockPCRData(previousData)
}
```

#### Decimal Precision

**Before**:
- PCR: `1.2345`
- Change: `±0.0523`

**After**:
- PCR: `1.23`
- Change: `±0.05`

**Implementation**:
```typescript
// Using toFixed(2) instead of toFixed(4)
const pcr = Number((putOI / callOI).toFixed(2))
const pcrChange = Number((currentPCR - previousPCR).toFixed(2))
```

### 🚀 How to Use

#### Development
```bash
npm run dev
```

During market hours (9:15 AM - 3:30 PM IST), the app will:
1. Attempt to fetch live NSE data
2. Fall back to mock data if CORS blocks the request
3. Check browser console for status

#### Check API Status
Open browser DevTools Console:
- ✅ **"Successfully parsed NSE data"** - Live API working
- ⚠️ **"Failed to fetch live NSE data, using fallback"** - Using mock data

#### CORS Solutions
See [LIVE_API_SETUP.md](./LIVE_API_SETUP.md) for:
- CORS proxy setup (development)
- Backend proxy implementation (production)
- Alternative data providers

### ⚠️ Known Issues

#### CORS Blocking
- **Issue**: NSE API may block browser requests
- **Status**: Expected behavior
- **Solution**: Use CORS proxy or backend proxy (see LIVE_API_SETUP.md)

#### NSE API Rate Limits
- **Issue**: NSE doesn't publish official rate limits
- **Mitigation**: 3-minute update interval (conservative)
- **Recommendation**: Use backend caching for production

### 📊 Testing

#### Build Test
```bash
npm run build
```
✅ Build successful with no TypeScript errors

#### Dev Server Test
```bash
npm run dev
```
✅ Server starts successfully on localhost:5174
✅ All components compile without errors

### 🎯 Next Steps

#### For Development
- [ ] Test during market hours (9:15 AM - 3:30 PM IST)
- [ ] Verify live NSE data parsing
- [ ] Check decimal formatting in UI

#### For Production
- [ ] Set up backend CORS proxy
- [ ] Implement request caching (Redis)
- [ ] Add rate limiting
- [ ] Set up monitoring/alerting
- [ ] Consider paid data providers for reliability

### 🙏 Credits

- NSE India for option chain data
- Vue 3 + Quasar for UI framework
- Firebase for authentication

---

## [v1.0.0] - Initial Release

### Features
- Firebase Google Authentication
- PCR calculation for 4 major indices
- Real-time dashboard with summary cards
- Historical data table (last 50 records)
- Market schedule detection
- Holiday calendar (NSE India 2024-2025)
- Background updates every 3 minutes
- localStorage persistence (7-day window)
- Mobile-responsive design
- PWA capabilities
- Mock data generation
