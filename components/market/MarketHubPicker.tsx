import { Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

/** Note only — hub is resolved from profile pincode (no location control on dashboard). */
export function MarketHubNote({
  selectedZone,
  showWhenNoLocation,
}: {
  selectedZone: string | null;
  /** When true, user has no saved pincode / is on fallback hub */
  showWhenNoLocation: boolean;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();

  if (!showWhenNoLocation) return null;

  const hub = selectedZone?.trim();
  const note = hub
    ? t("Rates follow your profile pincode. Nearest NECC hub is chosen when your city is not on the sheet.") +
      ` ${t("Showing")} ${hub}.`
    : t("Rates follow your profile pincode. Nearest NECC hub is chosen when your city is not on the sheet.");

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 }}>
        {note}
      </Text>
    </View>
  );
}

/** @deprecated Prefer MarketHubNote — kept so older imports do not break. */
export function MarketHubPicker({ selectedZone }: { selectedZone: string | null }) {
  return <MarketHubNote selectedZone={selectedZone} showWhenNoLocation />;
}
