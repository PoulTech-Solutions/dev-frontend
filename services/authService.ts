import { api } from "./api";
import type { AuthUser } from "../store/useAuthStore";

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpResponse {
  access_token: string;
  user: AuthUser;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser & { is_new_user?: boolean };
  is_new_user?: boolean;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/google", {
    id_token: idToken,
  });
  return data;
}

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const { data } = await api.post<SendOtpResponse>("/auth/send-otp", { phone });
  return data;
}

export async function forgotPassword(email: string): Promise<SendOtpResponse> {
  const { data } = await api.post<SendOtpResponse>("/auth/forgot-password", {
    email,
  });
  return data;
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  const { data } = await api.post<VerifyOtpResponse>("/auth/verify-otp", {
    phone,
    otp,
  });
  return data;
}
