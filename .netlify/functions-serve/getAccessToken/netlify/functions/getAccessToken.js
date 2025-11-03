var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/getAccessToken.ts
var getAccessToken_exports = {};
__export(getAccessToken_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getAccessToken_exports);
var handler = async () => {
  try {
    const response = await fetch(
      "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // "X-UserType": "USER",
          // "X-SourceID": "WEB",
          "X-PrivateKey": process.env.ANGEL_API_KEY
        },
        body: JSON.stringify({
          clientcode: process.env.ANGEL_CLIENT_CODE,
          password: process.env.ANGEL_PASSWORD,
          totp: process.env.ANGEL_TOTP || "131604"
        })
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
      body: JSON.stringify({ success: true, token })
    };
  } catch (error) {
    console.error("Error fetching Angel One token:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || "Internal Server Error"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=getAccessToken.js.map
