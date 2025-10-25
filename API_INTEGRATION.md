# API Integration Guide

This guide explains how to integrate real NSE (National Stock Exchange) API data into the PCR Analysis application.

## Current Implementation

The application currently uses mock data generated in `src/services/marketData.ts`. The `fetchPCRData` function simulates API calls with random variations.

## NSE API Options

### Option 1: Official NSE API

NSE provides option chain data through their website API:

**Endpoint**: `https://www.nseindia.com/api/option-chain-indices?symbol={SYMBOL}`

**Required Headers**:
```typescript
{
  'User-Agent': 'Mozilla/5.0...',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}
```

**Note**: NSE has CORS restrictions and may require a proxy server for browser-based applications.

### Option 2: Third-Party Data Providers

Consider these alternatives:
- **Zerodha Kite Connect API**
- **Upstox API**
- **5Paisa API**
- **Angel One SmartAPI**

These typically require:
1. Account creation
2. API key generation
3. OAuth authentication
4. Rate limit handling

## Implementation Steps

### 1. Set Up Proxy Server (If using NSE directly)

Create a backend proxy to handle NSE API calls:

```typescript
// backend/server.js (Node.js example)
import express from 'express'
import axios from 'axios'

const app = express()

app.get('/api/option-chain/:symbol', async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.nseindia.com/api/option-chain-indices?symbol=${req.params.symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0...',
          'Accept': 'application/json',
        }
      }
    )
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' })
  }
})

app.listen(3000)
```

### 2. Update Environment Variables

Add API configuration to `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=your_api_key_here  # If using third-party API
```

### 3. Modify fetchPCRData Function

Update `src/services/marketData.ts`:

```typescript
export async function fetchPCRData(
  symbol: IndexSymbol,
  previousData?: PCRData
): Promise<PCRData> {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL
    const response = await fetch(`${apiUrl}/option-chain/${symbol}`)

    if (!response.ok) {
      throw new Error('Failed to fetch option chain data')
    }

    const data = await response.json()

    // Transform NSE data to PCRData format
    return transformNSEData(data, previousData)
  } catch (error) {
    console.error('Error fetching PCR data:', error)
    // Fallback to mock data
    return generateMockPCRData(previousData)
  }
}
```

### 4. Create Data Transformer

Add a function to transform NSE API response:

```typescript
interface NSEOptionChainData {
  records: {
    data: Array<{
      CE?: { openInterest: number; totalTradedVolume: number }
      PE?: { openInterest: number; totalTradedVolume: number }
    }>
  }
}

function transformNSEData(
  nseData: NSEOptionChainData,
  previousData?: PCRData
): PCRData {
  const { data } = nseData.records

  // Calculate total Call and Put OI
  let totalCallOI = 0
  let totalPutOI = 0
  let totalCallVolume = 0
  let totalPutVolume = 0

  data.forEach(strike => {
    if (strike.CE) {
      totalCallOI += strike.CE.openInterest
      totalCallVolume += strike.CE.totalTradedVolume
    }
    if (strike.PE) {
      totalPutOI += strike.PE.openInterest
      totalPutVolume += strike.PE.totalTradedVolume
    }
  })

  const pcr = calculatePCR(totalPutOI, totalCallOI)
  const oiDiff = previousData
    ? (totalCallOI + totalPutOI) - (previousData.callOI + previousData.putOI)
    : 0
  const volumeDiff = previousData
    ? (totalCallVolume + totalPutVolume) - (previousData.callVolume + previousData.putVolume)
    : 0

  return {
    timestamp: new Date().toISOString(),
    callOI: totalCallOI,
    putOI: totalPutOI,
    callVolume: totalCallVolume,
    putVolume: totalPutVolume,
    pcr,
    oiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff)
  }
}
```

## Rate Limiting

Implement rate limiting to avoid API restrictions:

```typescript
// src/services/rateLimit.ts
class RateLimiter {
  private lastCall = 0
  private minInterval = 3000 // 3 seconds

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall

    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      )
    }

    this.lastCall = Date.now()
    return fn()
  }
}

export const rateLimiter = new RateLimiter()
```

Usage:
```typescript
export async function fetchPCRData(
  symbol: IndexSymbol,
  previousData?: PCRData
): Promise<PCRData> {
  return rateLimiter.throttle(() => {
    // API call here
  })
}
```

## Error Handling

Implement robust error handling:

```typescript
export async function fetchPCRData(
  symbol: IndexSymbol,
  previousData?: PCRData
): Promise<PCRData> {
  try {
    // API call
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      console.error('Network error:', error)
    } else if (error instanceof SyntaxError) {
      // JSON parse error
      console.error('Invalid data format:', error)
    } else {
      // Other errors
      console.error('Unexpected error:', error)
    }

    // Return last known data or mock data
    return previousData || generateMockPCRData()
  }
}
```

## Caching Strategy

Implement caching to reduce API calls:

```typescript
class DataCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl = 3 * 60 * 1000 // 3 minutes

  get(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

const pcrCache = new DataCache<PCRData>()
```

## Testing

Test API integration:

```typescript
// tests/marketData.test.ts
import { fetchPCRData } from '../services/marketData'

describe('PCR Data Fetching', () => {
  it('should fetch and transform NSE data', async () => {
    const data = await fetchPCRData('NIFTY')

    expect(data).toHaveProperty('callOI')
    expect(data).toHaveProperty('putOI')
    expect(data).toHaveProperty('pcr')
    expect(data.pcr).toBeGreaterThan(0)
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    const data = await fetchPCRData('INVALID_SYMBOL')

    expect(data).toBeDefined()
    // Should return mock or cached data
  })
})
```

## Production Considerations

1. **Environment Variables**: Never commit API keys
2. **Rate Limiting**: Respect API provider limits
3. **Error Monitoring**: Use Sentry or similar for production errors
4. **Caching**: Implement Redis or similar for distributed caching
5. **Authentication**: Securely store and refresh API tokens
6. **Monitoring**: Track API response times and success rates
7. **Fallback**: Always have mock data as fallback

## Resources

- [NSE India](https://www.nseindia.com/)
- [Zerodha Kite Connect](https://kite.trade/)
- [Upstox API](https://upstox.com/developer/api-documentation/)
- [5Paisa API](https://www.5paisa.com/developerapi)
