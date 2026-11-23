import { Platform } from "react-native";
import type { AuthUser } from "../store/useAuthStore";
import { logClientError } from "./secureLog";

/** Legacy key (stored access JWT — migrated away on web). */
const SESSION_KEY = "poultech.auth.session";
/** Web: profile only; access token stays in memory + refresh HttpOnly cookie. */
const PROFILE_KEY = "poultech.auth.profile";
const userRoles = new Set(["admin", "customer", "poultry_owner"]);

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken?: string | null;
}

export interface SaveSessionOptions {
  /** When false, nothing is written to disk (session ends on tab close). */
  persist?: boolean;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) return false;
  if (!("id" in value) || typeof value.id !== "string") return false;
  if (!("name" in value) || typeof value.name !== "string") return false;
  if (
    "role" in value &&
    value.role !== null &&
    value.role !== undefined &&
    (typeof value.role !== "string" || !userRoles.has(value.role))
  ) {
    return false;
  }
  if ("phone" in value && value.phone !== undefined && typeof value.phone !== "string") {
    return false;
  }
  if ("email" in value && value.email !== undefined && typeof value.email !== "string") {
    return false;
  }
  return true;
}

function clearLegacyWebSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

async function readNativeValue(): Promise<string | null> {
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeNativeValue(value: string): Promise<void> {
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function removeNativeValue(): Promise<void> {
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

function readWebProfile(): AuthUser | null {
  if (typeof window === "undefined") return null;
  clearLegacyWebSession();
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { user?: unknown };
    return parsed.user && isAuthUser(parsed.user) ? parsed.user : null;
  } catch (error) {
    logClientError("Invalid stored profile", error);
    window.localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

function writeWebProfile(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ user }));
  clearLegacyWebSession();
}

export async function loadAuthSession(): Promise<AuthSession> {
  if (Platform.OS === "web") {
    const user = readWebProfile();
    return { user, accessToken: null, refreshToken: null };
  }

  const value = await readNativeValue();
  if (!value) return { user: null, accessToken: null };

  let session: unknown;
  try {
    session = JSON.parse(value);
  } catch (error) {
    logClientError("Stored session is not valid JSON", error);
    await removeNativeValue();
    return { user: null, accessToken: null };
  }

  if (
    typeof session === "object" &&
    session !== null &&
    "accessToken" in session &&
    "user" in session &&
    (typeof session.accessToken === "string" || session.accessToken === null) &&
    (session.user === null || isAuthUser(session.user))
  ) {
    const stored = session as AuthSession;
    return {
      user: stored.user,
      accessToken: stored.accessToken,
      refreshToken: typeof stored.refreshToken === "string" ? stored.refreshToken : null,
    };
  }

  logClientError("Stored session has an invalid shape; clearing it.", null);
  await removeNativeValue();
  return { user: null, accessToken: null };
}

export async function saveAuthSession(
  session: AuthSession,
  options?: SaveSessionOptions,
): Promise<void> {
  const persist = options?.persist ?? true;
  if (!persist || !session.user) return;

  if (Platform.OS === "web") {
    writeWebProfile(session.user);
    return;
  }

  await writeNativeValue(JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_KEY);
      clearLegacyWebSession();
    }
    return;
  }
  await removeNativeValue();
}