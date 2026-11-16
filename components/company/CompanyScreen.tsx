import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

type IconName = keyof typeof Ionicons.glyphMap;

export function CompanyScreen({
  title,
  icon,
  color,
  background,
  children,
}: {
  title: string;
  icon: IconName;
  color: string;
  background: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 32 }}>
        <View style={{ width: "100%", maxWidth: 1080, alignSelf: "center" }}>
          <Pressable
            accessibilityLabel={t("Back")}
            accessibilityRole="button"
            className="cursor-pointer"
            onPress={() => router.back()}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }}
          >
            <Ionicons color={colors.primary} name="arrow-back" size={22} />
            <Text style={{ marginLeft: 6, color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
              {t("Back")}
            </Text>
          </Pressable>
          <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 56,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                backgroundColor: background,
              }}
            >
              <Ionicons color={color} name={icon} size={30} />
            </View>
            <Text style={{ flex: 1, marginLeft: 14, color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 24 }}>
              {t(title)}
            </Text>
          </View>
          <View style={{ marginTop: 20, gap: 12 }}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function CompanyLine({ icon, color, background, text }: { icon: IconName; color: string; background: string; text: string }) {
  const { t } = useLanguage();
  return (
    <View
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 12,
      }}
    >
      <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: background }}>
        <Ionicons color={color} name={icon} size={22} />
      </View>
      <Text style={{ flex: 1, marginLeft: 12, color: "#0F172A", fontFamily: "Poppins_500Medium", fontSize: 15, lineHeight: 22 }}>
        {t(text)}
      </Text>
    </View>
  );
}
