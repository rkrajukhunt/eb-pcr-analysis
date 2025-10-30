import axios from "axios";
import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  try {
    const response = await axios.post(
      "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        clientcode: process.env.ANGEL_CLIENT_CODE,
        password: process.env.ANGEL_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-PrivateKey": process.env.ANGEL_API_KEY,
          Accept: "application/json",
        },
      }
    );

    const token = response.data?.data?.jwtToken;
    if (!token) throw new Error("No token returned from Angel API");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({ token }),
    };
  } catch (err: any) {
    console.error("Token fetch error:", err.message);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: err.response?.data || err.message || "Unknown error",
      }),
    };
  }
};
