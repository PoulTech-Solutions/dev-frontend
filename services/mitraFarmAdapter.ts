import {
  calcFeedPerBirdG,
  calcLayPercent,
  dayNumberFromHatch,
  sortRecords,
} from "../utils/farmRecordCalc";
import { resolvePhase } from "../utils/farmRecordPhases";
import { emptyFlockBook, type ShedDailyRecord, type ShedFlockBook } from "../utils/farmRecordTypes";
import type { FarmPortfolioSummary, SavedFarm, SavedShed } from "./localRecords";
import {
  createFarmUnit,
  deleteDailyRecord,
  getFarmUnit,
  listAllDailyRecords,
  listFarmUnits,
  type FarmUnit,
  type FarmUnitCreateRequest,
  type FarmUnitType,
  type MitraDailyRecord,
  updateDailyRecord,
  updateFarmUnit,
  upsertDailyRecord,
} from "./mitraService";

const OPS_PREFIX = "ops:";
const MED_PREFIX = "med:";

function placeFromUnit(unit: FarmUnit): string {
  return [unit.village_city, unit.district, unit.state].filter(Boolean).join(", ") || unit.district;
}

function parseRemarks(raw: unknown): {
  operationsVaccination?: string;
  medication?: string;
  remark?: string;
} {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return {};
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  let operationsVaccination: string | undefined;
  let medication: string | undefined;
  const rest: string[] = [];
  for (const line of lines) {
    if (line.toLowerCase().startsWith(OPS_PREFIX)) {
      operationsVaccination = line.slice(OPS_PREFIX.length).trim();
    } else if (line.toLowerCase().startsWith(MED_PREFIX)) {
      medication = line.slice(MED_PREFIX.length).trim();
    } else {
      rest.push(line);
    }
  }
  return {
    operationsVaccination,
    medication,
    remark: rest.join("\n") || undefined,
  };
}

