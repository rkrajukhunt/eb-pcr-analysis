import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const response = await fetch(
      "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientcode: process.env.ANGEL_CLIENT_CODE,
          password: process.env.ANGEL_PASSWORD,
          apikey: process.env.ANGEL_API_KEY,
        }),
      }
    );

    console.log("response from ->", response);

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
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}