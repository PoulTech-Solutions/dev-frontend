import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { ModuleOption } from "../../components/ui/ModuleOption";
import { RateSparkline } from "../../components/ui/RateSparkline";
import { useAdminDemoStore } from "../../store/useAdminDemoStore";
import { useAuthStore } from "../../store/useAuthStore";
import type { UserRole } from "../../store/useAuthStore";
import { DEMO_FLOCKS } from "../../utils/demoData";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useLanguage } from "../../utils/i18n";

type IconName = keyof typeof Ionicons.glyphMap;

const COLORS = {
  cream: "#FAF7F0",
  white: "#FFFFFF",
  primary: "#0B2A5B",
  forest: "#14532D",
  accent: "#16A34A",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
};

const FONT_REGULAR = "Poppins_400Regular";
const FONT_MEDIUM = "Poppins_500Medium";
const FONT_SEMIBOLD = "Poppins_600SemiBold";
const FONT_BOLD = "Poppins_700Bold";

interface QuickAction {
  title: string;
  subtitle: string;
  icon: IconName;
  background: string;
  color: string;
  route: Href;
}

interface DashboardModule {
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  background: string;
  layout?: "horizontal";
  options: {
    title: string;
    subtitle: string;
    icon: IconName;
    color: string;
    background: string;
    route: Href;
    rateId?: string;
  }[];
}

function firstName(name?: string) {
  const cleaned = name?.trim();
  return cleaned ? cleaned.split(/\s+/)[0] : "there";
}

function DashboardHeader({ onNotificationPress }: { onNotificationPress: () => void }) {
  return (
    <View
      style={{
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Pressable
        accessibilityLabel="Notifications"
        accessibilityRole="button"
        className="cursor-pointer hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-accent"
        onPress={onNotificationPress}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.line,
          backgroundColor: COLORS.white,
        }}
      >
        <Ionicons color={COLORS.primary} name="notifications-outline" size={19} />
      </Pressable>
    </View>
  );
}

