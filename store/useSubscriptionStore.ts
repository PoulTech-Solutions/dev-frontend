import { create } from "zustand";
import type { SubscriptionPlanId } from "../utils/subscriptionPlans";

interface SubscriptionRecord {
  userId: string;
  planId: SubscriptionPlanId;
  startedAt: string;
  renewsAt: string;
}

interface SubscriptionState {
  planId: SubscriptionPlanId;
  renewsAt: string | null;
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  choosePlan: (userId: string, planId: SubscriptionPlanId) => Promise<void>;
}

const WEB_KEY = "poultech.subscription.v1";
const FILE_NAME = "poultech-subscription-v1.json";

function renewDate(from = new Date()) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

async function readAll(): Promise<SubscriptionRecord[]> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(WEB_KEY);
      return raw ? (JSON.parse(raw) as SubscriptionRecord[]) : [];
    }
    const FileSystem = await import("expo-file-system/legacy");
    const path = `${FileSystem.documentDirectory ?? ""}${FILE_NAME}`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as SubscriptionRecord[];
  } catch {
    return [];
  }
}

async function writeAll(records: SubscriptionRecord[]) {
  const raw = JSON.stringify(records);
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(WEB_KEY, raw);
    return;
  }
  const FileSystem = await import("expo-file-system/legacy");
  const path = `${FileSystem.documentDirectory ?? ""}${FILE_NAME}`;
  await FileSystem.writeAsStringAsync(path, raw);
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  planId: "basic",
  renewsAt: null,
  hydrated: false,
  hydrate: async (userId) => {
    const records = await readAll();
    const current = records.find((item) => item.userId === userId);
    set({
      planId: current?.planId ?? "basic",
      renewsAt: current?.renewsAt ?? null,
      hydrated: true,
    });
  },
  choosePlan: async (userId, planId) => {
    const startedAt = new Date().toISOString();
    const renewsAt = renewDate();
    const records = await readAll();
    const next = [
      ...records.filter((item) => item.userId !== userId),
      { userId, planId, startedAt, renewsAt },
    ];
    await writeAll(next);
    set({ planId, renewsAt, hydrated: true });
  },
}));
