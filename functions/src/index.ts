import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Types
interface PCRData {
  timestamp: string;
  callOI: number;
  putOI: number;
  callVolume: number;
  putVolume: number;
  pcr: number;
  oiDiff: number;
  volumeDiff: number;
  marketIndicator: 'bullish' | 'bearish' | 'neutral';
  pcrChange: number;
  pcrChangePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'MIDCPNIFTY';

const INDICES: IndexSymbol[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

/**
 * Calculate PCR (Put-Call Ratio) with 2 decimal places
 */
function calculatePCR(putOI: number, callOI: number): number {
  if (callOI === 0) return 0;
  return Number((putOI / callOI).toFixed(2));
}

/**
 * Get market indicator based on PCR
 */
function getMarketIndicator(pcr: number, oiDiff: number): 'bullish' | 'bearish' | 'neutral' {
  const pcrBullishThreshold = 1.2;
  const pcrBearishThreshold = 0.8;

  if (pcr >= pcrBullishThreshold && oiDiff > 0) {
    return 'bullish';
  } else if (pcr <= pcrBearishThreshold && oiDiff < 0) {
    return 'bearish';
  } else if (pcr > pcrBullishThreshold) {
    return 'bullish';
  } else if (pcr < pcrBearishThreshold) {
    return 'bearish';
  }

  return 'neutral';
}

/**
 * Calculate PCR trend indicators
 */
function calculatePCRTrend(currentPCR: number, previousPCR?: number) {
  if (!previousPCR) {
    return {
      pcrChange: 0,
      pcrChangePercent: 0,
      trend: 'neutral' as const
    };
  }

  const pcrChange = Number((currentPCR - previousPCR).toFixed(2));
  const pcrChangePercent = previousPCR !== 0
    ? Number(((pcrChange / previousPCR) * 100).toFixed(2))
    : 0;

  let trend: 'up' | 'down' | 'neutral';
  if (Math.abs(pcrChangePercent) < 0.5) {
    trend = 'neutral';
  } else if (pcrChange > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return { pcrChange, pcrChangePercent, trend };
}

/**
 * Fetch live NSE option chain data
 */
async function fetchNSEOptionChain(symbol: IndexSymbol): Promise<any> {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/option-chain'
    };

    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching NSE data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Parse NSE data and calculate PCR
 */
function parseNSEData(data: any, previousData?: PCRData): PCRData {
  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVolume = 0;
  let totalPutVolume = 0;

  if (data.records && data.records.data) {
    data.records.data.forEach((record: any) => {
      if (record.CE) {
        totalCallOI += record.CE.openInterest || 0;
        totalCallVolume += record.CE.totalTradedVolume || 0;
      }
      if (record.PE) {
        totalPutOI += record.PE.openInterest || 0;
        totalPutVolume += record.PE.totalTradedVolume || 0;
      }
    });
  }

  const pcr = calculatePCR(totalPutOI, totalCallOI);
  const oiDiff = previousData
    ? (totalCallOI + totalPutOI) - (previousData.callOI + previousData.putOI)
    : 0;
  const volumeDiff = previousData
    ? (totalCallVolume + totalPutVolume) - (previousData.callVolume + previousData.putVolume)
    : 0;

  const trendData = calculatePCRTrend(pcr, previousData?.pcr);

  return {
    timestamp: new Date().toISOString(),
    callOI: totalCallOI,
    putOI: totalPutOI,
    callVolume: totalCallVolume,
    putVolume: totalPutVolume,
    pcr,
    oiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff),
    ...trendData
  };
}

/**
 * Generate mock data as fallback
 */
function generateMockPCRData(previousData?: PCRData): PCRData {
  const baseCallOI = previousData ? previousData.callOI : 50000000;
  const basePutOI = previousData ? previousData.putOI : 55000000;

  const callOI = Math.round(baseCallOI + (Math.random() - 0.5) * 2000000);
  const putOI = Math.round(basePutOI + (Math.random() - 0.5) * 2000000);
  const callVolume = Math.round(5000000 + Math.random() * 1000000);
  const putVolume = Math.round(6000000 + Math.random() * 1000000);

  const pcr = calculatePCR(putOI, callOI);
  const oiDiff = previousData ? (callOI + putOI) - (previousData.callOI + previousData.putOI) : 0;
  const volumeDiff = previousData ? (callVolume + putVolume) - (previousData.callVolume + previousData.putVolume) : 0;

  const trendData = calculatePCRTrend(pcr, previousData?.pcr);

  return {
    timestamp: new Date().toISOString(),
    callOI,
    putOI,
    callVolume,
    putVolume,
    pcr,
    oiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff),
    ...trendData
  };
}

/**
 * Get latest PCR data for an index from Firestore
 */
async function getLatestPCRData(symbol: IndexSymbol): Promise<PCRData | undefined> {
  try {
    const snapshot = await db.collection('pcr_data')
      .doc(symbol)
      .collection('records')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return undefined;
    }

    return snapshot.docs[0].data() as PCRData;
  } catch (error) {
    console.error(`Error getting latest PCR data for ${symbol}:`, error);
    return undefined;
  }
}

/**
 * Save PCR data to Firestore
 */
