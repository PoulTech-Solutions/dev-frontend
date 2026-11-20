import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { DEMO_FLOCKS, DEMO_SELLER_LISTINGS } from "../utils/demoData";
import { buildDailyRecord, latestFlockSize } from "../utils/farmRecordCalc";
import pdfSeed from "../utils/farmRecordPdfSeed.json";
import { emptyFlockBook, type ShedFlockBook } from "../utils/farmRecordTypes";

/**
 * Farm / shed / flock-book persistence.
 *
 * Demo vs user (API-ready shape):
 * - Demo farms/sheds are templates from code.
 * - User-created farms and sheds, and all flock books the user edits, are persisted.
 * - One showcase shed (`shwet-shed-pdf`) is seed-locked so the PDF sample always reloads fresh.
 * Future backend can replace readList/writeList with REST/GraphQL while keeping these exports.
 */
const FARM_KEY = "poultech.farms.v3";
const FARM_KEY_LEGACY = "poultech.farms.v2";
const PRODUCT_KEY = "poultech.products.v2";
const FARM_FILE = `${FileSystem.documentDirectory ?? ""}poultech-farms-v3.json`;
const PRODUCT_FILE = `${FileSystem.documentDirectory ?? ""}poultech-products-v2.json`;

/** Showcase PDF sample — always rebuilt from seed; user records on this shed are not kept. */
const SEED_LOCKED_SHED_IDS = new Set(["shwet-shed-pdf"]);

const farmChangeListeners = new Set<() => void>();

/** Notify dashboard / other screens when farms or sheds are saved. */
export function subscribeFarmsChanged(listener: () => void): () => void {
  farmChangeListeners.add(listener);
  return () => {
    farmChangeListeners.delete(listener);
  };
}

function notifyFarmsChanged() {
  farmChangeListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore subscriber errors so one screen cannot break others.
    }
  });
}

export interface SavedShed {
  id: string;
  name: string;
  birds: string;
  age: string;
  eggs: string;
  mortality: string;
  flockBook?: ShedFlockBook;
}

export interface SavedFarm {
  id: string;
  userId: string;
  name: string;
  place: string;
  source: "demo" | "user";
  sheds: SavedShed[];
}

export type FarmPortfolioSummary = {
  farmCount: number;
  shedCount: number;
  liveBirds: number;
  recordDays: number;
  topFarmName: string | null;
};

/** Aggregate farms → sheds → live birds / record days for dashboard cards. */
export function summarizeFarmPortfolio(farms: SavedFarm[]): FarmPortfolioSummary {
  let shedCount = 0;
  let liveBirds = 0;
  let recordDays = 0;
  let topFarmName: string | null = null;
  let topBirds = -1;

  farms.forEach((farm) => {
    let farmBirds = 0;
    shedCount += farm.sheds.length;
    farm.sheds.forEach((shed) => {
      const book = shed.flockBook;
      if (book) {
        farmBirds += latestFlockSize(book);
        recordDays += book.dailyRecords.length;
      } else {
        farmBirds += Number(String(shed.birds).replace(/,/g, "")) || 0;
      }
    });
    liveBirds += farmBirds;
    if (farmBirds > topBirds) {
      topBirds = farmBirds;
      topFarmName = farm.name;
    }
  });

  return {
    farmCount: farms.length,
    shedCount,
    liveBirds,
    recordDays,
    topFarmName,
  };
}

export interface SavedProduct {
  id: string;
  userId: string;
  name: string;
  price: number;
  imageUri: string;
  dealerName: string;
  dealerPhone: string;
  source: "demo" | "user";
}

/** Full Farm Record Book PDF sample (Shwet Kamal / HL R Jaiswar) — ~714 daily rows across all phases. */
function demoLayerBook(): ShedFlockBook {
  const hatchDate = pdfSeed.hatchDate;
  const records = pdfSeed.records.map((row, index) =>
    buildDailyRecord({
      id: `pdf-seed-${row.dayNumber}-${index}`,
      date: row.date,
      hatchDate,
      period: row.period as "growing" | "laying",
      flockSize: row.flockSize,
      mortality: row.mortality,
      feedKg: row.feedKg,
      eggTrays: row.eggTrays ?? undefined,
      eggNumbers: row.eggNumbers ?? undefined,
      operationsVaccination: row.operationsVaccination ?? undefined,
      medication: row.medication ?? undefined,
      remark: row.remark ?? undefined,
    }),
  );

  const last = records[records.length - 1];
  return emptyFlockBook({
    hatchDate,
    chicksReceived: pdfSeed.chicksReceived,
    proprietor: pdfSeed.proprietor,
    henHoused: pdfSeed.henHoused,
    period: last?.period ?? "laying",
    dailyRecords: records,
  });
}

