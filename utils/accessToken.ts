/** Read JWT `exp` without verifying the signature — used only to schedule refresh. */
export function accessTokenExpiresAtMs(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = globalThis.atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Milliseconds until we should rotate — 60s before expiry, minimum 5s. */
export function msUntilAccessRefresh(token: string | null | undefined): number | null {
  const exp = accessTokenExpiresAtMs(token);
  if (exp === null) return null;
  return Math.max(exp - Date.now() - 60_000, 5_000);
}
