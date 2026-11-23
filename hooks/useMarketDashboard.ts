import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveMarketApiEnabled } from "./useMarketDemoMode";
import {
  fetchCitiesToday,
  fetchEggCoverage,
  fetchEggSheet,
  fetchEggTrend,
  fetchMarketDashboard,
  fetchMarketZones,
  fetchPoultryRates,
  setMarketZonePreference,
  upsertPoultryRates,
  type ManualPoultryRateUpsertRequest,
} from "../services/marketService";
import { useAuthStore } from "../store/useAuthStore";

function useLiveMarketEnabled(extra = true) {
  return useLiveMarketApiEnabled(extra);
}

export function useMarketDashboard(zone?: string | null, enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled);

  return useQuery({
    queryKey: ["market", "dashboard", zone ?? "default"],
    queryFn: () => fetchMarketDashboard(zone || undefined),
    enabled: canFetch,
    staleTime: 60_000,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useMarketZones(enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled);

  return useQuery({
    queryKey: ["market", "zones"],
    queryFn: () => fetchMarketZones(false),
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

export function useEggCoverage(zone: string | null | undefined, enabled = true) {
  const canFetch = useLiveMarketEnabled(enabled && Boolean(zone));

  return useQuery({
    queryKey: ["market", "coverage", zone],
    queryFn: () => fetchEggCoverage(zone!),
    enabled: canFetch,
    staleTime: 5 * 60_000,
  });
}

export function useEggTrend(
  zone: string | null | undefined,
  window: "days" | "month" | "year",
  enabled = true,
  opts?: { year?: number; month?: number; week?: number },
) {
  const canFetch = useLiveMarketEnabled(enabled && Boolean(zone));

  return useQuery({
    queryKey: ["market", "trend", zone, window, opts?.year, opts?.month, opts?.week],
    queryFn: () =>
      fetchEggTrend(zone!, window, {
        year: opts?.year,
        month: opts?.month,
        week: opts?.week,
      }),
    enabled: canFetch,
    staleTime: 60_000,
  });
}

export function useEggSheet(
  zone: string | null | undefined,
  year: number,
  month: number,
  enabled = true,
) {
  const canFetch = useLiveMarketEnabled(enabled && Boolean(zone));

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

export function usePoultryRates(
  product: "culls" | "broilers" | null,
  zone: string | null,
  enabled = true,
) {
  const canFetch = useLiveMarketEnabled(enabled && Boolean(product && zone));
  return useQuery({
    queryKey: ["market", "poultry-rates", product, zone],
    queryFn: () => fetchPoultryRates(product!, zone!),
    enabled: canFetch,
    staleTime: 30_000,
  });
}

export function useUpsertPoultryRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ManualPoultryRateUpsertRequest) => upsertPoultryRates(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["market"] });
    },
  });
}
