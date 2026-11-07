import { Platform } from "react-native";
import type { AuthUser } from "../store/useAuthStore";

const SESSION_KEY = "poultech.auth.session";
const userRoles = new Set(["admin", "customer", "poultry_owner"]);

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
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

async function readValue(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(SESSION_KEY);
  }

  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeValue(value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, value);
    return;
  }

  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function removeValue(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function loadAuthSession(): Promise<AuthSession> {
  const value = await readValue();
  if (!value) return { user: null, accessToken: null };

  let session: unknown;
  try {
    session = JSON.parse(value);
  } catch (error) {
    console.error("Stored Poultech session is not valid JSON.", error);
    await removeValue();
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
    return session as AuthSession;
  }

  console.error("Stored Poultech session has an invalid shape; clearing it.");
  await removeValue();
  return { user: null, accessToken: null };
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await writeValue(JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  await removeValue();
}
