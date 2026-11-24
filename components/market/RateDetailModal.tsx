import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { FormModal } from "../ui/FormModal";
import { PictureSymbol, type PictureName } from "../ui/PictureSymbol";
import { RateChart } from "../ui/RateChart";
import { useAppTheme } from "../../hooks/useAppTheme";
import {
  useEggCoverage,
  useEggSheet,
  useEggTrend,
  useMarketDashboard,
  useMarketZones,
  usePoultryCoverage,
  usePoultrySheet,
  usePoultryTrend,
  useSetMarketZone,
} from "../../hooks/useMarketDashboard";
import { rateDelta, ratePoints, rateSeries, type AdminDemoRate, type RateWindow } from "../../store/useAdminDemoStore";
import { MARKET_LIVE_PRODUCT_IDS, parseMarketAmount, type MarketLiveProductId } from "../../utils/marketRates";
import { useLanguage, type AppLanguage } from "../../utils/i18n";

const UP = "#15803D";
const DOWN = "#B91C1C";

export type RateCardId = "eggs" | "culls" | "broilers";

function emptyMarketRate(demo?: AdminDemoRate): AdminDemoRate | undefined {
  if (!demo) return undefined;
  return {
    ...demo,
    value: "",
    previousValue: "",
    nextValue: "",
    month: [],
    year: [],
    history: [],
  };
}

