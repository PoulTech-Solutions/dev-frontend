import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore";

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

const defaultApiRoot =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: defaultApiRoot,
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

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const { refreshAccessToken } = await import("./authService");
          const tokens = await refreshAccessToken();
          await useAuthStore.getState().setAccessToken(tokens.access_token);
          return tokens.access_token;
        } catch {
          await useAuthStore.getState().signOut();
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const nextToken = await refreshPromise;
    if (!nextToken) return Promise.reject(error);

    config._authRetried = true;
    config.headers.set("Authorization", `Bearer ${nextToken}`);
    return api(config);
  },
);