export function summarizeShed(book: ShedFlockBook, fallbackBirds: string): Pick<SavedShed, "birds" | "age" | "eggs" | "mortality"> {
  const sorted = [...book.dailyRecords].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  if (!last) {
    return { birds: fallbackBirds, age: "", eggs: "", mortality: "" };
  }
  const live = Math.max(0, last.flockSize - last.mortality);
  return {
    birds: String(live),
    age: `${last.dayNumber} days`,
    eggs: last.eggNumbers != null ? String(last.eggNumbers) : "",
    mortality: String(last.mortality),
  };
}

/** Create a new shed with an empty flock book ready for daily records. */
export function createShedRecord(input: {
  name: string;
  birds: string;
  age?: string;
  eggs?: string;
  proprietor?: string;
}): SavedShed {
  const chicks = Number(String(input.birds).replace(/,/g, "")) || 0;
  const flockBook = emptyFlockBook({
    chicksReceived: chicks,
    henHoused: chicks,
    period: "growing",
    hatchDate: new Date().toISOString().slice(0, 10),
    proprietor: input.proprietor?.trim() || "",
    dailyRecords: [],
  });
  return {
    id: `shed-${Date.now()}`,
    name: input.name.trim(),
    birds: input.birds.trim(),
    age: input.age?.trim() || "",
    eggs: input.eggs?.trim() || "",
    mortality: "",
    flockBook,
  };
}

function demoFarms(userId: string): SavedFarm[] {
  const pdfBook = demoLayerBook();
  const pdfSummary = summarizeShed(pdfBook, "3,431");
  return [
    {
      id: "demo-farm-green",
      userId,
      name: "Green Valley Poultry",
      place: "Pune",
      source: "demo",
      sheds: DEMO_FLOCKS.map((flock, index) => {
        const chicks = Number(String(flock.birds).replace(/,/g, "")) || 2000;
        // Recent hatch so empty demo sheds start in Growing when adding Day 1.
        const hatch = new Date();
        hatch.setDate(hatch.getDate() - (index === 0 ? 14 : index === 1 ? 7 : 3));
        return {
          id: `green-shed-${index + 1}`,
          name: flock.shed,
          birds: flock.birds,
          age: flock.age,
          eggs: flock.eggs,
          mortality: flock.mortality,
          flockBook: emptyFlockBook({
            hatchDate: hatch.toISOString().slice(0, 10),
            chicksReceived: chicks,
            proprietor: "Farm Owner",
            henHoused: chicks,
            period: "growing",
            dailyRecords: [],
          }),
        };
      }),
    },
    {
      id: "demo-farm-shwet-kamal",
      userId,
      name: "Shwet Kamal Poultry Farm",
      place: "PDF sample · HL R Jaiswar",
      source: "demo",
      sheds: [
        {
          id: "shwet-shed-pdf",
          name: "Layer shed · Full PDF book",
          ...pdfSummary,
          flockBook: pdfBook,
        },
      ],
    },
    {
      id: "demo-farm-sunrise",
      userId,
      name: "Sunrise Poultry",
      place: "Nashik",
      source: "demo",
      sheds: [
        {
          id: "sunrise-a",
          name: "Shed A",
          birds: "2,100",
          age: "18 weeks",
          eggs: "1,640 today",
          mortality: "6 birds",
          flockBook: emptyFlockBook({
            hatchDate: "2025-06-01",
            chicksReceived: 2100,
            proprietor: "Sunrise Owner",
            henHoused: 2100,
            period: "laying",
            dailyRecords: [],
          }),
        },
        {
          id: "sunrise-b",
          name: "Shed B",
          birds: "1,800",
          age: "7 weeks",
          eggs: "Not applicable",
          mortality: "11 birds",
          flockBook: emptyFlockBook({
            hatchDate: "2025-09-01",
            chicksReceived: 1800,
            proprietor: "Sunrise Owner",
            henHoused: 1800,
            period: "growing",
            dailyRecords: [],
          }),
        },
      ],
    },
  ];
}

