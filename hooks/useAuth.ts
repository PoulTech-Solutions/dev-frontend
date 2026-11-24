import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  confirmAccountRestore,
  forgotPassword,
  googleLogin,
  loginChallenge,
  requestAccountRestore,
  resendOtpChallenge,
  resetPassword,
  sendOtp,
  signup,
  verifyLoginOtp,
  fetchProfile,
  verifyOtp,
  verifySignupEmail,
} from "../services/authService";
import type { AuthUser } from "../store/useAuthStore";
import { isMockAuthEnabled as resolveMockAuthEnabled } from "../utils/apiConfig";

/** Mock auth is dev-only; never enabled in production bundles (reverse-engineering safety). */
export const isMockAuthEnabled = resolveMockAuthEnabled();

export const DEMO_EMAIL = "demo@poultech.in";
export const DEMO_PASSWORD = "Poultech123";
export const DEMO_OWNER_EMAIL = "owner@poultech.in";
export const DEMO_OWNER_PASSWORD = "PoultechOwner123";
export const DEMO_ADMIN_EMAIL = "admin@poultech.in";
export const DEMO_ADMIN_PASSWORD = "PoultechAdmin123";
export const DEMO_PHONE = "9876543210";
export const DEMO_OTP = "123456";

export interface VerifyOtpResult {
  accessToken: string;
  user: AuthUser;
  isNewUser?: boolean;
  mustChangePassword?: boolean;
  mustVerifyEmail?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
  confirm_device_switch?: boolean;
}

export interface CompleteLoginOtpInput {
  otp_session_id: string;
  otp: string;
  remember_me?: boolean;
  confirm_device_switch?: boolean;
}

function mockUser(identifier: string): AuthUser {
  const normalizedIdentifier = identifier.toLowerCase();
  const isOwner = normalizedIdentifier === DEMO_OWNER_EMAIL;
  return {
    id: `mock-${identifier}`,
    name: isOwner ? "Demo Farm Owner" : "Poultech User",
    email: identifier.includes("@") ? identifier : undefined,
    ...(isOwner
      ? {
          phone: "+91 9876543210",
          farmName: "Green Valley Poultry",
          city: "Pune",
          state: "Maharashtra",
        }
      : {}),
    role:
      normalizedIdentifier === DEMO_ADMIN_EMAIL
        ? "admin"
        : normalizedIdentifier === DEMO_OWNER_EMAIL
          ? "poultry_owner"
          : "customer",
  };
}

function toVerifyOtpResult(result: {
  access_token: string;
  user: AuthUser;
  is_new_user?: boolean;
}): VerifyOtpResult {
  return {
    accessToken: result.access_token,
    user: result.user,
    isNewUser: result.is_new_user,
  };
}

/** Step 1: password check → email OTP challenge. */
export function useLoginChallenge() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
      remember_me,
      confirm_device_switch,
    }: LoginCredentials) => {
      if (isMockAuthEnabled) {
        return { otp_session_id: "mock", masked_destination: email, purpose: "login" };
      }
      return loginChallenge(email, password, {
        remember_me,
        confirm_device_switch,
      });
    },
  });
}

/** Step 2: verify login OTP and load profile. */
export function useCompleteLoginOtp() {
  return useMutation({
    mutationFn: async ({
      otp_session_id,
      otp,
      remember_me,
      confirm_device_switch,
    }: CompleteLoginOtpInput): Promise<VerifyOtpResult> => {
      if (isMockAuthEnabled) {
        if (otp !== DEMO_OTP) throw new Error(`Invalid code. Try ${DEMO_OTP} in demo mode.`);
        return {
          accessToken: "mock-token",
          user: mockUser(DEMO_EMAIL),
          isNewUser: false,
        };
      }
      const tokens = await verifyLoginOtp(otp_session_id, otp, {
        remember_me,
        confirm_device_switch,
      });
      const user = await fetchProfile(tokens.access_token);
      return {
        accessToken: tokens.access_token,
        user,
        mustChangePassword: tokens.must_change_password,
        mustVerifyEmail: tokens.must_verify_email ?? user.mustVerifyEmail,
      };
    },
  });
}

