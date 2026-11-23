import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleOption } from "../../components/ui/ModuleOption";
import { RateSparkline } from "../../components/ui/RateSparkline";
import { rateDelta, useAdminDemoStore } from "../../store/useAdminDemoStore";
import { useAppLayout } from "../../hooks/useAppLayout";
import { pageToneColor } from "../../components/ui/SectionTitle";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { useMarketDashboard } from "../../hooks/useMarketDashboard";
import { useMarketDemoMode } from "../../hooks/useMarketDemoMode";
import { useAuthStore } from "../../store/useAuthStore";
import { getApiErrorCode, getApiErrorMessage } from "../../utils/apiErrors";
import { ApiConfigBanner } from "../../components/market/ApiConfigBanner";
import { MarketLocationPrompt } from "../../components/market/MarketLocationPrompt";
import {
  hasDynamicMarketValue,
  MARKET_RATE_LAYOUT,
  mergeLiveMarketRates,
} from "../../utils/marketRates";

const RATE_CATEGORIES = [
  { id: "eggs", title: "Eggs rate", icon: "egg-outline", color: "#B45309", background: "#FEF3C7" },
  { id: "culls", title: "Culls birds rate", icon: "paw-outline", color: "#C2410C", background: "#FFEDD5" },
  { id: "broilers", title: "Broiler rates", icon: "trending-up-outline", color: "#16A34A", background: "#DCFCE7" },
  { id: "feed", title: "Feed raw materials rate", icon: "nutrition-outline", color: "#7E22CE", background: "#F3E8FF" },
] as const;

