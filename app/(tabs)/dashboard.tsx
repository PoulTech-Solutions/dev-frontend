import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { RateDetailModal, type RateCardId } from "../../components/market/RateDetailModal";
import { PictureSymbol, type PictureName } from "../../components/ui/PictureSymbol";
import { RateTicker } from "../../components/ui/RateTicker";
import { MainCard } from "../../components/ui/MainCard";
import { pageToneColor, SectionTitle, type CardTone } from "../../components/ui/SectionTitle";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isMockAuthEnabled } from "../../hooks/useAuth";
import { useMarketDashboard } from "../../hooks/useMarketDashboard";
import {
  loadFarms,
  subscribeFarmsChanged,
  summarizeFarmPortfolio,
  type FarmPortfolioSummary,
  type SavedFarm,
} from "../../services/localRecords";
import { latestFlockSize } from "../../utils/farmRecordCalc";
import {
  rateDelta,
  useAdminDemoStore,
  type AdminDemoRate,
  type RateWindow,
} from "../../store/useAdminDemoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { DEMO_PRODUCTS, DEMO_RAW_MATERIALS } from "../../utils/demoData";
import { firstName } from "../../utils/displayName";
import { useLanguage } from "../../utils/i18n";

type RateDetail = { id: RateCardId; window: RateWindow };

const FARM_POINTS = [
  "Keep your poultry on your finger",
  "Handle your farm in an organised and simple way",
  "Now it is time to relax and enjoy your farming unit",
] as const;

const RATE_CARDS: {
  id: RateCardId;
  title: string;
  icon: PictureName;
  color: string;
  background: string;
}[] = [
  { id: "eggs", title: "Egg rate", icon: "egg", color: "#B45309", background: "#FEF3C7" },
  { id: "culls", title: "Culls rate", icon: "bird", color: "#C2410C", background: "#FFEDD5" },
  { id: "broilers", title: "Broiler rate", icon: "chicken", color: "#15803D", background: "#DCFCE7" },
];

const SERVICES: { title: string; icon: PictureName }[] = [
  { title: "Vaccination team", icon: "syringe" },
  { title: "Medicine door delivery", icon: "pill" },
  { title: "Water quality testing", icon: "water" },
  { title: "Feed quality testing", icon: "wheat" },
  { title: "Flock health checkup", icon: "stethoscope" },
];

const MATERIAL_PICTURE: Record<string, PictureName> = {
  "soya-doc": "seed",
  maize: "corn",
  dorb: "rice",
  ddgs: "grain",
  gnte: "peanut",
  mustard: "flower",
  rapeseed: "sprout",
};

const UP = "#15803D";
const DOWN = "#B91C1C";