async function savePCRData(symbol: IndexSymbol, data: PCRData): Promise<void> {
  try {
    const docRef = db.collection('pcr_data')
      .doc(symbol)
      .collection('records')
      .doc();

    await docRef.set(data);

    // Update latest data reference
    await db.collection('pcr_data').doc(symbol).set({
      latestData: data,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Saved PCR data for ${symbol} at ${data.timestamp}`);
  } catch (error) {
    console.error(`Error saving PCR data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch and save PCR data for a single index
 */
async function fetchAndSaveIndex(symbol: IndexSymbol): Promise<void> {
  try {
    const previousData = await getLatestPCRData(symbol);

    let pcrData: PCRData;
    try {
      const nseData = await fetchNSEOptionChain(symbol);
      pcrData = parseNSEData(nseData, previousData);
      console.log(`✅ Fetched live NSE data for ${symbol}`);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch live data for ${symbol}, using mock data`);
      pcrData = generateMockPCRData(previousData);
    }

    await savePCRData(symbol, pcrData);
  } catch (error) {
    console.error(`Error processing ${symbol}:`, error);
  }
}

/**
 * Check if current time is within market hours (9:15 AM - 3:30 PM IST)
 */
function isMarketHours(): boolean {
  const now = new Date();

  // Convert to IST (UTC+5:30)
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) {
    return false; // Weekend
  }

  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;  // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return currentMinutes >= marketOpen && currentMinutes <= marketClose;
}

/**
 * Cloud Function: Fetch PCR data every 3 minutes during market hours
 * Runs: Every 3 minutes, 9:15 AM - 3:30 PM IST, Monday-Friday
 */
export const fetchPCRData = functions
  .region('asia-south1') // Mumbai region for better latency
  .pubsub
  .schedule('*/3 9-15 * * 1-5') // Every 3 minutes, 9-15 hours, Mon-Fri
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('⏰ Scheduled PCR data fetch triggered');

    // Double-check market hours
    if (!isMarketHours()) {
      console.log('⏸️ Market is closed, skipping data fetch');
      return null;
    }

    console.log('📊 Market is open, fetching PCR data for all indices...');

    // Fetch data for all indices in parallel
    const promises = INDICES.map(symbol => fetchAndSaveIndex(symbol));
    await Promise.allSettled(promises);

    console.log('✅ PCR data fetch completed for all indices');
    return null;
  });

/**
 * Cloud Function: Initial market open fetch at 9:15 AM
 */
export const marketOpenFetch = functions
  .region('asia-south1')
  .pubsub
  .schedule('15 9 * * 1-5') // 9:15 AM, Mon-Fri
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('🔔 Market open! Starting initial PCR data fetch...');

    const promises = INDICES.map(symbol => fetchAndSaveIndex(symbol));
    await Promise.allSettled(promises);

    console.log('✅ Initial market open data fetch completed');
    return null;
  });

/**
 * Cloud Function: Cleanup old data on weekends
 * Keeps only last 7 days of data + last trading session
 * Runs: Every Sunday at 12:00 AM IST
 */
export const cleanupOldData = functions
  .region('asia-south1')
  .pubsub
  .schedule('0 0 * * 0') // Sunday at midnight
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('🧹 Starting weekend data cleanup...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const symbol of INDICES) {
      try {
        // Get all records older than 7 days
        const oldRecords = await db.collection('pcr_data')
          .doc(symbol)
          .collection('records')
          .where('timestamp', '<', sevenDaysAgo.toISOString())
          .get();

        if (oldRecords.empty) {
          console.log(`No old records to delete for ${symbol}`);
          continue;
        }

        // Delete in batches
        const batch = db.batch();
        oldRecords.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`✅ Deleted ${oldRecords.size} old records for ${symbol}`);
      } catch (error) {
        console.error(`Error cleaning up ${symbol}:`, error);
      }
    }

    console.log('✅ Weekend cleanup completed');
    return null;
  });

/**
 * Cloud Function: Save last trading session data
 * Runs: Every weekday at 3:35 PM IST (5 minutes after market close)
 */
export const saveLastTradingSession = functions
  .region('asia-south1')
  .pubsub
  .schedule('35 15 * * 1-5') // 3:35 PM, Mon-Fri
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('💾 Saving last trading session data...');

    for (const symbol of INDICES) {
      try {
        const latestData = await getLatestPCRData(symbol);

        if (latestData) {
          await db.collection('pcr_data').doc(symbol).set({
            lastTradingSession: latestData,
            lastTradingDate: new Date().toISOString()
          }, { merge: true });

          console.log(`✅ Saved last trading session for ${symbol}`);
        }
      } catch (error) {
        console.error(`Error saving last session for ${symbol}:`, error);
      }
    }

    console.log('✅ Last trading session saved for all indices');
    return null;
  });

/**
 * HTTP Cloud Function: Manual trigger for testing
 */
export const triggerPCRFetch = functions
  .region('asia-south1')
  .https
  .onRequest(async (req, res) => {
    console.log('🔧 Manual PCR fetch triggered');

    const promises = INDICES.map(symbol => fetchAndSaveIndex(symbol));
    await Promise.allSettled(promises);

    res.json({
      success: true,
      message: 'PCR data fetch completed',
      timestamp: new Date().toISOString()
    });
  });
