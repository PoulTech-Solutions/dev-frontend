import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  forgotPassword,
  googleLogin,
  login,
  sendOtp,
  verifyOtp,
} from "../services/authService";
import type { AuthUser } from "../store/useAuthStore";

export const isMockAuthEnabled =
  process.env.EXPO_PUBLIC_USE_MOCK_AUTH === "true" ||
  (process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== "false" &&
    __DEV__ &&
    !process.env.EXPO_PUBLIC_API_URL);

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
}

export interface LoginCredentials {
  email: string;
  password: string;
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
  user: AuthUser & { is_new_user?: boolean };
  is_new_user?: boolean;
}): VerifyOtpResult {
  return {
    accessToken: result.access_token,
    user: result.user,
    isNewUser: result.is_new_user ?? result.user.is_new_user,
  };
}

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
      return toVerifyOtpResult(await login(email, password));
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
      phone,
      otp,
    }: {
      phone: string;
      otp: string;
    }): Promise<VerifyOtpResult> => {
      if (isMockAuthEnabled) {
        if (otp !== DEMO_OTP) throw new Error(`Invalid code. Try ${DEMO_OTP} in demo mode.`);
        return {
          accessToken: `mock-token-${phone}`,
          user: { ...mockUser(phone), phone },
          isNewUser: false,
        };
      }

      const result = await verifyOtp(phone, otp);
      return toVerifyOtpResult(result);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      if (isMockAuthEnabled) return { message: "Demo mode is active. Password reset is not required." };
      return forgotPassword(email);
    },
  });
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: unknown; message?: unknown }>(error)) {
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message;
    if (typeof detail === "string") return detail;
    if (typeof message === "string") return message;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object" && item !== null && "msg" in item
            ? String(item.msg)
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