/** @deprecated Use useLoginChallenge + useCompleteLoginOtp in production. */
export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials): Promise<VerifyOtpResult> => {
      if (isMockAuthEnabled) {
        const normalizedEmail = email.toLowerCase();
        const expectedPassword =
          normalizedEmail === DEMO_ADMIN_EMAIL
            ? DEMO_ADMIN_PASSWORD
            : normalizedEmail === DEMO_OWNER_EMAIL
              ? DEMO_OWNER_PASSWORD
              : undefined;
        if (expectedPassword && password !== expectedPassword) {
          throw new Error("Incorrect demo password.");
        }
        return {
          accessToken: `mock-token-${email}`,
          user: mockUser(email),
          isNewUser: false,
        };
      }
      const challenge = await loginChallenge(email, password);
      throw new Error(
        `OTP required for ${challenge.masked_destination ?? "your email"}. Enter the code sent to your inbox.`,
      );
    },
  });
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: async (idToken: string): Promise<VerifyOtpResult> => {
      if (isMockAuthEnabled) {
        return {
          accessToken: "mock-google-token",
          user: { ...mockUser("google@example.com"), name: "Google User" },
          isNewUser: true,
        };
      }
      return toVerifyOtpResult(await googleLogin(idToken));
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      if (isMockAuthEnabled) return { message: `Your verification code is ${DEMO_OTP}.` };
      return sendOtp(phone);
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async ({
      otp_session_id,
      otp,
      purpose,
    }: {
      otp_session_id: string;
      otp: string;
      purpose?: string;
    }): Promise<VerifyOtpResult> => {
      if (isMockAuthEnabled) {
        if (otp !== DEMO_OTP) throw new Error(`Invalid code. Try ${DEMO_OTP} in demo mode.`);
        return {
          accessToken: `mock-token-${otp_session_id}`,
          user: mockUser(DEMO_EMAIL),
          isNewUser: false,
        };
      }
      const result = await verifyOtp(otp_session_id, otp, purpose ?? "login");
      return toVerifyOtpResult(result);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      if (isMockAuthEnabled) {
        return {
          message: "Demo mode: enter 123456 and a new password below.",
          otp_session_id: "mock-reset",
          masked_destination: email,
          resend_after: 60,
        };
      }
      return forgotPassword(email);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (body: {
      otp_session_id: string;
      otp: string;
      password: string;
      confirm_password: string;
    }) => {
      if (isMockAuthEnabled) {
        if (body.otp !== DEMO_OTP) {
          throw new Error(`Invalid code. Try ${DEMO_OTP} in demo mode.`);
        }
        return { message: "Password updated (demo). Sign in with your new password." };
      }
      return resetPassword(body);
    },
  });
}

export function useRequestAccountRestore() {
  return useMutation({
    mutationFn: async (email: string) => {
      if (isMockAuthEnabled) {
        return {
          message: "Demo mode: enter 123456 to reactivate.",
          otp_session_id: "mock-restore",
          masked_destination: email,
          resend_after: 60,
        };
      }
      return requestAccountRestore(email);
    },
  });
}

export function useConfirmAccountRestore() {
  return useMutation({
    mutationFn: async ({ otp_session_id, otp }: { otp_session_id: string; otp: string }) => {
      if (isMockAuthEnabled) {
        if (otp !== DEMO_OTP) throw new Error(`Invalid code. Try ${DEMO_OTP} in demo mode.`);
        return {
          access_token: "mock-restore-token",
          user: mockUser(DEMO_EMAIL),
        };
      }
      return confirmAccountRestore(otp_session_id, otp);
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (body: Parameters<typeof signup>[0]) => {
      if (isMockAuthEnabled) {
        return {
          otp_session_id: "mock-signup",
          purpose: "signup",
          masked_destination: body.email,
          hint: "Mock signup OTP: 123456",
        };
      }
      return signup(body);
    },
  });
}

export function useVerifySignupEmail() {
  return useMutation({
    mutationFn: async ({
      otp_session_id,
      otp,
    }: {
      otp_session_id: string;
      otp: string;
    }) => {
      if (isMockAuthEnabled) {
        if (otp !== DEMO_OTP) throw new Error(`Invalid code. Try ${DEMO_OTP} in demo mode.`);
        return { message: "Email confirmed. You can sign in now." };
      }
      return verifySignupEmail(otp_session_id, otp);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: async ({
      otp_session_id,
      purpose,
    }: {
      otp_session_id: string;
      purpose: string;
    }) => {
      if (isMockAuthEnabled) {
        return {
          otp_session_id,
          purpose,
          resend_after: 60,
          hint: `Mock code: ${DEMO_OTP}`,
        };
      }
      return resendOtpChallenge(otp_session_id, purpose);
    },
  });
}

export function getAuthErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: { code?: string } } | undefined;
    return payload?.error?.code;
  }
  return undefined;
}

