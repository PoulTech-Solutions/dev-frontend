import { create } from "zustand";

export interface AdminDemoRate {
  id: string;
  title: string;
  unit: string;
  value: string;
  previousValue: string;
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
  { id: "eggs", title: "Eggs", unit: "per tray", value: "180", previousValue: "175", history: [162, 166, 164, 170, 172, 175, 180] },
  { id: "culls", title: "Culls birds", unit: "per bird", value: "140", previousValue: "135", history: [128, 130, 127, 132, 134, 135, 140] },
  { id: "broilers", title: "Broilers", unit: "per kg", value: "115", previousValue: "110", history: [103, 105, 104, 108, 107, 110, 115] },
  { id: "feed", title: "Feed raw materials", unit: "per kg", value: "32", previousValue: "30", history: [27, 28, 27.5, 29, 28, 30, 32] },
];

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
      const nextValue = Number(value);
      if (!Number.isFinite(nextValue)) return state;

      return {
        rates: state.rates.map((rate) =>
          rate.id === id
            ? {
                ...rate,
                previousValue: rate.value,
                value,
                history: [...rate.history.slice(-6), nextValue],
              }
            : rate,
        ),
      };
    }),
}));