function demoProducts(userId: string): SavedProduct[] {
  return DEMO_SELLER_LISTINGS.map((listing, index) => ({
    id: `demo-product-${index}`,
    userId,
    name: listing.name,
    price: listing.price,
    imageUri: "",
    dealerName: "Green Valley Poultry",
    dealerPhone: "9876543210",
    source: "demo",
  }));
}

async function readList<T>(key: string, file: string, isItem: (value: unknown) => value is T): Promise<T[]> {
  let raw: string | null = null;
  if (Platform.OS === "web") {
    raw = window.localStorage.getItem(key);
  } else if (FileSystem.documentDirectory) {
    const info = await FileSystem.getInfoAsync(file);
    if (info.exists) raw = await FileSystem.readAsStringAsync(file);
  }
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isItem)) return [];
  return parsed;
}

async function writeList<T>(key: string, file: string, items: T[]): Promise<void> {
  const raw = JSON.stringify(items);
  if (Platform.OS === "web") {
    window.localStorage.setItem(key, raw);
    return;
  }
  if (!FileSystem.documentDirectory) throw new Error("Storage is unavailable on this device.");
  await FileSystem.writeAsStringAsync(file, raw);
}

function isShed(value: unknown): value is SavedShed {
  if (typeof value !== "object" || value === null) return false;
  const shed = value as Partial<SavedShed>;
  return typeof shed.id === "string" && typeof shed.name === "string";
}

function isFarm(value: unknown): value is SavedFarm {
  if (typeof value !== "object" || value === null) return false;
  const farm = value as Partial<SavedFarm>;
  return typeof farm.id === "string" && typeof farm.userId === "string" && typeof farm.name === "string" && Array.isArray(farm.sheds) && farm.sheds.every(isShed);
}

function isProduct(value: unknown): value is SavedProduct {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Partial<SavedProduct>;
  return typeof product.id === "string" && typeof product.userId === "string" && typeof product.name === "string" && typeof product.price === "number";
}

export function ensureShedBook(shed: SavedShed): SavedShed {
  if (shed.flockBook) return shed;
  const chicks = Number(String(shed.birds).replace(/,/g, "")) || 0;
  return {
    ...shed,
    flockBook: emptyFlockBook({
      chicksReceived: chicks,
      henHoused: chicks,
      period: "growing",
      hatchDate: new Date().toISOString().slice(0, 10),
      dailyRecords: [],
    }),
  };
}

function ensureFarmBooks(farm: SavedFarm): SavedFarm {
  return { ...farm, sheds: farm.sheds.map(ensureShedBook) };
}

function isSeedLockedShed(shedId: string): boolean {
  return SEED_LOCKED_SHED_IDS.has(shedId);
}

/** Drop heavy seed books from storage — they are rehydrated from code on load. */
function forStorage(farm: SavedFarm): SavedFarm {
  return {
    ...farm,
    sheds: farm.sheds.map((shed) =>
      isSeedLockedShed(shed.id)
        ? {
            id: shed.id,
            name: shed.name,
            birds: shed.birds,
            age: shed.age,
            eggs: shed.eggs,
            mortality: shed.mortality,
          }
        : ensureShedBook(shed),
    ),
  };
}

function mergeDemoFarm(template: SavedFarm, saved: SavedFarm | undefined): SavedFarm {
  if (!saved) return ensureFarmBooks(template);

  const templateIds = new Set(template.sheds.map((shed) => shed.id));
  const mergedTemplateSheds = template.sheds.map((templateShed) => {
    if (isSeedLockedShed(templateShed.id)) return templateShed;
    const savedShed = saved.sheds.find((shed) => shed.id === templateShed.id);
    if (!savedShed) return templateShed;
    const savedRecords = savedShed.flockBook?.dailyRecords.length ?? 0;
    // Empty demo sheds refresh from template (fresh hatch). Sheds with user rows keep saved books.
    if (savedRecords === 0) return templateShed;
    return ensureShedBook({
      ...templateShed,
      ...savedShed,
      id: templateShed.id,
      flockBook: savedShed.flockBook ?? templateShed.flockBook,
    });
  });

  const userAddedSheds = saved.sheds.filter((shed) => !templateIds.has(shed.id)).map(ensureShedBook);

  return ensureFarmBooks({
    ...template,
    // Keep user-renamed place only if they changed a user farm; demos keep template identity.
    sheds: [...mergedTemplateSheds, ...userAddedSheds],
  });
}

