import fetch from "node-fetch";

interface AngelLoginResponse {
  data?: {
    jwtToken?: string;
  };
}

interface OptionChainResponse {
  data?: any;
}

export const handler = async (event: any) => {
  try {
    const { symbol } = event.queryStringParameters;

    if (!symbol) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Symbol parameter is required" }),
      };
    }

    // Step 1: Fetch Angel One access token
    const loginResponse = await fetch(
      "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientcode: process.env.ANGEL_CLIENT_CODE,
          password: process.env.ANGEL_PASSWORD,
          totp: process.env.ANGEL_TOTP,
        }),
      }
    );

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData: AngelLoginResponse = await loginResponse.json();
    const jwtToken = loginData?.data?.jwtToken;

    if (!jwtToken) {
      throw new Error("No JWT token received from Angel One");
    }

    // Step 2: Fetch Option Chain data
    const optionChainUrl = `https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/option-chain?symbol=${symbol}`;

    const optionChainResponse = await fetch(optionChainUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!optionChainResponse.ok) {
      throw new Error(`Option chain API error: ${optionChainResponse.status}`);
    }

    const optionChainData: OptionChainResponse =
      await optionChainResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        symbol,
        token: jwtToken,
        optionChain: optionChainData,
      }),
    };
  } catch (err: any) {
    console.error("Error in Angel One function:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message,
      }),
    };
  }
};
