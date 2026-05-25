export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  // Read from COOKIE_SECRET first, fall back to JWT_SECRET for backward compatibility
  cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Log configuration on startup (for debugging)
if (process.env.NODE_ENV === "development") {
  console.log("[ENV] Configuration loaded:");
  console.log("[ENV] Google Client ID:", ENV.googleClientId ? "SET (" + ENV.googleClientId.substring(0, 20) + "...)" : "NOT SET");
  console.log("[ENV] App ID:", ENV.appId);
  console.log("[ENV] Cookie Secret:", ENV.cookieSecret ? "SET" : "NOT SET");
}
