import { resolvePhase } from "./farmRecordPhases";
import type { LayerPeriod, ShedDailyRecord, ShedFlockBook } from "./farmRecordTypes";

const EGGS_PER_TRAY = 30;

export function dayNumberFromHatch(hatchDate: string, entryDate: string): number {
  const hatch = new Date(`${hatchDate}T00:00:00`);
  const entry = new Date(`${entryDate}T00:00:00`);
  if (Number.isNaN(hatch.getTime()) || Number.isNaN(entry.getTime())) return 1;
  const diff = Math.floor((entry.getTime() - hatch.getTime()) / 86_400_000) + 1;
  return Math.max(1, diff);
}

export function calcFeedPerBirdG(feedKg: number, flockSize: number): number {
  if (!flockSize || flockSize <= 0 || !feedKg) return 0;
  return Math.round(((feedKg * 1000) / flockSize) * 100) / 100;
}

export function calcEggNumbers(trays: number, looseEggs = 0): number {
  return Math.max(0, Math.round(trays * EGGS_PER_TRAY + looseEggs));
}

export function calcLayPercent(eggNumbers: number, flockSize: number): number {
  if (!flockSize || flockSize <= 0 || !eggNumbers) return 0;
  return Math.round((eggNumbers / flockSize) * 10000) / 100;
}

export function closingFlockSize(openingFlockSize: number, mortality: number): number {
  return Math.max(0, openingFlockSize - Math.max(0, mortality));
}

export function sortRecords(records: ShedDailyRecord[]): ShedDailyRecord[] {
  return [...records].sort((a, b) => a.date.localeCompare(b.date) || a.dayNumber - b.dayNumber);
}

export function latestFlockSize(book: ShedFlockBook): number {
  const sorted = sortRecords(book.dailyRecords);
  const last = sorted[sorted.length - 1];
  if (!last) return book.henHoused || book.chicksReceived || 0;
  return closingFlockSize(last.flockSize, last.mortality);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate(new Date());
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

/**
 * Sensible default date for "Add record":
 * - First row → hatch date (Day 1 / Growing), not "today" (avoids jumping to Phase-3).
 * - Later rows → day after the last saved date (continuous book).
 */
export function nextEntryDate(book: ShedFlockBook): string {
  const hatch = book.hatchDate?.trim();
  const sorted = sortRecords(book.dailyRecords);
  if (!sorted.length) return hatch || isoDate(new Date());
  const last = sorted[sorted.length - 1].date;
  return addDaysIso(last, 1);
}

export function buildDailyRecord(input: {
  id?: string;
  date: string;
  hatchDate: string;
  period?: LayerPeriod;
  flockSize: number;
  mortality: number;
  feedKg: number;
  eggTrays?: number;
  eggNumbers?: number;
  operationsVaccination?: string;
  medication?: string;
  remark?: string;
}): ShedDailyRecord {
  const dayNumber = dayNumberFromHatch(input.hatchDate, input.date);
  const phase = resolvePhase(dayNumber);
  const period = input.period ?? phase.period;
  const mortality = Math.max(0, Number(input.mortality) || 0);
  const flockSize = Math.max(0, Number(input.flockSize) || 0);
  const feedKg = Math.max(0, Number(input.feedKg) || 0);
  const eggTrays = period === "laying" ? Math.max(0, Number(input.eggTrays) || 0) : undefined;
  const eggNumbers =
    period === "laying"
      ? Math.max(0, Number(input.eggNumbers) || calcEggNumbers(eggTrays ?? 0))
      : undefined;

  return {
    id: input.id ?? `rec-${Date.now()}`,
    date: input.date,
    dayNumber,
    period,
    flockSize,
    mortality,
    feedKg,
    feedPerBirdG: calcFeedPerBirdG(feedKg, flockSize),
    eggTrays,
    eggNumbers,
    layPercent: period === "laying" ? calcLayPercent(eggNumbers ?? 0, flockSize) : undefined,
    operationsVaccination: input.operationsVaccination?.trim() || undefined,
    medication: input.medication?.trim() || undefined,
    remark: input.remark?.trim() || undefined,
  };
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}
