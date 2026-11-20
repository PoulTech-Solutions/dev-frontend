import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isMockAuthEnabled } from "./useAuth";
import {
  fetchCitiesToday,
  fetchEggSheet,
  fetchEggTrend,
  fetchMarketDashboard,
  fetchMarketZones,
  setMarketZonePreference,
} from "../services/marketService";
import { useAuthStore } from "../store/useAuthStore";

function useLiveMarketEnabled(extra = true) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return extra && Boolean(accessToken) && !isMockAuthEnabled;
}

export function useMarketDashboard(zone?: string | null, enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled);

  return useQuery({
    queryKey: ["market", "dashboard", zone ?? "default"],
    queryFn: () => fetchMarketDashboard(zone || undefined),
    enabled: canFetch,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMarketZones(enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled);

  return useQuery({
    queryKey: ["market", "zones"],
    queryFn: () => fetchMarketZones(true),
    enabled: canFetch,
    staleTime: 5 * 60_000,
  });
}

export function useCitiesToday(enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled);

  return useQuery({
    queryKey: ["market", "cities-today"],
    queryFn: () => fetchCitiesToday(),
    enabled: canFetch,
    staleTime: 60_000,
  });
}

export function useEggTrend(
  zone: string | null | undefined,
  window: "days" | "month" | "year",
  enabled = true,
) {
  const canFetch = useLiveMarketEnabled(enabled && Boolean(zone));
  const now = new Date();

  return useQuery({
    queryKey: ["market", "trend", zone, window, now.getFullYear(), now.getMonth() + 1],
    queryFn: () =>
      fetchEggTrend(zone!, window, {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }),
    enabled: canFetch,
    staleTime: 60_000,
  });
}

export function useEggSheet(zone: string | null | undefined, enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled && Boolean(zone));
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ["market", "sheet", zone, year, month],
    queryFn: () => fetchEggSheet(zone!, year, month),
    enabled: canFetch,
    staleTime: 60_000,
  });
}

export function useSetMarketZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zone: string) => setMarketZonePreference(zone),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["market"] });
    },
  });
}
