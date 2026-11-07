import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useLanguage } from "../../utils/i18n";

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const { t } = useLanguage();
  return (
    <View
      style={{
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
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
          backgroundColor: "#EAF8EC",
        }}
      >
        <Ionicons color="#14532D" name={icon} size={27} />
      </View>
      <Text
        style={{
          marginTop: 16,
          color: "#0B2A5B",
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
          color: "#64748B",
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
