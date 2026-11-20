import { create } from "zustand";

export type MarketProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  rating: string;
  stock: string;
  picture: string;
  dealerName: string;
  dealerPhone: string;
};

export type CartLine = {
  productId: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  picture: string;
  dealerName: string;
  quantity: number;
};

export type PlacedOrder = {
  id: string;
  userId: string;
  createdAt: string;
  status: "placed" | "confirmed" | "delivered";
  deliveryNote: string;
  phone: string;
  items: CartLine[];
  itemCount: number;
  total: number;
};

interface CartState {
  userId: string | null;
  lines: CartLine[];
  orders: PlacedOrder[];
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  addItem: (product: MarketProduct, qty?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (input: { phone: string; deliveryNote: string }) => Promise<PlacedOrder | null>;
}

const WEB_KEY = "poultech.marketplace.cart.v1";
const FILE_NAME = "poultech-marketplace-cart-v1.json";

type PersistedCart = {
  userId: string;
  lines: CartLine[];
  orders: PlacedOrder[];
};

async function readAll(): Promise<PersistedCart[]> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(WEB_KEY);
      return raw ? (JSON.parse(raw) as PersistedCart[]) : [];
    }
    const FileSystem = await import("expo-file-system/legacy");
    const path = `${FileSystem.documentDirectory ?? ""}${FILE_NAME}`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return [];
    return JSON.parse(await FileSystem.readAsStringAsync(path)) as PersistedCart[];
  } catch {
    return [];
  }
}

async function writeAll(records: PersistedCart[]) {
  const raw = JSON.stringify(records);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(WEB_KEY, raw);
    return;
  }
  const FileSystem = await import("expo-file-system/legacy");
  const path = `${FileSystem.documentDirectory ?? ""}${FILE_NAME}`;
  await FileSystem.writeAsStringAsync(path, raw);
}

async function persist(userId: string, lines: CartLine[], orders: PlacedOrder[]) {
  const records = await readAll();
  await writeAll([...records.filter((item) => item.userId !== userId), { userId, lines, orders }]);
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export const useCartStore = create<CartState>((set, get) => ({
  userId: null,
  lines: [],
  orders: [],
  hydrated: false,

  hydrate: async (userId) => {
    const records = await readAll();
    const current = records.find((item) => item.userId === userId);
    set({
      userId,
      lines: current?.lines ?? [],
      orders: current?.orders ?? [],
      hydrated: true,
    });
  },

  addItem: (product, qty = 1) => {
    const { userId, lines, orders } = get();
    if (!userId) return;
    const existing = lines.find((line) => line.productId === product.id);
    const nextLines = existing
      ? lines.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + qty } : line,
        )
      : [
          ...lines,
          {
            productId: product.id,
            name: product.name,
            category: product.category,
            unit: product.unit,
            price: product.price,
            picture: product.picture,
            dealerName: product.dealerName,
            quantity: Math.max(1, qty),
          },
        ];
    set({ lines: nextLines });
    void persist(userId, nextLines, orders);
  },

  setQuantity: (productId, quantity) => {
    const { userId, lines, orders } = get();
    if (!userId) return;
    const nextLines =
      quantity <= 0
        ? lines.filter((line) => line.productId !== productId)
        : lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
    set({ lines: nextLines });
    void persist(userId, nextLines, orders);
  },

  removeItem: (productId) => {
    const { userId, lines, orders } = get();
    if (!userId) return;
    const nextLines = lines.filter((line) => line.productId !== productId);
    set({ lines: nextLines });
    void persist(userId, nextLines, orders);
  },

  clearCart: () => {
    const { userId, orders } = get();
    if (!userId) return;
    set({ lines: [] });
    void persist(userId, [], orders);
  },

  placeOrder: async ({ phone, deliveryNote }) => {
    const { userId, lines, orders } = get();
    if (!userId || !lines.length) return null;
    const order: PlacedOrder = {
      id: `order-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      status: "placed",
      deliveryNote: deliveryNote.trim(),
      phone: phone.trim(),
      items: lines,
      itemCount: cartItemCount(lines),
      total: cartTotal(lines),
    };
    const nextOrders = [order, ...orders];
    set({ lines: [], orders: nextOrders });
    await persist(userId, [], nextOrders);
    return order;
  },
}));
