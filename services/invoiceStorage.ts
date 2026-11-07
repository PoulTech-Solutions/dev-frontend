import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import type { InvoiceData } from "../utils/invoiceTypes";

const WEB_STORAGE_KEY = "poultech.invoices";
const NATIVE_STORAGE_PATH = `${FileSystem.documentDirectory ?? ""}poultech-invoices.json`;

export interface InvoiceRecord extends InvoiceData {
  id: string;
  userId: string;
  createdAt: string;
  total: number;
  pdfUri?: string;
}

function isInvoiceRecord(value: unknown): value is InvoiceRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<InvoiceRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.userId === "string" &&
    typeof record.invoiceNumber === "string" &&
    typeof record.customerName === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.total === "number" &&
    Array.isArray(record.items) &&
    record.items.every(
      (item) =>
        typeof item.description === "string" &&
        typeof item.quantity === "number" &&
        typeof item.unitPrice === "number",
    )
  );
}

async function readAllInvoices(): Promise<InvoiceRecord[]> {
  if (Platform.OS === "web") {
    const stored = window.localStorage.getItem(WEB_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isInvoiceRecord)) {
      throw new Error("Saved invoices have an invalid format.");
    }
    return parsed;
  }

  if (!FileSystem.documentDirectory) {
    throw new Error("Invoice storage is unavailable on this device.");
  }
  const info = await FileSystem.getInfoAsync(NATIVE_STORAGE_PATH);
  if (!info.exists) return [];
  const parsed: unknown = JSON.parse(
    await FileSystem.readAsStringAsync(NATIVE_STORAGE_PATH),
  );
  if (!Array.isArray(parsed) || !parsed.every(isInvoiceRecord)) {
    throw new Error("Saved invoices have an invalid format.");
  }
  return parsed;
}

async function writeAllInvoices(invoices: InvoiceRecord[]): Promise<void> {
  const serialized = JSON.stringify(invoices);
  if (Platform.OS === "web") {
    window.localStorage.setItem(WEB_STORAGE_KEY, serialized);
    return;
  }

  if (!FileSystem.documentDirectory) {
    throw new Error("Invoice storage is unavailable on this device.");
  }
  await FileSystem.writeAsStringAsync(NATIVE_STORAGE_PATH, serialized);
}

export async function loadInvoices(userId: string): Promise<InvoiceRecord[]> {
  const invoices = await readAllInvoices();
  return invoices
    .filter((invoice) => invoice.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function saveInvoice(invoice: InvoiceRecord): Promise<void> {
  const invoices = await readAllInvoices();
  await writeAllInvoices([
    ...invoices.filter((saved) => saved.id !== invoice.id),
    invoice,
  ]);
}
