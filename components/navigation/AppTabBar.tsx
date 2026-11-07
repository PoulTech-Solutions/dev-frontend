import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/useAuthStore";
import { SIDEBAR_BREAKPOINT, SIDEBAR_WIDTH } from "../../hooks/useAppLayout";
import { useLanguage } from "../../utils/i18n";

const ACTIVE = "#16A34A";
const INACTIVE = "#64748B";

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
  const signOut = useAuthStore((store) => store.signOut);
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await signOut();
      setMenuOpen(false);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Could not sign out.", error);
      Alert.alert(t("Unable to log out"), t("Please try again."));
    }
  };

  return (
    <>
      <View
        style={{
          minHeight: 62 + insets.top,
          flexDirection: "row",
          alignItems: "center",
          paddingTop: insets.top,
          paddingHorizontal: 18,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
        }}
      >
        <Image
          accessibilityLabel="Poultech Solutions logo"
          contentFit="cover"
          source={require("../../assets/images/logo.png")}
          style={{ width: 38, height: 38, borderRadius: 12 }}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 15 }}>
            Poultech Solutions
          </Text>
          <Text style={{ marginTop: 1, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>
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
          <Ionicons color="#0B2A5B" name="notifications-outline" size={20} />
        </Pressable>
        <Pressable
          accessibilityLabel={t("Log out")}
          accessibilityRole="button"
          className="cursor-pointer hover:bg-red-100"
          onPress={() => void handleLogout()}
          style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#FEF2F2", marginLeft: 4 }}
        >
          <Ionicons color="#B91C1C" name="log-out-outline" size={19} />
        </Pressable>
        <Pressable
          accessibilityLabel={t(menuOpen ? "Close navigation menu" : "Open navigation menu")}
          accessibilityRole="button"
          accessibilityState={{ expanded: menuOpen }}
          className="cursor-pointer hover:bg-slate-100"
          onPress={() => setMenuOpen((open) => !open)}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, marginLeft: 6 }}
        >
          <Ionicons color="#0B2A5B" name={menuOpen ? "close" : "menu"} size={25} />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        transparent
        visible={menuOpen}
      >
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.28)" }}>
          <Pressable
            accessibilityLabel="Close navigation menu"
            accessibilityRole="button"
            onPress={() => setMenuOpen(false)}
            style={{ flex: 1 }}
          />
          <View
            accessibilityLabel={t("Navigation menu")}
            style={{
              width: Math.min(300, Math.round(0.82 * width)),
              height: "100%",
              backgroundColor: "#FFFFFF",
              paddingTop: Math.max(insets.top, 16) + 10,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 14),
              borderLeftWidth: 1,
              borderLeftColor: "#E2E8F0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
              <Image
                accessibilityLabel="Poultech Solutions logo"
                contentFit="cover"
                source={require("../../assets/images/logo.png")}
                style={{ width: 40, height: 40, borderRadius: 12 }}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 14 }}>
                  Poultech Solutions
                </Text>
                <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>
                  Farm & marketplace
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close navigation menu"
                accessibilityRole="button"
                onPress={() => setMenuOpen(false)}
                style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#F1F5F9" }}
              >
                <Ionicons color="#334155" name="close" size={20} />
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
                  <Ionicons color={INACTIVE} name={item.icon} size={20} />
                  <Text style={{ marginLeft: 12, color: "#334155", fontFamily: "Poppins_500Medium", fontSize: 13 }}>
                    {t(item.name)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Pressable
              accessibilityLabel={t("Open profile")}
              accessibilityRole="button"
              className="cursor-pointer hover:bg-slate-50"
              onPress={() => {
                setMenuOpen(false);
                router.push("/(tabs)/profile");
              }}
              style={{ minHeight: 58, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10 }}
            >
              <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#E7EFE5" }}>
                <Text style={{ color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 14 }}>
                  {user?.name?.slice(0, 1).toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={{ color: "#334155", fontFamily: "Poppins_500Medium", fontSize: 12 }}>
                  {user?.name ?? t("Your profile")}
                </Text>
                <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>
                  {t("View profile")}
                </Text>
              </View>
              <Ionicons color="#64748B" name="chevron-forward" size={17} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((store) => store.user);
  const signOut = useAuthStore((store) => store.signOut);
  const { t } = useLanguage();
  const sidebarVisible = viewportWidth >= SIDEBAR_BREAKPOINT;

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Could not sign out.", error);
      Alert.alert(t("Unable to log out"), t("Please try again."));
    }
  };

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
        .filter((route) => !["profile", "(farm)/billing", "market-updates"].includes(route.name))
        .map((route) => {
        const index = state.routes.findIndex((item) => item.key === route.key);
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : options.title ?? route.name;
        const color = focused ? ACTIVE : INACTIVE;
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
        const onLongPress = () =>
          navigation.emit({ type: "tabLongPress", target: route.key });
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
      <View
        style={{
          width: SIDEBAR_WIDTH,
          height: "100%",
          backgroundColor: "#FFFFFF",
          borderRightWidth: 1,
          borderRightColor: "#E2E8F0",
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 14),
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            minHeight: 72,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: 24,
          }}
        >
          <Image
            accessibilityLabel="Poultech Solutions logo"
            contentFit="cover"
            source={require("../../assets/images/logo.png")}
            style={{ width: 44, height: 44, borderRadius: 13 }}
          />
          <View style={{ flex: 1, minWidth: 0, marginLeft: 11 }}>
            <Text numberOfLines={1} style={{ color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 15 }}>
              Poultech Solutions
            </Text>
            <Text numberOfLines={1} style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>
              Farm & marketplace
            </Text>
          </View>
        </View>

        {renderTabs(true)}

        <View
          style={{
            minHeight: 76,
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            paddingTop: 12,
            gap: 8,
          }}
        >
          <Pressable
            accessibilityLabel={t("Open profile")}
            accessibilityRole="button"
            className="cursor-pointer hover:bg-slate-100"
            onPress={() => router.push("/(tabs)/profile")}
            style={{ flex: 1, minWidth: 0, minHeight: 54, flexDirection: "row", alignItems: "center", borderRadius: 14, backgroundColor: "#F8FAFC", paddingHorizontal: 8 }}
          >
            <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#E7EFE5" }}>
              <Text style={{ color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 14 }}>
                {user?.name?.slice(0, 1).toUpperCase() ?? "?"}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
              <Text numberOfLines={1} style={{ color: "#334155", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                {user?.name ?? t("Your profile")}
              </Text>
              <Text style={{ marginTop: 1, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 9 }}>
                {t("View profile")}
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel={t("Log out")}
            accessibilityRole="button"
            className="cursor-pointer hover:bg-red-100"
            onPress={() => void handleLogout()}
            style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#FEF2F2" }}
          >
            <Ionicons color="#B91C1C" name="log-out-outline" size={20} />
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}
