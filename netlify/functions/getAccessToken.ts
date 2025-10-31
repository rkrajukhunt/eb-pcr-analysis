// netlify/functions/get-angel-token.ts

export const handler = async () => {
  try {
    const response = await fetch(
      "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          clientcode: process.env.ANGEL_CLIENT_CODE,
          password: process.env.ANGEL_PASSWORD,
          totp: process.env.ANGEL_TOTP,
        }),
      }
    );

    console.log("demo -->", response);

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    const token = data?.data?.jwtToken;

    if (!token) {
      throw new Error("JWT token missing in response");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, token }),
    };
  } catch (error: any) {
    console.error("Error fetching Angel One token:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || "Internal Server Error",
      }),
    };
  }
};

// export async function handler() {
//   try {
//     const response = await fetch(
//       "https://api.smartapi.angelbroking.com/v1/api/token",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           "X-Client-Code": process.env.ANGEL_CLIENT_CODE,
//           "X-API-Key": process.env.ANGEL_API_KEY,
//         },
//         body: JSON.stringify({
//           clientcode: process.env.ANGEL_CLIENT_CODE,
//           password: process.env.ANGEL_PASSWORD,
//           totp: process.env.ANGEL_TOTP,
//           request_token: process.env.ANGEL_REQUEST_TOKEN,
//         }),
//       }
//     );

//     const data = await response.json();
//     console.log("SmartAPI token response:", data);

//     if (!data.status || !data.data?.jwtToken) {
//       throw new Error("Failed to get Angel One JWT token");
//     }

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ success: true, token: data.data.jwtToken }),
//     };
//   } catch (err) {
//     console.error("Error fetching Angel One token:", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ success: false, message: err.message }),
//     };
//   }
// }
