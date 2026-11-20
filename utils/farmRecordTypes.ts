export type LayerPeriod = "growing" | "laying";

export interface ShedDailyRecord {
  id: string;
  date: string;
  dayNumber: number;
  period: LayerPeriod;
  flockSize: number;
  mortality: number;
  feedKg: number;
  feedPerBirdG: number;
  eggTrays?: number;
  eggNumbers?: number;
  layPercent?: number;
  operationsVaccination?: string;
  medication?: string;
  remark?: string;
}

export interface ShedFlockBook {
  birdType: "layer";
  hatchDate: string;
  chicksReceived: number;
  proprietor: string;
  henHoused: number;
  period: LayerPeriod;
  dailyRecords: ShedDailyRecord[];
}

export function emptyFlockBook(overrides?: Partial<ShedFlockBook>): ShedFlockBook {
  return {
    birdType: "layer",
    hatchDate: new Date().toISOString().slice(0, 10),
    chicksReceived: 0,
    proprietor: "",
    henHoused: 0,
    period: "growing",
    dailyRecords: [],
    ...overrides,
  };
}
