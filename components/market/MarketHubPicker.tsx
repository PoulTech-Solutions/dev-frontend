import { Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

export function MarketHubPicker({
  selectedZone,
}: {
  selectedZone: string | null;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {t("NECC centre")}
      </Text>
      <View
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.cardSoft,
        }}
      >
        <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
          {selectedZone || t("Set pincode")}
        </Text>
      </View>
      <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
        {t("Rates follow your profile pincode. Nearest NECC hub is chosen when your city is not on the sheet.")}
      </Text>
    </View>
  );
}
