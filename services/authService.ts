import { api } from "./api";
import { mapBackendRole, mapProfileToAuthUser } from "./authMapper";
import type { AuthUser } from "../store/useAuthStore";

export interface OtpChallenge {
  otp_session_id: string;
  purpose: string;
  expires_in?: number;
  resend_after?: number;
  masked_destination?: string;
  hint?: string;
}

export interface TokenPayload {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  role?: string;
  session_id?: string;
  must_change_password?: boolean;
  must_verify_email?: boolean;
}

export interface LoginChallengeOptions {
  remember_me?: boolean;
  confirm_device_switch?: boolean;
}

export interface VerifyLoginOtpOptions {
  remember_me?: boolean;
  confirm_device_switch?: boolean;
}

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

export interface SignupRequestBody {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export async function signup(body: SignupRequestBody): Promise<OtpChallenge> {
  const { data } = await api.post<OtpChallenge>("/auth/signup", body);
  return data;
}

export async function verifySignupEmail(
  otp_session_id: string,
  otp: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/verify-email", {
    otp_session_id,
    otp,
    purpose: "signup",
  });
  return data;
}

export async function resendOtpChallenge(
  otp_session_id: string,
  purpose: string,
): Promise<OtpChallenge> {
  const { data } = await api.post<OtpChallenge>("/auth/resend-otp", {
    otp_session_id,
    purpose,
  });
  return data;
}

export async function loginChallenge(
  email: string,
  password: string,
  options?: LoginChallengeOptions,
): Promise<OtpChallenge> {
  const { data } = await api.post<OtpChallenge>("/auth/login", {
    email,
    password,
    remember_me: options?.remember_me ?? false,
    confirm_device_switch: options?.confirm_device_switch ?? false,
  });
  return data;
}

export async function verifyLoginOtp(
  otp_session_id: string,
  otp: string,
  options?: VerifyLoginOtpOptions,
): Promise<TokenPayload> {
  const { data } = await api.post<TokenPayload>("/auth/verify-otp", {
    otp_session_id,
    otp,
    purpose: "login",
    remember_me: options?.remember_me ?? false,
    confirm_device_switch: options?.confirm_device_switch ?? false,
  });
  return data;
}

/** Rotate access token using HttpOnly refresh cookie (requires prior sign-in). */
export async function refreshAccessToken(): Promise<TokenPayload> {
  const { data } = await api.post<TokenPayload>(
    "/auth/refresh",
    {},
    {
      headers: { "X-Poultech-Refresh": "1" },
      skipAuthRefresh: true,
    },
  );
  return data;
}

/** Revokes current server session and clears refresh cookie. */
export async function logoutSession(): Promise<void> {
  await api.post("/auth/logout", undefined, { skipAuthRefresh: true });
}

export async function fetchProfile(accessToken: string): Promise<AuthUser> {
  const { data } = await api.get<Record<string, unknown>>("/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return mapProfileToAuthUser(data);
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<
    TokenPayload & { is_new_user?: boolean; auth_provider?: string }
  >("/auth/google", {
    id_token: idToken,
  });
  const user = await mapProfileFromToken(data);
  return {
    access_token: data.access_token,
    user,
    is_new_user: Boolean(data.is_new_user),
  };
}

export async function patchMyProfile(body: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  village_city?: string;
  state?: string;
  region?: string;
}): Promise<AuthUser> {
  const { data } = await api.patch<Record<string, unknown>>("/me/profile", body);
  return mapProfileToAuthUser(data);
}

async function mapProfileFromToken(tokens: TokenPayload): Promise<AuthUser> {
  try {
    return await fetchProfile(tokens.access_token);
  } catch {
    return {
      id: tokens.session_id ?? "unknown",
      name: "User",
      role: mapBackendRole(tokens.role),
    };
  }
}

// Legacy export used for phone demo — not supported by backend yet.
export async function sendOtp(_phone: string): Promise<SendOtpResponse> {
  throw new Error("Phone OTP is not available. Sign in with email and password.");
}

export interface ForgotPasswordResult extends SendOtpResponse {
  otp_session_id?: string;
  masked_destination?: string;
  resend_after?: number;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const { data } = await api.post<OtpChallenge>("/auth/forgot-password", { email });
  const hint = data.hint ?? "If an account exists, we sent a verification code to your email.";
  return {
    message: hint,
    otp_session_id: data.otp_session_id,
    masked_destination: data.masked_destination,
    resend_after: data.resend_after,
  };
}

export async function resetPassword(body: {
  otp_session_id: string;
  otp: string;
  password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", body);
  return data;
}

export async function verifyOtp(
  otp_session_id: string,
  otp: string,
  purpose = "login",
): Promise<VerifyOtpResponse> {
  const { data } = await api.post<TokenPayload>("/auth/verify-otp", {
    otp_session_id,
    otp,
    purpose,
  });
  const user = await fetchProfile(data.access_token);
  return { access_token: data.access_token, user };
}