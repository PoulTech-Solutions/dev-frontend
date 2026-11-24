import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboard } from "../services/adminService";
import { canReadAdminMitraDashboard } from "../utils/permissions";
import { useAuthStore } from "../store/useAuthStore";
import { useLiveMarketApiEnabled } from "./useMarketDemoMode";

export function useAdminMitraDashboard(
  enabled = true,
  params?: { from_date?: string; to_date?: string; sales_limit?: number },
) {
  const backendRole = useAuthStore((state) => state.user?.backendRole);
  const live = useLiveMarketApiEnabled(enabled && canReadAdminMitraDashboard(backendRole));

  return useQuery({
    queryKey: [
      "admin",
      "dashboard",
      params?.from_date ?? null,
      params?.to_date ?? null,
      params?.sales_limit ?? 50,
    ],
    queryFn: () => fetchAdminDashboard(params),
    enabled: live,
    staleTime: 30_000,
  });
}
