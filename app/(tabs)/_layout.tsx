import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { AppMobileHeader, AppTabBar } from "../../components/navigation/AppTabBar";
import { SIDEBAR_BREAKPOINT } from "../../hooks/useAppLayout";
import { useLanguage } from "../../utils/i18n";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const showSidebar = width >= SIDEBAR_BREAKPOINT;

  return (
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: !showSidebar,
        header: () => (showSidebar ? null : <AppMobileHeader />),
        tabBarPosition: showSidebar ? "left" : "bottom",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("Home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(farm)/records"
        options={{
          title: t("My Farm"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(marketplace)/feed"
        options={{
          title: t("Market"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(services)/booking"
        options={{
          title: t("Services"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(wallet)/index"
        options={{
          title: t("Wallet"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="(farm)/billing" options={{ href: null }} />
      <Tabs.Screen name="market-updates" options={{ href: null }} />
    </Tabs>
  );
}
