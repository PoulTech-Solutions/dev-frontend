import { Text, View } from "react-native";
import { useLanguage } from "../../utils/i18n";

const COLORS = {
  primary: "#0B2A5B",
  muted: "#64748B",
};

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
}

export function ModuleHeader({ title, subtitle }: ModuleHeaderProps) {
  const { t } = useLanguage();
  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          color: COLORS.primary,
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
          color: COLORS.muted,
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
