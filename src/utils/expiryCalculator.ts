/**
 * Calculate expiry dates for Indian stock market options
 * Options expire on the last Thursday of each month
 */

/**
 * Get the last Thursday of a given month
 */
function getLastThursday(year: number, month: number): Date {
  // Start from the last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const lastDayOfWeek = lastDay.getDay()

  // Thursday is day 4
  const thursday = 4

  // Calculate days to subtract to get to last Thursday
  let daysToSubtract = lastDayOfWeek - thursday
  if (daysToSubtract < 0) {
    daysToSubtract += 7
  }

  const lastThursday = new Date(year, month, lastDay.getDate() - daysToSubtract)
  return lastThursday
}

/**
 * Get current expiry (this month or next month if current has passed)
 */
export function getCurrentExpiry(): Date {
  const now = new Date()
  const thisMonthExpiry = getLastThursday(now.getFullYear(), now.getMonth())

  // If this month's expiry has passed, return next month's
  if (now > thisMonthExpiry) {
    return getLastThursday(now.getFullYear(), now.getMonth() + 1)
  }

  return thisMonthExpiry
}

/**
 * Get next expiry date
 */
export function getNextExpiry(): Date {
  const currentExpiry = getCurrentExpiry()
  const nextMonth = new Date(currentExpiry)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  return getLastThursday(nextMonth.getFullYear(), nextMonth.getMonth())
}

/**
 * Format date to DD-MMM-YYYY format (e.g., 28-DEC-2023)
 */
export function formatExpiryDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                     'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

/**
 * Get formatted current and next expiry dates
 */
export function getExpiryDates() {
  return {
    current: formatExpiryDate(getCurrentExpiry()),
    next: formatExpiryDate(getNextExpiry())
  }
}
