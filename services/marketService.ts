import { api } from "./api";

export interface MarketTickerItem {
  label: string;
  value: string;
  change: number;
  zone: string;
}

export interface MarketRateCard {
  id: string;
  title: string;
  unit: string;
  value: string;
  previousValue: string;
  nextValue: string;
  month: number[];
  year: number[];
  history: number[];
  live?: boolean;
  source?: string;
  zone?: string;
  month_average?: string | null;
  necc_sheet_average?: string | null;
}

export interface MarketDashboardMetadata {
  source: string;
  disclaimer: string;
  display_unit: string;
  selected_zone: string;
  resolved_zone: string | null;
  match_status: string;
  fallback_zone: string;
  fetched_at: string | null;
  price_as_of?: string | null;
  is_live_today?: boolean;
}

export interface MarketDashboardResponse {
  metadata: MarketDashboardMetadata;
  rates: MarketRateCard[];
  ticker: MarketTickerItem[];
}

export interface MarketZoneItem {
  name: string;
  state?: string | null;
  today_value?: string | null;
  today_change?: number | null;
}

export interface MarketZonesResponse {
  zones: MarketZoneItem[];
  default_zone: string;
}

export interface MarketTrendResponse {
  zone: string;
  window: string;
  unit: string;
  series: number[];
  points: { date: string; value: number }[];
  year?: number | null;
  month?: number | null;
  week?: number | null;
  sheet_average?: string | null;
}

export interface MarketCoverageResponse {
  zone: string;
  years: number[];
  months: Record<string, number[]>;
  weeks: Record<string, number[]>;
}

export async function fetchMarketDashboard(zone?: string): Promise<MarketDashboardResponse> {
  const { data } = await api.get<MarketDashboardResponse>("/market/dashboard", {
    params: zone ? { zone } : undefined,
  });
  return data;
}

export async function fetchMarketZones(includeToday = true): Promise<MarketZonesResponse> {
  const { data } = await api.get<MarketZonesResponse>("/market/zones", {
    params: { include_today: includeToday },
  });
  return data;
}

export async function setMarketZonePreference(zone: string): Promise<{ market_preferred_zone: string }> {
  const { data } = await api.patch<{ market_preferred_zone: string }>("/market/zone-preference", {
    zone,
  });
  return data;
}

export async function fetchEggTrend(
  zone: string,
  window: "days" | "month" | "year",
  opts?: { year?: number; month?: number; week?: number },
): Promise<MarketTrendResponse> {
  const { data } = await api.get<MarketTrendResponse>("/market/eggs/trend", {
    params: {
      zone,
      window,
      ...(opts?.year != null ? { year: opts.year } : {}),
      ...(opts?.month != null ? { month: opts.month } : {}),
      ...(opts?.week != null ? { week: opts.week } : {}),
    },
  });
  return data;
}

export async function fetchEggCoverage(zone: string): Promise<MarketCoverageResponse> {
  const { data } = await api.get<MarketCoverageResponse>("/market/eggs/coverage", {
    params: { zone },
  });
  return data;
}

export interface MarketDayPrice {
  day: number;
  date: string;
  price: string | null;
}

export interface MarketEggSheetResponse {
  zone: string;
  year: number;
  month: number;
  today: string | null;
  yesterday: string | null;
  tomorrow: string | null;
  necc_sheet_average: string | null;
  computed_daily_average: string | null;
  days: MarketDayPrice[];
}

export interface MarketCompareResponse {
  zones: MarketTickerItem[];
  as_of: string | null;
}

export async function fetchEggSheet(
  zone: string,
  year: number,
  month: number,
): Promise<MarketEggSheetResponse> {
  const { data } = await api.get<MarketEggSheetResponse>("/market/eggs/sheet", {
    params: { zone, year, month },
  });
  return data;
}

export interface MarketPoultrySheetResponse {
  product: string;
  zone: string;
  year: number;
  month: number;
  today: string | null;
  yesterday: string | null;
  tomorrow: string | null;
  month_average: string | null;
  days: MarketDayPrice[];
}

export async function fetchPoultryCoverage(
  product: "culls" | "broilers",
  zone: string,
): Promise<MarketCoverageResponse> {
  const { data } = await api.get<MarketCoverageResponse>("/market/poultry/coverage", {
    params: { product, zone },
  });
  return data;
}

export async function fetchPoultryTrend(
  product: "culls" | "broilers",
  zone: string,
  window: "days" | "month" | "year",
  opts?: { year?: number; month?: number; week?: number },
): Promise<MarketTrendResponse> {
  const { data } = await api.get<MarketTrendResponse>("/market/poultry/trend", {
    params: {
      product,
      zone,
      window,
      ...(opts?.year != null ? { year: opts.year } : {}),
      ...(opts?.month != null ? { month: opts.month } : {}),
      ...(opts?.week != null ? { week: opts.week } : {}),
    },
  });
  return data;
}

export async function fetchPoultrySheet(
  product: "culls" | "broilers",
  zone: string,
  year: number,
  month: number,
): Promise<MarketPoultrySheetResponse> {
  const { data } = await api.get<MarketPoultrySheetResponse>("/market/poultry/sheet", {
    params: { product, zone, year, month },
  });
  return data;
}

export async function fetchCitiesToday(): Promise<MarketCompareResponse> {
  const { data } = await api.get<MarketCompareResponse>("/market/eggs/cities-today");
  return data;
}

export async function fetchEggCompare(zones: string[]): Promise<MarketCompareResponse> {
  const { data } = await api.get<MarketCompareResponse>("/market/eggs/compare", {
    params: { zones: zones.join(",") },
  });
  return data;
}

export interface ManualPoultryRateUpsertRequest {
  product: "culls" | "broilers";
  zone: string;
  today?: string;
  yesterday?: string;
  tomorrow?: string;
  apply_all_zones?: boolean;
}

export interface ManualPoultryRateUpsertResponse {
  product: string;
  zone: string;
  source: string;
  today: string;
  yesterday: string | null;
  tomorrow: string | null;
  today_source_date?: string | null;
  yesterday_source_date?: string | null;
  today_carried?: boolean;
  yesterday_carried?: boolean;
  today_editable?: boolean;
  yesterday_editable?: boolean;
  tomorrow_editable?: boolean;
  zones_updated?: number;
  apply_all_zones?: boolean;
}

export interface ManualPoultryRateReadResponse {
  product: string;
  zone: string;
  source: string;
  today: string | null;
  yesterday: string | null;
  tomorrow: string | null;
  today_source_date?: string | null;
  yesterday_source_date?: string | null;
  today_carried?: boolean;
  yesterday_carried?: boolean;
  today_editable?: boolean;
  yesterday_editable?: boolean;
  tomorrow_editable?: boolean;
}

export async function fetchPoultryRates(
  product: "culls" | "broilers",
  zone: string,
): Promise<ManualPoultryRateReadResponse> {
  const { data } = await api.get<ManualPoultryRateReadResponse>("/market/admin/poultry-rates", {
    params: { product, zone },
  });
  return data;
}

export async function upsertPoultryRates(
  body: ManualPoultryRateUpsertRequest,
): Promise<ManualPoultryRateUpsertResponse> {
  const { data } = await api.put<ManualPoultryRateUpsertResponse>("/market/admin/poultry-rates", body);
  return data;
}
