import "../global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { appQueryClient } from "../services/appQueryClient";
import { useThemeStore } from "../store/useThemeStore";
import { LanguageProvider } from "../utils/i18n";

SplashScreen.setOptions({ duration: 450, fade: true });

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.error("Could not keep the native splash screen visible.", error);
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const accessToken = useAuthStore((state) => state.accessToken);
  const appearance = useThemeStore((state) => state.appearance);
  const hydrateTheme = useThemeStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate().catch((error: unknown) => {
      console.error("Could not hydrate the saved auth session.", error);
    });
    void hydrateTheme().catch((error: unknown) => {
      console.error("Could not load the saved appearance.", error);
    });
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (!accessToken) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    void (async () => {
      const { msUntilAccessRefresh } = await import("../utils/accessToken");
      const wait = msUntilAccessRefresh(accessToken);
      if (wait === null) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        void import("../services/api").then(({ ensureFreshAccessToken }) => ensureFreshAccessToken());
      }, wait);
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [accessToken]);

  useEffect(() => {
    if (fontError) console.error("Could not load Poppins fonts.", fontError);
  }, [fontError]);

  const isReady = isHydrated && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (!isReady) return;

    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.error("Could not hide the native splash screen.", error);
    });
  }, [isReady]);

  if (!isReady) return null;

  return (
    <QueryClientProvider client={appQueryClient}>
      <LanguageProvider>
        <StatusBar style={appearance === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="company" />
        </Stack>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
