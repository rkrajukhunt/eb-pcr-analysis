import type { PCRData, IndexSymbol, IndexData } from '../types/market'
import { DEFAULT_INDICATOR_CONFIG } from '../types/market'
import { getExpiryDates } from '../utils/expiryCalculator'

/**
 * Calculate PCR (Put-Call Ratio)
 * PCR = Put OI / Call OI
 */
function calculatePCR(putOI: number, callOI: number): number {
  if (callOI === 0) return 0
  return Number((putOI / callOI).toFixed(4))
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

  return {
    timestamp: new Date().toISOString(),
    callOI,
    putOI,
    callVolume,
    putVolume,
    pcr,
    oiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff)
  }
}

/**
 * Fetch PCR data for a specific index
 * TODO: Replace with real API integration
 */
export async function fetchPCRData(
  _symbol: IndexSymbol,
  previousData?: PCRData
): Promise<PCRData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // TODO: Replace with actual NSE API call
  // Example: const response = await fetch(`https://www.nseindia.com/api/option-chain-indices?symbol=${_symbol}`)

  return generateMockPCRData(previousData)
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
