import type { AuthUser, UserRole } from "../store/useAuthStore";

/** Maps backend RBAC names to UI roles used in Expo routes. */
export function mapBackendRole(role: string | undefined | null): UserRole {
  const r = (role ?? "user").toLowerCase();
  if (r === "farm_owner" || r === "farm_member") return "poultry_owner";
  if (r === "admin" || r === "super_admin" || r === "staff") return "admin";
  return "customer";
}

export function mapProfileToAuthUser(profile: Record<string, unknown>): AuthUser {
  const first = String(profile.first_name ?? "").trim();
  const last = String(profile.last_name ?? "").trim();
  const name = [first, last].filter(Boolean).join(" ") || String(profile.email ?? "User");
  const backendRole = String(profile.role ?? "user");
  return {
    id: String(profile.user_id ?? profile.id ?? ""),
    name,
    backendRole,
    email: profile.email ? String(profile.email) : undefined,
    phone: profile.phone ? String(profile.phone) : undefined,
    city: profile.village_city ? String(profile.village_city) : undefined,
    state: profile.state ? String(profile.state) : undefined,
    district: profile.district ? String(profile.district) : undefined,
    tehsil: profile.tehsil ? String(profile.tehsil) : undefined,
    pincode: profile.pincode ? String(profile.pincode) : undefined,
    farmName: profile.region ? String(profile.region) : undefined,
    role: mapBackendRole(backendRole),
    isProfileComplete: Boolean(profile.is_profile_complete),
    mustVerifyEmail: Boolean(profile.must_verify_email),
  };
}