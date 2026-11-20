import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { AppMobileHeader, AppTabBar } from "../../components/navigation/AppTabBar";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useAuthStore } from "../../store/useAuthStore";
import { useLanguage } from "../../utils/i18n";

export default function TabLayout() {
  const router = useRouter();
  const { t } = useLanguage();
  const { sidebarVisible: showSidebar } = useAppLayout();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isHydrated, router]);

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
      <Tabs.Screen name="(farm)/shed-book" options={{ href: null }} />
      <Tabs.Screen name="market-updates" options={{ href: null }} />
    </Tabs>
  );
}
