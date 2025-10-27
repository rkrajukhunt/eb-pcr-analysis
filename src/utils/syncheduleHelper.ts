/**
 * Calculate the next synchronized 3-minute interval from market open (9:15 AM)
 * Returns milliseconds until the next interval
 *
 * Intervals: 09:15, 09:18, 09:21, 09:24, ... , 15:27, 15:30
 */
export function calculateNextSyncedInterval(): number {
  const now = new Date()

  // Convert to IST
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))

  const hours = istTime.getHours()
  const minutes = istTime.getMinutes()
  const seconds = istTime.getSeconds()
  const milliseconds = istTime.getMilliseconds()

  // Market open: 9:15 AM (915 minutes from midnight)
  const marketOpenMinutes = 9 * 60 + 15 // 555 minutes
  const marketCloseMinutes = 15 * 60 + 30 // 930 minutes

  const currentMinutes = hours * 60 + minutes

  // If before market open or after market close, return 0 (don't schedule)
  if (currentMinutes < marketOpenMinutes || currentMinutes >= marketCloseMinutes) {
    return 0
  }

  // Calculate minutes elapsed since market open
  const minutesSinceOpen = currentMinutes - marketOpenMinutes

  // Calculate next 3-minute interval
  const intervalsPassed = Math.floor(minutesSinceOpen / 3)
  const nextIntervalMinutes = (intervalsPassed + 1) * 3

  // If next interval would be after market close, return 0
  if (marketOpenMinutes + nextIntervalMinutes >= marketCloseMinutes) {
    return 0
  }

  // Calculate exact time until next interval
  const currentSeconds = currentMinutes * 60 + seconds
  const nextIntervalSeconds = (marketOpenMinutes + nextIntervalMinutes) * 60
  const secondsUntilNext = nextIntervalSeconds - currentSeconds

  // Convert to milliseconds and subtract current milliseconds
  return secondsUntilNext * 1000 - milliseconds
}

/**
 * Check if current time is exactly on a synchronized interval
 */
export function isOnSyncedInterval(): boolean {
  const now = new Date()
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))

  const hours = istTime.getHours()
  const minutes = istTime.getMinutes()
  const seconds = istTime.getSeconds()

  const marketOpenMinutes = 9 * 60 + 15
  const currentMinutes = hours * 60 + minutes

  // Check if we're at :00 seconds of an interval minute
  if (seconds !== 0) {
    return false
  }

  const minutesSinceOpen = currentMinutes - marketOpenMinutes

  // Check if it's a multiple of 3 minutes since open
  return minutesSinceOpen >= 0 && minutesSinceOpen % 3 === 0
}

/**
 * Get all scheduled fetch times for the day
 * Returns array of times in HH:MM format
 */
export function getScheduledFetchTimes(): string[] {
  const times: string[] = []

  // Start at 9:15 AM
  let hour = 9
  let minute = 15

  // Generate times until 3:30 PM
  while (hour < 15 || (hour === 15 && minute <= 30)) {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    times.push(timeStr)

    // Add 3 minutes
    minute += 3
    if (minute >= 60) {
      hour += 1
      minute -= 60
    }
  }

  return times
}

/**
 * Format time without seconds (HH:MM)
 */
export function formatTimeWithoutSeconds(date: Date): string {
  const istTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = istTime.getHours().toString().padStart(2, '0')
  const minutes = istTime.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
