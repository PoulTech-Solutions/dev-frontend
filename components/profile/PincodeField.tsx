import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isMockAuthEnabled } from "../../hooks/useAuth";
import { searchPincodes, type GeoPincodeItem } from "../../services/geoService";
import { useLanguage } from "../../utils/i18n";

const DEMO_PINCODES: GeoPincodeItem[] = [
  { pincode: "411001", state: "Maharashtra", district: "Pune", tehsil: "Pune", label: "411001 · Pune, Maharashtra" },
  { pincode: "600001", state: "Tamil Nadu", district: "Chennai", tehsil: "Chennai", label: "600001 · Chennai, Tamil Nadu" },
];

export function PincodeField({
  value,
  district,
  state,
  onSelect,
  editable,
}: {
  value: string;
  district: string;
  state: string;
  onSelect: (item: GeoPincodeItem) => void;
  editable: boolean;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<GeoPincodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!editable) return;
    const digits = query.replace(/\D/g, "");
    const place = query.trim();
    const useDigits = digits.length >= 3;
    const usePlace = !useDigits && /[A-Za-z]/.test(place) && place.length >= 2;
    if (!useDigits && !usePlace) {
      setItems([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const q = useDigits ? digits : place;
          if (isMockAuthEnabled) {
            const needle = q.toLowerCase();
            setItems(
              DEMO_PINCODES.filter(
                (row) =>
                  row.pincode.startsWith(digits || "x") ||
                  row.district.toLowerCase().includes(needle) ||
                  row.state.toLowerCase().includes(needle),
              ),
            );
          } else {
            const res = await searchPincodes(q);
            setItems(res.items);
          }
          setOpen(true);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 280);
    return () => clearTimeout(timer);
  }, [query, editable]);

  const pick = (item: GeoPincodeItem) => {
    setQuery(item.pincode);
    setOpen(false);
    onSelect(item);
  };

  return (
    <View style={{ flex: 1, minWidth: "100%" }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {t("Pincode")}
      </Text>
      {editable ? (
        <TextInput
          accessibilityLabel={t("Pincode")}
          keyboardType="default"
          maxLength={40}
          onChangeText={(text) => {
            setQuery(text.slice(0, 40));
            setOpen(true);
          }}
          placeholder={t("Type pincode or city name")}
          placeholderTextColor={colors.muted}
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.ink,
            fontFamily: "Poppins_500Medium",
            fontSize: 14,
            backgroundColor: colors.cardSoft,
          }}
          value={query}
        />
      ) : (
        <Text style={{ marginTop: 6, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
          {value || "—"}
        </Text>
      )}
      {editable && (district || state) ? (
        <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
          {[district, state].filter(Boolean).join(", ")}
        </Text>
      ) : null}
      {editable && loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 8 }} />
      ) : null}
      {editable && open && items.length > 0 ? (
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            backgroundColor: colors.card,
            maxHeight: 160,
            overflow: "hidden",
          }}
        >
          {items.map((item) => (
            <Pressable
              key={item.pincode}
              accessibilityRole="button"
              className="cursor-pointer"
              onPress={() => pick(item)}
              style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
            >
              <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {editable ? (
        <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
          {t("Select a valid India Post pincode for egg rates in your area.")}
        </Text>
      ) : null}
    </View>
  );
}