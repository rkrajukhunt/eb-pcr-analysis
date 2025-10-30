import axios from "axios";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
// import { authenticator } from "otplib";

// Base URL for Angel API
// const ANGEL_BASE_URL = "https://apiconnect.angelbroking.com";

// Config stored securely (but NOT the rotating TOTP)
const ANGEL_API_KEY = "YT37cNi5";
const ANGEL_CLIENT_CODE = "N57703821";
const ANGEL_PASSWORD = "2580";

// Permanent TOTP secret from your Angel One account
// const ANGEL_TOTP_SECRET = "U74O5VOIGPHX7Y5V27UUU3EMMA"; // base32 secret key


export const getAngelToken = onCall(async (request) => {
  try {
    logger.info("Generating Angel Broking token...");

        // // 🔹 1. Generate dynamic TOTP using secret
        // const currentTotp = authenticator.generate(ANGEL_TOTP_SECRET);

    const response = await axios.post(
      "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        clientcode: process.env.ANGEL_CLIENT_CODE ?? ANGEL_CLIENT_CODE,
        password: process.env.ANGEL_PASSWORD ?? ANGEL_PASSWORD,
        // totp: currentTotp,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-PrivateKey": process.env.ANGEL_API_KEY ?? ANGEL_API_KEY,
          Accept: "application/json",
        },
      }
    );

    const token = response.data?.data?.jwtToken;
    if (!token) throw new Error("No token received from Angel API");

    return { token };
  } catch (error: any) {
    logger.error("Error generating token", error.message);
    throw new Error(error.response?.data?.message || error.message);
  }
});
