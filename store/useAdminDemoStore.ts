import { create } from "zustand";

export type RateWindow = "days" | "month" | "year";

export interface AdminDemoRate {
  id: string;
  title: string;
  unit: string;
  value: string;
  previousValue: string;
  nextValue: string;
  month: number[];
  year: number[];
  history: number[];
}

export interface AdminDemoSale {
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface AdminDemoFarm {
  id: string;
  name: string;
  owner: string;
  location: string;
  sales: AdminDemoSale[];
}

interface AdminDemoState {
  rates: AdminDemoRate[];
  farms: AdminDemoFarm[];
  updateRate: (id: string, value: string) => void;
}

const demoRates: AdminDemoRate[] = [
  {
    id: "eggs",
    title: "Eggs",
    unit: "per tray",
    value: "180",
    previousValue: "175",
    nextValue: "184",
    month: [162, 164, 161, 166, 168, 165, 163, 167, 170, 169, 172, 171, 168, 166, 169, 173, 175, 172, 170, 174, 176, 174, 171, 169, 172, 176, 178, 177, 175, 180],
    year: [192, 188, 184, 179, 186, 181, 176, 183, 178, 174, 177, 180],
    history: [169, 172, 176, 178, 177, 175, 180],
  },
  {
    id: "culls",
    title: "Culls birds",
    unit: "per bird",
    value: "140",
    previousValue: "146",
    nextValue: "135",
    month: [118, 121, 119, 124, 126, 123, 128, 130, 127, 132, 134, 131, 136, 138, 135, 139, 142, 140, 144, 147, 145, 149, 151, 148, 150, 152, 149, 147, 146, 140],
    year: [158, 154, 161, 157, 152, 149, 155, 150, 146, 148, 143, 140],
    history: [149, 151, 148, 150, 152, 146, 140],
  },
  {
    id: "broilers",
    title: "Broilers",
    unit: "per kg",
    value: "115",
    previousValue: "110",
    nextValue: "119",
    month: [128, 126, 129, 127, 124, 122, 125, 121, 119, 123, 120, 118, 121, 117, 116, 119, 115, 113, 116, 114, 112, 114, 111, 109, 112, 110, 108, 111, 110, 115],
    year: [96, 99, 94, 101, 104, 98, 106, 103, 108, 105, 112, 115],
    history: [112, 110, 108, 111, 110, 110, 115],
  },
  {
    id: "feed",
    title: "Feed raw materials",
    unit: "per kg",
    value: "32",
    previousValue: "30",
    nextValue: "34",
    month: [34, 33.5, 34, 33, 32.5, 33, 32, 31.5, 32, 31, 31.5, 30.5, 31, 30, 30.5, 29.5, 30, 29, 29.5, 30, 30.5, 31, 30, 30.5, 31, 31.5, 31, 30, 32],
    year: [28, 29, 27, 30, 31, 29, 32, 30, 31, 33, 31, 32],
    history: [30.5, 31, 31.5, 31, 30, 30, 32],
  },
];

export function rateSeries(rate: AdminDemoRate, window: RateWindow) {
  if (window === "month") return rate.month;
  if (window === "year") return rate.year;
  return rate.history;
}

export function rateDelta(values: number[] | null | undefined) {
  if (!values || values.length < 2) return 0;
  return Math.round((values[values.length - 1] - values[0]) * 10) / 10;
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function ratePoints(values: number[], window: RateWindow, today = new Date()) {
  if (window === "year") {
    return values.map((value, index) => ({
      at: new Date(today.getFullYear(), today.getMonth() - (values.length - 1 - index), 1),
      value,
    }));
  }
  const offset = values.length - 1;
  return values.map((value, index) => ({ at: shiftDate(today, index - offset), value }));
}

const demoFarms: AdminDemoFarm[] = [
  {
    id: "demo-farm-1",
    name: "Green Valley Poultry",
    owner: "Demo Farm Owner",
    location: "Pune, Maharashtra",
    sales: [
      { category: "Eggs", quantity: 120, unit: "trays", unitPrice: 180, total: 21600 },
      { category: "Broilers", quantity: 350, unit: "kg", unitPrice: 115, total: 40250 },
      { category: "Culls birds", quantity: 12, unit: "birds", unitPrice: 140, total: 1680 },
    ],
  },
  {
    id: "demo-farm-2",
    name: "Sunrise Poultry Farm",
    owner: "Sample Farm Owner",
    location: "Nashik, Maharashtra",
    sales: [
      { category: "Eggs", quantity: 85, unit: "trays", unitPrice: 180, total: 15300 },
      { category: "Broilers", quantity: 210, unit: "kg", unitPrice: 115, total: 24150 },
      { category: "Feed raw materials", quantity: 60, unit: "kg", unitPrice: 32, total: 1920 },
    ],
  },
];

export const useAdminDemoStore = create<AdminDemoState>((set) => ({
  rates: demoRates,
  farms: demoFarms,
  updateRate: (id, value) =>
    set((state) => {
      const next = Number(value);
      if (!Number.isFinite(next)) return state;

      return {
        rates: state.rates.map((rate) => {
          if (rate.id !== id) return rate;
          const today = Number(rate.value);
          const forecast = Math.round((next + (next - today)) * 10) / 10;
          const month = [...rate.month.slice(1), next];
          const year = [...rate.year.slice(0, -1), next];
          return {
            ...rate,
            previousValue: rate.value,
            value,
            nextValue: String(forecast),
            month,
            year,
            history: month.slice(-7),
          };
        }),
      };
    }),
}));