export function isAlreadySignedInError(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  if (code === "already_signed_in") return true;
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return false;
  const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
  return typeof message === "string" && message.toLowerCase().includes("another device");
}

/** Login failures — backend `error.code` with clearer guidance for email issues. */
export function getLoginFailureMessage(error: unknown): string {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error);
  if (code === "registration_required" || code === "email_not_verified") {
    return message;
  }
  if (code === "account_deleted") {
    return message || 'Your account is deactivated. Use "Reactivate account" below to restore it.';
  }
  if (code === "invalid_credentials") {
    return message;
  }
  if (isInvalidEmailValidationError(error)) {
    return "Enter a valid email address you can access (for example, name@example.com).";
  }
  return message;
}

export function shouldSuggestAccountRestore(error: unknown): boolean {
  return getAuthErrorCode(error) === "account_deleted";
}

export function isInvalidEmailValidationError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return false;
  const payload = error.response.data as {
    error?: { details?: Array<{ field?: string; message?: string }> };
  };
  const details = payload?.error?.details;
  return Boolean(
    Array.isArray(details) && details.some((d) => {
      const field = (d.field ?? "").toLowerCase();
      const msg = (d.message ?? "").toLowerCase();
      return field.includes("email") || msg.includes("email");
    }),
  );
}

export function shouldSuggestRegistration(error: unknown): boolean {
  return getAuthErrorCode(error) === "registration_required";
}

export function getSignupFailureMessage(error: unknown): string {
  const message = getAuthErrorMessage(error);
  const code = getAuthErrorCode(error);
  if (code === "email_taken") {
    return `${message} Sign in instead, or register with another valid email.`;
  }
  if (isInvalidEmailValidationError(error)) {
    return "Enter a valid email address you can access (for example, name@example.com).";
  }
  return message;
}

/** OTP verify / resend — clearer next steps for common backend codes. */
export function getOtpFailureMessage(error: unknown): string {
  const message = getAuthErrorMessage(error);
  const code = getAuthErrorCode(error);
  if (code === "otp_expired" || code === "signup_expired") {
    return `${message} Start again and request a new code.`;
  }
  if (code === "otp_attempts_exceeded") {
    return `${message} Use resend or start the step again.`;
  }
  if (code === "otp_invalid") {
    return message;
  }
  if (code === "resend_not_allowed") {
    return `${message} Start the step again from the beginning.`;
  }
  if (code === "otp_cooldown" || code === "too_many_otp_requests") {
    return message;
  }
  return message;
}

function cleanBackendValidationText(raw: string): string {
  return raw
    .replace(/^Value error,\s*/i, "")
    .replace(/^String should have at least \d+ characters?,?\s*/i, "")
    .trim();
}

/** Backend `details` is a field list on 422, or a plain object (e.g. already_signed_in). */
function fieldErrorLines(details: unknown): string[] {
  if (!Array.isArray(details)) return [];
  return details
    .map((d) => {
      if (!d || typeof d !== "object") return "";
      const row = d as { field?: string; message?: string };
      const msg = row.message ? cleanBackendValidationText(row.message) : "";
      if (!msg) return "";
      const field = (row.field ?? "").replace(/^body\.?/, "").trim();
      return field ? `${field}: ${msg}` : msg;
    })
    .filter((m): m is string => Boolean(m));
}

/**
 * Maps backend `{ error: { code, message, details? } }` to user-visible text.
 * Prefers field `details` on 422; adds retry hints on 429.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | {
          error?: {
            message?: string;
            code?: string;
            details?: Array<{ field?: string; message?: string }>;
          };
          detail?: unknown;
          message?: unknown;
        }
      | undefined;
    const fieldErrors = fieldErrorLines(payload?.error?.details);
    if (fieldErrors?.length) return fieldErrors.join(" ");
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const base =
        payload?.error?.message ??
        "Too many requests. Please wait before trying again.";
      if (retryAfter) {
        return `${base} Try again in about ${retryAfter} seconds.`;
      }
      return base;
    }
    const code = payload?.error?.code;
    const topMessage = payload?.error?.message;
    if (code === "validation_error" && topMessage && !fieldErrors?.length) {
      return topMessage;
    }
    if (topMessage && code !== "validation_error") return topMessage;
    if (topMessage) return cleanBackendValidationText(topMessage);
    const detail = payload?.detail;
    const message = payload?.message;
    if (typeof detail === "string") return detail;
    if (typeof message === "string") return message;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object" && item !== null && "msg" in item
            ? String((item as { msg: string }).msg)
            : String(item),
        )
        .join(" ");
    }
    return error.message || "The authentication request failed. Please try again.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}