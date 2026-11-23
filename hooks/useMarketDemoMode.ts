import { useAuthStore } from "../store/useAuthStore";
import { isMockAuthEnabled } from "./useAuth";

/** True when egg/culls/broiler cards may show sample store prices (mock login or mock auth, no real API session). */
export function useMarketDemoMode(): boolean {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (user?.id.startsWith("mock-")) return true;
  if (accessToken && user && !user.id.startsWith("mock-")) return false;
  return isMockAuthEnabled;
}

export function useLiveMarketApiEnabled(extra = true): boolean {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  return extra && Boolean(accessToken) && Boolean(user) && !user!.id.startsWith("mock-");
}