import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SIDEBAR_BREAKPOINT, SIDEBAR_WIDTH, useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useAuthStore } from "../../store/useAuthStore";
import { useShellStore } from "../../store/useShellStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { firstName, fullName } from "../../utils/displayName";
import { planById } from "../../utils/subscriptionPlans";
import { useLanguage } from "../../utils/i18n";

const ACTIVE = "#16A34A";

function UserAvatar({ name, photoUri, size = 38 }: { name?: string; photoUri?: string; size?: number }) {
  const { colors } = useAppTheme();
  if (photoUri) {
    return <Image contentFit="cover" source={{ uri: photoUri }} style={{ width: size, height: size, borderRadius: 12 }} />;
  }
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.promoBg }}>
      <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: size * 0.37 }}>
        {(name ?? "?").slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

const APP_ROUTES = [
  { name: "Home", route: "/(tabs)/dashboard", icon: "grid-outline" },
  { name: "My Farm", route: "/(tabs)/(farm)/records", icon: "leaf-outline" },
  { name: "Market", route: "/(tabs)/(marketplace)/feed", icon: "storefront-outline" },
  { name: "Services", route: "/(tabs)/(services)/booking", icon: "medkit-outline" },
  { name: "Wallet", route: "/(tabs)/(wallet)", icon: "wallet-outline" },
] as const;

export function AppMobileHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((store) => store.user);
  const setSidebarOpen = useShellStore((state) => state.setSidebarOpen);
  const planId = useSubscriptionStore((state) => state.planId);
  const hydratePlan = useSubscriptionStore((state) => state.hydrate);
  const { t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const wide = width >= SIDEBAR_BREAKPOINT;
  const plan = planById(planId);
  const shownName = firstName(user?.name) || fullName(user?.name) || t("Your profile");

  useEffect(() => {
    if (user?.id) void hydratePlan(user.id);
  }, [hydratePlan, user?.id]);

  return (
    <>
      <View
        style={{
          minHeight: 62 + insets.top,
          flexDirection: "row",
          alignItems: "center",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          backgroundColor: colors.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <Image
          accessibilityLabel="Poultech Solutions logo"
          contentFit="cover"
          source={require("../../assets/images/logo.png")}
          style={{ width: 38, height: 38, borderRadius: 12 }}
        />
        <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 15 }}>
            Poultech Solutions
          </Text>
          <Text numberOfLines={1} style={{ marginTop: 1, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>
            Farm & marketplace
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t("Notifications")}
          accessibilityRole="button"
          className="cursor-pointer hover:bg-slate-50"
          onPress={() => router.push("/(tabs)/(services)/booking")}
          style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12 }}
        >
          <Ionicons color={colors.primary} name="notifications-outline" size={20} />
        </Pressable>
        <Pressable
          accessibilityLabel={t("Settings")}
          accessibilityRole="button"
          className="cursor-pointer hover:bg-slate-50"
          onPress={() => router.push("/(tabs)/profile")}
          style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, marginLeft: 2 }}
        >
          <Ionicons color={colors.primary} name="settings-outline" size={20} />
        </Pressable>
        <Pressable
          accessibilityLabel={t(wide ? "Open sidebar" : menuOpen ? "Close navigation menu" : "Open navigation menu")}
          accessibilityRole="button"
          accessibilityState={{ expanded: menuOpen }}
          className="cursor-pointer hover:bg-slate-100"
          onPress={() => (wide ? setSidebarOpen(true) : setMenuOpen((open) => !open))}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, marginLeft: 6 }}
        >
          <Ionicons color={colors.primary} name={menuOpen ? "close" : "menu"} size={25} />
        </Pressable>
      </View>

      <Modal animationType="fade" onRequestClose={() => setMenuOpen(false)} transparent visible={menuOpen}>
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.28)" }}>
          <Pressable accessibilityLabel="Close navigation menu" accessibilityRole="button" onPress={() => setMenuOpen(false)} style={{ flex: 1 }} />
          <View
            accessibilityLabel={t("Navigation menu")}
            style={{
              width: Math.min(300, Math.round(0.82 * width)),
              height: "100%",
              backgroundColor: colors.card,
              paddingTop: Math.max(insets.top, 16) + 10,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 14),
              borderLeftWidth: 1,
              borderLeftColor: colors.line,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
              <Image
                accessibilityLabel="Poultech Solutions logo"
                contentFit="cover"
                source={require("../../assets/images/logo.png")}
                style={{ width: 40, height: 40, borderRadius: 12 }}
              />
              <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 14 }}>
                  Poultech Solutions
                </Text>
                <Text numberOfLines={1} style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>
                  Farm & marketplace
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close navigation menu"
                accessibilityRole="button"
                onPress={() => setMenuOpen(false)}
                style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.cardSoft }}
              >
                <Ionicons color={colors.ink} name="close" size={20} />
              </Pressable>
            </View>
            <View style={{ gap: 6 }}>
              {APP_ROUTES.map((item) => (
                <Pressable
                  key={item.name}
                  accessibilityRole="button"
                  className="cursor-pointer hover:bg-green-50"
                  onPress={() => {
                    setMenuOpen(false);
                    router.push(item.route);
                  }}
                  style={{ minHeight: 48, flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12 }}
                >
                  <Ionicons color={colors.muted} name={item.icon} size={20} />
                  <Text style={{ marginLeft: 12, color: colors.ink, fontFamily: "Poppins_500Medium", fontSize: 13 }}>
                    {t(item.name)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 8 }}>
              {(
                [
                  { label: "Settings", icon: "settings-outline" as const, href: "/(tabs)/profile" as const },
                  { label: "Contact Us", icon: "chatbubbles-outline" as const, href: "/company/contact" as const },
                  { label: "Report Issue", icon: "warning-outline" as const, href: "/company/contact" as const },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  className="cursor-pointer hover:bg-slate-50"
                  onPress={() => {
                    setMenuOpen(false);
                    router.push(item.href);
                  }}
                  style={{
                    minHeight: 44,
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: colors.cardSoft,
                  }}
                >
                  <Ionicons color={colors.ink} name={item.icon} size={18} />
                  <Text style={{ marginLeft: 10, color: colors.ink, fontFamily: "Poppins_500Medium", fontSize: 13 }}>
                    {t(item.label)}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityLabel={t("Your profile")}
                accessibilityRole="button"
                className="cursor-pointer hover:bg-slate-50"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/(tabs)/profile");
                }}
                style={{
                  minHeight: 54,
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.cardSoft,
                  paddingHorizontal: 8,
                  marginTop: 4,
                }}
              >
                <UserAvatar name={user?.name} photoUri={user?.photoUri} />
                <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                  <Text numberOfLines={1} style={{ color: isDark ? colors.ink : "#334155", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                    {shownName}
                  </Text>
                  <Text style={{ color: plan.color, fontFamily: "Poppins_600SemiBold", fontSize: 10 }}>{t(plan.name)}</Text>
                </View>
                <Ionicons color={colors.muted} name="chevron-forward" size={18} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((store) => store.user);
  const planId = useSubscriptionStore((state) => state.planId);
  const hydratePlan = useSubscriptionStore((state) => state.hydrate);
  const { t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const { sidebarVisible } = useAppLayout();
  const setSidebarOpen = useShellStore((state) => state.setSidebarOpen);
  const plan = planById(planId);
  const shownName = firstName(user?.name) || fullName(user?.name) || t("Your profile");

  useEffect(() => {
    if (user?.id) void hydratePlan(user.id);
  }, [hydratePlan, user?.id]);

  const renderTabs = (vertical: boolean) => (
    <View
      style={{
        flex: vertical ? 1 : undefined,
        flexDirection: vertical ? "column" : "row",
        alignItems: vertical ? "stretch" : "center",
        justifyContent: vertical ? "flex-start" : "space-around",
        gap: vertical ? 4 : 0,
      }}
    >
      {state.routes
        .filter((route) => !["profile", "(farm)/billing", "(farm)/shed-book", "market-updates"].includes(route.name))
        .map((route) => {
          const index = state.routes.findIndex((item) => item.key === route.key);
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string" ? options.tabBarLabel : options.title ?? route.name;
          const color = focused ? ACTIVE : colors.muted;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });
          const icon = options.tabBarIcon?.({ focused, color, size: 20 });

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              className="cursor-pointer hover:bg-slate-50"
              onLongPress={onLongPress}
              onPress={onPress}
              style={{
                minHeight: vertical ? 44 : 56,
                flex: vertical ? undefined : 1,
                flexDirection: vertical ? "row" : "column",
                alignItems: "center",
                justifyContent: vertical ? "flex-start" : "center",
                borderRadius: vertical ? 12 : 10,
                backgroundColor: focused ? "#F0FDF4" : "transparent",
                paddingHorizontal: vertical ? 14 : 4,
                paddingVertical: vertical ? 10 : 7,
                marginVertical: vertical ? 2 : 0,
              }}
            >
              {icon}
              <Text
                numberOfLines={1}
                style={{
                  flex: vertical ? 1 : undefined,
                  marginLeft: vertical ? 12 : 0,
                  marginTop: vertical ? 0 : 3,
                  color,
                  fontSize: vertical ? 14 : 10,
                  fontWeight: focused ? "600" : "500",
                  textAlign: vertical ? "left" : "center",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );

  if (sidebarVisible) {
    return (
      <>
        <View
          style={{
            width: SIDEBAR_WIDTH,
            height: "100%",
            backgroundColor: colors.card,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 14),
            paddingHorizontal: 16,
          }}
        >
          <Pressable
            accessibilityHint={t("Click the logo or name to close the menu")}
            accessibilityLabel={t("Close sidebar")}
            accessibilityRole="button"
            className="cursor-pointer"
            onPress={() => setSidebarOpen(false)}
            style={{
              minHeight: 72,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
              borderRadius: 14,
              paddingVertical: 4,
              paddingRight: 4,
            }}
          >
            <Image
              accessibilityLabel="Poultech Solutions logo"
              contentFit="cover"
              source={require("../../assets/images/logo.png")}
              style={{ width: 44, height: 44, borderRadius: 13 }}
            />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 11 }}>
              <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 15 }}>
                Poultech Solutions
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>
                {t("Click to close menu")}
              </Text>
            </View>
          </Pressable>

          {renderTabs(true)}

          <View
            style={{
              minHeight: 76,
              flexDirection: "row",
              alignItems: "center",
              borderTopWidth: 1,
              borderTopColor: colors.line,
              paddingTop: 12,
              gap: 8,
            }}
          >
            <Pressable
              accessibilityLabel={t("Your profile")}
              accessibilityRole="button"
              className="cursor-pointer hover:bg-slate-100"
              onPress={() => router.push("/(tabs)/profile")}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 54,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                backgroundColor: colors.cardSoft,
                paddingHorizontal: 8,
              }}
            >
              <UserAvatar name={user?.name} photoUri={user?.photoUri} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: isDark ? colors.ink : "#334155", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}
                >
                  {shownName}
                </Text>
                <View
                  style={{
                    marginTop: 3,
                    alignSelf: "flex-start",
                    borderRadius: 8,
                    backgroundColor: plan.background,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: plan.color, fontFamily: "Poppins_600SemiBold", fontSize: 9 }}>{t(plan.name)}</Text>
                </View>
              </View>
              <Ionicons color={colors.muted} name="chevron-forward" size={18} />
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return null;
}