export default function MarketUpdatesScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("amber", isDark, colors.page);
  const { t } = useLanguage();
  const { category: requestedCategory } = useLocalSearchParams<{ category?: string }>();
  const demoRates = useAdminDemoStore((state) => state.rates);
  const user = useAuthStore((state) => state.user);
  const demoMode = useMarketDemoMode();
  const marketQuery = useMarketDashboard(null);
  const rates = useMemo(() => {
    const layout = demoMode ? demoRates : MARKET_RATE_LAYOUT;
    return mergeLiveMarketRates(layout, marketQuery.data, demoMode);
  }, [demoRates, demoMode, marketQuery.data]);
  const visibleCategories = useMemo(
    () => (demoMode ? RATE_CATEGORIES : RATE_CATEGORIES.filter((item) => item.id !== "feed")),
    [demoMode],
  );
  const marketErrorCode = getApiErrorCode(marketQuery.error);
  const needsMarketLocation = !demoMode && marketErrorCode === "profile_location_required";
  const marketLoading = !demoMode && marketQuery.isLoading;
  const marketSyncMissing = !demoMode && marketErrorCode === "market_data_unavailable";
  const liveZone =
    marketQuery.data?.metadata?.resolved_zone ?? marketQuery.data?.metadata?.selected_zone ?? null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    RATE_CATEGORIES.find((item) => item.id === requestedCategory)?.title ?? null,
  );
  const contentWidth = Math.min(width - 36, 980);
  const selected = RATE_CATEGORIES.find((item) => item.title === selectedCategory);
  const selectedRate = selected ? rates.find((rate) => rate.id === selected.id) : undefined;
  const selectedDelta = selectedRate ? rateDelta(selectedRate.month) : 0;
  const selectedTrendColor = selectedDelta > 0 ? "#15803D" : selectedDelta < 0 ? "#B91C1C" : colors.muted;

  useEffect(() => {
    setSelectedCategory(RATE_CATEGORIES.find((item) => item.id === requestedCategory)?.title ?? null);
  }, [requestedCategory]);

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(marketQuery.isFetching && !marketQuery.isLoading)}
            onRefresh={() => {
              void (async () => {
                const { ensureFreshAccessToken } = await import("../../services/api");
                await ensureFreshAccessToken();
                await marketQuery.refetch();
              })();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader title="Poultry info & updates" subtitle="Market rates and poultry business updates." tone="amber" />

          <ApiConfigBanner />
          {!demoMode && (!user?.pincode?.trim() || needsMarketLocation) ? <MarketLocationPrompt /> : null}

          {marketSyncMissing ? (
            <Text style={{ marginBottom: 12, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
              {getApiErrorMessage(marketQuery.error) ?? t("Egg rates are not synced yet. Try again later.")}
            </Text>
          ) : null}

          {marketLoading ? (
            <Text style={{ marginBottom: 12, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
              {t("Loading live egg rates…")}
            </Text>
          ) : null}

          {!demoMode && liveZone ? (
            <Text style={{ marginBottom: 12, color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>
              {t("Hub")}: {liveZone}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {visibleCategories.map((item) => {
              const rate = rates.find((entry) => entry.id === item.id);
              const hasValue = hasDynamicMarketValue(rate);
              return (
                <View key={item.title} style={{ width: width >= 760 ? "48.5%" : "100%" }}>
                  <ModuleOption
                    accessibilityLabel={`${t(item.title)}, ${t("current rate")} ₹${rate?.value ?? "—"}`}
                    background={item.background}
                    color={item.color}
                    icon={item.icon}
                    onPress={() => setSelectedCategory(item.title)}
                    subtitle={
                      hasValue
                        ? `Now ₹${rate?.value} · Prev ₹${rate?.previousValue || "—"}`
                        : t("Rates will appear when market data is connected.")
                    }
                    showChevron={false}
                    trailingContent={
                      rate && hasValue ? (
                        <View style={{ minWidth: 76, alignItems: "flex-end", marginLeft: 6 }}>
                          <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                            ₹{rate.value}
                          </Text>
                          <RateSparkline color={trendColorFromRate(rate, colors.muted)} height={22} values={rate.history} width={66} />
                        </View>
                      ) : null
                    }
                    title={t(item.title)}
                  />
                </View>
              );
            })}
          </View>
          <View style={{ marginTop: 20 }}>
            {selected && selectedRate && selectedRate.value ? (
              <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.card, padding: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: selected.background }}>
                    <Ionicons color={selected.color} name={selected.icon} size={20} />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t(selected.title)}</Text>
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{selectedRate.unit}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 18, flexDirection: width >= 600 ? "row" : "column", gap: 10 }}>
                  <View style={{ flex: 1, borderRadius: 15, backgroundColor: colors.cardSoft, padding: 14 }}>
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("Latest rate")}</Text>
                    <Text style={{ marginTop: 4, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 24 }}>
                      ₹{selectedRate.value}
                    </Text>
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{selectedRate.unit}</Text>
                  </View>
                  <View style={{ flex: 1, borderRadius: 15, backgroundColor: colors.cardSoft, padding: 14 }}>
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("Previous rate")}</Text>
                    <Text style={{ marginTop: 4, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 20 }}>
                      ₹{selectedRate.previousValue}
                    </Text>
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{selectedRate.unit}</Text>
                  </View>
                  <View style={{ flex: 1, minHeight: 110, justifyContent: "center", overflow: "hidden", borderRadius: 15, backgroundColor: selectedDelta > 0 ? colors.promoBg : selectedDelta < 0 ? "#FEF2F2" : colors.cardSoft, padding: 14 }}>
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("This month")}</Text>
                    <View style={{ marginTop: 10 }}>
                      <RateSparkline color={selectedTrendColor} height={45} values={selectedRate.month} />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <EmptyState
                icon="newspaper-outline"
                title={t("No market updates yet")}
                description={t("Select a category to see the latest rate.")}
              />
            )}
          </View>
          <View style={{ marginTop: 14, flexDirection: "row", alignItems: "flex-start", borderRadius: 14, backgroundColor: "#EFF6FF", padding: 13 }}>
            <Ionicons color="#1D4ED8" name="information-circle-outline" size={18} />
            <Text style={{ flex: 1, marginLeft: 8, color: "#334155", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17 }}>
              {demoMode
                ? t("Displayed demo rates are sample values only and are not current market quotations.")
                : t("Latest prices from the poultry market.")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function trendColorFromRate(rate: { previousValue: string; value: string }, muted: string) {
  const delta = rateDelta([Number(rate.previousValue), Number(rate.value)]);
  if (delta > 0) return "#15803D";
  if (delta < 0) return "#B91C1C";
  return muted;
}