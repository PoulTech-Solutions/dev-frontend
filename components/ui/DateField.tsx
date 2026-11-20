import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { formatDateTyping, isoToSlashDate, slashDateToIso } from "../../utils/dateInput";

type DateFieldProps = {
  label: string;
  /** Stored value as YYYY-MM-DD (or empty). */
  value: string;
  /** Called with YYYY-MM-DD when the typed date is complete & valid, or "" when cleared. */
  onChangeIso: (iso: string) => void;
  placeholder?: string;
  hint?: string;
};

/**
 * Easy date entry: type `20261120` or `2026` and `/` is inserted automatically → `2026/11/20`.
 */
export function DateField({
  label,
  value,
  onChangeIso,
  placeholder = "2026/11/20",
  hint = "Type year / month / day — slashes are added for you",
}: DateFieldProps) {
  const { colors } = useAppTheme();
  const [text, setText] = useState(() => isoToSlashDate(value));

  useEffect(() => {
    setText(isoToSlashDate(value));
  }, [value]);

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ marginBottom: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="number-pad"
        maxLength={10}
        onChangeText={(raw) => {
          const next = formatDateTyping(raw);
          setText(next);
          if (!next) {
            onChangeIso("");
            return;
          }
          const iso = slashDateToIso(next);
          if (iso) onChangeIso(iso);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          backgroundColor: colors.card,
          paddingHorizontal: 12,
          color: colors.ink,
          fontFamily: "Poppins_500Medium",
          fontSize: 13,
          letterSpacing: 0.5,
        }}
        value={text}
      />
      {hint ? (
        <Text style={{ marginTop: 4, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{hint}</Text>
      ) : null}
    </View>
  );
}
