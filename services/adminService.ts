import { api } from "./api";

export type InternalRole = "admin" | "staff";

export interface AdminUserItem {
  user_id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address_line1?: string | null;
  village_city?: string | null;
  tehsil?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUserListResponse {
  items: AdminUserItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export async function listInternalUsers(params?: {
  limit?: number;
  offset?: number;
}): Promise<AdminUserListResponse> {
  const { data } = await api.get<AdminUserListResponse>("/admin/users", { params });
  return data;
}

export async function startInternalUser(body: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: InternalRole;
}): Promise<{
  otp_session_id: string;
  purpose: string;
  expires_in?: number;
  resend_after?: number;
  masked_destination?: string;
  hint?: string;
}> {
  const { data } = await api.post("/admin/users", body);
  return data;
}

export async function confirmInternalUser(body: {
  otp_session_id: string;
  otp: string;
  purpose?: string;
}): Promise<AdminUserItem> {
  const { data } = await api.post<AdminUserItem>("/admin/users/verify", {
    otp_session_id: body.otp_session_id,
    otp: body.otp,
    purpose: body.purpose ?? "internal_signup",
  });
  return data;
}

export async function setInternalUserActive(userId: string, isActive: boolean): Promise<AdminUserItem> {
  const { data } = await api.patch<AdminUserItem>(`/admin/users/${userId}`, { is_active: isActive });
  return data;
}

export async function deleteInternalUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}