function money(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function trendColor(values: number[], muted: string) {
  const delta = rateDelta(values);
  if (delta > 0) return UP;
  if (delta < 0) return DOWN;
  return muted;
}

function pointLabel(date: Date, window: RateWindow, language: AppLanguage) {
  const locale = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
  if (window === "year") return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function formatTrendLabel(iso: string, window: RateWindow, language: AppLanguage) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return pointLabel(date, window, language);
}

function monthShort(month: number, language: AppLanguage) {
  const locale = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
  return new Date(2020, month - 1, 1).toLocaleDateString(locale, { month: "short" });
}

function weekSpanLabel(year: number, month: number, week: number) {
  const start = (week - 1) * 7 + 1;
  const last = new Date(year, month, 0).getDate();
  return `${start}-${Math.min(week * 7, last)}`;
}

function FilterChips({
  options,
  selected,
  onSelect,
  theme,
}: {
  options: { id: number; label: string }[];
  selected: number;
  onSelect: (id: number) => void;
  theme: { chip: string; cardSoft: string; accent: string; line: string; primary: string; muted: string };
}) {
  if (!options.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((item) => {
        const on = selected === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className="cursor-pointer hover:bg-slate-100"
            onPress={() => onSelect(item.id)}
            style={{
              minHeight: 32,
              justifyContent: "center",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: on ? theme.accent : theme.line,
              backgroundColor: on ? theme.chip : theme.cardSoft,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: on ? theme.primary : theme.muted, fontFamily: "Poppins_700Bold", fontSize: 12 }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function RateDetailModal({
  visible,
  onClose,
  rateId,
  title,
  icon,
  initialWindow,
  demoRate,
  liveEnabled,
}: {
  visible: boolean;
  onClose: () => void;
  rateId: RateCardId;
  title: string;
  icon: PictureName;
  initialWindow: RateWindow;
  demoRate?: AdminDemoRate;
  liveEnabled: boolean;
}) {
  const { t, n, language } = useLanguage();
  const { colors: theme } = useAppTheme();
  const isMarketLiveId = MARKET_LIVE_PRODUCT_IDS.includes(rateId as MarketLiveProductId);
  const isEggs = rateId === "eggs" && liveEnabled;
  const isPoultryLive = (rateId === "culls" || rateId === "broilers") && liveEnabled;
  const poultryProduct = isPoultryLive ? rateId : null;
  const [window, setWindow] = useState<RateWindow>(initialWindow);
  const [zone, setZone] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(() => new Date().getMonth() + 1);
  const [filterWeek, setFilterWeek] = useState(() => Math.ceil(new Date().getDate() / 7));
  const [weekPicked, setWeekPicked] = useState(false);
  const trendFiltersEnabled = (isEggs || isPoultryLive) && Boolean(zone);

  useEffect(() => {
    if (visible) {
      setWindow(initialWindow);
      setZone(null);
      setWeekPicked(false);
    }
  }, [visible, initialWindow]);

  const zonesQuery = useMarketZones(visible && (isEggs || isPoultryLive));
  const dashboardQuery = useMarketDashboard(zone, visible && (isEggs || isPoultryLive));
  const setMarketZone = useSetMarketZone();
  const eggCoverageQuery = useEggCoverage(zone, visible && isEggs && Boolean(zone));
  const poultryCoverageQuery = usePoultryCoverage(
    poultryProduct,
    zone,
    visible && isPoultryLive && Boolean(zone),
  );
  const coverageQuery = isEggs ? eggCoverageQuery : poultryCoverageQuery;

  const trendWindow = window === "days" ? "days" : window;
  const trendOpts = {
    year: filterYear,
    month: filterMonth,
    week: window === "days" && weekPicked ? filterWeek : undefined,
  };
  const eggTrendQuery = useEggTrend(zone, trendWindow, visible && isEggs && trendFiltersEnabled, trendOpts);
  const poultryTrendQuery = usePoultryTrend(
    poultryProduct,
    zone,
    trendWindow,
    visible && isPoultryLive && trendFiltersEnabled,
    trendOpts,
  );
  const trendQuery = isEggs ? eggTrendQuery : poultryTrendQuery;

  const eggSheetQuery = useEggSheet(zone, filterYear, filterMonth, visible && isEggs && window === "month" && Boolean(zone));
  const poultrySheetQuery = usePoultrySheet(
    poultryProduct,
    zone,
    filterYear,
    filterMonth,
    visible && isPoultryLive && window === "month" && Boolean(zone),
  );
  const sheetQuery = isEggs ? eggSheetQuery : poultrySheetQuery;

  useEffect(() => {
    const years = coverageQuery.data?.years;
    if (!Array.isArray(years) || !years.length) return;
    setFilterYear((prev) => (years.includes(prev) ? prev : years[0]));
  }, [coverageQuery.data]);

  useEffect(() => {
    const months = coverageQuery.data?.months?.[String(filterYear)] ?? [];
    if (!Array.isArray(months) || !months.length) return;
    setFilterMonth((prev) => (months.includes(prev) ? prev : months[months.length - 1]));
  }, [coverageQuery.data, filterYear]);

  useEffect(() => {
    const key = `${filterYear}-${String(filterMonth).padStart(2, "0")}`;
    const weeks = coverageQuery.data?.weeks?.[key] ?? [];
    if (!Array.isArray(weeks) || !weeks.length) return;
    setFilterWeek((prev) => (weeks.includes(prev) ? prev : weeks[weeks.length - 1]));
  }, [coverageQuery.data, filterYear, filterMonth]);

  useEffect(() => {
    if (!visible || !(isEggs || isPoultryLive)) return;
    const next =
      zone ??
      dashboardQuery.data?.metadata?.resolved_zone ??
      dashboardQuery.data?.metadata?.selected_zone ??
      zonesQuery.data?.default_zone ??
      null;
    if (!zone && next) setZone(next);
  }, [
    visible,
    isEggs,
    isPoultryLive,
    zone,
    dashboardQuery.data?.metadata?.resolved_zone,
    dashboardQuery.data?.metadata?.selected_zone,
    zonesQuery.data?.default_zone,
  ]);

  const liveEggs = dashboardQuery.data?.rates?.find((item) => item.id === "eggs");
  const livePoultry = dashboardQuery.data?.rates?.find((item) => item.id === rateId);
  const activeRate: AdminDemoRate | undefined =
    isEggs && liveEggs
      ? {
          id: "eggs",
          title: liveEggs.title,
          unit: liveEggs.unit,
          value: liveEggs.value,
          previousValue: liveEggs.previousValue,
          nextValue: liveEggs.nextValue,
          month: liveEggs.month,
          year: liveEggs.year,
          history: liveEggs.history,
        }
      : isPoultryLive && livePoultry
        ? {
            id: rateId,
            title: livePoultry.title,
            unit: livePoultry.unit,
            value: livePoultry.value,
            previousValue: livePoultry.previousValue,
            nextValue: livePoultry.nextValue,
            month: livePoultry.month,
            year: livePoultry.year,
            history: livePoultry.history,
          }
        : liveEnabled && isMarketLiveId
          ? emptyMarketRate(demoRate)
          : demoRate;

  const chartPoints = useMemo(() => {
    const points = trendQuery.data?.points;
    if ((isEggs || isPoultryLive) && Array.isArray(points) && points.length) {
      return points.map((point) => ({
        label: formatTrendLabel(point.date, window, language),
        value: point.value,
      }));
    }
    if (!activeRate?.value) return [];
    const series = rateSeries(activeRate, window);
    if (!Array.isArray(series) || !series.length) return [];
    return ratePoints(series, window).map((point) => ({
      label: pointLabel(point.at, window, language),
      value: point.value,
    }));
  }, [isEggs, isPoultryLive, trendQuery.data, activeRate, window, language]);

  const monthDays = useMemo(() => {
    const days = sheetQuery.data?.days;
    if (!Array.isArray(days)) return [];
    return [...days].sort((a, b) => a.day - b.day);
  }, [sheetQuery.data?.days]);

  const yearOptions = (Array.isArray(coverageQuery.data?.years) ? coverageQuery.data.years : []).map((year) => ({
    id: year,
    label: String(year),
  }));
  const monthList = coverageQuery.data?.months?.[String(filterYear)];
  const monthOptions = (Array.isArray(monthList) ? monthList : []).map((month) => ({
    id: month,
    label: monthShort(month, language),
  }));
  const weekList = coverageQuery.data?.weeks?.[`${filterYear}-${String(filterMonth).padStart(2, "0")}`];
  const weekOptions = (Array.isArray(weekList) ? weekList : []).map((week) => ({
    id: week,
    label: weekSpanLabel(filterYear, filterMonth, week),
  }));

  const seriesValues = chartPoints.map((point) => point.value);
  const delta = rateDelta(seriesValues);
  const color = seriesValues.length > 1 ? trendColor(seriesValues, theme.muted) : theme.muted;
  const yesterday = parseMarketAmount(activeRate?.previousValue);
  const today = parseMarketAmount(activeRate?.value);
  const tomorrow = parseMarketAmount(activeRate?.nextValue);
  const loading =
    (isEggs || isPoultryLive) &&
    (dashboardQuery.isPending || ((isEggs || isPoultryLive) && trendQuery.isPending));

  const selectZone = (name: string) => {
    setZone(name);
    if (liveEnabled) {
      void setMarketZone.mutateAsync(name).catch(() => undefined);
    }
  };

  return (
    <FormModal
      onClose={onClose}
      size="large"
      title={`${title}${zone && (isEggs || isPoultryLive) ? ` · ${zone}` : ""}`}
      visible={visible}
    >
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <PictureSymbol name={icon} size={52} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "uppercase" }}>
              {isEggs
                ? t("NECC suggested · per 100 eggs")
                : isPoultryLive && livePoultry
                  ? t("Live hub rate · per bird")
                  : t("Sample preview rates")}
            </Text>
            <Text style={{ marginTop: 2, color: theme.ink, fontFamily: "Poppins_700Bold", fontSize: 22 }}>
              {today !== null ? `₹${n(money(today))}` : "—"}
            </Text>
          </View>
          {loading ? <ActivityIndicator color={theme.accent} /> : null}
        </View>

        {(isEggs || isPoultryLive) && Array.isArray(zonesQuery.data?.zones) && zonesQuery.data.zones.length ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
              {t("Cities")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {zonesQuery.data.zones.map((item) => {
                const selected = zone === item.name;
                return (
                  <Pressable
                    key={item.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className="cursor-pointer hover:bg-green-50 hover:border-green-400"
                    onPress={() => selectZone(item.name)}
                    style={{
                      minHeight: 36,
                      justifyContent: "center",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: selected ? theme.accent : theme.line,
                      backgroundColor: selected ? theme.chip : theme.cardSoft,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? theme.primary : theme.ink,
                        fontFamily: "Poppins_700Bold",
                        fontSize: 12,
                      }}
                    >
                      {item.name}
                      {item.today_value ? (
                        <Text style={{ color: selected ? theme.primary : theme.muted, fontFamily: "Poppins_700Bold" }}>
                          {` · ₹${item.today_value}`}
                        </Text>
                      ) : null}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              ["Yesterday", yesterday],
              ["Today", today],
              ["Tomorrow", tomorrow],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={{ flex: 1, borderRadius: 12, backgroundColor: theme.cardSoft, paddingHorizontal: 10, paddingVertical: 10 }}>
              <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
                {t(label)}
              </Text>
              <Text style={{ marginTop: 4, color: theme.ink, fontFamily: "Poppins_700Bold", fontSize: 17 }}>
                {value !== null ? `₹${n(money(value))}` : t("N/A")}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {(["days", "month", "year"] as const).map((option) => {
            const selected = window === option;
            const label = option === "days" ? "Week" : option === "month" ? "Month" : "Year";
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="cursor-pointer hover:bg-slate-100"
                onPress={() => setWindow(option)}
                style={{
                  minHeight: 34,
                  justifyContent: "center",
                  borderRadius: 10,
                  backgroundColor: selected ? theme.chip : theme.cardSoft,
                  borderWidth: 1,
                  borderColor: selected ? theme.accent : theme.line,
                  paddingHorizontal: 14,
                }}
              >
                <Text
                  style={{
                    color: selected ? theme.primary : theme.muted,
                    fontFamily: "Poppins_700Bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {t(label)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {(isEggs || isPoultryLive) && Array.isArray(coverageQuery.data?.years) && coverageQuery.data.years.length ? (
          <View style={{ gap: 8 }}>
            <FilterChips options={yearOptions} selected={filterYear} onSelect={setFilterYear} theme={theme} />
            {window !== "year" ? (
              <FilterChips options={monthOptions} selected={filterMonth} onSelect={setFilterMonth} theme={theme} />
            ) : null}
            {window === "days" ? (
              <FilterChips
                options={weekOptions}
                selected={filterWeek}
                onSelect={(id) => {
                  setWeekPicked(true);
                  setFilterWeek(id);
                }}
                theme={theme}
              />
            ) : null}
          </View>
        ) : null}

        <View style={{ borderWidth: 1, borderColor: theme.line, borderRadius: 16, backgroundColor: theme.cardSoft, padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ flex: 1, color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 14, textTransform: "uppercase" }}>
              {t("Rate trend")}
            </Text>
            {seriesValues.length > 1 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons color={color} name={delta >= 0 ? "trending-up" : "trending-down"} size={16} />
                <Text style={{ color, fontFamily: "Poppins_700Bold", fontSize: 13 }}>
                  {delta > 0 ? "+" : ""}₹{n(money(delta))}
                </Text>
              </View>
            ) : null}
          </View>
          {chartPoints.length > 0 ? (
            <RateChart color={color} formatValue={(value) => n(money(value))} height={160} points={chartPoints} />
          ) : (
            <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 13 }}>
              {t("Rates will appear when market data is connected.")}
            </Text>
          )}
        </View>

        {(isEggs || isPoultryLive) && window === "month" && monthDays.length ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
              {monthShort(filterMonth, language)} {filterYear}
              {isEggs && sheetQuery.data && "necc_sheet_average" in sheetQuery.data && sheetQuery.data.necc_sheet_average
                ? ` · avg ₹${sheetQuery.data.necc_sheet_average}`
                : ""}
              {isPoultryLive &&
              sheetQuery.data &&
              "month_average" in sheetQuery.data &&
              sheetQuery.data.month_average
                ? ` · avg ₹${sheetQuery.data.month_average}`
                : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 }}>
              {monthDays.map((day) => (
                <View key={day.date || String(day.day)} style={{ width: "25%", padding: 3 }}>
                  <Pressable
                    accessibilityRole="button"
                    className="cursor-pointer hover:bg-green-50"
                    style={{ borderRadius: 10, backgroundColor: "#F1F5F9", paddingVertical: 8, paddingHorizontal: 6 }}
                  >
                    <Text style={{ color: theme.muted, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{day.day}</Text>
                    <Text style={{ marginTop: 2, color: theme.ink, fontFamily: "Poppins_700Bold", fontSize: 13 }}>
                      {day.price ? `₹${day.price}` : "—"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {dashboardQuery.data?.metadata?.disclaimer && isEggs ? (
          <Text style={{ color: theme.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
            {dashboardQuery.data.metadata.disclaimer}
          </Text>
        ) : null}
      </View>
    </FormModal>
  );
}
