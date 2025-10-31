import type { PCRData, IndexSymbol, IndexData } from "../types/market";
import { DEFAULT_INDICATOR_CONFIG } from "../types/market";
import { getExpiryDates } from "../utils/expiryCalculator";

/**
 * Calculate PCR (Put-Call Ratio)
 * PCR = Put OI / Call OI
 * Returns value with 2 decimal places
 */
function calculatePCR(putOI: number, callOI: number): number {
  if (callOI === 0) return 0;
  return Number((putOI / callOI)?.toFixed(2));
}

/**
 * Determine market indicator based on PCR and OI changes
 */
function getMarketIndicator(
  pcr: number,
  oiDiff: number
): "bullish" | "bearish" | "neutral" {
  const { pcrBullishThreshold, pcrBearishThreshold } = DEFAULT_INDICATOR_CONFIG;

  if (pcr >= pcrBullishThreshold && oiDiff > 0) {
    return "bullish";
  } else if (pcr <= pcrBearishThreshold && oiDiff < 0) {
    return "bearish";
  } else if (pcr > pcrBullishThreshold) {
    return "bullish";
  } else if (pcr < pcrBearishThreshold) {
    return "bearish";
  }

  return "neutral";
}

/**
 * Calculate PCR trend indicators
 * Returns values with 2 decimal places for better readability
 */
function calculatePCRTrend(currentPCR: number, previousPCR?: number) {
  if (!previousPCR) {
    return {
      pcrChange: 0,
      pcrChangePercent: 0,
      trend: "neutral" as const,
    };
  }

  const pcrChange = Number((currentPCR - previousPCR).toFixed(2));
  const pcrChangePercent =
    previousPCR !== 0
      ? Number(((pcrChange / previousPCR) * 100)?.toFixed(2))
      : 0;

  let trend: "up" | "down" | "neutral";
  if (Math.abs(pcrChangePercent) < 0.5) {
    trend = "neutral";
  } else if (pcrChange > 0) {
    trend = "up";
  } else {
    trend = "down";
  }

  return { pcrChange, pcrChangePercent, trend };
}

/**
 * Generate mock PCR data for development
 * DEPRECATED: No longer used in production - we don't use dummy data on API failure
 * Exported for potential future use in testing/development
 */
export function generateMockPCRData(previousData?: PCRData): PCRData {
  const baseCallOI = previousData ? previousData.callOI : 50000000;
  const basePutOI = previousData ? previousData.putOI : 55000000;

  // Add some random variation
  const callOI = Math.round(baseCallOI + (Math.random() - 0.5) * 2000000);
  const putOI = Math.round(basePutOI + (Math.random() - 0.5) * 2000000);
  const callVolume = Math.round(5000000 + Math.random() * 1000000);
  const putVolume = Math.round(6000000 + Math.random() * 1000000);

  const pcr = calculatePCR(putOI, callOI);
  const oiDiff = previousData
    ? callOI + putOI - (previousData.callOI + previousData.putOI)
    : 0;
  const volumeDiff = previousData
    ? callVolume +
      putVolume -
      (previousData.callVolume + previousData.putVolume)
    : 0;

  // Calculate trend indicators
  const trendData = calculatePCRTrend(pcr, previousData?.pcr);

  const totalOiDiff =
    callOI +
    putOI -
    (((previousData?.callOI ?? 0) as number) +
      ((previousData?.putOI ?? 0) as number));

  return {
    timestamp: new Date().toISOString(),
    callOI,
    putOI,
    callPutTotalOI: Math.round(callOI + putOI),
    callVolume,
    putVolume,
    pcr,
    oiDiff,
    totalOiDiff,
    volumeDiff,
    marketIndicator: getMarketIndicator(pcr, oiDiff),
    ...trendData,
  };
}

// export async function getAngelAccessToken(): Promise<string> {
//   /**
//    * ⚙️ How this works:
//    *
//    * - For local development:
//    *     1. Run Netlify locally:
//    *          netlify dev --port=9999
//    *     2. Set in your `.env.local`:
//    *          VITE_NETLIFY_BASE_URL=http://localhost:9999
//    *
//    * - For production (deployed on Netlify):
//    *     No config needed — use relative path:
//    *          /.netlify/functions/getAccessToken
//    */

//   const baseUrl = import.meta.env.VITE_NETLIFY_BASE_URL || "";
//   const endpoint = `${baseUrl}/.netlify/functions/getAccessToken`;

//   const response = await fetch(endpoint);
//   const data = await response.json();

//   if (!data.success) {
//     throw new Error(data.message || "Failed to get Angel One token");
//   }

//   return data.token;
// }

// export async function getAngelAccessToken(): Promise<string> {
//   const response = await fetch(
//     "http://localhost:9999/.netlify/functions/getAccessToken"
//   );
//   const data = await response.json();

//   if (!data.success) {
//     throw new Error(data.message || "Failed to get Angel One token");
//   }

//   return data.token;
// }

// /**
//  * Fetch live option chain data from NSE India
//  */
// async function fetchNSEOptionChain(symbol: IndexSymbol): Promise<any> {
//   try {
//     const url = `https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/option-chain?symbol=${symbol}`;
//     const token = await getAngelAccessToken();

//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Option chain fetch failed: ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Error fetching Angel Option Chain:", error);
//     throw error;
//   }
// }

