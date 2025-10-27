export interface PCRData {
  timestamp: string
  callOI: number
  putOI: number
  callVolume: number
  putVolume: number
  pcr: number
  oiDiff: number
  volumeDiff: number
  marketIndicator: 'bullish' | 'bearish' | 'neutral'
  pcrChange: number // Absolute change from previous reading
  pcrChangePercent: number // Percentage change from previous reading
  trend: 'up' | 'down' | 'neutral' // Trend direction
}

export interface IndexData {
  symbol: string
  name: string
  spotPrice: number | null
  currentExpiry: string
  nextExpiry: string
  pcrHistory: PCRData[]
  latestPCR: PCRData | null
}

export type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'MIDCPNIFTY'

export interface MarketIndicatorConfig {
  pcrBullishThreshold: number  // PCR > this = bullish (more puts)
  pcrBearishThreshold: number  // PCR < this = bearish (more calls)
  oiDiffThreshold: number      // Significant OI change threshold
}

export const DEFAULT_INDICATOR_CONFIG: MarketIndicatorConfig = {
  pcrBullishThreshold: 1.2,
  pcrBearishThreshold: 0.8,
  oiDiffThreshold: 5000
}