export async function loadFarms(userId: string): Promise<SavedFarm[]> {
  let saved = (await readList(FARM_KEY, FARM_FILE, isFarm)).filter((farm) => farm.userId === userId);
  if (saved.length === 0) {
    const legacy = (await readList(FARM_KEY_LEGACY, `${FileSystem.documentDirectory ?? ""}poultech-farms-v2.json`, isFarm)).filter(
      (farm) => farm.userId === userId,
    );
    if (legacy.length) {
      saved = legacy.map(ensureFarmBooks);
      await writeList(FARM_KEY, FARM_FILE, saved.map(forStorage));
    }
  }

  const demos = demoFarms(userId).map((farm) => mergeDemoFarm(farm, saved.find((item) => item.id === farm.id)));
  const extra = saved
    .filter((farm) => farm.source === "user" && !demos.some((demo) => demo.id === farm.id))
    .map(ensureFarmBooks);
  return [...demos, ...extra];
}

/** Resolve one farm + shed after merge (used by record book screen). */
export async function loadFarmShed(
  userId: string,
  farmId: string,
  shedId: string,
): Promise<{ farm: SavedFarm; shed: SavedShed } | null> {
  const farms = await loadFarms(userId);
  const farm = farms.find((item) => item.id === farmId);
  if (!farm) return null;
  const shed = farm.sheds.find((item) => item.id === shedId);
  if (!shed) return null;
  return { farm, shed: ensureShedBook(shed) };
}

export async function saveFarm(farm: SavedFarm): Promise<void> {
  const next = forStorage(ensureFarmBooks(farm));
  const saved = await readList(FARM_KEY, FARM_FILE, isFarm);
  await writeList(FARM_KEY, FARM_FILE, [...saved.filter((item) => !(item.userId === next.userId && item.id === next.id)), next]);
  notifyFarmsChanged();
}

/** Append a shed to a farm and persist (works for demo and user farms). */
export async function addShedToFarm(farm: SavedFarm, shed: SavedShed): Promise<SavedFarm> {
  const nextShed = ensureShedBook(shed);
  const nextFarm: SavedFarm = {
    ...farm,
    sheds: [...farm.sheds, nextShed],
  };
  await saveFarm(nextFarm);
  // Return merged view so demo seed books stay correct and new sheds appear everywhere.
  const loaded = await loadFarms(farm.userId);
  return loaded.find((item) => item.id === farm.id) ?? ensureFarmBooks(nextFarm);
}

export async function updateShedInFarm(farm: SavedFarm, shed: SavedShed): Promise<SavedFarm> {
  const book = shed.flockBook ?? emptyFlockBook();
  const summary = summarizeShed(book, shed.birds);
  const nextShed: SavedShed = ensureShedBook({ ...shed, ...summary, flockBook: book });
  const exists = farm.sheds.some((item) => item.id === nextShed.id);
  const nextFarm: SavedFarm = {
    ...farm,
    sheds: exists
      ? farm.sheds.map((item) => (item.id === nextShed.id ? nextShed : item))
      : [...farm.sheds, nextShed],
  };
  await saveFarm(nextFarm);
  // Return merged view so callers keep seed books in memory for locked sheds.
  if (farm.source === "demo") {
    const loaded = await loadFarms(farm.userId);
    return loaded.find((item) => item.id === farm.id) ?? ensureFarmBooks(nextFarm);
  }
  return ensureFarmBooks(nextFarm);
}

export async function loadProducts(userId: string): Promise<SavedProduct[]> {
  const saved = (await readList(PRODUCT_KEY, PRODUCT_FILE, isProduct)).filter((product) => product.userId === userId);
  return [...demoProducts(userId), ...saved.filter((product) => product.source === "user")];
}

export async function addProduct(product: SavedProduct): Promise<void> {
  const saved = await readList(PRODUCT_KEY, PRODUCT_FILE, isProduct);
  await writeList(PRODUCT_KEY, PRODUCT_FILE, [...saved, product]);
}
