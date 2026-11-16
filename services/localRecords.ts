import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { DEMO_FLOCKS, DEMO_SELLER_LISTINGS } from "../utils/demoData";

const FARM_KEY = "poultech.farms.v2";
const PRODUCT_KEY = "poultech.products.v2";
const FARM_FILE = `${FileSystem.documentDirectory ?? ""}poultech-farms-v2.json`;
const PRODUCT_FILE = `${FileSystem.documentDirectory ?? ""}poultech-products-v2.json`;

export interface SavedShed {
  id: string;
  name: string;
  birds: string;
  age: string;
  eggs: string;
  mortality: string;
}

export interface SavedFarm {
  id: string;
  userId: string;
  name: string;
  place: string;
  source: "demo" | "user";
  sheds: SavedShed[];
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

function demoFarms(userId: string): SavedFarm[] {
  return [
    {
      id: "demo-farm-green",
      userId,
      name: "Green Valley Poultry",
      place: "Pune",
      source: "demo",
      sheds: DEMO_FLOCKS.map((flock, index) => ({
        id: `green-shed-${index}`,
        name: flock.shed,
        birds: flock.birds,
        age: flock.age,
        eggs: flock.eggs,
        mortality: flock.mortality,
      })),
    },
    {
      id: "demo-farm-sunrise",
      userId,
      name: "Sunrise Poultry",
      place: "Nashik",
      source: "demo",
      sheds: [
        { id: "sunrise-a", name: "Shed A", birds: "2,100", age: "18 weeks", eggs: "1,640 today", mortality: "6 birds" },
        { id: "sunrise-b", name: "Shed B", birds: "1,800", age: "7 weeks", eggs: "Not applicable", mortality: "11 birds" },
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

export async function loadFarms(userId: string): Promise<SavedFarm[]> {
  const saved = (await readList(FARM_KEY, FARM_FILE, isFarm)).filter((farm) => farm.userId === userId);
  const demos = demoFarms(userId).map((farm) => saved.find((item) => item.id === farm.id) ?? farm);
  const extra = saved.filter((farm) => farm.source === "user" && !demos.some((demo) => demo.id === farm.id));
  return [...demos, ...extra];
}

export async function saveFarm(farm: SavedFarm): Promise<void> {
  const saved = await readList(FARM_KEY, FARM_FILE, isFarm);
  await writeList(FARM_KEY, FARM_FILE, [...saved.filter((item) => !(item.userId === farm.userId && item.id === farm.id)), farm]);
}

export async function loadProducts(userId: string): Promise<SavedProduct[]> {
  const saved = (await readList(PRODUCT_KEY, PRODUCT_FILE, isProduct)).filter((product) => product.userId === userId);
  return [...demoProducts(userId), ...saved.filter((product) => product.source === "user")];
}

export async function addProduct(product: SavedProduct): Promise<void> {
  const saved = await readList(PRODUCT_KEY, PRODUCT_FILE, isProduct);
  await writeList(PRODUCT_KEY, PRODUCT_FILE, [...saved, product]);
}
