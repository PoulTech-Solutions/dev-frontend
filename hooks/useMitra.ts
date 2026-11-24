import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBillingSale,
  createExpense,
  createFarmUnit,
  deleteBillingSale,
  deleteFarmUnit,
  fetchProfitSummary,
  listBillingSales,
  listExpenses,
  listFarmUnits,
  type BillingSaleCreateRequest,
  type FarmUnitCreateRequest,
  type FarmUnitUpdateRequest,
  updateFarmUnit,
} from "../services/mitraService";
import { useLiveMarketApiEnabled } from "./useMarketDemoMode";

/**
 * Compatibility stub for a removed owner-dashboard hook.
 * Keeps stale Fast Refresh clients from crashing; always disabled.
 * Prefer admin farm reports via `useAdminMitraDashboard` on `/admin/dashboard`.
 */
export function useMitraDashboard(_enabled = false) {
  return useQuery({
    queryKey: ["mitra", "dashboard", "removed"],
    queryFn: async () => null,
    enabled: false,
  });
}

/** Owner Mitra API hooks (units, billing, expenses, profit). */
export function useMitraUnits(enabled = true) {
  const live = useLiveMarketApiEnabled(enabled);
  return useQuery({
    queryKey: ["mitra", "units"],
    queryFn: listFarmUnits,
    enabled: live,
    staleTime: 30_000,
  });
}

export function useCreateMitraUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FarmUnitCreateRequest) => createFarmUnit(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mitra", "units"] });
    },
  });
}

export function useUpdateMitraUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, body }: { unitId: string; body: FarmUnitUpdateRequest }) =>
      updateFarmUnit(unitId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mitra", "units"] });
    },
  });
}

export function useDeleteMitraUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => deleteFarmUnit(unitId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mitra", "units"] });
    },
  });
}

export function useMitraBilling(unitId: string | null | undefined, enabled = true) {
  const live = useLiveMarketApiEnabled(enabled && Boolean(unitId));
  return useQuery({
    queryKey: ["mitra", "billing", unitId],
    queryFn: () => listBillingSales(unitId!, { limit: 200 }),
    enabled: live && Boolean(unitId),
    staleTime: 20_000,
  });
}

export function useCreateMitraBilling(unitId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BillingSaleCreateRequest) => {
      if (!unitId) throw new Error("Select a farm unit first");
      return createBillingSale(unitId, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mitra", "billing", unitId] });
      void qc.invalidateQueries({ queryKey: ["mitra", "profit", unitId] });
    },
  });
}

export function useDeleteMitraBilling(unitId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (saleId: string) => {
      if (!unitId) throw new Error("Select a farm unit first");
      return deleteBillingSale(unitId, saleId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mitra", "billing", unitId] });
      void qc.invalidateQueries({ queryKey: ["mitra", "profit", unitId] });
    },
  });
}

export function useMitraExpenses(unitId: string | null | undefined, enabled = true) {
  const live = useLiveMarketApiEnabled(enabled && Boolean(unitId));
  return useQuery({
    queryKey: ["mitra", "expenses", unitId],
    queryFn: () => listExpenses(unitId!, { limit: 200 }),
    enabled: live && Boolean(unitId),
    staleTime: 20_000,
  });
}

export function useCreateMitraExpense(unitId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      expense_date: string;
      supplier: string;
      category: string;
      description: string;
      amount_inr: number;
      paid_inr?: number;
    }) => {
      if (!unitId) throw new Error("Select a farm unit first");
      return createExpense(unitId, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mitra", "expenses", unitId] });
      void qc.invalidateQueries({ queryKey: ["mitra", "profit", unitId] });
    },
  });
}

export function useMitraProfit(unitId: string | null | undefined, enabled = true) {
  const live = useLiveMarketApiEnabled(enabled && Boolean(unitId));
  return useQuery({
    queryKey: ["mitra", "profit", unitId],
    queryFn: () => fetchProfitSummary(unitId!),
    enabled: live && Boolean(unitId),
    staleTime: 20_000,
  });
}
