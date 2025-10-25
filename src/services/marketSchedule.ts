import type { MarketHoliday, MarketStatus } from '../types/marketSchedule'

/**
 * NSE India Stock Market Holidays 2025
 * Source: https://www.nseindia.com/regulations/trading-holidays
 */
export const MARKET_HOLIDAYS_2025: MarketHoliday[] = [
  { date: '2025-01-26', name: 'Republic Day', type: 'both' },
  { date: '2025-03-14', name: 'Holi', type: 'both' },
  { date: '2025-03-31', name: 'Id-Ul-Fitr (Ramadan Eid)', type: 'both' },
  { date: '2025-04-10', name: 'Mahavir Jayanti', type: 'both' },
  { date: '2025-04-14', name: 'Dr. Baba Saheb Ambedkar Jayanti', type: 'both' },
  { date: '2025-04-18', name: 'Good Friday', type: 'both' },
  { date: '2025-05-01', name: 'Maharashtra Day', type: 'both' },
  { date: '2025-06-07', name: 'Bakri Id', type: 'both' },
  { date: '2025-08-15', name: 'Independence Day', type: 'both' },
  { date: '2025-08-27', name: 'Ganesh Chaturthi', type: 'both' },
  { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti', type: 'both' },
  { date: '2025-10-21', name: 'Dussehra', type: 'both' },
  { date: '2025-11-05', name: 'Diwali-Laxmi Pujan', type: 'both' },
  { date: '2025-11-06', name: 'Diwali-Balipratipada', type: 'both' },
  { date: '2025-11-24', name: 'Gurunanak Jayanti', type: 'both' },
  { date: '2025-12-25', name: 'Christmas', type: 'both' }
]

/**
 * NSE India Stock Market Holidays 2024
 */
export const MARKET_HOLIDAYS_2024: MarketHoliday[] = [
  { date: '2024-01-26', name: 'Republic Day', type: 'both' },
  { date: '2024-03-08', name: 'Maha Shivratri', type: 'both' },
  { date: '2024-03-25', name: 'Holi', type: 'both' },
  { date: '2024-03-29', name: 'Good Friday', type: 'both' },
  { date: '2024-04-11', name: 'Id-Ul-Fitr', type: 'both' },
  { date: '2024-04-17', name: 'Ram Navami', type: 'both' },
  { date: '2024-04-21', name: 'Mahavir Jayanti', type: 'both' },
  { date: '2024-05-01', name: 'Maharashtra Day', type: 'both' },
  { date: '2024-06-17', name: 'Bakri Id', type: 'both' },
  { date: '2024-07-17', name: 'Moharram', type: 'both' },
  { date: '2024-08-15', name: 'Independence Day', type: 'both' },
  { date: '2024-10-02', name: 'Mahatma Gandhi Jayanti', type: 'both' },
  { date: '2024-11-01', name: 'Diwali-Laxmi Pujan', type: 'both' },
  { date: '2024-11-15', name: 'Gurunanak Jayanti', type: 'both' },
  { date: '2024-12-25', name: 'Christmas', type: 'both' }
]

// Combine holidays from multiple years
const ALL_HOLIDAYS = [...MARKET_HOLIDAYS_2024, ...MARKET_HOLIDAYS_2025]

// Market trading hours (IST)
const MARKET_OPEN_HOUR = 9
const MARKET_OPEN_MINUTE = 15
const MARKET_CLOSE_HOUR = 15
const MARKET_CLOSE_MINUTE = 30

/**
 * Check if a given date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

/**
 * Check if a given date is a market holiday
 */
function isMarketHoliday(date: Date): MarketHoliday | null {
  const dateStr = formatDateToYYYYMMDD(date)
  return ALL_HOLIDAYS.find(h => h.date === dateStr) || null
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if current time is within market trading hours
 */
function isMarketHours(date: Date): boolean {
  const hours = date.getHours()
  const minutes = date.getMinutes()

  const currentMinutes = hours * 60 + minutes
  const openMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE
  const closeMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

/**
 * Get next trading day
 */
function getNextTradingDay(fromDate: Date): Date {
  const nextDay = new Date(fromDate)
  nextDay.setDate(nextDay.getDate() + 1)
  nextDay.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0)

  // Keep searching until we find a trading day
  let attempts = 0
  while (attempts < 30) { // Max 30 days ahead
    if (!isWeekend(nextDay) && !isMarketHoliday(nextDay)) {
      return nextDay
    }
    nextDay.setDate(nextDay.getDate() + 1)
    attempts++
  }

  return nextDay
}

/**
 * Get last trading day
 */
function getLastTradingDay(fromDate: Date): Date {
  const previousDay = new Date(fromDate)
  previousDay.setDate(previousDay.getDate() - 1)
  previousDay.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0)

  // Keep searching until we find a trading day
  let attempts = 0
  while (attempts < 30) { // Max 30 days back
    if (!isWeekend(previousDay) && !isMarketHoliday(previousDay)) {
      return previousDay
    }
    previousDay.setDate(previousDay.getDate() - 1)
    attempts++
  }

  return previousDay
}

/**
 * Get current market status
 */
export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const isHoliday = isMarketHoliday(now)
  const isWeekendDay = isWeekend(now)
  const inMarketHours = isMarketHours(now)
  const isTradingDay = !isWeekendDay && !isHoliday

  let currentStatus: MarketStatus['currentStatus']
  let isOpen = false

  if (isHoliday) {
    currentStatus = isHoliday.type === 'bank' ? 'bank-holiday' : 'holiday'
  } else if (isWeekendDay) {
    currentStatus = 'weekend'
  } else if (isTradingDay) {
    if (inMarketHours) {
      currentStatus = 'trading'
      isOpen = true
    } else {
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const currentMinutes = hours * 60 + minutes
      const openMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE

      currentStatus = currentMinutes < openMinutes ? 'pre-market' : 'post-market'
    }
  } else {
    currentStatus = 'holiday'
  }

  const nextTradingSession = isTradingDay && !inMarketHours
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0)
    : getNextTradingDay(now)

  const lastTradingSession = getLastTradingDay(now)

  return {
    isOpen,
    isMarketHours: inMarketHours,
    isTradingDay,
    nextTradingSession,
    lastTradingSession,
    currentStatus,
    holidayInfo: isHoliday || undefined
  }
}

/**
 * Get market status message for display
 */
export function getMarketStatusMessage(status: MarketStatus): string {
  switch (status.currentStatus) {
    case 'trading':
      return 'Market is open - Live data updates every 3 minutes'
    case 'pre-market':
      return `Market opens at ${MARKET_OPEN_HOUR}:${String(MARKET_OPEN_MINUTE).padStart(2, '0')} IST`
    case 'post-market':
      return 'Market is closed - Showing last trading session data'
    case 'weekend':
      return 'Market closed (Weekend) - Showing last trading session data'
    case 'holiday':
      return status.holidayInfo
        ? `Market Holiday: ${status.holidayInfo.name} - Showing last trading session data`
        : 'Market closed (Holiday) - Showing last trading session data'
    case 'bank-holiday':
      return status.holidayInfo
        ? `Bank Holiday: ${status.holidayInfo.name} - Showing last trading session data`
        : 'Bank Holiday - Showing last trading session data'
    default:
      return 'Market status unknown'
  }
}

/**
 * Format trading session date for display
 */
export function formatTradingSessionDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  }
  return date.toLocaleString('en-IN', options)
}

/**
 * Check if we should fetch live data
 */
export function shouldFetchLiveData(status: MarketStatus): boolean {
  return status.isOpen && status.isMarketHours && status.isTradingDay
}
