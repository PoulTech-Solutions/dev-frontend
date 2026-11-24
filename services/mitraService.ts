import { api } from "./api";

export type FarmUnitType =
  | "layer"
  | "broiler"
  | "pullet"
  | "breeder"
  | "hatchery"
  | "kadaknath"
  | "duck_layer"
  | "duck_meat"
  | "quail"
  | "turkey"
  | "desi";

export interface FarmUnit {
  id: string;
  name: string;
  farm_type: FarmUnitType;
  contact_phone: string;
  state: string;
  district: string;
  tehsil?: string | null;
  village_city?: string | null;
  pincode?: string | null;
  address_line1?: string | null;
  notes?: string | null;
  hatch_date?: string | null;
  birds_placed?: number | null;
  proprietor?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmUnitListResponse {
  items: FarmUnit[];
  total: number;
  max_units: number;
}

export interface FarmUnitCreateRequest {
  name: string;
  farm_type: FarmUnitType;
  contact_phone: string;
  state: string;
  district: string;
  tehsil?: string | null;
  village_city?: string | null;
  pincode?: string | null;
  address_line1?: string | null;
  notes?: string | null;
  hatch_date?: string | null;
  birds_placed?: number | null;
  proprietor?: string | null;
}

export type FarmUnitUpdateRequest = Partial<Omit<FarmUnitCreateRequest, "farm_type">>;

export interface MitraDailyRecord {
  id: string;
  unit_id: string;
  record_date: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MitraDailyRecordListResponse {
  items: MitraDailyRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface BillingSale {
  id: string;
  unit_id: string;
  invoice_no: string;
  sale_date: string;
  flock_batch_ref?: string | null;
  buyer: string;
  item: string;
  quantity: number | string;
  qty_unit: string;
  rate_inr: number | string;
  amount_inr: number | string;
  pay_mode?: string | null;
  received_inr: number | string;
  balance_inr: number | string;
  remarks?: string | null;
  invoice_kind: string;
  hsn_sac?: string | null;
  buyer_gstin?: string | null;
  place_of_supply_state?: string | null;
  supply_type: string;
  tax_inclusive: boolean;
  taxable_value_inr: number | string;
  gst_rate_pct: number | string;
  cgst_inr: number | string;
  sgst_inr: number | string;
  igst_inr: number | string;
  total_tax_inr: number | string;
  created_at: string;
  updated_at: string;
}

export interface BillingSaleListResponse {
  items: BillingSale[];
  total: number;
  limit: number;
  offset: number;
}

export interface BillingSaleCreateRequest {
  invoice_no: string;
  sale_date: string;
  flock_batch_ref?: string | null;
  buyer: string;
  item: string;
  quantity: number;
  qty_unit: string;
  rate_inr: number;
  amount_inr?: number | null;
  pay_mode?: string | null;
  received_inr?: number | null;
  balance_inr?: number | null;
  remarks?: string | null;
  invoice_kind?: string | null;
  hsn_sac?: string | null;
  buyer_gstin?: string | null;
  place_of_supply_state?: string | null;
  gst_rate_pct?: number | null;
  tax_inclusive?: boolean;
}

export interface ExpenseItem {
  id: string;
  unit_id: string;
  expense_date: string;
  bill_no?: string | null;
  flock_batch_ref?: string | null;
  supplier: string;
  category: string;
  description: string;
  amount_inr: number | string;
  paid_inr: number | string;
  balance_inr: number | string;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseListResponse {
  items: ExpenseItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProfitSummary {
  unit_id: string;
  unit_name: string;
  farm_type: string;
  flock_batch_ref?: string | null;
  income_inr: number | string;
  expenses_inr: number | string;
  profit_inr: number | string;
  units_sold: number | string;
  profit_per_unit_inr?: number | string | null;
  to_receive_inr: number | string;
  to_pay_inr: number | string;
}

export interface HatcheryBatch {
  id: string;
  unit_id: string;
  batch_code: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function listFarmUnits(): Promise<FarmUnitListResponse> {
  const { data } = await api.get<FarmUnitListResponse>("/mitra/units");
  return data;
}

export async function getFarmUnit(unitId: string): Promise<FarmUnit> {
  const { data } = await api.get<FarmUnit>(`/mitra/units/${unitId}`);
  return data;
}

export async function createFarmUnit(body: FarmUnitCreateRequest): Promise<FarmUnit> {
  const { data } = await api.post<FarmUnit>("/mitra/units", body);
  return data;
}

export async function updateFarmUnit(unitId: string, body: FarmUnitUpdateRequest): Promise<FarmUnit> {
  const { data } = await api.patch<FarmUnit>(`/mitra/units/${unitId}`, body);
  return data;
}

export async function deleteFarmUnit(unitId: string): Promise<void> {
  await api.delete(`/mitra/units/${unitId}`);
}

export async function listDailyRecords(
  unitId: string,
  params?: { from_date?: string; to_date?: string; limit?: number; offset?: number },
): Promise<MitraDailyRecordListResponse> {
  const { data } = await api.get<MitraDailyRecordListResponse>(`/mitra/units/${unitId}/daily-records`, {
    params,
  });
  return data;
}

/** Fetch every daily row for a unit (API max page size 366). */
export async function listAllDailyRecords(unitId: string): Promise<MitraDailyRecord[]> {
  const items: MitraDailyRecord[] = [];
  let offset = 0;
  const limit = 366;
  for (;;) {
    const page = await listDailyRecords(unitId, { limit, offset });
    items.push(...page.items);
    if (items.length >= page.total || page.items.length === 0) break;
    offset += limit;
  }
  return items;
}

export async function upsertDailyRecord(
  unitId: string,
  body: { record_date: string; data: Record<string, unknown> },
): Promise<MitraDailyRecord> {
  const { data } = await api.put<MitraDailyRecord>(`/mitra/units/${unitId}/daily-records`, body);
  return data;
}

export async function updateDailyRecord(
  unitId: string,
  recordId: string,
  body: { record_date: string; data: Record<string, unknown> },
): Promise<MitraDailyRecord> {
  const { data } = await api.patch<MitraDailyRecord>(
    `/mitra/units/${unitId}/daily-records/${recordId}`,
    body,
  );
  return data;
}

export async function deleteDailyRecord(unitId: string, recordId: string): Promise<void> {
  await api.delete(`/mitra/units/${unitId}/daily-records/${recordId}`);
}

export async function listHatcheryBatches(
  unitId: string,
  params?: { limit?: number; offset?: number },
): Promise<{ items: HatcheryBatch[]; total: number; limit: number; offset: number }> {
  const { data } = await api.get(`/mitra/units/${unitId}/hatchery-batches`, { params });
  return data;
}

export async function createHatcheryBatch(
  unitId: string,
  body: { batch_code?: string; data: Record<string, unknown> },
): Promise<HatcheryBatch> {
  const { data } = await api.post<HatcheryBatch>(`/mitra/units/${unitId}/hatchery-batches`, body);
  return data;
}

export async function listBillingSales(
  unitId: string,
  params?: { from_date?: string; to_date?: string; limit?: number; offset?: number },
): Promise<BillingSaleListResponse> {
  const { data } = await api.get<BillingSaleListResponse>(`/mitra/units/${unitId}/billing`, { params });
  return data;
}

export async function createBillingSale(
  unitId: string,
  body: BillingSaleCreateRequest,
): Promise<BillingSale> {
  const { data } = await api.post<BillingSale>(`/mitra/units/${unitId}/billing`, body);
  return data;
}

export async function deleteBillingSale(unitId: string, saleId: string): Promise<void> {
  await api.delete(`/mitra/units/${unitId}/billing/${saleId}`);
}

export async function listExpenses(
  unitId: string,
  params?: { from_date?: string; to_date?: string; limit?: number; offset?: number },
): Promise<ExpenseListResponse> {
  const { data } = await api.get<ExpenseListResponse>(`/mitra/units/${unitId}/expenses`, { params });
  return data;
}

export async function createExpense(
  unitId: string,
  body: {
    expense_date: string;
    supplier: string;
    category: string;
    description: string;
    amount_inr: number;
    bill_no?: string | null;
    flock_batch_ref?: string | null;
    paid_inr?: number | null;
    balance_inr?: number | null;
    remarks?: string | null;
  },
): Promise<ExpenseItem> {
  const { data } = await api.post<ExpenseItem>(`/mitra/units/${unitId}/expenses`, body);
  return data;
}

export async function fetchProfitSummary(
  unitId: string,
  flock_batch_ref?: string,
): Promise<ProfitSummary> {
  const { data } = await api.get<ProfitSummary>(`/mitra/units/${unitId}/profit-summary`, {
    params: flock_batch_ref ? { flock_batch_ref } : undefined,
  });
  return data;
}

export async function exportFarmUnit(
  unitId: string,
  opts?: { format?: "csv" | "json"; include_daily?: boolean },
): Promise<Blob> {
  const { data } = await api.get(`/mitra/units/${unitId}/export`, {
    params: {
      format: opts?.format ?? "csv",
      include_daily: opts?.include_daily ?? true,
    },
    responseType: "blob",
  });
  return data as Blob;
}
