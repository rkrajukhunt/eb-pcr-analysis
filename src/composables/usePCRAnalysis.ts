import { ref, onMounted, onUnmounted, computed, type Ref } from 'vue'
import type { IndexData, IndexSymbol } from '../types/market'
import type { MarketStatus } from '../types/marketSchedule'
import { initializeIndexData, fetchPCRData, updateIndexData, AVAILABLE_INDICES } from '../services/marketData'
import { getMarketStatus, shouldFetchLiveData, getMarketStatusMessage, formatTradingSessionDate } from '../services/marketSchedule'
import { saveLastTradingSession, loadLastTradingSession, saveIndicesData, loadIndicesData, isRecentSessionData } from '../services/storageService'

const UPDATE_INTERVAL = 3 * 60 * 1000 // 3 minutes in milliseconds
const STATUS_CHECK_INTERVAL = 60 * 1000 // Check market status every minute

/**
 * Composable for PCR Analysis with background updates
 */
export function usePCRAnalysis() {
  const indices: Ref<Map<IndexSymbol, IndexData>> = ref(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref<Date | null>(null)
  const selectedIndex: Ref<IndexSymbol> = ref('NIFTY')
  const marketStatus: Ref<MarketStatus | null> = ref(null)
  const lastTradingSessionDate: Ref<Date | null> = ref(null)
  const isUsingCachedData = ref(false)

  let intervalId: number | null = null
  let statusCheckIntervalId: number | null = null

  /**
   * Update market status
   */
  const updateMarketStatus = () => {
    marketStatus.value = getMarketStatus()

    // If market just closed, save current data as last trading session
    if (marketStatus.value.currentStatus === 'post-market' && lastUpdateTime.value) {
      const now = new Date()
      const lastUpdate = lastUpdateTime.value
      const timeDiff = now.getTime() - lastUpdate.getTime()

      // If last update was within 30 minutes, save it as last session
      if (timeDiff < 30 * 60 * 1000) {
        saveLastTradingSession(lastUpdate, indices.value)
        lastTradingSessionDate.value = lastUpdate
      }
    }
  }

  /**
   * Fetch and update PCR data for all indices
   */
  const updatePCRData = async (forceUpdate = false) => {
    // Check if we should fetch live data
    updateMarketStatus()

    if (!forceUpdate && marketStatus.value && !shouldFetchLiveData(marketStatus.value)) {
      console.log('Market is closed. Skipping live data fetch.')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const updates = AVAILABLE_INDICES.map(async (symbol) => {
        const currentData = indices.value.get(symbol)
        const previousPCR = currentData?.latestPCR || undefined

        const newPCRData = await fetchPCRData(symbol, previousPCR)

        if (currentData) {
          const updatedData = updateIndexData(currentData, newPCRData)
          indices.value.set(symbol, updatedData)
        }
      })

      await Promise.all(updates)
      lastUpdateTime.value = new Date()
      isUsingCachedData.value = false

      // Save to localStorage
      saveIndicesData(indices.value)

      // If market is open, save as last trading session
      if (marketStatus.value?.isOpen) {
        saveLastTradingSession(lastUpdateTime.value, indices.value)
        lastTradingSessionDate.value = lastUpdateTime.value
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch PCR data'
      console.error('Error updating PCR data:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load cached data from localStorage
   */
  const loadCachedData = () => {
    const lastSession = loadLastTradingSession()

    if (lastSession && isRecentSessionData(lastSession.date)) {
      indices.value = lastSession.indices
      lastUpdateTime.value = lastSession.timestamp
      lastTradingSessionDate.value = lastSession.date
      isUsingCachedData.value = true
      console.log('Loaded last trading session data from:', formatTradingSessionDate(lastSession.date))
      return true
    }

    // Try loading any stored data
    const storedData = loadIndicesData()
    if (storedData) {
      indices.value = storedData
      isUsingCachedData.value = true
      return true
    }

    return false
  }

  /**
   * Initialize PCR analysis
   */
  const initialize = async () => {
    // Update market status first
    updateMarketStatus()

    // Initialize data structures for all indices
    AVAILABLE_INDICES.forEach((symbol) => {
      indices.value.set(symbol, initializeIndexData(symbol))
    })

    // Try to load cached data first
    const hasCachedData = loadCachedData()

    // If market is open, fetch fresh data regardless of cache
    if (marketStatus.value && shouldFetchLiveData(marketStatus.value)) {
      await updatePCRData()
    } else if (!hasCachedData) {
      // No cached data and market closed - show message
      error.value = 'No previous trading data available. PCR calculation will start on next trading session.'
    }

    // Start background updates and status checks
    startBackgroundUpdates()
    startStatusChecks()
  }

  /**
   * Start background updates
   */
  const startBackgroundUpdates = () => {
    if (intervalId) return

    intervalId = window.setInterval(() => {
      updatePCRData()
    }, UPDATE_INTERVAL)
  }

  /**
   * Start market status checks
   */
  const startStatusChecks = () => {
    if (statusCheckIntervalId) return

    statusCheckIntervalId = window.setInterval(() => {
      const previousStatus = marketStatus.value?.currentStatus
      updateMarketStatus()

      // If market just opened, fetch data immediately
      if (previousStatus !== 'trading' && marketStatus.value?.currentStatus === 'trading') {
        console.log('Market just opened. Fetching fresh data...')
        updatePCRData()
      }
    }, STATUS_CHECK_INTERVAL)
  }

  /**
   * Stop background updates
   */
  const stopBackgroundUpdates = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (statusCheckIntervalId) {
      clearInterval(statusCheckIntervalId)
      statusCheckIntervalId = null
    }
  }

  /**
   * Get data for a specific index
   */
  const getIndexData = (symbol: IndexSymbol): IndexData | undefined => {
    return indices.value.get(symbol)
  }

  /**
   * Get data for the currently selected index
   */
  const getCurrentIndexData = (): IndexData | undefined => {
    return indices.value.get(selectedIndex.value)
  }

  /**
   * Change selected index
   */
  const selectIndex = (symbol: IndexSymbol) => {
    selectedIndex.value = symbol
  }

  /**
   * Manual refresh
   */
  const refresh = async () => {
    await updatePCRData(true) // Force update even if market is closed
  }

  // Computed properties
  const marketStatusMessage = computed(() => {
    return marketStatus.value ? getMarketStatusMessage(marketStatus.value) : ''
  })

  const nextTradingSession = computed(() => {
    return marketStatus.value?.nextTradingSession || null
  })

  const formattedLastSessionDate = computed(() => {
    if (lastTradingSessionDate.value) {
      return formatTradingSessionDate(lastTradingSessionDate.value)
    }
    return null
  })

  // Lifecycle hooks
  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    stopBackgroundUpdates()
  })

  return {
    indices,
    isLoading,
    error,
    lastUpdateTime,
    selectedIndex,
    marketStatus,
    marketStatusMessage,
    nextTradingSession,
    lastTradingSessionDate,
    formattedLastSessionDate,
    isUsingCachedData,
    getIndexData,
    getCurrentIndexData,
    selectIndex,
    refresh,
    availableIndices: AVAILABLE_INDICES
  }
}
