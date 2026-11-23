import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { accessTokenExpiresAtMs } from "../utils/accessToken";
import { resolveApiRoot } from "../utils/apiConfig";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    _authRetried?: boolean;
  }
}

type RetryConfig = InternalAxiosRequestConfig & {
  skipAuthRefresh?: boolean;
  _authRetried?: boolean;
};

export const api = axios.create({
  baseURL: resolveApiRoot(),
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/** Always rotate using the HttpOnly cookie (web) or stored refresh (native). Single-flight. */
export function rotateAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { refreshAccessToken } = await import("./authService");
        const nativeRefresh = Platform.OS === "web" ? undefined : useAuthStore.getState().refreshToken;
        const tokens = await refreshAccessToken(nativeRefresh);
        await useAuthStore.getState().setAccessToken(tokens.access_token, tokens.refresh_token);
        return tokens.access_token;
      } catch {
        await useAuthStore.getState().signOut();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/** Proactive path: reuse a still-valid access token, otherwise rotate. */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const existing = useAuthStore.getState().accessToken;
  const exp = accessTokenExpiresAtMs(existing);
  if (existing && exp !== null && exp - Date.now() > 60_000) return existing;
  return rotateAccessToken();
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config || config.skipAuthRefresh || config._authRetried) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    const path = config.url ?? "";
    if (path.includes("/auth/login") || path.includes("/auth/refresh") || path.includes("/auth/logout")) {
      return Promise.reject(error);
    }

    const nextToken = await rotateAccessToken();
    if (!nextToken) return Promise.reject(error);

    config._authRetried = true;
    config.headers.set("Authorization", `Bearer ${nextToken}`);
    return api(config);
  },
);
