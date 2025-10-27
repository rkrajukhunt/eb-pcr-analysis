# Live NSE API Integration Guide

## Overview
This application now integrates with **NSE India's live option chain API** to fetch real-time PCR (Put-Call Ratio) data. All PCR values are displayed with **2 decimal precision** using `toFixed(2)`.

---

## Features Implemented

### 1. Live Data Fetching
- **Endpoint**: `https://www.nseindia.com/api/option-chain-indices?symbol={INDEX}`
- **Supported Indices**: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY
- **Update Frequency**: Every 3 minutes during market hours
- **Fallback**: Mock data if API fails (ensures app stability)

### 2. Decimal Formatting (2 Decimal Places)
All PCR-related values now use **2 decimal precision**:
- **PCR Value**: `1.23` (was `1.2345`)
- **PCR Change**: `+0.05` (was `+0.0523`)
- **Change Percent**: `+3.25%` (consistent)

**Updated Files**:
- `src/services/marketData.ts:12` - `calculatePCR()` uses `.toFixed(2)`
- `src/services/marketData.ts:47` - `calculatePCRTrend()` uses `.toFixed(2)`
- `src/components/PCRDashboard.vue:87` - Dashboard displays `pcr.toFixed(2)`
- `src/components/PCRAnalysisTable.vue:36` - Table displays `pcr.toFixed(2)`
- `src/components/TrendIndicator.vue:68` - Change displays `change.toFixed(2)`

---

## CORS Issues & Solutions

### Problem
NSE API blocks browser requests due to CORS (Cross-Origin Resource Sharing) restrictions.

### Solution Options

#### **Option 1: CORS Proxy (Recommended for Development)**
Use a CORS proxy service:

```typescript
// Update fetchNSEOptionChain in src/services/marketData.ts
const proxyUrl = 'https://corsproxy.io/?'
const url = `${proxyUrl}https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`
```

**Free CORS Proxies**:
- https://corsproxy.io/
- https://cors-anywhere.herokuapp.com/
- https://api.allorigins.win/raw?url=

#### **Option 2: Backend Proxy (Recommended for Production)**
Create a simple Node.js/Express backend:

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.get('/api/option-chain/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(
      `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com/option-chain'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NSE data' });
  }
});

app.listen(3001, () => console.log('Proxy running on port 3001'));
```

Then update frontend:
```typescript
// src/services/marketData.ts
const url = `http://localhost:3001/api/option-chain/${symbol}`
```

#### **Option 3: Browser Extension (Development Only)**
Install browser extension like "CORS Unblock" or "Allow CORS"
- Not recommended for production
- Only for testing

---

## Implementation Details

### NSE API Response Structure

```json
{
  "records": {
    "data": [
      {
        "strikePrice": 18000,
        "CE": {
          "openInterest": 5000000,
          "totalTradedVolume": 1000000,
          "impliedVolatility": 12.5
        },
        "PE": {
          "openInterest": 6000000,
          "totalTradedVolume": 1200000,
          "impliedVolatility": 13.2
        }
      },
      // ... more strike prices
    ]
  }
}
```

### Data Parsing Logic

```typescript
// src/services/marketData.ts:133-177
function parseNSEData(data: any, previousData?: PCRData): PCRData {
  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVolume = 0;
  let totalPutVolume = 0;

  data.records.data.forEach((record: any) => {
    if (record.CE) {
      totalCallOI += record.CE.openInterest || 0;
      totalCallVolume += record.CE.totalTradedVolume || 0;
    }
    if (record.PE) {
      totalPutOI += record.PE.openInterest || 0;
      totalPutVolume += record.PE.totalTradedVolume || 0;
    }
  });

  const pcr = calculatePCR(totalPutOI, totalCallOI);
  // ... rest of calculations
}
```

---

## Testing the Integration

### 1. Check Browser Console
```bash
# Open DevTools > Console
# You should see either:
✅ Successfully parsed NSE data
❌ Failed to fetch live NSE data, using fallback
```

### 2. Network Tab
```bash
# Open DevTools > Network
# Filter: option-chain-indices
# Check if API call succeeds (Status 200) or fails (CORS error)
```

### 3. Verify PCR Values
- Check that PCR displays as `1.23` (not `1.2345`)
- Verify trend indicators show `±0.05` (2 decimals)
- Confirm percentage shows `±3.25%`

---

## Environment Configuration

No additional environment variables needed! The integration uses:
- Direct NSE API calls (with fallback)
- Client-side parsing
- Existing Firebase auth

---

## Rate Limiting & Best Practices

### Current Implementation
- **Update Interval**: 3 minutes (180,000ms)
- **Market Hours Only**: 9:15 AM - 3:30 PM IST
- **Automatic Pause**: When market is closed

### NSE API Limits
- **Unknown official limit** (not publicly documented)
- **Recommended**: Maximum 1 request per minute per index
- **Current Setup**: Safe at 3-minute intervals

### Error Handling
```typescript
// Automatic fallback to mock data if:
// 1. Network error
// 2. CORS blocked
// 3. NSE server down
// 4. Invalid response format
```

---

## Production Deployment Checklist

- [ ] Set up backend CORS proxy (Option 2 above)
- [ ] Update `VITE_API_BASE_URL` in `.env`
- [ ] Test with real market data during trading hours
- [ ] Implement rate limiting on backend
- [ ] Add monitoring/alerting for API failures
- [ ] Consider caching layer (Redis) for reduced API calls
- [ ] Add request retry logic with exponential backoff
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression on backend

---

## Troubleshooting

### Issue: CORS Error in Browser
**Solution**: Use CORS proxy (see Option 1 above)

### Issue: "NSE API error: 403"
**Solution**: NSE blocks requests without proper headers. Already implemented in code:
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0...',
  'Referer': 'https://www.nseindia.com/option-chain'
}
```

### Issue: Empty PCR Data
**Solution**: Check market hours. NSE API returns data only during trading sessions.

### Issue: Inconsistent Data
**Solution**: NSE updates data every ~1-3 minutes. Our 3-minute interval is appropriate.

---

## Code Changes Summary

### Modified Files
1. **src/services/marketData.ts**
   - Added `fetchNSEOptionChain()` - API call with headers
   - Added `parseNSEData()` - Parse NSE response
   - Updated `fetchPCRData()` - Live data with fallback
   - Changed `calculatePCR()` - 2 decimal precision
   - Changed `calculatePCRTrend()` - 2 decimal precision

2. **src/components/PCRDashboard.vue**
   - Line 87: Added `.toFixed(2)` to PCR display

3. **src/components/PCRAnalysisTable.vue**
   - Line 36: Added `.toFixed(2)` to table PCR values

4. **src/components/TrendIndicator.vue**
   - Line 68: Changed from `.toFixed(4)` to `.toFixed(2)`

---

## Next Steps

1. **Immediate**: Test with CORS proxy during market hours
2. **Short-term**: Deploy backend proxy for production
3. **Long-term**: Consider paid data providers (NSE data can be unreliable)

**Alternative Data Providers**:
- **Upstox API** (free tier available)
- **Zerodha Kite Connect** (₹2000/month)
- **Angel Broking SmartAPI** (free for clients)
- **Dhan API** (free tier)

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test during market hours (9:15 AM - 3:30 PM IST)
4. Ensure fallback mock data works

**Happy Trading! 📈**
