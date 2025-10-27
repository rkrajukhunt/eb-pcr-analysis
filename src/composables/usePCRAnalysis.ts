import { ref, onMounted, onUnmounted, computed, type Ref } from 'vue'
import type { IndexData, IndexSymbol } from '../types/market'
import type { MarketStatus } from '../types/marketSchedule'
import { initializeIndexData, fetchPCRData, updateIndexData, AVAILABLE_INDICES } from '../services/marketData'
import { getMarketStatus, shouldFetchLiveData, getMarketStatusMessage, formatTradingSessionDate } from '../services/marketSchedule'
import { saveLastTradingSession, loadLastTradingSession, saveIndicesData, loadIndicesData, isRecentSessionData } from '../services/storageService'
import { calculateNextSyncedInterval } from '../utils/syncheduleHelper'

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
   * Handles errors gracefully - failed fetches don't add rows
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

    let successCount = 0
    let failureCount = 0
    const failedIndices: string[] = []

    try {
      // Fetch data for each index independently
      const updates = AVAILABLE_INDICES.map(async (symbol) => {
        try {
          const currentData = indices.value.get(symbol)
          const previousPCR = currentData?.latestPCR || undefined

          // Attempt to fetch PCR data
          const newPCRData = await fetchPCRData(symbol, previousPCR)

          // Only update if fetch succeeded
          if (currentData) {
            const updatedData = updateIndexData(currentData, newPCRData)
            indices.value.set(symbol, updatedData)
            successCount++
            console.log(`✅ Successfully fetched data for ${symbol}`)
          }
        } catch (err) {
          // Log the error but don't break the flow
          failureCount++
          failedIndices.push(symbol)
          console.error(`❌ Failed to fetch ${symbol}, skipping this update`, {
            symbol,
            error: err instanceof Error ? err.message : String(err),
            timestamp: new Date().toISOString()
          })
          // Continue with other indices - don't throw
        }
      })

      // Wait for all fetches to complete (both successful and failed)
      await Promise.allSettled(updates)

      // Update timestamp only if at least one fetch succeeded
      if (successCount > 0) {
        lastUpdateTime.value = new Date()
        isUsingCachedData.value = false

        // Save to localStorage
        saveIndicesData(indices.value)

        // If market is open, save as last trading session
        if (marketStatus.value?.isOpen) {
          saveLastTradingSession(lastUpdateTime.value, indices.value)
          lastTradingSessionDate.value = lastUpdateTime.value
        }

        console.log(`📊 Update completed: ${successCount} succeeded, ${failureCount} failed`)
      } else {
        // All fetches failed
        error.value = `Failed to fetch data for all indices. Please check your internet connection.`
        console.error('❌ All API calls failed. No data updated.')
      }

      // Set error message if some failed
      if (failureCount > 0 && successCount > 0) {
        error.value = `Partial update: Failed to fetch data for ${failedIndices.join(', ')}`
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch PCR data'
      console.error('❌ Error updating PCR data:', err)
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
   * Schedule next synchronized update
   * Updates happen at synchronized intervals: 09:15, 09:18, 09:21, etc.
   */
  const scheduleNextUpdate = () => {
    // Clear any existing timeout
    if (intervalId) {
      clearTimeout(intervalId)
      intervalId = null
    }

    // Calculate milliseconds until next synced interval
    const msUntilNext = calculateNextSyncedInterval()

    if (msUntilNext === 0) {
      console.log('Market closed or after hours. No update scheduled.')
      return
    }

    const nextUpdateTime = new Date(Date.now() + msUntilNext)
    console.log(`Next update scheduled at: ${nextUpdateTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })} IST (in ${Math.round(msUntilNext / 1000)} seconds)`)

    // Schedule the update
    intervalId = window.setTimeout(async () => {
      await updatePCRData()
      // Schedule the next one after this completes
      scheduleNextUpdate()
    }, msUntilNext)
  }

  /**
   * Start background updates
   */
  const startBackgroundUpdates = () => {
    scheduleNextUpdate()
  }

  /**
   * Start market status checks
   */
  const startStatusChecks = () => {
    if (statusCheckIntervalId) return

    statusCheckIntervalId = window.setInterval(() => {
      const previousStatus = marketStatus.value?.currentStatus
      updateMarketStatus()

      // If market just opened, fetch data immediately and reschedule
      if (previousStatus !== 'trading' && marketStatus.value?.currentStatus === 'trading') {
        console.log('Market just opened. Fetching fresh data...')
        updatePCRData()
        scheduleNextUpdate() // Reschedule for synchronized intervals
      }
    }, STATUS_CHECK_INTERVAL)
  }

  /**
   * Stop background updates
   */
  const stopBackgroundUpdates = () => {
    if (intervalId) {
      clearTimeout(intervalId) // Changed from clearInterval to clearTimeout
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

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
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
    clearError,
    availableIndices: AVAILABLE_INDICES
  }
}
