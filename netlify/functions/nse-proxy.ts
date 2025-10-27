import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const symbol = event.queryStringParameters?.symbol || "NIFTY";

  try {
    // Step 1: Get cookies first
    const cookieResponse = await fetch("https://www.nseindia.com", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const cookies = cookieResponse.headers.get("set-cookie");

    // Step 2: Fetch actual data
    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.nseindia.com/option-chain",
        Cookie: cookies || "",
      },
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      // NSE returned HTML (bot protection)
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "NSE blocked the request. Try again later.",
          htmlSnippet: text.slice(0, 100),
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
