import type { InvoiceData } from "../utils/invoiceTypes";

const DATABASE_NAME = "poultech-billing";
const STORE_NAME = "invoices";

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
    typeof record.pdfUri === "string" &&
    Array.isArray(record.items) &&
    record.items.every(
      (item) =>
        typeof item.description === "string" &&
        typeof item.quantity === "number" &&
        typeof item.unitPrice === "number",
    )
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("userId", "userId", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open invoice storage."));
  });
}

export async function loadInvoices(userId: string): Promise<InvoiceRecord[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .index("userId")
        .getAll(userId);
      request.onsuccess = () => {
        const records: unknown = request.result;
        if (!Array.isArray(records) || !records.every(isInvoiceRecord)) {
          reject(new Error("Saved invoices have an invalid format."));
          return;
        }
        resolve(
          records.sort((left, right) =>
            right.createdAt.localeCompare(left.createdAt),
          ),
        );
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Could not load saved invoices."));
    });
  } finally {
    database.close();
  }
}

export async function saveInvoice(invoice: InvoiceRecord): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, "readwrite")
        .objectStore(STORE_NAME)
        .put(invoice);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Could not save the invoice."));
    });
  } finally {
    database.close();
  }
}
