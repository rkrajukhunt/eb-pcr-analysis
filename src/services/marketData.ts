import type { PCRData, IndexSymbol, IndexData } from '../types/market'
import { DEFAULT_INDICATOR_CONFIG } from '../types/market'
import { getExpiryDates } from '../utils/expiryCalculator'

/**
 * Calculate PCR (Put-Call Ratio)
 * PCR = Put OI / Call OI
 * Returns value with 2 decimal places
 */
function calculatePCR(putOI: number, callOI: number): number {
  if (callOI === 0) return 0
  return Number((putOI / callOI).toFixed(2))
}

/**
 * Determine market indicator based on PCR and OI changes
 */
function getMarketIndicator(pcr: number, oiDiff: number): 'bullish' | 'bearish' | 'neutral' {
  const { pcrBullishThreshold, pcrBearishThreshold } = DEFAULT_INDICATOR_CONFIG

  if (pcr >= pcrBullishThreshold && oiDiff > 0) {
    return 'bullish'
  } else if (pcr <= pcrBearishThreshold && oiDiff < 0) {
    return 'bearish'
  } else if (pcr > pcrBullishThreshold) {
    return 'bullish'
  } else if (pcr < pcrBearishThreshold) {
    return 'bearish'
  }

  return 'neutral'
}

/**
 * Calculate PCR trend indicators
 * Returns values with 2 decimal places for better readability
 */
function calculatePCRTrend(currentPCR: number, previousPCR?: number) {
  if (!previousPCR) {
    return {
      pcrChange: 0,
      pcrChangePercent: 0,
      trend: 'neutral' as const
    }
  }

  const pcrChange = Number((currentPCR - previousPCR).toFixed(2))
  const pcrChangePercent = previousPCR !== 0
    ? Number(((pcrChange / previousPCR) * 100).toFixed(2))
    : 0

  let trend: 'up' | 'down' | 'neutral'
  if (Math.abs(pcrChangePercent) < 0.5) {
    trend = 'neutral'
  } else if (pcrChange > 0) {
    trend = 'up'
  } else {
    trend = 'down'
  }

  return { pcrChange, pcrChangePercent, trend }
}

/**
 * Generate mock PCR data for development
 * In production, this should fetch real data from NSE or data provider
 */
function generateMockPCRData(previousData?: PCRData): PCRData {
  const baseCallOI = previousData ? previousData.callOI : 50000000
  const basePutOI = previousData ? previousData.putOI : 55000000

  // Add some random variation
  const callOI = Math.round(baseCallOI + (Math.random() - 0.5) * 2000000)
  const putOI = Math.round(basePutOI + (Math.random() - 0.5) * 2000000)
  const callVolume = Math.round(5000000 + Math.random() * 1000000)
  const putVolume = Math.round(6000000 + Math.random() * 1000000)

  const pcr = calculatePCR(putOI, callOI)
  const oiDiff = previousData ? (callOI + putOI) - (previousData.callOI + previousData.putOI) : 0
  const volumeDiff = previousData ? (callVolume + putVolume) - (previousData.callVolume + previousData.putVolume) : 0

  // Calculate trend indicators
  const trendData = calculatePCRTrend(pcr, previousData?.pcr)

  return {
    timestamp: new Date().toISOString(),
    callOI,
    putOI,
    callVolume,
    putVolume,
    pcr,
    oiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff),
    ...trendData
  }
}

/**
 * Fetch live option chain data from NSE India
 */
async function fetchNSEOptionChain(symbol: IndexSymbol): Promise<any> {
  try {
    // NSE requires specific headers to prevent blocking
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/option-chain'
    }

    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`NSE API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching NSE data:', error)
    throw error
  }
}

/**
 * Parse NSE option chain data to calculate PCR
 */
function parseNSEData(data: any, previousData?: PCRData): PCRData {
  let totalCallOI = 0
  let totalPutOI = 0
  let totalCallVolume = 0
  let totalPutVolume = 0

  // NSE data structure: data.records.data contains array of option chain data
  if (data.records && data.records.data) {
    data.records.data.forEach((record: any) => {
      // Each record has CE (Call) and PE (Put) data
      if (record.CE) {
        totalCallOI += record.CE.openInterest || 0
        totalCallVolume += record.CE.totalTradedVolume || 0
      }
      if (record.PE) {
        totalPutOI += record.PE.openInterest || 0
        totalPutVolume += record.PE.totalTradedVolume || 0
      }
    })
  }

  const pcr = calculatePCR(totalPutOI, totalCallOI)
  const oiDiff = previousData
    ? (totalCallOI + totalPutOI) - (previousData.callOI + previousData.putOI)
    : 0
  const volumeDiff = previousData
    ? (totalCallVolume + totalPutVolume) - (previousData.callVolume + previousData.putVolume)
    : 0

  // Calculate trend indicators
  const trendData = calculatePCRTrend(pcr, previousData?.pcr)

  return {
    timestamp: new Date().toISOString(),
    callOI: totalCallOI,
    putOI: totalPutOI,
    callVolume: totalCallVolume,
    putVolume: totalPutVolume,
    pcr,
    oiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff),
    ...trendData
  }
}

/**
 * Fetch PCR data for a specific index
 * Uses live NSE API with fallback to mock data
 */
export async function fetchPCRData(
  symbol: IndexSymbol,
  previousData?: PCRData
): Promise<PCRData> {
  try {
    // Try to fetch live data from NSE
    const nseData = await fetchNSEOptionChain(symbol)
    return parseNSEData(nseData, previousData)
  } catch (error) {
    console.warn('Failed to fetch live NSE data, using fallback:', error)

    // Fallback to mock data if API fails
    // This ensures the app continues working even if NSE API is down
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateMockPCRData(previousData)
  }
}

/**
 * Get index name from symbol
 */
function getIndexName(symbol: IndexSymbol): string {
  const names: Record<IndexSymbol, string> = {
    NIFTY: 'Nifty 50',
    BANKNIFTY: 'Bank Nifty',
    FINNIFTY: 'Fin Nifty',
    MIDCPNIFTY: 'Midcap Nifty'
  }
  return names[symbol]
}

/**
 * Initialize index data
 */
export function initializeIndexData(symbol: IndexSymbol): IndexData {
  const expiry = getExpiryDates()

  return {
    symbol,
    name: getIndexName(symbol),
    currentExpiry: expiry.current,
    nextExpiry: expiry.next,
    pcrHistory: [],
    latestPCR: null
  }
}

/**
 * Update index data with new PCR data
 */
export function updateIndexData(
  indexData: IndexData,
  newPCRData: PCRData
): IndexData {
  const updatedHistory = [...indexData.pcrHistory, newPCRData]

  // Keep only last 50 records to prevent memory issues
  if (updatedHistory.length > 50) {
    updatedHistory.shift()
  }

  return {
    ...indexData,
    pcrHistory: updatedHistory,
    latestPCR: newPCRData
  }
}

/**
 * Available indices for analysis
 */
export const AVAILABLE_INDICES: IndexSymbol[] = [
  'NIFTY',
  'BANKNIFTY',
  'FINNIFTY',
  'MIDCPNIFTY'
]