function WelcomeCard({
  name,
  role,
  onPress,
}: {
  name: string;
  role: UserRole | null | undefined;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const greeting =
    t(role === "customer" ? "Welcome to your marketplace." : "Your farm, growing stronger.");
  return (
    <View
      style={{
        minHeight: 222,
        overflow: "hidden",
        borderRadius: 28,
        backgroundColor: COLORS.forest,
      }}
    >
      <Image
        accessibilityLabel="Farmer tending to poultry at sunrise"
        contentFit="cover"
        source={require("../../assets/images/login-hero.jpg")}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "58%",
          height: "100%",
          opacity: 0.63,
        }}
      />
      <LinearGradient
        colors={["#14532D", "rgba(20,83,45,0.93)", "rgba(11,42,91,0.52)"]}
        locations={[0, 0.54, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "flex-start",
          paddingHorizontal: 26,
          paddingVertical: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.15)",
            paddingHorizontal: 11,
            paddingVertical: 6,
          }}
        >
          <Ionicons color="#D9F99D" name="sunny-outline" size={14} />
          <Text
            style={{
              marginLeft: 6,
              color: "#F0FDF4",
              fontFamily: FONT_MEDIUM,
              fontSize: 11,
            }}
          >
            POULTECH FARM DASHBOARD
          </Text>
        </View>
        <Text
          style={{
            maxWidth: 440,
            marginTop: 15,
            color: COLORS.white,
            fontFamily: FONT_BOLD,
            fontSize: 27,
            lineHeight: 36,
          }}
        >
          {t("Good morning, {name} 👋").replace("{name}", name)}
        </Text>
        <Text
          style={{
            maxWidth: 430,
            marginTop: 6,
            color: "rgba(255,255,255,0.86)",
            fontFamily: FONT_REGULAR,
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          {greeting}
        </Text>
        <Pressable
          accessibilityLabel={role === "customer" ? "Browse marketplace" : "View farm overview"}
          accessibilityRole="button"
          className="cursor-pointer hover:bg-green-50 focus-visible:ring-2 focus-visible:ring-white"
          onPress={onPress}
          style={{
            minHeight: 42,
            marginTop: 18,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 13,
            backgroundColor: COLORS.white,
            paddingHorizontal: 15,
          }}
        >
          <Text style={{ color: COLORS.forest, fontFamily: FONT_SEMIBOLD, fontSize: 12 }}>
            {t(role === "customer" ? "Explore marketplace" : "View farm overview")}
          </Text>
          <Ionicons
            color={COLORS.forest}
            name="arrow-forward"
            size={15}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: 20,
          top: 20,
          width: 52,
          height: 52,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          borderRadius: 26,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: 36,
          top: 36,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "rgba(245,184,61,0.9)",
        }}
      />
    </View>
  );
}

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <View
      style={{
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ color: COLORS.primary, fontFamily: FONT_BOLD, fontSize: 17 }}>
        {t(title)}
      </Text>
      {action && onAction ? (
        <Pressable
          accessibilityLabel={action}
          accessibilityRole="button"
          className="cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
          onPress={onAction}
          style={{ paddingVertical: 5, paddingLeft: 8 }}
        >
          <Text style={{ color: COLORS.accent, fontFamily: FONT_SEMIBOLD, fontSize: 12 }}>
            {t(action)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DashboardModuleCard({
  module,
  onNavigate,
  demoMode,
}: {
  module: DashboardModule;
  onNavigate: (route: Href) => void;
  demoMode: boolean;
}) {
  const { width } = useAppLayout();
  const { t } = useLanguage();
  const rates = useAdminDemoStore((state) => state.rates);

  return (
    <View
      style={{
        flex: module.layout === "horizontal" ? 1 : undefined,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        padding: module.layout === "horizontal" ? 18 : 14,
      }}
    >
      {module.layout !== "horizontal" ? <View style={{ minHeight: 44, flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 13,
            backgroundColor: module.background,
          }}
        >
          <Ionicons color={module.color} name={module.icon} size={19} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: module.color, fontFamily: FONT_BOLD, fontSize: 13 }}>
            {t(module.title)}
          </Text>
          <Text style={{ marginTop: 1, color: COLORS.muted, fontFamily: FONT_REGULAR, fontSize: 9 }}>
            {t(module.subtitle)}
          </Text>
        </View>
      </View> : null}
      {module.layout === "horizontal" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {module.options.map((option) => (
            <View
              key={option.title}
              style={{
                width: width >= 520 ? "48%" : "100%",
                flexShrink: 0,
              }}
            >
              <Pressable
                accessibilityLabel={t(option.title)}
                accessibilityRole="button"
                className="cursor-pointer hover:opacity-90"
                onPress={() => onNavigate(option.route)}
                style={{
                  minHeight: 108,
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  padding: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: option.background }}>
                    <Ionicons color={option.color} name={option.icon} size={18} />
                  </View>
                  <Text numberOfLines={2} style={{ flex: 1, minWidth: 0, marginLeft: 9, color: COLORS.primary, fontFamily: FONT_SEMIBOLD, fontSize: 11, lineHeight: 16 }}>
                    {t(option.title)}
                  </Text>
                </View>
                {option.rateId && demoMode ? (() => {
                  const rate = rates.find((item) => item.id === option.rateId);
                  if (!rate) return null;
                  const current = Number(rate.value);
                  const previous = Number(rate.previousValue);
                  const rising = current > previous;
                  const falling = current < previous;
                  const trendColor = rising ? "#15803D" : falling ? "#B91C1C" : COLORS.muted;
                  return (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                      <View>
                        <Text style={{ color: COLORS.ink, fontFamily: FONT_BOLD, fontSize: 16 }}>
                          ₹{rate.value}
                          <Text style={{ color: COLORS.muted, fontFamily: FONT_REGULAR, fontSize: 9 }}> / {rate.unit.replace("per ", "")}</Text>
                        </Text>
                        <Text style={{ color: COLORS.muted, fontFamily: FONT_REGULAR, fontSize: 9 }}>
                          Prev ₹{rate.previousValue}
                        </Text>
                      </View>
                      <RateSparkline color={trendColor} height={22} values={rate.history} width={66} />
                    </View>
                  );
                })() : option.rateId ? (
                  <Text style={{ marginTop: 8, color: COLORS.muted, fontFamily: FONT_REGULAR, fontSize: 10 }}>
                    {t("Rate unavailable")}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {module.options.map((option) => (
            <ModuleOption
              key={option.title}
              background={option.background}
              color={option.color}
              icon={option.icon}
              onPress={() => onNavigate(option.route)}
              subtitle={t(option.subtitle)}
              title={t(option.title)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function QuickActionCard({
  action,
  onPress,
}: {
  action: QuickAction;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Pressable
      accessibilityLabel={`${t(action.title)}: ${t(action.subtitle)}`}
      accessibilityRole="button"
      className="cursor-pointer hover:bg-green-50 focus-visible:ring-2 focus-visible:ring-accent"
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 145,
        minHeight: 112,
        justifyContent: "space-between",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: COLORS.white,
        padding: 15,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: action.background,
        }}
      >
        <Ionicons color={action.color} name={action.icon} size={18} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: COLORS.ink, fontFamily: FONT_SEMIBOLD, fontSize: 12 }}>
          {t(action.title)}
        </Text>
        <Text style={{ marginTop: 2, color: COLORS.muted, fontFamily: FONT_REGULAR, fontSize: 10 }}>
          {t(action.subtitle)}
        </Text>
      </View>
    </Pressable>
  );
}

function MarketPromo({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable
      accessibilityLabel={t("Explore poultry marketplace")}
      accessibilityRole="button"
      className="cursor-pointer hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-accent"
      onPress={onPress}
      style={{
        minHeight: 106,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        backgroundColor: "#EEF6EE",
        padding: 17,
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 17,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Ionicons color={COLORS.forest} name="basket-outline" size={24} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: COLORS.forest, fontFamily: FONT_BOLD, fontSize: 14 }}>
          {t("Everything your farm needs")}
        </Text>
        <Text
          style={{
            marginTop: 4,
            color: "#456B50",
            fontFamily: FONT_REGULAR,
            fontSize: 11,
            lineHeight: 17,
          }}
        >
          {t("Chicks, feed and equipment from trusted suppliers.")}
        </Text>
      </View>
      <View
        style={{
          width: 34,
          height: 34,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: COLORS.white,
        }}
      >
        <Ionicons color={COLORS.forest} name="arrow-forward" size={16} />
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { width, sidebarVisible } = useAppLayout();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const name = firstName(user?.name);
  const demoMode = Boolean(user?.id.startsWith("mock-"));
  const contentWidth = Math.min(width - 36, 1180);
  const compact = width < 600;

  const actions = useMemo<QuickAction[]>(() => {
    if (role === "customer") {
      return [
        {
          title: "Browse products",
          subtitle: "Purchase poultry supplies",
          icon: "basket-outline",
          background: "#EAF8EC",
          color: COLORS.forest,
          route: "/(tabs)/(marketplace)/feed",
        },
        {
          title: "Book a service",
          subtitle: "Support for your flock",
          icon: "medkit-outline",
          background: "#EAF0FA",
          color: COLORS.primary,
          route: "/(tabs)/(services)/booking",
        },
        {
          title: "Wallet",
          subtitle: "Balance and referrals",
          icon: "wallet-outline",
          background: "#FEF3C7",
          color: "#A16207",
          route: "/(tabs)/(wallet)",
        },
      ];
    }

    return [
      {
        title: "Add farm record",
        subtitle: "Flock and shed records",
        icon: "add-circle-outline",
        background: "#EAF8EC",
        color: COLORS.forest,
        route: "/(tabs)/(farm)/records",
      },
      {
        title: "Create bill",
        subtitle: "Generate and share an invoice",
        icon: "receipt-outline",
        background: "#EFF6FF",
        color: COLORS.primary,
        route: "/(tabs)/(farm)/billing",
      },
      {
        title: "Add product for sale",
        subtitle: "Open seller options",
        icon: "storefront-outline",
        background: "#F3E8FF",
        color: "#7E22CE",
        route: "/(tabs)/(marketplace)/feed?mode=sell",
      },
      {
        title: "Book a test",
        subtitle: "Water, feed, or flock health",
        icon: "flask-outline",
        background: "#E0F2FE",
        color: "#0369A1",
        route: "/(tabs)/(services)/booking",
      },
      {
        title: "Schedule vaccination",
        subtitle: "View vaccination support",
        icon: "shield-checkmark-outline",
        background: "#FEF3C7",
        color: "#A16207",
        route: "/(tabs)/(services)/booking",
      },
    ];
  }, [role]);

  const modules = useMemo<DashboardModule[]>(() => [
    {
      title: "Poultry Mitra",
      subtitle: "Complete farm management",
      icon: "home-outline",
      color: "#0B78C6",
      background: "#E0F2FE",
      options: [
        { title: "Complete Farm Records", subtitle: "Manage sheds and flock activity", icon: "clipboard-outline", color: "#0B78C6", background: "#E0F2FE", route: "/(tabs)/(farm)/records" },
        { title: "Billing Software", subtitle: "Create and share customer invoices", icon: "receipt-outline", color: "#0B78C6", background: "#E0F2FE", route: "/(tabs)/(farm)/billing" },
      ],
    },
    {
      title: "Poultry Info & Updates",
      subtitle: "Market rates and insights",
      icon: "stats-chart-outline",
      color: "#B45309",
      background: "#FEF3C7",
      layout: "horizontal",
      options: [
        { title: "Eggs Rate", subtitle: "Regional market rates", icon: "egg-outline", color: "#B45309", background: "#FEF3C7", route: "/(tabs)/market-updates?category=eggs", rateId: "eggs" },
        { title: "Culls Birds Rate", subtitle: "Regional market rates", icon: "paw-outline", color: "#B45309", background: "#FEF3C7", route: "/(tabs)/market-updates?category=culls", rateId: "culls" },
        { title: "Broiler Rates", subtitle: "Regional market rates", icon: "trending-up-outline", color: "#B45309", background: "#FEF3C7", route: "/(tabs)/market-updates?category=broilers", rateId: "broilers" },
        { title: "Feed Raw Materials Rate", subtitle: "Regional market rates", icon: "nutrition-outline", color: "#B45309", background: "#FEF3C7", route: "/(tabs)/market-updates?category=feed", rateId: "feed" },
      ],
    },
  ], []);
  const visibleModules =
    role === "customer" ? modules.filter((module) => module.title !== "Poultry Mitra") : modules;

  if (role === "admin") {
    return (
      <AdminDashboard
        demoMode={Boolean(user?.id.startsWith("mock-"))}
      />
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          {sidebarVisible ? (
            <DashboardHeader
              onNotificationPress={() => router.push("/(tabs)/(services)/booking")}
            />
          ) : null}

          <View style={{ marginTop: 22 }}>
            <WelcomeCard
              name={name}
              role={role}
              onPress={() =>
                router.push(
                  role === "customer"
                    ? "/(tabs)/(marketplace)/feed"
                    : "/(tabs)/(farm)/records",
                )
              }
            />
          </View>

          <View style={{ marginTop: 26 }}>
            <SectionHeading title="Your overview" />
            <View
              accessibilityRole="text"
              style={{
                minHeight: 112,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 20,
                backgroundColor: COLORS.white,
                padding: 18,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: "#EAF8EC",
                }}
              >
                <Ionicons color={COLORS.forest} name="analytics-outline" size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                {demoMode ? (
                  <Text style={{ marginBottom: 4, color: "#15803D", fontFamily: FONT_SEMIBOLD, fontSize: 9 }}>
                    {t("DEMO OVERVIEW · SAMPLE DATA")}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: COLORS.muted,
                    fontFamily: FONT_REGULAR,
                    fontSize: 12,
                    lineHeight: 19,
                  }}
                >
                  {demoMode && role === "poultry_owner"
                    ? t("{sheds} sheds · 12,890 birds tracked · 7,690 eggs recorded today.").replace("{sheds}", String(DEMO_FLOCKS.length))
                    : demoMode && role === "customer"
                      ? t("2 sample orders · 1 service booking · Your marketplace activity at a glance.")
                      : t("Your farm, order, and service details will appear here when available.")}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              marginTop: 26,
              flexDirection: width >= 760 ? "row" : "column",
              alignItems: "flex-start",
              gap: 18,
            }}
          >
            <View style={{ width: width >= 760 ? "40%" : "100%" }}>
              <SectionHeading
                title="Quick actions"
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {actions.map((action) => (
                  <QuickActionCard
                    key={action.title}
                    action={action}
                    onPress={() => router.push(action.route)}
                  />
                ))}
              </View>
            </View>
            <View style={{ flex: 1, width: width >= 760 ? undefined : "100%" }}>
              <SectionHeading title="Poultry Info & Updates" />
              {visibleModules
                .filter((module) => module.layout === "horizontal")
                .map((module) => (
                  <DashboardModuleCard
                    key={module.title}
                    module={module}
                    demoMode={Boolean(user?.id.startsWith("mock-"))}
                    onNavigate={(route) => router.push(route)}
                  />
                ))}
            </View>
          </View>

          <View style={{ marginTop: 26 }}>
            <SectionHeading
              action="Explore"
              onAction={() => router.push("/(tabs)/(marketplace)/feed")}
              title="For your farm"
            />
            <MarketPromo onPress={() => router.push("/(tabs)/(marketplace)/feed")} />
          </View>

          <View
            style={{
              marginTop: 24,
              flexDirection: compact ? "column" : "row",
              alignItems: compact ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 8,
              paddingHorizontal: 2,
            }}
          >
            <Text style={{ color: COLORS.muted, fontFamily: FONT_REGULAR, fontSize: 10 }}>
              {t("Poultech Solutions · Growing together")}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons color={COLORS.accent} name="shield-checkmark-outline" size={13} />
              <Text
                style={{
                  marginLeft: 5,
                  color: COLORS.muted,
                  fontFamily: FONT_REGULAR,
                  fontSize: 10,
                }}
              >
                {t("Your farm data stays secure")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
