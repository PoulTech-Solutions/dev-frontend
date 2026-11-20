import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

const LINKS = [
  { label: "Privacy policy", href: "/company/privacy", icon: "shield-check", color: "#15803D", background: "#DCFCE7" },
  { label: "Contact us", href: "/company/contact", icon: "phone", color: "#0369A1", background: "#E0F2FE" },
  { label: "Office address", href: "/company/office", icon: "office-building", color: "#7E22CE", background: "#F3E8FF" },
] as const;

export function CompanyFooter({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const stacked = compact || width < 560;

  return (
    <View style={compact ? { gap: 6 } : { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16, gap: 10 }}>
      {compact ? null : (
        <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
          Poultech Solutions
        </Text>
      )}
      <View style={{ flexDirection: compact ? "column" : "row", flexWrap: "wrap", marginHorizontal: compact ? 0 : -4 }}>
        {LINKS.map((link) => (
            <View key={link.href} style={{ width: stacked && !compact ? "100%" : compact ? "100%" : "33.333%", paddingHorizontal: compact ? 0 : 4, paddingBottom: 8 }}>
            <Pressable
              accessibilityLabel={t(link.label)}
              accessibilityRole="link"
              className="cursor-pointer"
              onPress={() => {
                onNavigate?.();
                router.push(link.href as Href);
              }}
              style={{
                minHeight: compact ? 44 : 64,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 14,
                backgroundColor: colors.card,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  backgroundColor: link.background,
                }}
              >
                <MaterialCommunityIcons color={link.color} name={link.icon} size={24} />
              </View>
              <Text numberOfLines={2} style={{ flex: 1, marginLeft: 10, color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                {t(link.label)}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
