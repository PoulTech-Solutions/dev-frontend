import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { LanguageProvider } from "../utils/i18n";

SplashScreen.setOptions({ duration: 450, fade: true });

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.error("Could not keep the native splash screen visible.", error);
});

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate().catch((error: unknown) => {
      console.error("Could not hydrate the saved auth session.", error);
    });
  }, [hydrate]);

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
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
