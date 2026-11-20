import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { CARD_TONES, type CardTone } from "./SectionTitle";

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  tone?: CardTone;
}

export function EmptyState({ icon, title, description, tone = "green" }: EmptyStateProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const palette = CARD_TONES[tone];

  return (
    <View
      style={{
        alignItems: "center",
        borderWidth: 1,
        borderColor: isDark ? colors.line : palette.border,
        borderRadius: 24,
        backgroundColor: isDark ? colors.card : palette.bg,
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
    >
      <View
        style={{
          width: 58,
          height: 58,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
          backgroundColor: isDark ? colors.promoBg : palette.brush,
        }}
      >
        <Ionicons color={palette.bar} name={icon} size={27} />
      </View>
      <Text
        style={{
          marginTop: 16,
          color: colors.primary,
          fontFamily: "Poppins_600SemiBold",
          fontSize: 16,
          textAlign: "center",
        }}
      >
        {t(title)}
      </Text>
      <Text
        style={{
          maxWidth: 360,
          marginTop: 6,
          color: colors.muted,
          fontFamily: "Poppins_400Regular",
          fontSize: 12,
          lineHeight: 19,
          textAlign: "center",
        }}
      >
        {t(description)}
      </Text>
    </View>
  );
}
