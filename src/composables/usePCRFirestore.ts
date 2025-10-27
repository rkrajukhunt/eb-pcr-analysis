import { ref, onMounted, onUnmounted, computed, type Ref } from 'vue'
import type { IndexData, IndexSymbol } from '../types/market'
import type { MarketStatus } from '../types/marketSchedule'
import { AVAILABLE_INDICES } from '../services/marketData'
import { getMarketStatus } from '../services/marketSchedule'
import {
  subscribeToPCRData,
  getInitialPCRData,
  getLastTradingSessionData,
  subscribeToAllIndices
} from '../services/firestoreService'

const STATUS_CHECK_INTERVAL = 60 * 1000 // Check market status every minute

/**
 * Composable for PCR Analysis with Firestore real-time updates
 * Data is automatically fetched by Firebase Cloud Functions (9:15 AM - 3:30 PM IST)
 * Frontend just subscribes to real-time updates
 */
export function usePCRFirestore() {
  const indices: Ref<Map<IndexSymbol, IndexData>> = ref(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref<Date | null>(null)
  const selectedIndex: Ref<IndexSymbol> = ref('NIFTY')
  const marketStatus: Ref<MarketStatus | null> = ref(null)
  const lastTradingSessionDate: Ref<Date | null> = ref(null)
  const isUsingCachedData = ref(false)
  const isConnectedToFirestore = ref(false)

  let unsubscribeAll: (() => void) | null = null
  let statusCheckIntervalId: number | null = null

  /**
   * Update market status
   */
  const updateMarketStatus = () => {
    marketStatus.value = getMarketStatus()
  }

  /**
   * Initialize data from Firestore
   */
  const initializeData = async () => {
    isLoading.value = true
    error.value = null

    try {
      updateMarketStatus()

      // Load initial data for all indices
      for (const symbol of AVAILABLE_INDICES) {
        const data = await getInitialPCRData(symbol)

        if (data) {
          indices.value.set(symbol, data)

          // If we have data, update last update time
          if (data.latestPCR) {
            lastUpdateTime.value = new Date(data.latestPCR.timestamp)
          }
        } else {
          // If no live data, try to load last trading session
          const lastSession = await getLastTradingSessionData(symbol)
          if (lastSession) {
            const indexData = {
              symbol,
              name: getIndexName(symbol),
              currentExpiry: '',
              nextExpiry: '',
              pcrHistory: [lastSession],
              latestPCR: lastSession
            }
            indices.value.set(symbol, indexData)
            isUsingCachedData.value = true
            lastTradingSessionDate.value = new Date(lastSession.timestamp)
          }
        }
      }

      console.log('✅ Initial data loaded from Firestore')
    } catch (err: any) {
      error.value = err.message || 'Failed to load data from Firestore'
      console.error('Error initializing Firestore data:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Subscribe to real-time updates
   */
  const subscribeToUpdates = () => {
    try {
      unsubscribeAll = subscribeToAllIndices(AVAILABLE_INDICES, (symbol, data) => {
        indices.value.set(symbol, data)

        // Update last update time
        if (data.latestPCR) {
          lastUpdateTime.value = new Date(data.latestPCR.timestamp)
          isUsingCachedData.value = false
        }

        console.log(`📊 Real-time update received for ${symbol}`)
      })

      isConnectedToFirestore.value = true
      console.log('🔄 Subscribed to Firestore real-time updates')
    } catch (err: any) {
      error.value = err.message || 'Failed to subscribe to Firestore updates'
      console.error('Error subscribing to Firestore:', err)
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
   * Manually refresh data (rarely needed with Firestore)
   */
  const refreshData = async () => {
    console.log('🔄 Manual refresh requested')
    await initializeData()
  }

  /**
   * Select an index
   */
  const selectIndex = (symbol: IndexSymbol) => {
    selectedIndex.value = symbol
  }

  /**
   * Get current index data
   */
  const currentIndexData = computed(() => {
    return indices.value.get(selectedIndex.value) || null
  })

  /**
   * Get market status message
   */
  const marketStatusMessage = computed(() => {
    if (!marketStatus.value) return ''

    const status = marketStatus.value.currentStatus
    const messages: Record<string, string> = {
      'open': '🟢 Market is Open',
      'pre-market': '🔵 Pre-Market',
      'post-market': '🟠 Market Closed',
      'closed': '🟠 Market Closed',
      'weekend': '📅 Weekend - Market Closed',
      'holiday': '🎉 Holiday - Market Closed'
    }

    return messages[status] || 'Market Status Unknown'
  })

  /**
   * Get next trading session info
   */
  const nextTradingSession = computed(() => {
    if (!marketStatus.value) return null
    return marketStatus.value.nextTradingSession
  })

  /**
   * Check if market is currently open
   */
  const isMarketOpen = computed(() => {
    return marketStatus.value?.currentStatus === 'open'
  })

  /**
   * Get formatted last trading date
   */
  const formattedLastTradingDate = computed(() => {
    if (!lastTradingSessionDate.value) return null

    return lastTradingSessionDate.value.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })

  /**
   * Setup on component mount
   */
  onMounted(async () => {
    console.log('🚀 Initializing PCR Firestore composable...')

    // Initialize data
    await initializeData()

    // Subscribe to real-time updates
    subscribeToUpdates()

    // Start market status check interval
    statusCheckIntervalId = window.setInterval(() => {
      updateMarketStatus()
    }, STATUS_CHECK_INTERVAL)

    console.log('✅ PCR Firestore composable initialized')
  })

  /**
   * Cleanup on component unmount
   */
  onUnmounted(() => {
    console.log('🛑 Cleaning up PCR Firestore composable...')

    // Unsubscribe from Firestore
    if (unsubscribeAll) {
      unsubscribeAll()
      unsubscribeAll = null
    }

    // Clear status check interval
    if (statusCheckIntervalId !== null) {
      clearInterval(statusCheckIntervalId)
      statusCheckIntervalId = null
    }

    isConnectedToFirestore.value = false
    console.log('✅ PCR Firestore composable cleaned up')
  })

  return {
    // State
    indices,
    selectedIndex,
    currentIndexData,
    isLoading,
    error,
    lastUpdateTime,
    marketStatus,
    marketStatusMessage,
    nextTradingSession,
    isMarketOpen,
    lastTradingSessionDate,
    formattedLastTradingDate,
    isUsingCachedData,
    isConnectedToFirestore,

    // Actions
    selectIndex,
    refreshData,

    // Available indices
    availableIndices: AVAILABLE_INDICES
  }
}
