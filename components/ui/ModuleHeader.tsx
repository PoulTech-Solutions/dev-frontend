import { Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
}

export function ModuleHeader({ title, subtitle }: ModuleHeaderProps) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          color: colors.primary,
          fontFamily: "Poppins_700Bold",
          fontSize: 26,
          lineHeight: 34,
        }}
      >
        {t(title)}
      </Text>
      <Text
        style={{
          marginTop: 4,
          color: colors.muted,
          fontFamily: "Poppins_400Regular",
          fontSize: 13,
          lineHeight: 20,
        }}
      >
        {t(subtitle)}
      </Text>
    </View>
  );
}
