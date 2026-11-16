import { create } from "zustand";

export type AppAppearance = "light" | "dark";

interface ThemeState {
  appearance: AppAppearance;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAppearance: (appearance: AppAppearance) => Promise<void>;
}

const WEB_KEY = "poultech.appearance.v1";

async function readAppearance(): Promise<AppAppearance> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(WEB_KEY);
      return saved === "dark" ? "dark" : "light";
    }
    const SecureStore = await import("expo-secure-store");
    const saved = await SecureStore.getItemAsync(WEB_KEY);
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

async function writeAppearance(appearance: AppAppearance) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(WEB_KEY, appearance);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(WEB_KEY, appearance);
}

export const useThemeStore = create<ThemeState>((set) => ({
  appearance: "light",
  hydrated: false,
  hydrate: async () => {
    const appearance = await readAppearance();
    set({ appearance, hydrated: true });
  },
  setAppearance: async (appearance) => {
    await writeAppearance(appearance);
    set({ appearance, hydrated: true });
  },
}));

export function themeColors(appearance: AppAppearance) {
  if (appearance === "dark") {
    return {
      page: "#0B1220",
      card: "#111827",
      cardSoft: "#1F2937",
      line: "#334155",
      primary: "#E2E8F0",
      ink: "#F8FAFC",
      muted: "#94A3B8",
      accent: "#22C55E",
      chip: "#0F172A",
      promoBg: "#052E16",
      promoBorder: "#14532D",
      promoText: "#BBF7D0",
      headerBg: "#0F172A",
      overlay: "rgba(2,6,23,0.65)",
    };
  }
  return {
    page: "#FAF7F0",
    card: "#FFFFFF",
    cardSoft: "#F8FAFC",
    line: "#E2E8F0",
    primary: "#0B2A5B",
    ink: "#0F172A",
    muted: "#64748B",
    accent: "#15803D",
    chip: "#F1F5F9",
    promoBg: "#ECFDF5",
    promoBorder: "#BBF7D0",
    promoText: "#14532D",
    headerBg: "#FFFFFF",
    overlay: "rgba(15,23,42,0.45)",
  };
}
