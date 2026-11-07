import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleOption } from "../../components/ui/ModuleOption";
import { RateSparkline } from "../../components/ui/RateSparkline";
import { useAdminDemoStore } from "../../store/useAdminDemoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useLanguage } from "../../utils/i18n";

const RATE_CATEGORIES = [
  { id: "eggs", title: "Eggs rate", icon: "egg-outline", color: "#B45309", background: "#FEF3C7" },
  { id: "culls", title: "Culls birds rate", icon: "paw-outline", color: "#C2410C", background: "#FFEDD5" },
  { id: "broilers", title: "Broiler rates", icon: "trending-up-outline", color: "#16A34A", background: "#DCFCE7" },
  { id: "feed", title: "Feed raw materials rate", icon: "nutrition-outline", color: "#7E22CE", background: "#F3E8FF" },
] as const;

export default function MarketUpdatesScreen() {
  const { width } = useAppLayout();
  const { t } = useLanguage();
  const { category: requestedCategory } = useLocalSearchParams<{ category?: string }>();
  const user = useAuthStore((state) => state.user);
  const rates = useAdminDemoStore((state) => state.rates);
  const isDemoSession = Boolean(user?.id.startsWith("mock-"));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    RATE_CATEGORIES.find((item) => item.id === requestedCategory)?.title ?? null,
  );
  const contentWidth = Math.min(width - 36, 980);
  const selected = RATE_CATEGORIES.find((item) => item.title === selectedCategory);
  const selectedRate = selected ? rates.find((rate) => rate.id === selected.id) : undefined;
  const selectedCurrent = Number(selectedRate?.value);
  const selectedPrevious = Number(selectedRate?.previousValue);
  const selectedRising = selectedCurrent > selectedPrevious;
  const selectedFalling = selectedCurrent < selectedPrevious;
  const selectedTrendColor = selectedRising ? "#15803D" : selectedFalling ? "#B91C1C" : "#64748B";

  useEffect(() => {
    setSelectedCategory(RATE_CATEGORIES.find((item) => item.id === requestedCategory)?.title ?? null);
  }, [requestedCategory]);

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader title="Poultry info & updates" subtitle="Market rates and poultry business updates." />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {RATE_CATEGORIES.map((item) => (
              <View key={item.title} style={{ width: width >= 760 ? "48.5%" : "100%" }}>
                <ModuleOption
                  accessibilityLabel={`${t(item.title)}${isDemoSession ? `, ${t("current rate")} ₹${rates.find((rate) => rate.id === item.id)?.value}, ${t("previous rate")} ₹${rates.find((rate) => rate.id === item.id)?.previousValue}` : `, ${t("rates unavailable")}`}`}
                  background={item.background}
                  color={item.color}
                  icon={item.icon}
                  onPress={() => setSelectedCategory(item.title)}
                  subtitle={
                    isDemoSession
                      ? `Now ₹${rates.find((rate) => rate.id === item.id)?.value ?? "—"} · Prev ₹${rates.find((rate) => rate.id === item.id)?.previousValue ?? "—"}`
                      : t("Rate data unavailable")
                  }
                  showChevron={false}
                  trailingContent={isDemoSession ? (() => {
                    const rate = rates.find((entry) => entry.id === item.id);
                    if (!rate) return null;
                    const current = Number(rate.value);
                    const previous = Number(rate.previousValue);
                    const trendColor = current > previous ? "#15803D" : current < previous ? "#B91C1C" : "#64748B";
                    return (
                      <View style={{ minWidth: 76, alignItems: "flex-end", marginLeft: 6 }}>
                        <Text style={{ color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                          ₹{rate.value}
                        </Text>
                        <RateSparkline color={trendColor} height={22} values={rate.history} width={66} />
                      </View>
                    );
                  })() : null}
                  title={t(item.title)}
                />
              </View>
            ))}
          </View>
          <View style={{ marginTop: 20 }}>
            {selected && isDemoSession && selectedRate ? (
              <View style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 20, backgroundColor: "#FFFFFF", padding: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: selected.background }}>
                    <Ionicons color={selected.color} name={selected.icon} size={20} />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t(selected.title)}</Text>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("Demo market update · sample data")}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 18, flexDirection: width >= 600 ? "row" : "column", gap: 10 }}>
                  <View style={{ flex: 1, borderRadius: 15, backgroundColor: "#F8FAFC", padding: 14 }}>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("Latest rate")}</Text>
                    <Text style={{ marginTop: 4, color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 24 }}>
                      ₹{selectedRate.value}
                    </Text>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{selectedRate.unit}</Text>
                  </View>
                  <View style={{ flex: 1, borderRadius: 15, backgroundColor: "#F8FAFC", padding: 14 }}>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("Previous rate")}</Text>
                    <Text style={{ marginTop: 4, color: "#334155", fontFamily: "Poppins_600SemiBold", fontSize: 20 }}>
                      ₹{selectedRate.previousValue}
                    </Text>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{selectedRate.unit}</Text>
                  </View>
                  <View style={{ flex: 1, minHeight: 110, justifyContent: "center", borderRadius: 15, backgroundColor: selectedRising ? "#F0FDF4" : selectedFalling ? "#FEF2F2" : "#F8FAFC", padding: 14 }}>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t("Recent rate trend · sample history")}</Text>
                    <View style={{ marginTop: 10, alignItems: "center" }}>
                      <RateSparkline
                        color={selectedTrendColor}
                        height={45}
                        values={selectedRate.history}
                        width={width >= 600 ? 220 : Math.max(180, width - 104)}
                      />
                    </View>
                  </View>
                </View>
                <Text style={{ marginTop: 12, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>
                  {t("Demo values only; not current market quotations. The previous rate is replaced whenever the admin updates this demo rate.")}
                </Text>
              </View>
            ) : selected ? (
              <EmptyState
                icon={selected.icon}
                title={isDemoSession
                  ? t("{category} · demo data").replace("{category}", t(selected.title))
                  : t("{category} unavailable").replace("{category}", t(selected.title))}
                description={
                  isDemoSession
                    ? t("Demo rate: ₹{value} {unit}. This is sample data, not a live regional rate.")
                        .replace("{value}", rates.find((rate) => rate.id === selected.id)?.value ?? "—")
                        .replace("{unit}", rates.find((rate) => rate.id === selected.id)?.unit ?? "")
                    : t("Regional rates and updates will appear here once the market data service is connected.")
                }
              />
            ) : (
              <EmptyState
                icon="newspaper-outline"
                title={t("No market updates yet")}
                description={t("Select a category to see its regional updates when the market data service is available.")}
              />
            )}
          </View>
          <View style={{ marginTop: 14, flexDirection: "row", alignItems: "flex-start", borderRadius: 14, backgroundColor: "#EFF6FF", padding: 13 }}>
            <Ionicons color="#1D4ED8" name="information-circle-outline" size={18} />
            <Text style={{ flex: 1, marginLeft: 8, color: "#334155", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17 }}>
              {isDemoSession
                ? t("Displayed demo rates are sample values only and are not current market quotations.")
                : t("No rates are estimated or displayed until verified market data is connected.")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
