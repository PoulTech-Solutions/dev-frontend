import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { FormModal } from "../ui/FormModal";
import { PictureSymbol, type PictureName } from "../ui/PictureSymbol";
import { RateChart } from "../ui/RateChart";
import { useAppTheme } from "../../hooks/useAppTheme";
import {
  useEggSheet,
  useEggTrend,
  useMarketDashboard,
  useMarketZones,
  useSetMarketZone,
} from "../../hooks/useMarketDashboard";
import { rateDelta, ratePoints, rateSeries, type AdminDemoRate, type RateWindow } from "../../store/useAdminDemoStore";
import { useLanguage, type AppLanguage } from "../../utils/i18n";

const UP = "#15803D";
const DOWN = "#B91C1C";

export type RateCardId = "eggs" | "culls" | "broilers";

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
  const isEggs = rateId === "eggs" && liveEnabled;
  const [window, setWindow] = useState<RateWindow>(initialWindow);
  const [zone, setZone] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setWindow(initialWindow);
  }, [visible, initialWindow]);

  const zonesQuery = useMarketZones(visible && isEggs);
  const setZoneMutation = useSetMarketZone();
  const dashboardQuery = useMarketDashboard(zone, visible && isEggs);
  const trendQuery = useEggTrend(
    zone,
    window === "days" ? "days" : window,
    visible && isEggs && Boolean(zone),
  );
  const sheetQuery = useEggSheet(zone, visible && isEggs && window === "month" && Boolean(zone));

  useEffect(() => {
    if (!visible || !isEggs) return;
    const next =
      zone ??
      dashboardQuery.data?.metadata.resolved_zone ??
      dashboardQuery.data?.metadata.selected_zone ??
      zonesQuery.data?.default_zone ??
      null;
    if (!zone && next) setZone(next);
  }, [
    visible,
    isEggs,
    zone,
    dashboardQuery.data?.metadata.resolved_zone,
    dashboardQuery.data?.metadata.selected_zone,
    zonesQuery.data?.default_zone,
  ]);

  const liveEggs = dashboardQuery.data?.rates?.find((item) => item.id === "eggs");
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
      : demoRate;

  const chartPoints = useMemo(() => {
    if (isEggs && trendQuery.data?.points?.length) {
      return trendQuery.data.points.map((point) => ({
        label: formatTrendLabel(point.date, window, language),
        value: point.value,
      }));
    }
    if (!activeRate) return [];
    const series = rateSeries(activeRate, window);
    return ratePoints(series, window).map((point) => ({
      label: pointLabel(point.at, window, language),
      value: point.value,
    }));
  }, [isEggs, trendQuery.data, activeRate, window, language]);

  const monthDays = useMemo(() => {
    const days = sheetQuery.data?.days ?? [];
    return [...days].sort((a, b) => a.day - b.day);
  }, [sheetQuery.data?.days]);

  const seriesValues = chartPoints.map((point) => point.value);
  const delta = rateDelta(seriesValues);
  const color = seriesValues.length > 1 ? trendColor(seriesValues, theme.muted) : theme.muted;
  const yesterday = Number(activeRate?.previousValue);
  const today = Number(activeRate?.value);
  const tomorrow = Number(activeRate?.nextValue);
  const loading = isEggs && (dashboardQuery.isFetching || trendQuery.isFetching);

  const selectZone = (name: string) => {
    setZone(name);
    setZoneMutation.mutate(name);
  };

  return (
    <FormModal
      onClose={onClose}
      size="large"
      title={`${title}${zone && isEggs ? ` · ${zone}` : ""}`}
      visible={visible}
    >
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <PictureSymbol name={icon} size={52} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "uppercase" }}>
              {isEggs ? t("NECC suggested · per 100 eggs") : t("Sample preview rates")}
            </Text>
            <Text style={{ marginTop: 2, color: theme.ink, fontFamily: "Poppins_700Bold", fontSize: 22 }}>
              {Number.isFinite(today) ? `₹${n(money(today))}` : "—"}
            </Text>
          </View>
          {loading ? <ActivityIndicator color={theme.accent} /> : null}
        </View>

        {isEggs && zonesQuery.data?.zones?.length ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
              {t("Regions")}
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
                {Number.isFinite(value) ? `₹${n(money(value))}` : "—"}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {(["days", "month", "year"] as const).map((option) => {
            const selected = window === option;
            const label = option === "days" ? "Days" : option === "month" ? "Month" : "Year";
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
          {chartPoints.length > 1 ? (
            <RateChart color={color} formatValue={(value) => n(money(value))} height={160} points={chartPoints} />
          ) : (
            <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 13 }}>
              {t("Rates will appear when market data is connected.")}
            </Text>
          )}
        </View>

        {isEggs && window === "month" && monthDays.length ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
              {t("This month")}
              {sheetQuery.data?.necc_sheet_average ? ` · avg ₹${sheetQuery.data.necc_sheet_average}` : ""}
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

        {dashboardQuery.data?.metadata.disclaimer && isEggs ? (
          <Text style={{ color: theme.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
            {dashboardQuery.data.metadata.disclaimer}
          </Text>
        ) : null}
      </View>
    </FormModal>
  );
}
