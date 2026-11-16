import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { FormModal } from "../../components/ui/FormModal";
import { PictureSymbol, type PictureName } from "../../components/ui/PictureSymbol";
import { RateChart } from "../../components/ui/RateChart";
import { RateTicker } from "../../components/ui/RateTicker";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { rateDelta, ratePoints, rateSeries, useAdminDemoStore, type RateWindow } from "../../store/useAdminDemoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { DEMO_RAW_MATERIALS } from "../../utils/demoData";
import { useLanguage, type AppLanguage } from "../../utils/i18n";

type RateRange = "month" | "year";
type RateDetail = { id: "eggs" | "culls" | "broilers"; range: RateRange };


const FARM_POINTS = [
  "Keep your poultry on your finger",
  "Handle your farm in an organised and simple way",
  "Now it is time to relax and enjoy your farming unit",
] as const;

const RATE_CARDS: { id: "eggs" | "culls" | "broilers"; title: string; icon: PictureName; color: string; background: string }[] = [
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

const TRENDS: { id: "eggs" | "culls" | "broilers"; title: string; icon: PictureName }[] = [
  { id: "eggs", title: "Egg rate trend", icon: "egg" },
  { id: "culls", title: "Culls rate trend", icon: "bird" },
  { id: "broilers", title: "Broiler rate trend", icon: "chicken" },
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

function trendColor(values: number[], muted: string) {
  const delta = rateDelta(values);
  if (delta > 0) return UP;
  if (delta < 0) return DOWN;
  return muted;
}

function money(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function quoteColor(value: number, previous: number, ink: string) {
  if (value > previous) return UP;
  if (value < previous) return DOWN;
  return ink;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 4, height: 22, borderRadius: 4, backgroundColor: colors.accent, marginRight: 10 }} />
        <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 22 }}>{t(title)}</Text>
      </View>
      {subtitle ? (
        <View
          style={{
            marginTop: 10,
            borderRadius: 12,
            backgroundColor: colors.promoBg,
            borderWidth: 1,
            borderColor: colors.promoBorder,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.promoText, fontFamily: "Poppins_600SemiBold", fontSize: 14, lineHeight: 20 }}>{t(subtitle)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function pointLabel(date: Date, window: RateWindow, language: AppLanguage) {
  const locale = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
  if (window === "year") return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t, n, language } = useLanguage();
  const { width, sidebarVisible } = useAppLayout();
  const { colors: theme } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const rates = useAdminDemoStore((state) => state.rates);
  const demoMode = Boolean(user?.id.startsWith("mock-"));
  const [windows, setWindows] = useState<Record<string, RateWindow>>({});
  const [rateDetail, setRateDetail] = useState<RateDetail | null>(null);
  const pagePadding = width < 480 ? 12 : 18;
  const rateColumns = width >= 980 ? 3 : 1;
  const materialsBeside = width >= 860;
  const contentWidth = Math.min(Math.max(0, width - pagePadding * 2), 1180);

  if (user?.role === "admin") {
    return <AdminDashboard demoMode={demoMode} />;
  }

  const open = (href: Href) => router.push(href);
  const detailCard = rateDetail ? RATE_CARDS.find((card) => card.id === rateDetail.id) : undefined;
  const detailRate = rateDetail ? rates.find((item) => item.id === rateDetail.id) : undefined;
  const detailSeries = detailRate ? (rateDetail?.range === "month" ? detailRate.month : detailRate.year) : [];
  const detailDelta = rateDelta(detailSeries);
  const detailColor = detailSeries.length > 1 ? trendColor(detailSeries, theme.muted) : theme.muted;
  const tickerItems = useMemo(
    () => [
      ...RATE_CARDS.map((card) => {
        const rate = rates.find((item) => item.id === card.id);
        const today = Number(rate?.value);
        const yesterday = Number(rate?.previousValue);
        return {
          label: card.title,
          value: money(Number.isFinite(today) ? today : 0),
          change: Number.isFinite(today) && Number.isFinite(yesterday) ? Math.round((today - yesterday) * 10) / 10 : 0,
        };
      }),
      ...DEMO_RAW_MATERIALS.map((item, index) => ({
        label: item.name,
        value: money(item.price),
        change: [1, -0.5, 0.5, -1, 1.5, -0.5, 0][index] ?? 0,
      })),
    ],
    [rates],
  );

  const marketplaceCards = (
    <View style={{ gap: 10 }}>
      {(
        [
          {
            title: "Seller",
            detail: "List a product with a photo and a price",
            href: "/(tabs)/(marketplace)/feed?mode=sell" as Href,
            picture: "shop" as PictureName,
            background: "#F3E8FF",
            color: "#6B21A8",
          },
          {
            title: "Purchase",
            detail: "See the photo, details, category, and the dealer phone number",
            href: "/(tabs)/(marketplace)/feed" as Href,
            picture: "cart" as PictureName,
            background: "#E0F2FE",
            color: "#0C4A6E",
          },
        ] as const
      ).map((card) => (
        <Pressable
          key={card.title}
          accessibilityLabel={t(card.title)}
          accessibilityRole="button"
          className="cursor-pointer"
          onPress={() => open(card.href)}
          style={{ minHeight: 148, borderRadius: 16, backgroundColor: card.background, padding: 16 }}
        >
          <PictureSymbol name={card.picture} size={52} />
          <Text style={{ marginTop: 12, color: card.color, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t(card.title)}</Text>
          <Text style={{ marginTop: 6, color: card.color, fontFamily: "Poppins_500Medium", fontSize: 14, lineHeight: 20 }}>{t(card.detail)}</Text>
        </Pressable>
      ))}
    </View>
  );

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
              minHeight: 140,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.line,
              backgroundColor: theme.card,
              padding: 14,
            }}
          >
            <PictureSymbol name={service.icon} size={48} />
            <Text style={{ marginTop: 10, color: theme.ink, fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 21 }}>{t(service.title)}</Text>
            <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Book now")}</Text>
              <Ionicons color="#15803D" name="chevron-forward" size={14} style={{ marginLeft: 2 }} />
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: theme.page }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: pagePadding, paddingTop: sidebarVisible ? 18 : 10, paddingBottom: 28 }}>
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center", gap: 22 }}>
          <View style={{ overflow: "hidden", borderRadius: 22 }}>
            <ImageBackground
              contentFit="cover"
              source={require("../../assets/images/login-hero.jpg")}
              style={{ width: "100%", minHeight: 240 }}
            >
              <View style={{ flex: 1, backgroundColor: "rgba(15, 46, 24, 0.72)", padding: 20 }}>
                <Text style={{ color: "#D9F99D", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t("Farm Mitra")}</Text>
                <Text style={{ marginTop: 4, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 26 }}>
                  {t("Hello, {name}").replace("{name}", user?.name?.split(/\s+/)[0] || t("farmer"))}
                </Text>
                <View style={{ marginTop: 16, gap: 8 }}>
                  {FARM_POINTS.map((point) => (
                    <Text key={point} style={{ color: "#F0FDF4", fontFamily: "Poppins_500Medium", fontSize: 15, lineHeight: 22 }}>
                      {t(point)}
                    </Text>
                  ))}
                </View>
                <Pressable
                  accessibilityLabel={t("Open My Farm")}
                  accessibilityRole="button"
                  className="cursor-pointer"
                  onPress={() => open("/(tabs)/(farm)/records")}
                  style={{
                    minHeight: 48,
                    marginTop: 18,
                    alignSelf: "flex-start",
                    justifyContent: "center",
                    borderRadius: 14,
                    backgroundColor: "#FFFFFF",
                    paddingHorizontal: 18,
                  }}
                >
                  <Text style={{ color: "#14532D", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>{t("Open My Farm")}</Text>
                </Pressable>
              </View>
            </ImageBackground>
          </View>

          <View>
            <SectionTitle title="Poultry info and updates" subtitle="Today's egg, culls, broiler and feed rates" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {RATE_CARDS.map((card) => {
                const rate = rates.find((item) => item.id === card.id);
                const yesterday = Number(rate?.previousValue);
                const today = Number(rate?.value);
                const tomorrow = Number(rate?.nextValue);
                const monthDelta = rate ? rateDelta(rate.month) : 0;
                const yearDelta = rate ? rateDelta(rate.year) : 0;
                return (
                  <View key={card.id} style={{ width: rateColumns === 3 ? "33.333%" : "100%", paddingHorizontal: 6, paddingBottom: 12 }}>
                    <View style={{ flex: 1, borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.card, padding: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <PictureSymbol name={card.icon} size={58} />
                        <Text style={{ flex: 1, minWidth: 0, marginLeft: 12, marginTop: 6, color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>
                          {t(card.title)}
                        </Text>
                        {rate ? (
                          <View style={{ flexDirection: "row", marginLeft: 8, gap: 6 }}>
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
                                  onPress={() => setRateDetail({ id: card.id, range })}
                                  style={{
                                    minHeight: 34,
                                    justifyContent: "center",
                                    borderRadius: 10,
                                    backgroundColor: up ? "#DCFCE7" : down ? "#FEE2E2" : "#F1F5F9",
                                    paddingHorizontal: 12,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: up ? UP : down ? DOWN : theme.muted,
                                      fontFamily: "Poppins_600SemiBold",
                                      fontSize: 13,
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
                      {rate ? (
                        <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
                          {(
                            [
                              ["Yesterday", yesterday, theme.ink],
                              ["Today", today, quoteColor(today, yesterday, theme.ink)],
                              ["Tomorrow", tomorrow, quoteColor(tomorrow, today, theme.ink)],
                            ] as const
                          ).map(([label, value, color]) => (
                            <View key={label} style={{ flex: 1, borderRadius: 12, backgroundColor: theme.cardSoft, paddingHorizontal: 10, paddingVertical: 10 }}>
                              <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 12 }}>{t(label)}</Text>
                              <Text style={{ marginTop: 4, color, fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{n(money(value))}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ marginTop: 12, color: theme.muted, fontFamily: "Poppins_400Regular", fontSize: 14 }}>{t("Rate unavailable")}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: materialsBeside ? "row" : "column", alignItems: "flex-start", marginTop: 4, gap: materialsBeside ? 16 : 18 }}>
              <View style={{ flex: materialsBeside ? 0.95 : undefined, width: materialsBeside ? undefined : "100%", minWidth: 0, gap: 18 }}>
                <View style={{ overflow: "hidden", borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.card }}>
                  <View style={{ backgroundColor: "#FFF7ED", borderBottomWidth: 1, borderBottomColor: "#FED7AA", paddingHorizontal: 14, paddingVertical: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <PictureSymbol name="sack" size={52} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t("Raw material rate")}</Text>
                        <Text style={{ marginTop: 2, color: "#9A3412", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                          {t("Today's feed and grain prices")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ padding: 12, gap: 8 }}>
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
                        <Text style={{ flex: 1, marginLeft: 12, color: theme.ink, fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>{t(item.name)}</Text>
                        <Text style={{ color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>₹{n(item.price)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View>
                  <SectionTitle title="Services" subtitle="Now it is easy to find services for your poultry farm" />
                  {servicesGrid}
                </View>
              </View>

              <View style={{ flex: materialsBeside ? 1.05 : undefined, width: materialsBeside ? undefined : "100%", minWidth: 0, gap: 18 }}>
                <View style={{ gap: 10 }}>
                  {TRENDS.map((trend) => {
                    const rate = rates.find((item) => item.id === trend.id);
                    const window = windows[trend.id] ?? "month";
                    const series = rate ? rateSeries(rate, window) : [];
                    const color = series.length > 1 ? trendColor(series, theme.muted) : theme.muted;
                    const points = ratePoints(series, window).map((point) => ({
                      label: pointLabel(point.at, window, language),
                      value: point.value,
                    }));
                    return (
                      <View key={trend.id} style={{ overflow: "hidden", borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.card, padding: 14 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <PictureSymbol name={trend.icon} size={48} />
                          <Text style={{ flex: 1, minWidth: 0, marginLeft: 10, color: theme.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(trend.title)}</Text>
                        </View>
                        <View style={{ flexDirection: "row", marginTop: 10, gap: 6 }}>
                          {(["days", "month", "year"] as const).map((option) => {
                            const selected = window === option;
                            const label = option === "days" ? "Days" : option === "month" ? "Month" : "Year";
                            return (
                              <Pressable
                                key={option}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                onPress={() => setWindows((current) => ({ ...current, [trend.id]: option }))}
                                style={{ minHeight: 32, justifyContent: "center", borderRadius: 10, backgroundColor: selected ? theme.chip : theme.cardSoft, paddingHorizontal: 12 }}
                              >
                                <Text style={{ color: selected ? theme.primary : theme.muted, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t(label)}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <View style={{ marginTop: 8 }}>
                          <RateChart color={color} formatValue={(value) => n(money(value))} height={92} points={points} />
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View>
                  <SectionTitle title="Marketplace" subtitle="Buy and sell poultry products near you" />
                  {marketplaceCards}
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
      <RateTicker items={tickerItems} />
      <FormModal
        onClose={() => setRateDetail(null)}
        title={detailCard ? `${t(detailCard.title)} · ${t(rateDetail?.range === "month" ? "This month" : "This year")}` : "Rate"}
        visible={Boolean(rateDetail && detailCard && detailSeries.length > 1)}
      >
        {detailCard && detailSeries.length > 1 ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <PictureSymbol name={detailCard.icon} size={48} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.muted, fontFamily: "Poppins_500Medium", fontSize: 13 }}>
                  {t(rateDetail?.range === "month" ? "This month" : "This year")}
                </Text>
                <Text style={{ marginTop: 2, color: theme.ink, fontFamily: "Poppins_700Bold", fontSize: 20 }}>
                  ₹{n(money(detailSeries[0]))} → ₹{n(money(detailSeries[detailSeries.length - 1]))}
                </Text>
              </View>
              <Text style={{ color: detailColor, fontFamily: "Poppins_700Bold", fontSize: 18 }}>
                {detailDelta > 0 ? "+" : ""}₹{n(money(detailDelta))}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons color={detailColor} name={detailDelta >= 0 ? "trending-up" : "trending-down"} size={18} />
              <Text style={{ marginLeft: 6, color: detailColor, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                {detailDelta >= 0 ? t("Price increased") : t("Price decreased")}
              </Text>
            </View>
          </View>
        ) : null}
      </FormModal>
    </SafeAreaView>
  );
}