/**
 * Fetch live option chain data from NSE India
 */
async function fetchNSEOptionChain(symbol: IndexSymbol): Promise<any> {
  try {
    const url = `/.netlify/functions/angel-option-chain?symbol=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.optionChain;
  } catch (error) {
    console.error("Error fetching Angel Option Chain:", error);
    throw error;
  }
}

/**
 * Parse NSE option chain data to calculate PCR
 * Returns PCR data along with expiry dates and spot price from API
 */
function parseNSEData(
  data: any,
  previousData?: PCRData
): {
  pcrData: PCRData;
  spotPrice: number | null;
  currentExpiry: string | null;
  nextExpiry: string | null;
} {
  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVolume = 0;
  let totalPutVolume = 0;

  // Extract metadata from API response
  const spotPrice = data.records?.underlyingValue || null;
  const expiryDates = data.records?.expiryDates || [];
  const currentExpiry = expiryDates[0] || null;
  const nextExpiry = expiryDates[1] || null;

  // NSE data structure: data.records.data contains array of option chain data
  if (data.filtered && data.filtered.data) {
    totalCallOI = data.filtered.CE.totOI || 0;
    totalPutOI = data.filtered.PE.totOI || 0;
    totalCallVolume = data.filtered.CE.totVol || 0;
    totalPutVolume = data.filtered.PE.totVol || 0;
  }

  const pcr = calculatePCR(totalPutOI, totalCallOI);
  const oiDiff = previousData
    ? totalCallOI + totalPutOI - (previousData.callOI + previousData.putOI)
    : 0;

  const callPutTotal = totalCallOI + totalPutOI;

  const callPutTotalOIDiff = previousData
    ? callPutTotal - previousData.callPutTotalOI
    : 0;
  const volumeDiff = previousData
    ? totalCallVolume +
      totalPutVolume -
      (previousData.callVolume + previousData.putVolume)
    : 0;

  // Calculate trend indicators
  const trendData = calculatePCRTrend(pcr, previousData?.pcr);

  return {
    pcrData: {
      timestamp: new Date().toISOString(),
      callOI: Math.round(totalCallOI),
      putOI: Math.round(totalPutOI),
      callPutTotalOI: Math.round(callPutTotal),
      totalOiDiff: Math.round(callPutTotalOIDiff),
      callVolume: Math.round(totalCallVolume),
      putVolume: Math.round(totalPutVolume),
      pcr,
      oiDiff: Math.round(oiDiff),
      volumeDiff: Math.round(volumeDiff),
      marketIndicator: getMarketIndicator(pcr, oiDiff),
      ...trendData,
    },
    spotPrice,
    currentExpiry,
    nextExpiry,
  };
}

/**
 * Fetch PCR data for a specific index
 * Throws error if API fails - no dummy data fallback
 * Returns PCR data along with expiry dates and spot price from API
 */
export async function fetchPCRData(
  symbol: IndexSymbol,
  previousData?: PCRData
): Promise<{
  pcrData: PCRData;
  spotPrice: number | null;
  currentExpiry: string | null;
  nextExpiry: string | null;
}> {
  try {
    // Try to fetch live data from NSE
    const nseData = await fetchNSEOptionChain(symbol);
    return parseNSEData(nseData, previousData);
  } catch (error) {
    // Log the error with details
    console.error(`❌ Failed to fetch PCR data for ${symbol}:`, {
      symbol,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      previousDataExists: !!previousData,
    });

    // Re-throw the error - do not use dummy data
    throw new Error(
      `Failed to fetch PCR data for ${symbol}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get index name from symbol
 */
function getIndexName(symbol: IndexSymbol): string {
  const names: Record<IndexSymbol, string> = {
    NIFTY: "Nifty 50",
    BANKNIFTY: "Bank Nifty",
    FINNIFTY: "Fin Nifty",
    MIDCPNIFTY: "Midcap Nifty",
  };
  return names[symbol];
}

/**
 * Initialize index data
 */
export function initializeIndexData(symbol: IndexSymbol): IndexData {
  const expiry = getExpiryDates();

  return {
    symbol,
    name: getIndexName(symbol),
    spotPrice: null,
    currentExpiry: expiry.current,
    nextExpiry: expiry.next,
    pcrHistory: [],
    latestPCR: null,
  };
}

/**
 * Update index data with new PCR data, expiry dates, and spot price
 */
export function updateIndexData(
  indexData: IndexData,
  newPCRData: PCRData,
  spotPrice?: number | null,
  currentExpiry?: string | null,
  nextExpiry?: string | null
): IndexData {
  const updatedHistory = [...indexData.pcrHistory, newPCRData];

  // Keep only last 50 records to prevent memory issues
  if (updatedHistory.length > 50) {
    updatedHistory.shift();
  }

  return {
    ...indexData,
    spotPrice: spotPrice !== undefined ? spotPrice : indexData.spotPrice,
    currentExpiry: currentExpiry || indexData.currentExpiry,
    nextExpiry: nextExpiry || indexData.nextExpiry,
    pcrHistory: updatedHistory,
    latestPCR: newPCRData,
  };
}

/**
 * Available indices for analysis
 */
export const AVAILABLE_INDICES: IndexSymbol[] = [
  "NIFTY",
  "BANKNIFTY",
  // "FINNIFTY",
  // "MIDCPNIFTY",
];
