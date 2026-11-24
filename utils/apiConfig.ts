import { Platform } from "react-native";
import { isProductionBuild } from "./runtime";

/** Same default as `services/api.ts` — local Docker API on :8000. */
export const LOCAL_DEV_API_ROOT = "http://localhost:8000/api/v1";

/** Android emulator cannot reach the host via localhost — use 10.0.2.2. */
function rewriteLocalhostForAndroidEmulator(url: string): string {
  if (Platform.OS !== "android") return url;
  return url.replace("://localhost", "://10.0.2.2").replace("://127.0.0.1", "://10.0.2.2");
}

export function resolveApiRoot(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  const root = configured || (isProductionBuild ? "/api/v1" : LOCAL_DEV_API_ROOT);
  return rewriteLocalhostForAndroidEmulator(root);
}

function mockAuthFlag(): string | undefined {
  return process.env.EXPO_PUBLIC_USE_MOCK_AUTH?.trim().toLowerCase();
}

/**
 * Mock auth / static market demo.
 * Local dev defaults to the real API at localhost:8000 (no `.env` required).
 * Set `EXPO_PUBLIC_USE_MOCK_AUTH=true` only when the backend is down.
 */
export function isMockAuthEnabled(): boolean {
  if (isProductionBuild) return false;
  const flag = mockAuthFlag();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return false;
}