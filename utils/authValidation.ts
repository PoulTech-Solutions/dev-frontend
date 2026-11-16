/** Mirrors backend `password_policy_errors` rules for client-side checks. */
export const BACKEND_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const BACKEND_PASSWORD_HINT =
  "Password needs upper, lower, a digit, and a special character.";

/** Indian mobile: 10 digits, starts with 6–9 (backend normalises to E.164). */
export function isValidIndianMobile(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits);
}

export const INDIAN_MOBILE_HINT =
  "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).";

export function registerPathFromLogin(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return "/(auth)/register?from=login";
  }
  return `/(auth)/register?email=${encodeURIComponent(trimmed)}&from=login`;
}

export function loginPathAfterSignup(email: string): string {
  const trimmed = email.trim().toLowerCase();
  return `/(auth)/login?email=${encodeURIComponent(trimmed)}&registered=1`;
}