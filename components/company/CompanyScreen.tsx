import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ModuleHeader } from "../ui/ModuleHeader";
import { pageToneColor } from "../ui/SectionTitle";
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
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("teal", isDark, colors.page);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 32 }}>
        <View style={{ width: "100%", maxWidth: 1080, alignSelf: "center" }}>
          <ModuleHeader
            title={title}
            subtitle="Poultech Solutions"
            tone="teal"
            leading={
              <Pressable
                accessibilityLabel={t("Back")}
                accessibilityRole="button"
                className="cursor-pointer"
                onPress={() => router.back()}
                style={{ minHeight: 40, marginBottom: 6, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }}
              >
                <Ionicons color={colors.primary} name="arrow-back" size={22} />
                <Text style={{ marginLeft: 6, color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                  {t("Back")}
                </Text>
              </Pressable>
            }
            trailing={
              <View
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  backgroundColor: background,
                }}
              >
                <Ionicons color={color} name={icon} size={26} />
              </View>
            }
          />
          <View style={{ gap: 12 }}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function CompanyLine({ icon, color, background, text }: { icon: IconName; color: string; background: string; text: string }) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.line,
        padding: 12,
      }}
    >
      <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: background }}>
        <Ionicons color={color} name={icon} size={22} />
      </View>
      <Text style={{ flex: 1, marginLeft: 12, color: colors.ink, fontFamily: "Poppins_500Medium", fontSize: 15, lineHeight: 22 }}>
        {t(text)}
      </Text>
    </View>
  );
}
