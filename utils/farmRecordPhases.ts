import type { LayerPeriod } from "./farmRecordTypes";

/** Matches the Farm Record Book PDF sheet titles by bird age (week from hatch). */
export type LayerPhaseId = "growing" | "pre_layer_phase1" | "phase2" | "phase3";

export type SheetKind = "growing" | "laying";

export interface LayerPhaseInfo {
  id: LayerPhaseId;
  title: string;
  shortTitle: string;
  sheet: SheetKind;
  period: LayerPeriod;
  weekFrom: number;
  weekTo: number | null;
}

export const LAYER_PHASES: LayerPhaseInfo[] = [
  {
    id: "growing",
    title: "Growing Period/Rearing Period",
    shortTitle: "Growing",
    sheet: "growing",
    period: "growing",
    weekFrom: 1,
    weekTo: 17,
  },
  {
    id: "pre_layer_phase1",
    title: "Laying Period (Pre-Layer & Phase-1)",
    shortTitle: "Pre-Layer & Phase-1",
    sheet: "laying",
    period: "laying",
    weekFrom: 18,
    weekTo: 34,
  },
  {
    id: "phase2",
    title: "Laying Period (Phase-2)",
    shortTitle: "Phase-2",
    sheet: "laying",
    period: "laying",
    weekFrom: 35,
    weekTo: 68,
  },
  {
    id: "phase3",
    title: "Laying Period (Phase-3)",
    shortTitle: "Phase-3",
    sheet: "laying",
    period: "laying",
    weekFrom: 69,
    weekTo: null,
  },
];

export function weekFromDayNumber(dayNumber: number): number {
  return Math.max(1, Math.ceil(Math.max(1, dayNumber) / 7));
}

export function resolvePhase(dayNumber: number): LayerPhaseInfo {
  const week = weekFromDayNumber(dayNumber);
  const match = LAYER_PHASES.find((phase) => week >= phase.weekFrom && (phase.weekTo == null || week <= phase.weekTo));
  return match ?? LAYER_PHASES[LAYER_PHASES.length - 1];
}

export function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
