import type { MarketDashboardResponse, MarketRateCard } from "../services/marketService";
import type { AdminDemoRate } from "../store/useAdminDemoStore";

export const MARKET_LIVE_PRODUCT_IDS = ["eggs", "culls", "broilers"] as const;
export type MarketLiveProductId = (typeof MARKET_LIVE_PRODUCT_IDS)[number];

const LIVE_ID_SET = new Set<string>(MARKET_LIVE_PRODUCT_IDS);

/** Layout for signed-in users — titles/units only, never sample prices. */
export const MARKET_RATE_LAYOUT: AdminDemoRate[] = [
  {
    id: "eggs",
    title: "Eggs",
    unit: "per tray",
    value: "",
    previousValue: "",
    nextValue: "",
    month: [],
    year: [],
    history: [],
  },
  {
    id: "culls",
    title: "Culls birds",
    unit: "per bird",
    value: "",
    previousValue: "",
    nextValue: "",
    month: [],
    year: [],
    history: [],
  },
  {
    id: "broilers",
    title: "Broilers",
    unit: "per kg",
    value: "",
    previousValue: "",
    nextValue: "",
    month: [],
    year: [],
    history: [],
  },
  {
    id: "feed",
    title: "Feed raw materials",
    unit: "per kg",
    value: "",
    previousValue: "",
    nextValue: "",
    month: [],
    year: [],
    history: [],
  },
];

export function parseMarketAmount(raw: string | undefined): number | null {
  const text = raw?.trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** UI shell: titles/units only — no prices (used when API is missing). */
function emptyRateShell(rate: AdminDemoRate): AdminDemoRate {
  return {
    ...rate,
    value: "",
    previousValue: "",
    nextValue: "",
    month: [],
    year: [],
    history: [],
  };
}

function mapApiCardToRate(shell: AdminDemoRate, live: MarketRateCard): AdminDemoRate {
  return {
    ...shell,
    title: live.title || shell.title,
    unit: live.unit || shell.unit,
    value: live.value,
    previousValue: live.previousValue,
    nextValue: live.nextValue,
    month: [...(live.month ?? [])],
    year: [...(live.year ?? [])],
    history: [...(live.history ?? [])],
  };
}

/**
 * Live auth: eggs / culls / broilers come only from `/market/dashboard` (never static store prices).
 * Feed has no backend yet — shown empty until connected.
 */
export function mergeLiveMarketRates(
  layoutRates: AdminDemoRate[],
  data: MarketDashboardResponse | undefined,
  demoMode: boolean,
): AdminDemoRate[] {
  if (demoMode) return layoutRates;

  const base = layoutRates.map((rate) => emptyRateShell(rate));
  const liveById = new Map(data?.rates?.map((item) => [item.id, item]) ?? []);

  return base.map((shell) => {
    if (!LIVE_ID_SET.has(shell.id)) return shell;
    const live = liveById.get(shell.id);
    return live ? mapApiCardToRate(shell, live) : shell;
  });
}

export function isLiveMarketRateId(
  id: string,
  demoMode: boolean,
  data: MarketDashboardResponse | undefined,
): boolean {
  if (demoMode || !LIVE_ID_SET.has(id)) return false;
  const card = data?.rates?.find((item) => item.id === id);
  return Boolean(parseMarketAmount(card?.value));
}

export function hasDynamicMarketValue(rate: AdminDemoRate | undefined): boolean {
  return parseMarketAmount(rate?.value) !== null;
}