function money(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function quoteColor(value: number, previous: number, ink: string) {
  if (value > previous) return UP;
  if (value < previous) return DOWN;
  return ink;
}

/** Title + subtitle + content share one outer card. */
function SectionCard({
  title,
  subtitle,
  tone = "green",
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: CardTone;
  children: ReactNode;
}) {
  return (
    <MainCard tone={tone}>
      <SectionTitle subtitle={subtitle} title={title} tone={tone} />
      {children}
    </MainCard>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t, n } = useLanguage();
  const { width, sidebarVisible } = useAppLayout();
  const { colors: theme, isDark } = useAppTheme();
  const pageBg = pageToneColor("green", isDark, theme.page);
  const user = useAuthStore((state) => state.user);
  const demoRates = useAdminDemoStore((state) => state.rates);
  const demoMode = Boolean(user?.id.startsWith("mock-")) || isMockAuthEnabled;
  const marketQuery = useMarketDashboard(null);
  const [rateDetail, setRateDetail] = useState<RateDetail | null>(null);
  const [farms, setFarms] = useState<SavedFarm[]>([]);
  const [farmSummary, setFarmSummary] = useState<FarmPortfolioSummary | null>(null);
  const pagePadding = width < 480 ? 12 : 18;
  const rateColumns = width >= 980 ? 3 : 1;
  const materialsBeside = width >= 860;
  const contentWidth = Math.min(Math.max(0, width - pagePadding * 2), 1180);
  const helloName = firstName(user?.name) || t("farmer");

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || user.role === "admin") return;
      let active = true;
      const refresh = () => {
        void loadFarms(user.id)
          .then((next) => {
            if (!active) return;
            setFarms(next);
            setFarmSummary(summarizeFarmPortfolio(next));
          })
          .catch(() => {
            if (!active) return;
            setFarms([]);
            setFarmSummary(null);
          });
      };
      refresh();
      const unsubscribe = subscribeFarmsChanged(refresh);
      return () => {
        active = false;
        unsubscribe();
      };
    }, [user?.id, user?.role]),
  );

  const rates = useMemo((): AdminDemoRate[] => {
    const liveEggs = marketQuery.data?.rates?.find((item) => item.id === "eggs");
    if (!liveEggs) return demoRates;
    return demoRates.map((rate) => {
      if (rate.id !== "eggs") return rate;
      return {
        ...rate,
        title: liveEggs.title || rate.title,
        unit: liveEggs.unit || rate.unit,
        value: liveEggs.value,
        previousValue: liveEggs.previousValue,
        nextValue: liveEggs.nextValue,
        month: liveEggs.month?.length ? liveEggs.month : rate.month,
        year: liveEggs.year?.length ? liveEggs.year : rate.year,
        history: liveEggs.history?.length ? liveEggs.history : rate.history,
      };
    });
  }, [demoRates, marketQuery.data]);

  const liveZone =
    marketQuery.data?.metadata.resolved_zone ?? marketQuery.data?.metadata.selected_zone ?? null;

  if (user?.role === "admin") {
    return <AdminDashboard demoMode={demoMode} />;
  }

  const open = (href: Href) => router.push(href);
  const detailCard = rateDetail ? RATE_CARDS.find((card) => card.id === rateDetail.id) : undefined;
  const detailRate = rateDetail ? rates.find((item) => item.id === rateDetail.id) : undefined;
  const previewProducts = DEMO_PRODUCTS.slice(0, 4);

  const tickerItems = useMemo(() => {
    const fromApi = marketQuery.data?.ticker?.map((item) => ({
      label: item.label,
      value: item.value,
      change: item.change,
    }));
    if (fromApi?.length) {
      return [
        ...fromApi,
        ...DEMO_RAW_MATERIALS.map((item, index) => ({
          label: item.name,
          value: money(item.price),
          change: [1, -0.5, 0.5, -1, 1.5, -0.5, 0][index] ?? 0,
        })),
      ];
    }
    return [
      ...RATE_CARDS.map((card) => {
        const rate = rates.find((item) => item.id === card.id);
        const today = Number(rate?.value);
        const yesterday = Number(rate?.previousValue);
        return {
          label: card.title,
          value: money(Number.isFinite(today) ? today : 0),
          change:
            Number.isFinite(today) && Number.isFinite(yesterday)
              ? Math.round((today - yesterday) * 10) / 10
              : 0,
        };
      }),
      ...DEMO_RAW_MATERIALS.map((item, index) => ({
        label: item.name,
        value: money(item.price),
        change: [1, -0.5, 0.5, -1, 1.5, -0.5, 0][index] ?? 0,
      })),
    ];
  }, [marketQuery.data?.ticker, rates]);

  const servicesGrid = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 }}>
      {SERVICES.map((service) => (
        <View key={service.title} style={{ width: "50%", padding: 5 }}>
          <Pressable
            accessibilityLabel={t(service.title)}
            accessibilityRole="button"
            className="cursor-pointer"
            onPress={() => open("/(tabs)/(services)/booking")}
            style={{
              minHeight: 132,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.line,
              backgroundColor: theme.cardSoft,
              padding: 12,
            }}
          >
            <PictureSymbol name={service.icon} size={44} />
            <Text
              style={{
                marginTop: 10,
                color: theme.ink,
                fontFamily: "Poppins_700Bold",
                fontSize: 13,
                lineHeight: 18,
                textTransform: "uppercase",
              }}
            >
              {t(service.title)}
            </Text>
            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Book now")}</Text>
              <Ionicons color="#15803D" name="chevron-forward" size={14} style={{ marginLeft: 2 }} />
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: pagePadding,
          paddingTop: sidebarVisible ? 18 : 10,
          paddingBottom: 28,
        }}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center", gap: 22 }}>
          <MainCard padded={false} tone="plain">
            <Pressable
              accessibilityLabel={t("Open My Farm")}
              accessibilityRole="button"
              className="cursor-pointer"
              onPress={() => open("/(tabs)/(farm)/records")}
            >
              <ImageBackground
                contentFit="cover"
                source={require("../../assets/images/login-hero.jpg")}
                style={{ width: "100%", minHeight: 220 }}
              >
                <View style={{ flex: 1, backgroundColor: "rgba(15, 46, 24, 0.72)", padding: 20 }}>
                  <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 26 }}>
                    {t("Hello, {name}").replace("{name}", helloName)}
                  </Text>
                  <View style={{ marginTop: 16, gap: 8 }}>
                    {FARM_POINTS.map((point) => (
                      <Text key={point} style={{ color: "#F0FDF4", fontFamily: "Poppins_500Medium", fontSize: 15, lineHeight: 22 }}>
                        {t(point)}
                      </Text>
                    ))}
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          </MainCard>

          <SectionCard title="Poultry info and updates" subtitle="Today's egg, culls, broiler and feed rates" tone="amber">
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {RATE_CARDS.map((card) => {
                const rate = rates.find((item) => item.id === card.id);
                const yesterday = Number(rate?.previousValue);
                const today = Number(rate?.value);
                const tomorrow = Number(rate?.nextValue);
                const monthDelta = rate ? rateDelta(rate.month) : 0;
                const yearDelta = rate ? rateDelta(rate.year) : 0;
                const isLiveEggs =
                  card.id === "eggs" && Boolean(marketQuery.data?.rates?.some((item) => item.id === "eggs"));
                return (
                  <View
                    key={card.id}
                    style={{ width: rateColumns === 3 ? "33.333%" : "100%", paddingHorizontal: 6, paddingBottom: 12 }}
                  >
                    <Pressable
                      accessibilityLabel={t(card.title)}
                      accessibilityRole="button"
                      className="cursor-pointer"
                      onPress={() => setRateDetail({ id: card.id, window: "month" })}
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: theme.line,
                        borderRadius: 16,
                        backgroundColor: theme.card,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: card.background,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.line,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <PictureSymbol name={card.icon} size={48} />
                          <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                            <Text
                              style={{
                                color: card.color,
                                fontFamily: "Poppins_700Bold",
                                fontSize: 15,
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                              }}
                            >
                              {t(card.title)}
                            </Text>
                            {isLiveEggs ? (
                              <Text style={{ marginTop: 2, color: UP, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>
                                NECC{liveZone ? ` · ${liveZone}` : ""}
                              </Text>
                            ) : null}
                          </View>
                          {rate ? (
                            <View style={{ flexDirection: "row", marginLeft: 6, gap: 6 }}>
                              {(
                                [
                                  ["month", monthDelta],
                                  ["year", yearDelta],
                                ] as const
                              ).map(([range, delta]) => {
                                const up = delta > 0;
                                const down = delta < 0;
                                return (
                                  <Pressable
                                    key={range}
                                    accessibilityLabel={`${t(card.title)} ${t(range === "month" ? "Month" : "Year")}`}
                                    accessibilityRole="button"
                                    className="cursor-pointer"
                                    onPress={() => setRateDetail({ id: card.id, window: range })}
                                    style={{
                                      minHeight: 32,
                                      justifyContent: "center",
                                      borderRadius: 10,
                                      backgroundColor: up ? "#DCFCE7" : down ? "#FEE2E2" : theme.card,
                                      borderWidth: 1,
                                      borderColor: up ? "#BBF7D0" : down ? "#FECACA" : theme.line,
                                      paddingHorizontal: 10,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: up ? UP : down ? DOWN : theme.muted,
                                        fontFamily: "Poppins_700Bold",
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {t(range === "month" ? "Month" : "Year")}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View style={{ padding: 12 }}>
                        {rate ? (
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            {(
                              [
                                ["Yesterday", yesterday, theme.ink],
                                ["Today", today, quoteColor(today, yesterday, theme.ink)],
                                ["Tomorrow", tomorrow, quoteColor(tomorrow, today, theme.ink)],
                              ] as const
                            ).map(([label, value, color]) => (
                              <View
                                key={label}
                                style={{
                                  flex: 1,
                                  borderRadius: 12,
                                  backgroundColor: theme.cardSoft,
                                  paddingHorizontal: 8,
                                  paddingVertical: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    color: theme.muted,
                                    fontFamily: "Poppins_500Medium",
                                    fontSize: 10,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {t(label)}
                                </Text>
                                <Text style={{ marginTop: 4, color, fontFamily: "Poppins_700Bold", fontSize: 17 }}>
                                  ₹{n(money(value))}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={{ color: theme.muted, fontFamily: "Poppins_400Regular", fontSize: 14 }}>
                            {t("Rate unavailable")}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </SectionCard>

          <View
            style={{
              flexDirection: materialsBeside ? "row" : "column",
              alignItems: "flex-start",
              gap: materialsBeside ? 16 : 18,
            }}
          >
            <View
              style={{
                flex: materialsBeside ? 1.15 : undefined,
                width: materialsBeside ? undefined : "100%",
                minWidth: 0,
                gap: 18,
              }}
            >
              <SectionCard title="Farm Mitra" subtitle="Your farm records and daily flock tools" tone="navy">
                <View style={{ gap: 12 }}>
                  {/* Billing — separate module */}
                  <Pressable
                    accessibilityLabel={t("Billing software")}
                    onPress={() => open("/(tabs)/(farm)/billing")}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#BFDBFE",
                      backgroundColor: "#EFF6FF",
                      padding: 14,
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <PictureSymbol name="sack" size={40} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: "#1E3A8A", fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
                          {t("Billing software")}
                        </Text>
                        <Text style={{ marginTop: 3, color: "#1D4ED8", fontFamily: "Poppins_500Medium", fontSize: 12, lineHeight: 17 }}>
                          {t("Create and share customer invoices")}
                        </Text>
                      </View>
                      <Ionicons color="#1D4ED8" name="chevron-forward" size={18} />
                    </View>
                  </Pressable>

                  {/* Records summary — separate module */}
                  <View
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                      backgroundColor: "#F0FDF4",
                      padding: 12,
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <PictureSymbol name="chicken" size={36} />
                      <View style={{ flex: 1, minWidth: 140 }}>
                        <Text style={{ color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
                          {t("Records summary")}
                        </Text>
                        {farmSummary && farmSummary.farmCount > 0 ? (
                          <Text style={{ marginTop: 2, color: "#166534", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                            {n(farmSummary.farmCount)} {t("farms")} · {n(farmSummary.shedCount)} {t("sheds")} · {n(farmSummary.liveBirds)}{" "}
                            {t("live birds")}
                            {farmSummary.recordDays > 0 ? ` · ${n(farmSummary.recordDays)} ${t("record days")}` : ""}
                          </Text>
                        ) : (
                          <Text style={{ marginTop: 2, color: "#166534", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                            {t("Add a farm and sheds to see live flock totals here.")}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        accessibilityLabel={t("Open Farm Mitra")}
                        onPress={() => open("/(tabs)/(farm)/records")}
                        style={{
                          minHeight: 36,
                          borderRadius: 10,
                          backgroundColor: "#15803D",
                          paddingHorizontal: 12,
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 11 }}>{t("Open")}</Text>
                      </Pressable>
                    </View>

                    {farms.length ? (
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                          marginHorizontal: -5,
                        }}
                      >
                        {farms.map((farm) => {
                          const farmBirds = farm.sheds.reduce((sum, shed) => {
                            if (shed.flockBook) return sum + latestFlockSize(shed.flockBook);
                            return sum + (Number(String(shed.birds).replace(/,/g, "")) || 0);
                          }, 0);
                          const farmCols = width >= 560 ? 2 : 1;
                          return (
                            <View
                              key={farm.id}
                              style={{
                                width: farmCols === 2 ? "50%" : "100%",
                                padding: 5,
                                alignSelf: "flex-start",
                              }}
                            >
                              <View
                                style={{
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: "#BBF7D0",
                                  backgroundColor: theme.card,
                                  padding: 12,
                                  gap: 8,
                                }}
                              >
                                <Pressable onPress={() => open("/(tabs)/(farm)/records")}>
                                  <Text numberOfLines={2} style={{ color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 14 }}>
                                    {farm.name}
                                  </Text>
                                  <Text style={{ marginTop: 2, color: theme.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                                    {farm.place || t("Farm")} · {n(farm.sheds.length)} {t("sheds")}
                                  </Text>
                                  <Text style={{ marginTop: 2, color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                                    {n(farmBirds)} {t("live birds")}
                                  </Text>
                                </Pressable>

                                {farm.sheds.length ? (
                                  <View style={{ gap: 5 }}>
                                    {farm.sheds.map((shed) => {
                                      const recordDays = shed.flockBook?.dailyRecords.length ?? 0;
                                      const birds = shed.flockBook
                                        ? latestFlockSize(shed.flockBook)
                                        : Number(String(shed.birds).replace(/,/g, "")) || 0;
                                      return (
                                        <Pressable
                                          key={shed.id}
                                          accessibilityLabel={`${t(shed.name)} ${t("record book")}`}
                                          onPress={() =>
                                            open(
                                              `/(tabs)/(farm)/shed-book?farmId=${encodeURIComponent(farm.id)}&shedId=${encodeURIComponent(shed.id)}` as Href,
                                            )
                                          }
                                          style={{
                                            borderRadius: 10,
                                            backgroundColor: "#F0FDF4",
                                            borderWidth: 1,
                                            borderColor: "#DCFCE7",
                                            paddingHorizontal: 8,
                                            paddingVertical: 8,
                                          }}
                                        >
                                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <PictureSymbol name="chicken" size={24} />
                                            <Text numberOfLines={1} style={{ flex: 1, color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 11 }}>
                                              {shed.name}
                                            </Text>
                                            <Ionicons color="#15803D" name="chevron-forward" size={14} />
                                          </View>
                                          <Text style={{ marginTop: 4, color: "#166534", fontFamily: "Poppins_500Medium", fontSize: 10 }}>
                                            {n(birds)} {t("birds")} · {n(recordDays)} {t("days")}
                                          </Text>
                                        </Pressable>
                                      );
                                    })}
                                  </View>
                                ) : (
                                  <Text style={{ color: theme.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                                    {t("No sheds yet — add a shed in Farm Mitra.")}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                </View>
              </SectionCard>

              <SectionCard title="Services" subtitle="Now it is easy to find services for your poultry farm" tone="teal">
                {servicesGrid}
              </SectionCard>
            </View>

            <View
              style={{
                flex: materialsBeside ? 0.85 : undefined,
                width: materialsBeside ? undefined : "100%",
                minWidth: 0,
                gap: 18,
              }}
            >
              <SectionCard title="Raw material rate" subtitle="Today's feed and grain prices" tone="green">
                <View style={{ gap: 8 }}>
                  {DEMO_RAW_MATERIALS.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        minHeight: 58,
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 14,
                        backgroundColor: theme.cardSoft,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }}
                    >
                      <PictureSymbol name={MATERIAL_PICTURE[item.id] ?? "sack"} size={46} />
                      <Text style={{ flex: 1, marginLeft: 12, color: theme.ink, fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>
                        {t(item.name)}
                      </Text>
                      <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>₹{n(item.price)}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>

              <SectionCard title="Marketplace" subtitle="Buy and sell poultry products near you" tone="blue">
                <View style={{ gap: 12 }}>
                  <Pressable
                    accessibilityLabel={t("Seller")}
                    accessibilityRole="button"
                    className="cursor-pointer"
                    onPress={() => open("/(tabs)/(marketplace)/feed?mode=sell")}
                    style={{
                      minHeight: 76,
                      borderRadius: 14,
                      backgroundColor: "#F3E8FF",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <PictureSymbol name="shop" size={40} />
                    <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                      <Text
                        style={{
                          color: "#6B21A8",
                          fontFamily: "Poppins_700Bold",
                          fontSize: 13,
                          textTransform: "uppercase",
                        }}
                      >
                        {t("Seller")}
                      </Text>
                      <Text style={{ marginTop: 2, color: "#6B21A8", fontFamily: "Poppins_500Medium", fontSize: 12, lineHeight: 17 }}>
                        {t("List a product with a photo and a price")}
                      </Text>
                    </View>
                    <Ionicons color="#6B21A8" name="chevron-forward" size={18} />
                  </Pressable>

                  <View style={{ borderRadius: 14, backgroundColor: "#E0F2FE", padding: 12 }}>
                    <Pressable
                      accessibilityLabel={t("Purchase")}
                      accessibilityRole="button"
                      className="cursor-pointer"
                      onPress={() => open("/(tabs)/(marketplace)/feed")}
                      style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
                    >
                      <PictureSymbol name="cart" size={40} />
                      <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                        <Text
                          style={{
                            color: "#0C4A6E",
                            fontFamily: "Poppins_700Bold",
                            fontSize: 13,
                            textTransform: "uppercase",
                          }}
                        >
                          {t("Purchase")}
                        </Text>
                        <Text style={{ marginTop: 2, color: "#0C4A6E", fontFamily: "Poppins_500Medium", fontSize: 12 }}>
                          {t("Browse marketplace")}
                        </Text>
                      </View>
                      <Ionicons color="#0C4A6E" name="chevron-forward" size={18} />
                    </Pressable>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
                      {previewProducts.map((product) => (
                        <View key={product.id} style={{ width: "50%", padding: 4 }}>
                          <Pressable
                            accessibilityLabel={t(product.name)}
                            accessibilityRole="button"
                            className="cursor-pointer"
                            onPress={() => open("/(tabs)/(marketplace)/feed")}
                            style={{
                              borderRadius: 12,
                              backgroundColor: theme.card,
                              paddingHorizontal: 10,
                              paddingVertical: 10,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <PictureSymbol name={product.picture as PictureName} size={40} />
                              <View style={{ flex: 1 }} />
                              <Text
                                style={{
                                  color: theme.primary,
                                  fontFamily: "Poppins_700Bold",
                                  fontSize: 14,
                                  paddingLeft: 8,
                                }}
                              >
                                ₹{n(product.price)}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={2}
                              style={{
                                marginTop: 8,
                                color: theme.ink,
                                fontFamily: "Poppins_600SemiBold",
                                fontSize: 12,
                                lineHeight: 16,
                              }}
                            >
                              {t(product.name)}
                            </Text>
                            <Text style={{ marginTop: 3, color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 10 }}>
                              {t(product.category)}
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </SectionCard>
            </View>
          </View>
        </View>
      </ScrollView>
      <RateTicker items={tickerItems} />
      {detailCard && rateDetail ? (
        <RateDetailModal
          demoRate={detailRate}
          icon={detailCard.icon}
          initialWindow={rateDetail.window}
          liveEnabled={!demoMode}
          onClose={() => setRateDetail(null)}
          rateId={rateDetail.id}
          title={detailCard.title}
          visible
        />
      ) : null}
    </SafeAreaView>
  );
}
