import { Text, View } from "react-native";
import { isMockAuthEnabled } from "../../hooks/useAuth";
import { useLanguage } from "../../utils/i18n";
import { resolveApiRoot } from "../../utils/apiConfig";
import { isProductionBuild } from "../../utils/runtime";

const API_ROOT = resolveApiRoot();

function isLocalBrowserHost(): boolean {
  if (typeof window === "undefined") return true;
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
}

/** Surfaces misconfiguration that makes eggs look static or demo-like. */
export function ApiConfigBanner() {
  const { t } = useLanguage();

  if (isMockAuthEnabled) {
    return (
      <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: "#FEF3C7", padding: 10 }}>
        <Text style={{ color: "#92400E", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
          {t("Mock auth is on — market cards use sample data, not NECC.")}
        </Text>
      </View>
    );
  }

  if (isProductionBuild && !API_ROOT) {
    return (
      <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: "#FEE2E2", padding: 10 }}>
        <Text style={{ color: "#991B1B", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
          {t("This build has no EXPO_PUBLIC_API_URL. Rebuild the web image with your server API URL.")}
        </Text>
      </View>
    );
  }

  // Local Docker (:8088) + API on localhost is valid — warn only when opened from another device.
  if (isProductionBuild && /localhost|127\.0\.0\.1/i.test(API_ROOT) && !isLocalBrowserHost()) {
    return (
      <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: "#FEE2E2", padding: 10 }}>
        <Text style={{ color: "#991B1B", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
          {t("API URL in this build points to localhost — it will not work on other devices. Rebuild with your server IP.")}
        </Text>
      </View>
    );
  }

  return null;
}