import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { ModuleOption } from "../../../components/ui/ModuleOption";
import { useAuthStore } from "../../../store/useAuthStore";
import { DEMO_FLOCKS } from "../../../utils/demoData";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useLanguage } from "../../../utils/i18n";

const COLORS = {
  cream: "#FAF7F0",
  primary: "#0B2A5B",
  forest: "#14532D",
  accent: "#16A34A",
  muted: "#64748B",
};

export default function FarmRecordsScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { t } = useLanguage();
  const role = useAuthStore((state) => state.user?.role);
  const isDemoSession = useAuthStore((state) => Boolean(state.user?.id.startsWith("mock-")));
  const contentWidth = Math.min(width - 36, 1080);
  const isCustomer = role === "customer";

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader
            title={isCustomer ? "Farm" : "My Farm"}
            subtitle={
              isCustomer
                ? "Farm management tools are available to Poultry Owner accounts."
                : "Keep your flock and shed records organized in one place."
            }
          />

          {!isCustomer ? (
            <View
              style={{
                minHeight: 190,
                overflow: "hidden",
                justifyContent: "center",
                borderRadius: 26,
                backgroundColor: COLORS.forest,
                padding: 24,
              }}
            >
              <Image
                accessibilityLabel="Poultry farm"
                contentFit="cover"
                source={require("../../../assets/images/login-hero.jpg")}
                style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "60%", height: "100%", opacity: 0.48 }}
              />
              <LinearGradient
                colors={["#14532D", "rgba(20,83,45,0.88)", "rgba(11,42,91,0.3)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View style={{ maxWidth: 480 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons color="#D9F99D" name="leaf-outline" size={17} />
                  <Text style={{ marginLeft: 7, color: "#F0FDF4", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                    {t("POULTRY MITRA")}
                  </Text>
                </View>
                <Text style={{ marginTop: 12, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 23, lineHeight: 31 }}>
                  {t("Better visibility for every flock.")}
                </Text>
                <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.88)", fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 19 }}>
                  {isDemoSession
                    ? t("Review sample flock counts, mortality, and egg production across your sheds.")
                    : t("Your shed records and flock activity will be shown here when farm data is connected.")}
                </Text>
              </View>
            </View>
          ) : null}

          {!isCustomer ? (
            <View style={{ marginTop: 18 }}>
              <ModuleOption
                background="#EFF6FF"
                color="#1D4ED8"
                icon="receipt-outline"
                onPress={() => router.push("/(tabs)/(farm)/billing")}
                subtitle={t("Create and share customer invoices")}
                title={t("Billing Software")}
              />
            </View>
          ) : null}

          {isDemoSession && !isCustomer ? (
            <View style={{ marginTop: 22 }}>
              <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", borderRadius: 13, backgroundColor: "#FFFBEB", padding: 11 }}>
                <Ionicons color="#A16207" name="information-circle-outline" size={17} />
                <Text style={{ flex: 1, marginLeft: 7, color: "#854D0E", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>
                  {t("Demo farm records · sample flock data for preview only")}
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {DEMO_FLOCKS.map((flock) => (
                  <View key={flock.shed} style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 20, backgroundColor: "#FFFFFF", padding: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EAF8EC" }}>
                        <Ionicons color="#14532D" name="home-outline" size={20} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 11 }}>
                        <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t(flock.shed)}</Text>
                        <Text style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t(flock.batch)}</Text>
                      </View>
                      <View style={{ borderRadius: 999, backgroundColor: flock.status === "Healthy" ? "#DCFCE7" : "#FEF3C7", paddingHorizontal: 9, paddingVertical: 5 }}>
                        <Text style={{ color: flock.status === "Healthy" ? "#166534" : "#A16207", fontFamily: "Poppins_600SemiBold", fontSize: 9 }}>{t(flock.status)}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {[
                        { label: "Flock age", value: flock.age },
                        { label: "Live birds", value: flock.birds },
                        { label: "Mortality", value: flock.mortality },
                        { label: "Egg count", value: flock.eggs },
                      ].map((metric) => (
                        <View key={metric.label} style={{ flexGrow: 1, flexBasis: 130, borderRadius: 13, backgroundColor: "#F8FAFC", padding: 11 }}>
                          <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 9 }}>{t(metric.label)}</Text>
                          <Text style={{ marginTop: 3, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{metric.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 22 }}>
              <EmptyState
                icon={isCustomer ? "information-circle-outline" : "file-tray-outline"}
                title={isCustomer ? "This section is for farm owners" : "No farm records yet"}
                description={
                  isCustomer
                    ? "You can explore products and book services from the other sections."
                    : "Farm and shed records will appear here after they are added to your account."
                }
              />
            </View>
          )}

          {isCustomer ? (
            <Pressable
              accessibilityLabel={t("Browse marketplace")}
              accessibilityRole="button"
              className="cursor-pointer hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-accent"
              onPress={() => router.push("/(tabs)/(marketplace)/feed")}
              style={{
                minHeight: 52,
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                backgroundColor: COLORS.accent,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                Browse marketplace
              </Text>
              <Ionicons color="#FFFFFF" name="arrow-forward" size={16} style={{ marginLeft: 8 }} />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
