import { api } from "./api";

const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
const statesMemo: { at: number; data: GeoNameListResponse | null } = { at: 0, data: null };
const districtMemo = new Map<string, { at: number; data: GeoNameListResponse }>();
const tehsilMemo = new Map<string, { at: number; data: GeoNameListResponse }>();

function stillFresh(at: number): boolean {
  return Date.now() - at < CATALOG_TTL_MS;
}

export interface GeoPincodeItem {
  pincode: string;
  state: string;
  district: string;
  tehsil?: string | null;
  label: string;
}

export interface GeoPincodeSearchResponse {
  items: GeoPincodeItem[];
  query: string;
}

export interface GeoNameItem {
  name: string;
}

export interface GeoNameListResponse {
  items: GeoNameItem[];
}

export async function searchPincodes(q: string, limit = 15): Promise<GeoPincodeSearchResponse> {
  const { data } = await api.get<GeoPincodeSearchResponse>("/geo/pincodes/search", {
    params: { q, limit },
  });
  return data;
}

export async function fetchPincode(pincode: string): Promise<GeoPincodeItem> {
  const { data } = await api.get<GeoPincodeItem>(`/geo/pincodes/${pincode}`);
  return data;
}

export async function listGeoStates(): Promise<GeoNameListResponse> {
  if (statesMemo.data && stillFresh(statesMemo.at)) return statesMemo.data;
  const { data } = await api.get<GeoNameListResponse>("/geo/states");
  statesMemo.data = data;
  statesMemo.at = Date.now();
  return data;
}

export async function listGeoDistricts(state: string): Promise<GeoNameListResponse> {
  const key = state.trim().toLowerCase();
  const hit = districtMemo.get(key);
  if (hit && stillFresh(hit.at)) return hit.data;
  const { data } = await api.get<GeoNameListResponse>("/geo/districts", {
    params: { state },
  });
  districtMemo.set(key, { at: Date.now(), data });
  return data;
}

export async function listGeoPincodes(
  state: string,
  district: string,
  limit = 80,
  tehsil?: string,
): Promise<GeoPincodeSearchResponse> {
  const { data } = await api.get<GeoPincodeSearchResponse>("/geo/pincodes", {
    params: { state, district, limit, tehsil: tehsil || undefined },
  });
  return data;
}

export async function listGeoTehsils(state: string, district: string): Promise<GeoNameListResponse> {
  const key = `${state.trim().toLowerCase()}|${district.trim().toLowerCase()}`;
  const hit = tehsilMemo.get(key);
  if (hit && stillFresh(hit.at)) return hit.data;
  const { data } = await api.get<GeoNameListResponse>("/geo/tehsils", {
    params: { state, district },
  });
  tehsilMemo.set(key, { at: Date.now(), data });
  return data;
}

export interface GeoOfficeItem {
  name: string;
  pincode: string;
  taluk?: string | null;
  office_type?: string | null;
  label: string;
}

export async function listGeoOffices(
  state: string,
  district: string,
  tehsil?: string,
  limit = 80,
  q?: string,
): Promise<{ items: GeoOfficeItem[] }> {
  const { data } = await api.get<{ items: GeoOfficeItem[] }>("/geo/offices", {
    params: { state, district, tehsil: tehsil || undefined, limit, q: q || undefined },
  });
  return data;
}