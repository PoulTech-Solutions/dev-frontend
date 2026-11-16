/**
 * Google Sign-In config — all public knobs from EXPO_PUBLIC_* (.env / Docker build args).
 * JavaScript origins must still be registered in Google Cloud Console (Google does not read .env).
 */

const trim = (v: string | undefined) => v?.trim() ?? "";

export const googleAuthEnv = {
  /** Web OAuth client ID; must match backend GOOGLE_CLIENT_ID */
  webClientId: trim(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  androidClientId: trim(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  iosClientId: trim(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  /** Native / redirect flow only (web uses GIS in useGoogleAuth.web.ts) */
  webRedirectUri: trim(process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI).replace(/\/$/, ""),
  /**
   * Comma-separated origins to register in Google Console (documentation + error hints).
   * Example: http://127.0.0.1:8088,http://localhost:8088,https://app.example.com
   */
  javascriptOrigins: trim(process.env.EXPO_PUBLIC_GOOGLE_JS_ORIGINS)
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
  /** Optional label for errors when window is unavailable at build time */
  appWebOrigin: trim(process.env.EXPO_PUBLIC_APP_WEB_ORIGIN).replace(/\/$/, ""),
} as const;

export const GOOGLE_WEB_CLIENT_FALLBACK = "google-client-not-configured.apps.googleusercontent.com";

/** Current browser origin, or configured fallback for messages */
export function activeWebOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return googleAuthEnv.appWebOrigin || googleAuthEnv.javascriptOrigins[0] || "";
}

/** Origins to list in setup / error text (env list + current page) */
export function googleConsoleOriginHint(): string {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const o of [...googleAuthEnv.javascriptOrigins, activeWebOrigin()]) {
    if (!o || seen.has(o)) continue;
    seen.add(o);
    list.push(o);
  }
  return list.length ? list.join(", ") : activeWebOrigin() || "(your site origin)";
}

export function googleOriginSetupMessage(prefix?: string): string {
  const hint = googleConsoleOriginHint();
  const head =
    prefix ??
    "In Google Cloud Console → Credentials → your Web OAuth client → Authorized JavaScript origins, add:";
  return `${head} ${hint}`;
}

export function hasGoogleWebClient(): boolean {
  return Boolean(googleAuthEnv.webClientId);
}