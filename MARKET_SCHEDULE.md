# Market Schedule & Trading Hours

This document explains how the application handles market trading hours, holidays, and data persistence.

## Features

### 1. Market Status Detection

The application automatically detects the current market status:

- **Trading** (9:15 AM - 3:30 PM IST): Market is open, live data updates every 3 minutes
- **Pre-Market**: Before market opens
- **Post-Market**: After market closes
- **Weekend**: Saturday/Sunday
- **Holiday**: NSE market holidays
- **Bank Holiday**: Bank-specific holidays

### 2. Trading Hours

**NSE India Trading Hours:**
- **Market Open**: 9:15 AM IST
- **Market Close**: 3:30 PM IST
- **Trading Days**: Monday - Friday (excluding holidays)

### 3. Holiday Calendar

The application includes a comprehensive list of NSE India market holidays for 2024-2025:

#### 2025 Holidays
- January 26 - Republic Day
- March 14 - Holi
- March 31 - Id-Ul-Fitr (Ramadan Eid)
- April 10 - Mahavir Jayanti
- April 14 - Dr. Baba Saheb Ambedkar Jayanti
- April 18 - Good Friday
- May 1 - Maharashtra Day
- June 7 - Bakri Id
- August 15 - Independence Day
- August 27 - Ganesh Chaturthi
- October 2 - Mahatma Gandhi Jayanti
- October 21 - Dussehra
- November 5 - Diwali-Laxmi Pujan
- November 6 - Diwali-Balipratipada
- November 24 - Gurunanak Jayanti
- December 25 - Christmas

## Data Persistence

### Last Trading Session Data

When the market is closed, the application:

1. **Loads Last Trading Session**: Retrieves the most recent trading session data from localStorage
2. **Displays Data with Context**: Shows the date and time of the last trading session
3. **Maintains History**: Keeps historical PCR data for up to 7 days

### Storage Mechanism

The application uses browser localStorage to persist:

- **Last Trading Session**: Complete index data from the last active trading session
- **Indices Data**: Current data for all tracked indices
- **Timestamp**: When the data was last updated

### Data Freshness

- Data is considered "recent" if it's within the last 7 days
- Older data is automatically cleared to prevent stale information

## User Experience

### During Market Hours

When the market is **open** (9:15 AM - 3:30 PM IST on trading days):

```
🟢 Market is open - Live data updates every 3 minutes
Last updated: 2:45:30 PM
```

- Background updates run automatically every 3 minutes
- Fresh data is fetched from the market
- Data is saved to localStorage as the last trading session

### During Non-Market Hours

#### Post-Market (After 3:30 PM)

```
🟠 Market is closed - Showing last trading session data
Last trading session: Wed, 25 Oct 2023, 3:30:00 PM
Next trading session: Thu, 26 Oct 2023, 9:15:00 AM
```

#### Weekend

```
⬜ Market closed (Weekend) - Showing last trading session data
Last trading session: Fri, 20 Oct 2023, 3:30:00 PM
Next trading session: Mon, 23 Oct 2023, 9:15:00 AM
```

#### Market Holiday

```
🟣 Market Holiday: Diwali - Showing last trading session data
🎉 Diwali
Last trading session: Thu, 2 Nov 2023, 3:30:00 PM
Next trading session: Fri, 3 Nov 2023, 9:15:00 AM
```

### No Previous Data Available

If no cached data exists (first-time user or cleared cache):

```
❌ No previous trading data available. PCR calculation will start on next trading session.
Next trading session: Mon, 23 Oct 2023, 9:15:00 AM
```

## Background Behavior

### Automatic Updates

The application runs two background processes:

1. **Data Updates** (every 3 minutes):
   - Only fetches when market is open
   - Skips updates during closed hours
   - Saves data after each successful update

2. **Status Checks** (every 1 minute):
   - Monitors market status changes
   - Detects when market opens/closes
   - Triggers immediate data fetch when market opens

### Auto-Resume on Market Open

The application automatically detects when the market opens:

```
Market Status Check:
Pre-Market → Trading (Market just opened)
Action: Fetch fresh data immediately
```

This ensures you always get the latest data as soon as trading begins, even if the application was left open overnight.

## Manual Refresh

Users can manually refresh data at any time:

- **During Market Hours**: Fetches fresh live data
- **During Closed Hours**: Force-refreshes (still uses mock/cached data)

The refresh button is always available but behavior depends on market status.

## Implementation Details

### Market Schedule Service

Located in `src/services/marketSchedule.ts`:

- `getMarketStatus()`: Returns current market status
- `shouldFetchLiveData()`: Determines if live data should be fetched
- `getMarketStatusMessage()`: Generates user-friendly status messages
- `formatTradingSessionDate()`: Formats dates for display

### Storage Service

Located in `src/services/storageService.ts`:

- `saveLastTradingSession()`: Saves session data to localStorage
- `loadLastTradingSession()`: Retrieves last session data
- `isRecentSessionData()`: Checks if data is within 7 days

### PCR Analysis Composable

Located in `src/composables/usePCRAnalysis.ts`:

- Integrates market status checking
- Manages data persistence
- Controls background updates based on market hours
- Provides reactive market status to UI components

## Timezone Considerations

All times are in **IST (Indian Standard Time - Asia/Kolkata)**:

```typescript
timeZone: 'Asia/Kolkata'
```

Ensure your system or server correctly handles IST timezone for accurate market hours detection.

## Testing Market Status

To test different market statuses:

1. **Change System Time**: Adjust your system clock to different times
2. **Check Console Logs**: The app logs market status changes
3. **Use Browser DevTools**: Inspect localStorage for saved data

Example console output:
```
Market is closed. Skipping live data fetch.
Loaded last trading session data from: Fri, 20 Oct 2023, 3:30:00 PM
```

## Updating Holiday Calendar

To update the holiday calendar for new years:

1. Visit [NSE India Trading Holidays](https://www.nseindia.com/regulations/trading-holidays)
2. Add new holidays to `src/services/marketSchedule.ts`
3. Follow the existing format:

```typescript
export const MARKET_HOLIDAYS_2026: MarketHoliday[] = [
  { date: '2026-01-26', name: 'Republic Day', type: 'both' },
  // ... more holidays
]
```

4. Add to the `ALL_HOLIDAYS` array:

```typescript
const ALL_HOLIDAYS = [...MARKET_HOLIDAYS_2024, ...MARKET_HOLIDAYS_2025, ...MARKET_HOLIDAYS_2026]
```

## Best Practices

1. **Keep Holiday Calendar Updated**: Update annually from official NSE calendar
2. **Monitor localStorage Usage**: Clear old data if storage becomes full
3. **Handle Timezone Carefully**: Always use IST for Indian markets
4. **Test Edge Cases**: Test behavior on holidays, weekends, and session boundaries
5. **Provide Clear Messaging**: Always inform users about data source (live vs. cached)

## Limitations

- **Mock Data in Development**: Currently using simulated data (see API_INTEGRATION.md for real API setup)
- **7-Day Data Retention**: Older data is automatically cleared
- **Browser Dependency**: Uses localStorage (data lost if cache cleared)
- **Single Timezone**: Assumes IST only (not suitable for international markets)

## Future Enhancements

Potential improvements:

1. **Server-Side Storage**: Store last session data on backend
2. **Multi-Market Support**: Handle different market timezones
3. **Pre-Market Indicators**: Show futures/global market sentiment pre-market
4. **Holiday Prediction**: Auto-detect holidays from external calendars
5. **Market Announcements**: Display NSE circulars and announcements
