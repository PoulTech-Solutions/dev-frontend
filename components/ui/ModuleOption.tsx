import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useLanguage } from "../../utils/i18n";

type IconName = keyof typeof Ionicons.glyphMap;

interface ModuleOptionProps {
  title: string;
  subtitle?: string;
  icon: IconName;
  color: string;
  background: string;
  onPress: () => void;
  accessibilityLabel?: string;
  showChevron?: boolean;
  trailingContent?: ReactNode;
}

export function ModuleOption({
  title,
  subtitle,
  icon,
  color,
  background,
  onPress,
  accessibilityLabel = title,
  showChevron = true,
  trailingContent,
}: ModuleOptionProps) {
  const { t } = useLanguage();
  return (
    <Pressable
      accessibilityLabel={t(accessibilityLabel)}
      accessibilityRole="button"
      className="cursor-pointer hover:bg-slate-50 active:bg-green-50 focus-visible:ring-2 focus-visible:ring-accent"
      onPress={onPress}
      style={{
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 13,
          backgroundColor: background,
        }}
      >
        <Ionicons color={color} name={icon} size={19} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
          {t(title)}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={{
              marginTop: 2,
              color: "#64748B",
              fontFamily: "Poppins_400Regular",
              fontSize: 10,
              lineHeight: 15,
            }}
          >
            {t(subtitle)}
          </Text>
        ) : null}
      </View>
      {trailingContent}
      {showChevron ? <Ionicons color="#94A3B8" name="chevron-forward" size={17} /> : null}
    </Pressable>
  );
}
