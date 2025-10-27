import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, getDocs, where } from 'firebase/firestore'
import type { IndexSymbol, PCRData, IndexData } from '../types/market'
import { getExpiryDates } from '../utils/expiryCalculator'

const db = getFirestore()

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
 * Subscribe to real-time PCR data updates for a specific index
 * @param symbol - Index symbol
 * @param callback - Callback function to receive updates
 * @returns Unsubscribe function
 */
export function subscribeToPCRData(
  symbol: IndexSymbol,
  callback: (data: IndexData) => void
): () => void {
  // Subscribe to the latest data document
  const indexDocRef = doc(db, 'pcr_data', symbol)

  const unsubscribeLatest = onSnapshot(indexDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()

      // If we have latest data, fetch historical records
      if (data.latestData) {
        fetchHistoricalRecords(symbol).then(records => {
          const expiry = getExpiryDates()

          const indexData: IndexData = {
            symbol,
            name: getIndexName(symbol),
            spotPrice: data.spotPrice || null,
            currentExpiry: data.currentExpiry || expiry.current,
            nextExpiry: data.nextExpiry || expiry.next,
            pcrHistory: records,
            latestPCR: data.latestData as PCRData
          }

          callback(indexData)
        })
      }
    }
  }, (error) => {
    console.error(`Error subscribing to PCR data for ${symbol}:`, error)
  })

  return unsubscribeLatest
}

/**
 * Fetch historical PCR records (last 50 records)
 */
async function fetchHistoricalRecords(symbol: IndexSymbol): Promise<PCRData[]> {
  try {
    const recordsRef = collection(db, 'pcr_data', symbol, 'records')
    const q = query(recordsRef, orderBy('timestamp', 'desc'), limit(50))

    const snapshot = await getDocs(q)

    const records: PCRData[] = []
    snapshot.forEach(doc => {
      records.push(doc.data() as PCRData)
    })

    // Reverse to get chronological order (oldest first)
    return records.reverse()
  } catch (error) {
    console.error(`Error fetching historical records for ${symbol}:`, error)
    return []
  }
}

/**
 * Get initial PCR data for an index (one-time fetch)
 */
export async function getInitialPCRData(symbol: IndexSymbol): Promise<IndexData | null> {
  try {
    const indexDocRef = doc(db, 'pcr_data', symbol)
    const snapshot = await getDoc(indexDocRef)

    if (!snapshot.exists()) {
      console.log(`No data found for ${symbol}`)
      return null
    }

    const data = snapshot.data()
    const records = await fetchHistoricalRecords(symbol)
    const expiry = getExpiryDates()

    return {
      symbol,
      name: getIndexName(symbol),
      spotPrice: data.spotPrice || null,
      currentExpiry: data.currentExpiry || expiry.current,
      nextExpiry: data.nextExpiry || expiry.next,
      pcrHistory: records,
      latestPCR: data.latestData as PCRData || null
    }
  } catch (error) {
    console.error(`Error getting initial data for ${symbol}:`, error)
    return null
  }
}

/**
 * Get last trading session data for an index
 * Useful when market is closed
 */
export async function getLastTradingSessionData(symbol: IndexSymbol): Promise<PCRData | null> {
  try {
    const indexDocRef = doc(db, 'pcr_data', symbol)
    const snapshot = await getDoc(indexDocRef)

    if (!snapshot.exists()) {
      return null
    }

    const data = snapshot.data()
    return data.lastTradingSession as PCRData || null
  } catch (error) {
    console.error(`Error getting last trading session for ${symbol}:`, error)
    return null
  }
}

/**
 * Get PCR data for a specific date range
 */
export async function getPCRDataByDateRange(
  symbol: IndexSymbol,
  startDate: Date,
  endDate: Date
): Promise<PCRData[]> {
  try {
    const recordsRef = collection(db, 'pcr_data', symbol, 'records')
    const q = query(
      recordsRef,
      where('timestamp', '>=', startDate.toISOString()),
      where('timestamp', '<=', endDate.toISOString()),
      orderBy('timestamp', 'asc')
    )

    const snapshot = await getDocs(q)

    const records: PCRData[] = []
    snapshot.forEach(doc => {
      records.push(doc.data() as PCRData)
    })

    return records
  } catch (error) {
    console.error(`Error getting date range data for ${symbol}:`, error)
    return []
  }
}

/**
 * Subscribe to multiple indices at once
 */
export function subscribeToAllIndices(
  symbols: IndexSymbol[],
  callback: (symbol: IndexSymbol, data: IndexData) => void
): () => void {
  const unsubscribers = symbols.map(symbol =>
    subscribeToPCRData(symbol, (data) => callback(symbol, data))
  )

  // Return a function that unsubscribes from all
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe())
  }
}

/**
 * Check if Firestore has any data (for first-time setup detection)
 */
export async function hasFirestoreData(): Promise<boolean> {
  try {
    const indexDocRef = doc(db, 'pcr_data', 'NIFTY')
    const snapshot = await getDoc(indexDocRef)
    return snapshot.exists()
  } catch (error) {
    console.error('Error checking Firestore data:', error)
    return false
  }
}
