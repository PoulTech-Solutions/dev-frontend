import { QueryClient } from "@tanstack/react-query";

/** One client for the app so logout can drop cached admin and market data. */
export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
