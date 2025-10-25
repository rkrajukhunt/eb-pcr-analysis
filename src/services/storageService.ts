import type { IndexData, IndexSymbol } from '../types/market'

const STORAGE_KEY_PREFIX = 'eb_pcr_'
const LAST_SESSION_KEY = 'last_trading_session'
const INDEX_DATA_KEY = 'index_data'

/**
 * Save last trading session data to localStorage
 */
export function saveLastTradingSession(date: Date, indicesData: Map<IndexSymbol, IndexData>): void {
  try {
    const sessionData = {
      date: date.toISOString(),
      timestamp: new Date().toISOString(),
      indices: Object.fromEntries(indicesData)
    }

    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${LAST_SESSION_KEY}`,
      JSON.stringify(sessionData)
    )
  } catch (error) {
    console.error('Failed to save last trading session:', error)
  }
}

/**
 * Load last trading session data from localStorage
 */
export function loadLastTradingSession(): {
  date: Date
  timestamp: Date
  indices: Map<IndexSymbol, IndexData>
} | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${LAST_SESSION_KEY}`)
    if (!stored) return null

    const sessionData = JSON.parse(stored)
    return {
      date: new Date(sessionData.date),
      timestamp: new Date(sessionData.timestamp),
      indices: new Map(Object.entries(sessionData.indices)) as Map<IndexSymbol, IndexData>
    }
  } catch (error) {
    console.error('Failed to load last trading session:', error)
    return null
  }
}

/**
 * Save current indices data to localStorage
 */
export function saveIndicesData(indicesData: Map<IndexSymbol, IndexData>): void {
  try {
    const data = Object.fromEntries(indicesData)
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${INDEX_DATA_KEY}`,
      JSON.stringify(data)
    )
  } catch (error) {
    console.error('Failed to save indices data:', error)
  }
}

/**
 * Load indices data from localStorage
 */
export function loadIndicesData(): Map<IndexSymbol, IndexData> | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${INDEX_DATA_KEY}`)
    if (!stored) return null

    const data = JSON.parse(stored)
    return new Map(Object.entries(data)) as Map<IndexSymbol, IndexData>
  } catch (error) {
    console.error('Failed to load indices data:', error)
    return null
  }
}

/**
 * Clear all stored data
 */
export function clearStoredData(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Failed to clear stored data:', error)
  }
}

/**
 * Check if stored data is from a recent session (within last 7 days)
 */
export function isRecentSessionData(date: Date): boolean {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}
