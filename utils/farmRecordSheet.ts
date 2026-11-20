import { formatNumber } from "./farmRecordCalc";
import {
  LAYER_PHASES,
  resolvePhase,
  weekFromDayNumber,
  type LayerPhaseInfo,
  type SheetKind,
} from "./farmRecordPhases";
import type { ShedDailyRecord, ShedFlockBook } from "./farmRecordTypes";

/** Exact Farm Record Book PDF palette */
export const SHEET_COLORS = {
  farmBlue: "#1D4ED8",
  farmBlueText: "#FFFFFF",
  phaseYellow: "#FACC15",
  phaseYellowText: "#0F172A",
  metaBlue: "#93C5FD",
  metaText: "#0F172A",
  /** Column header row (Date | Days | …) — medium blue, white text */
  headerBg: "#2563EB",
  headerText: "#FFFFFF",
  grid: "#0F172A",
  rowA: "#FFEDD5",
  rowB: "#EFF6FF",
  ink: "#0F172A",
} as const;

export type SheetColKey =
  | "date"
  | "day"
  | "flock"
  | "mort"
  | "feed"
  | "fpb"
  | "remark"
  | "ops"
  | "med"
  | "trays"
  | "eggs"
  | "pct";

export interface SheetColumn {
  key: SheetColKey;
  label: string;
  /** Relative width for layout */
  width: number;
  align: "left" | "right" | "center";
}

/** Growing sheet column order matches the PDF exactly. */
export const GROWING_COLUMNS: SheetColumn[] = [
  { key: "date", label: "Date", width: 92, align: "left" },
  { key: "day", label: "Days", width: 52, align: "center" },
  { key: "flock", label: "Flock size", width: 78, align: "right" },
  { key: "mort", label: "Mortality", width: 72, align: "right" },
  { key: "feed", label: "Feed(kg)", width: 70, align: "right" },
  { key: "fpb", label: "Feed/bird(gm)", width: 96, align: "right" },
  { key: "remark", label: "Remark", width: 140, align: "left" },
  { key: "ops", label: "Operations/Vaccination", width: 170, align: "left" },
  { key: "med", label: "Medication", width: 120, align: "left" },
];

/** Laying sheet column order matches the PDF exactly. */
export const LAYING_COLUMNS: SheetColumn[] = [
  { key: "date", label: "Date", width: 92, align: "left" },
  { key: "day", label: "Days", width: 52, align: "center" },
  { key: "flock", label: "Flock size", width: 78, align: "right" },
  { key: "mort", label: "Mortality", width: 72, align: "right" },
  { key: "trays", label: "Eggs trays", width: 78, align: "right" },
  { key: "eggs", label: "Eggs Numbers", width: 90, align: "right" },
  { key: "pct", label: "Percentage %", width: 90, align: "right" },
  { key: "feed", label: "Feed(kg)", width: 70, align: "right" },
  { key: "fpb", label: "Feed/Bird(gm)", width: 96, align: "right" },
  { key: "remark", label: "Remark", width: 160, align: "left" },
];

export function columnsForSheet(sheet: SheetKind): SheetColumn[] {
  return sheet === "growing" ? GROWING_COLUMNS : LAYING_COLUMNS;
}

/** Exact phase banner titles as printed on the Farm Record Book. */
export const PHASE_BANNER_TITLE: Record<string, string> = {
  growing: "Growing Period/Rearing Period",
  pre_layer_phase1: "Laying Period (Pre-Layer & Phase-1)",
  phase2: "Laying Period (Phase-2)",
  phase3: "Laying Period (Phase-3)",
};

export function phaseBannerTitle(phase: LayerPhaseInfo): string {
  return PHASE_BANNER_TITLE[phase.id] ?? phase.title;
}

export function cellValue(record: ShedDailyRecord, key: SheetColKey): string {
  switch (key) {
    case "date":
      return record.date;
    case "day":
      return String(record.dayNumber);
    case "flock":
      return String(record.flockSize);
    case "mort":
      return String(record.mortality);
    case "feed":
      return formatNumber(record.feedKg, 2);
    case "fpb":
      return formatNumber(record.feedPerBirdG, 2);
    case "remark":
      return record.remark?.trim() || "";
    case "ops":
      return record.operationsVaccination?.trim() || "";
    case "med":
      return record.medication?.trim() || "";
    case "trays":
      return formatNumber(record.eggTrays ?? 0, 2);
    case "eggs":
      return String(record.eggNumbers ?? 0);
    case "pct":
      return formatNumber(record.layPercent ?? 0, 2);
    default:
      return "";
  }
}

export function displayCell(record: ShedDailyRecord, key: SheetColKey): string {
  const value = cellValue(record, key);
  if (key === "ops" || key === "med" || key === "remark") return value || "—";
  return value;
}

export interface PhaseMetaItem {
  label: string;
  value: string;
}

export function formatHatchDisplay(iso: string): string {
  if (!iso || iso.length < 10) return iso || "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

/**
 * Middle title row between farm/phase banner and Date|Days headers.
 * Exact labels from the Farm Record Book spreadsheet.
 */
export function phaseMetaItems(
  phase: LayerPhaseInfo,
  book: ShedFlockBook,
  phaseRecords: ShedDailyRecord[],
): PhaseMetaItem[] {
  const first = phaseRecords[0];
  const henHoused = first?.flockSize ?? book.henHoused ?? book.chicksReceived ?? 0;
  const proprietor = book.proprietor?.trim() || "";

  if (phase.id === "growing") {
    return [
      { label: "Hatch Date", value: formatHatchDisplay(book.hatchDate) },
      { label: "Received chick", value: String(book.chicksReceived || 0) },
      { label: "Transport Mortality", value: "" },
    ];
  }

  const avgBwt =
    phase.id === "pre_layer_phase1" ? "1150gm" : phase.id === "phase2" ? "" : phase.id === "phase3" ? "" : "";

  const items: PhaseMetaItem[] = [
    { label: "Total Hen-Housed Birds", value: String(henHoused) },
    { label: "Avg Bwt at inhoused", value: avgBwt },
  ];
  if (phase.id === "pre_layer_phase1") {
    items.push({ label: "Costing per bird", value: "" });
  }
  items.push({ label: "Proprietor", value: proprietor });
  return items;
}

/** Render as `Label= value` for a meta cell (blank value still shows `Label=`). */
export function formatMetaCell(item: PhaseMetaItem): string {
  const value = item.value?.trim() ?? "";
  return value ? `${item.label}= ${value}` : `${item.label}=`;
}

export function groupRecordsByPhase(records: ShedDailyRecord[]): {
  phase: LayerPhaseInfo;
  records: ShedDailyRecord[];
}[] {
  return LAYER_PHASES.map((phase) => ({
    phase,
    records: records.filter((record) => resolvePhase(record.dayNumber).id === phase.id),
  })).filter((section) => section.records.length > 0 || records.length === 0);
}

export function weekRangeLabel(phase: LayerPhaseInfo): string {
  return phase.weekTo ? `Weeks ${phase.weekFrom}–${phase.weekTo}` : `Weeks ${phase.weekFrom}+`;
}

export { weekFromDayNumber, resolvePhase, LAYER_PHASES };
