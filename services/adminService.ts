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

export interface AdminDashboardSaleItem {
  id: string;
  invoice_no: string;
  sale_date: string;
  buyer: string;
  item: string;
  quantity: number | string;
  qty_unit: string;
  amount_inr: number | string;
  received_inr: number | string;
  balance_inr: number | string;
}

export interface AdminDashboardFarmCard {
  unit_id: string;
  unit_name: string;
  farm_type: string;
  state?: string | null;
  district?: string | null;
  owner_user_id: string;
  owner_email: string;
  income_inr: number | string;
  expenses_inr: number | string;
  profit_inr: number | string;
  to_receive_inr: number | string;
  to_pay_inr: number | string;
  units_sold: number | string;
  sale_count: number;
  expense_count: number;
  sales: AdminDashboardSaleItem[];
}

export interface AdminDashboardTotals {
  farm_count: number;
  owner_count: number;
  sale_count: number;
  expense_count: number;
  income_inr: number | string;
  expenses_inr: number | string;
  profit_inr: number | string;
  to_receive_inr: number | string;
  to_pay_inr: number | string;
  units_sold: number | string;
}

export interface AdminDashboardResponse {
  from_date?: string | null;
  to_date?: string | null;
  totals: AdminDashboardTotals;
  farms: AdminDashboardFarmCard[];
}

export async function fetchAdminDashboard(params?: {
  from_date?: string;
  to_date?: string;
  sales_limit?: number;
}): Promise<AdminDashboardResponse> {
  const { data } = await api.get<AdminDashboardResponse>("/admin/dashboard", { params });
  return data;
}
