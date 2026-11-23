const MARKET_RATES_MANAGE = "market:rates:manage";

function roleName(backendRole: string | undefined | null): string {
  return (backendRole ?? "").toLowerCase();
}

export function canManageMarketRates(backendRole: string | undefined | null): boolean {
  const r = roleName(backendRole);
  return r === "staff" || r === "admin" || r === "super_admin";
}

export function canManageStaff(backendRole: string | undefined | null): boolean {
  const r = roleName(backendRole);
  return r === "admin" || r === "super_admin";
}

export function canListDirectory(backendRole: string | undefined | null): boolean {
  const r = roleName(backendRole);
  return r === "staff" || r === "admin" || r === "super_admin";
}

export function canManageAdmins(backendRole: string | undefined | null): boolean {
  return roleName(backendRole) === "super_admin";
}

export function isInternalAccount(backendRole: string | undefined | null): boolean {
  const r = roleName(backendRole);
  return r === "staff" || r === "admin" || r === "super_admin";
}

export { MARKET_RATES_MANAGE };