function encodeRemarks(input: {
  operationsVaccination?: string;
  medication?: string;
  remark?: string;
}): string | undefined {
  const parts: string[] = [];
  if (input.operationsVaccination?.trim()) parts.push(`${OPS_PREFIX} ${input.operationsVaccination.trim()}`);
  if (input.medication?.trim()) parts.push(`${MED_PREFIX} ${input.medication.trim()}`);
  if (input.remark?.trim()) parts.push(input.remark.trim());
  return parts.length ? parts.join("\n") : undefined;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mitraRecordToShedDaily(
  record: MitraDailyRecord,
  hatchDate: string,
): ShedDailyRecord {
  const data = record.data ?? {};
  const opening = num(data.opening_birds, num(data.closing_birds));
  const mortality = num(data.mortality);
  const feedKg = num(data.feed_kg);
  const eggTrays = data.egg_trays != null ? num(data.egg_trays) : undefined;
  const eggNumbers = data.egg_numbers != null ? num(data.egg_numbers) : undefined;
  const dayNumber = data.age_days != null ? num(data.age_days, 1) : dayNumberFromHatch(hatchDate || record.record_date, record.record_date);
  const phase = resolvePhase(Math.max(1, dayNumber));
  const parsed = parseRemarks(data.remarks);

  return {
    id: record.id,
    date: record.record_date,
    dayNumber: Math.max(1, dayNumber),
    period: phase.period,
    flockSize: opening,
    mortality,
    feedKg,
    feedPerBirdG:
      data.feed_g_per_bird != null
        ? num(data.feed_g_per_bird)
        : calcFeedPerBirdG(feedKg, opening),
    eggTrays,
    eggNumbers,
    layPercent:
      data.lay_percent != null
        ? num(data.lay_percent)
        : eggNumbers != null
          ? calcLayPercent(eggNumbers, opening)
          : undefined,
    operationsVaccination: parsed.operationsVaccination,
    medication: parsed.medication,
    remark: parsed.remark,
  };
}

export function shedDailyToMitraPayload(record: ShedDailyRecord): Record<string, unknown> {
  const closing = Math.max(0, record.flockSize - Math.max(0, record.mortality));
  const payload: Record<string, unknown> = {
    age_days: record.dayNumber,
    opening_birds: record.flockSize,
    mortality: record.mortality,
    closing_birds: closing,
    feed_kg: record.feedKg,
    feed_g_per_bird: record.feedPerBirdG || calcFeedPerBirdG(record.feedKg, record.flockSize),
  };
  if (record.period === "laying" || record.eggNumbers != null || record.eggTrays != null) {
    if (record.eggNumbers != null) payload.egg_numbers = record.eggNumbers;
    if (record.eggTrays != null) payload.egg_trays = record.eggTrays;
    if (record.layPercent != null) payload.lay_percent = record.layPercent;
  }
  const remarks = encodeRemarks({
    operationsVaccination: record.operationsVaccination,
    medication: record.medication,
    remark: record.remark,
  });
  if (remarks) payload.remarks = remarks;
  return payload;
}

export function unitToFlockBook(unit: FarmUnit, daily: MitraDailyRecord[]): ShedFlockBook {
  const hatchDate = unit.hatch_date || new Date().toISOString().slice(0, 10);
  const records = sortRecords(daily.map((row) => mitraRecordToShedDaily(row, hatchDate)));
  const last = records[records.length - 1];
  return emptyFlockBook({
    hatchDate,
    chicksReceived: unit.birds_placed ?? 0,
    proprietor: unit.proprietor ?? "",
    henHoused: unit.birds_placed ?? 0,
    period: last?.period ?? "growing",
    dailyRecords: records,
  });
}

export function unitToSavedFarm(unit: FarmUnit, daily: MitraDailyRecord[] = []): SavedFarm {
  const book = unitToFlockBook(unit, daily);
  const birds = String(unit.birds_placed ?? book.henHoused ?? 0);
  const shed: SavedShed = {
    id: unit.id,
    name: unit.farm_type,
    birds,
    age: book.hatchDate,
    eggs: String(book.dailyRecords.reduce((sum, row) => sum + (row.eggNumbers ?? 0), 0) || ""),
    mortality: "",
    flockBook: book,
  };
  return {
    id: unit.id,
    userId: "",
    name: unit.name,
    place: placeFromUnit(unit),
    source: "user",
    sheds: [shed],
  };
}

export function summarizeUnitsAsPortfolio(units: FarmUnit[], books?: Map<string, ShedFlockBook>): FarmPortfolioSummary {
  let liveBirds = 0;
  let recordDays = 0;
  let topFarmName: string | null = null;
  let topBirds = -1;

  units.forEach((unit) => {
    const book = books?.get(unit.id);
    const birds = book
      ? book.dailyRecords.length
        ? Math.max(
            0,
            book.dailyRecords[book.dailyRecords.length - 1].flockSize -
              book.dailyRecords[book.dailyRecords.length - 1].mortality,
          )
        : book.henHoused || book.chicksReceived || unit.birds_placed || 0
      : unit.birds_placed || 0;
    liveBirds += birds;
    recordDays += book?.dailyRecords.length ?? 0;
    if (birds > topBirds) {
      topBirds = birds;
      topFarmName = unit.name;
    }
  });

  return {
    farmCount: units.length,
    shedCount: units.length,
    liveBirds,
    recordDays,
    topFarmName,
  };
}

export async function loadMitraFarms(): Promise<SavedFarm[]> {
  const listed = await listFarmUnits();
  return listed.items.map((unit) => unitToSavedFarm(unit));
}

export async function loadMitraFarmShed(
  unitId: string,
): Promise<{ farm: SavedFarm; shed: SavedShed; unit: FarmUnit } | null> {
  const [unit, daily] = await Promise.all([getFarmUnit(unitId), listAllDailyRecords(unitId)]);
  const farm = unitToSavedFarm(unit, daily);
  const shed = farm.sheds[0];
  if (!shed) return null;
  return { farm, shed, unit };
}

export async function createMitraFarmUnit(input: {
  name: string;
  place?: string;
  farm_type?: FarmUnitType;
  contact_phone: string;
  state: string;
  district: string;
  village_city?: string;
  pincode?: string;
  birds_placed?: number;
  hatch_date?: string;
  proprietor?: string;
}): Promise<SavedFarm> {
  const body: FarmUnitCreateRequest = {
    name: input.name.trim(),
    farm_type: input.farm_type ?? "layer",
    contact_phone: input.contact_phone.trim(),
    state: input.state.trim(),
    district: input.district.trim(),
    village_city: input.village_city?.trim() || input.place?.trim() || null,
    pincode: input.pincode?.trim() || null,
    birds_placed: input.birds_placed ?? null,
    hatch_date: input.hatch_date || null,
    proprietor: input.proprietor?.trim() || null,
  };
  const unit = await createFarmUnit(body);
  return unitToSavedFarm(unit);
}

export async function saveMitraFlockSetup(
  unitId: string,
  book: ShedFlockBook,
): Promise<{ farm: SavedFarm; shed: SavedShed }> {
  const unit = await updateFarmUnit(unitId, {
    hatch_date: book.hatchDate,
    birds_placed: book.chicksReceived || book.henHoused || 0,
    proprietor: book.proprietor || null,
  });
  const daily = await listAllDailyRecords(unitId);
  const farm = unitToSavedFarm(unit, daily);
  return { farm, shed: farm.sheds[0] };
}

export async function saveMitraDailyEntry(
  unitId: string,
  record: ShedDailyRecord,
  opts?: { isEdit?: boolean },
): Promise<{ farm: SavedFarm; shed: SavedShed }> {
  const payload = {
    record_date: record.date,
    data: shedDailyToMitraPayload(record),
  };
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    record.id,
  );
  if (opts?.isEdit && looksLikeUuid) {
    await updateDailyRecord(unitId, record.id, payload);
  } else {
    await upsertDailyRecord(unitId, payload);
  }
  const loaded = await loadMitraFarmShed(unitId);
  if (!loaded) throw new Error("Unit not found after save");
  return { farm: loaded.farm, shed: loaded.shed };
}

export async function removeMitraDailyEntry(
  unitId: string,
  recordId: string,
): Promise<{ farm: SavedFarm; shed: SavedShed }> {
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    recordId,
  );
  if (looksLikeUuid) {
    await deleteDailyRecord(unitId, recordId);
  }
  const loaded = await loadMitraFarmShed(unitId);
  if (!loaded) throw new Error("Unit not found after delete");
  return { farm: loaded.farm, shed: loaded.shed };
}
