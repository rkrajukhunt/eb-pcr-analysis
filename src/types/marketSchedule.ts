export interface MarketHoliday {
  date: string // YYYY-MM-DD format
  name: string
  type: 'market' | 'bank' | 'both'
}

export interface TradingSession {
  date: string
  startTime: string
  endTime: string
}

export interface MarketStatus {
  isOpen: boolean
  isMarketHours: boolean
  isTradingDay: boolean
  nextTradingSession: Date | null
  lastTradingSession: Date | null
  currentStatus: 'trading' | 'pre-market' | 'post-market' | 'weekend' | 'holiday' | 'bank-holiday'
  holidayInfo?: MarketHoliday
}

export interface LastSessionData {
  date: string
  timestamp: string
  indexSymbol: string
  pcrData: any // We'll store the PCR data
}
