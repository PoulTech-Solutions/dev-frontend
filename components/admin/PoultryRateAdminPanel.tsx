import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useMarketDashboard, useMarketZones, usePoultryRates, useUpsertPoultryRates } from "../../hooks/useMarketDashboard";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { getApiErrorMessage } from "../../utils/apiErrors";

const REGULAR = "Poppins_400Regular";
const SEMIBOLD = "Poppins_600SemiBold";
const BOLD = "Poppins_700Bold";

export function PoultryRateAdminPanel() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const zonesQuery = useMarketZones();
  const dashboardQuery = useMarketDashboard(null);
  const upsertMutation = useUpsertPoultryRates();

  const defaultZone =
    dashboardQuery.data?.metadata?.selected_zone ?? zonesQuery.data?.default_zone ?? "";

  const [zone, setZone] = useState("");
  const [product, setProduct] = useState<"culls" | "broilers">("culls");
  const [today, setToday] = useState("");
  const [yesterday, setYesterday] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [saved, setSaved] = useState(false);

  const activeZone = zone || defaultZone;
  const currentQuery = usePoultryRates(product, activeZone || null, Boolean(activeZone));

  useEffect(() => {
    if (zone || !defaultZone) return;
    setZone(defaultZone);
  }, [defaultZone, zone]);

  useEffect(() => {
    const data = currentQuery.data;
    if (!data) return;
    setToday(data.today ?? "");
    setYesterday(data.yesterday_carried ? "" : (data.yesterday ?? ""));
    setTomorrow(data.tomorrow ?? "");
  }, [currentQuery.data]);

  const todayEditable = currentQuery.data?.today_editable !== false;
  const yesterdayEditable = currentQuery.data?.yesterday_editable !== false;
  const tomorrowEditable = currentQuery.data?.tomorrow_editable !== false;

  const submit = () => {
    if (!activeZone) return;
    const payload: {
      product: "culls" | "broilers";
      zone: string;
      today?: string;
      yesterday?: string;
      tomorrow?: string;
    } = { product, zone: activeZone };
    if (todayEditable && today.trim()) payload.today = today.trim();
    if (yesterdayEditable && yesterday.trim()) payload.yesterday = yesterday.trim();
    if (tomorrowEditable && tomorrow.trim()) payload.tomorrow = tomorrow.trim();
    if (!payload.today && !payload.yesterday && !payload.tomorrow) return;
    setSaved(false);
    upsertMutation.mutate(payload, {
      onSuccess: () => {
        setSaved(true);
      },
    });
  };

  const cities = Array.isArray(zonesQuery.data?.zones) ? zonesQuery.data.zones : [];
  const carriedHint =
    currentQuery.data?.today_carried && currentQuery.data.today_source_date
      ? `${t("No rate for today yet. Showing last published")} ${currentQuery.data.today_source_date}. ${t("Save to record it for today.")}`
      : null;

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 11, lineHeight: 16 }}>
        {t("Choose a stored market city. Staff can fill empty yesterday/today cells once. After a day has a rate, only admin or super admin can change it. Tomorrow stays optional.")}
      </Text>

      <View>
        <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 10, marginBottom: 6 }}>
          {t("Market city")}
        </Text>
        {zonesQuery.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {cities.map((item) => {
            const selected = activeZone === item.name;
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setZone(item.name);
                  setSaved(false);
                }}
                style={{
                  minHeight: 36,
                  justifyContent: "center",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.line,
                  backgroundColor: selected ? colors.chip : colors.card,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ color: selected ? colors.primary : colors.ink, fontFamily: BOLD, fontSize: 12 }}>
                  {item.name}
                </Text>
                {item.state ? (
                  <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 9 }}>{item.state}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["culls", "broilers"] as const).map((p) => {
          const selected = product === p;
          return (
            <Pressable
              key={p}
              onPress={() => {
                setProduct(p);
                setSaved(false);
              }}
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.line,
                backgroundColor: selected ? colors.chip : colors.card,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.ink, fontFamily: BOLD, fontSize: 12, textTransform: "capitalize" }}>
                {t(p === "culls" ? "Culls birds" : "Broiler rate")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {carriedHint ? (
        <Text style={{ color: "#92400E", fontFamily: REGULAR, fontSize: 11 }}>{carriedHint}</Text>
      ) : null}

      <View style={{ gap: 8 }}>
        {(
          [
            ["today", today, setToday, todayEditable],
            ["yesterday", yesterday, setYesterday, yesterdayEditable],
            ["tomorrow", tomorrow, setTomorrow, tomorrowEditable],
          ] as const
        ).map(([key, value, setter, editable]) => (
          <View key={key}>
            <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 10, marginBottom: 4 }}>
              {t(
                key === "today"
                  ? editable
                    ? "Today (optional)"
                    : "Today (locked)"
                  : key === "yesterday"
                    ? editable
                      ? "Yesterday (optional)"
                      : "Yesterday (locked)"
                    : "Tomorrow (optional)",
              )}
            </Text>
            <TextInput
              editable={editable}
              keyboardType="decimal-pad"
              onChangeText={setter}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 10,
                backgroundColor: editable ? colors.card : colors.cardSoft,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontFamily: REGULAR,
                fontSize: 14,
                color: colors.ink,
                opacity: editable ? 1 : 0.7,
              }}
              value={value}
            />
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={
          upsertMutation.isPending ||
          !activeZone ||
          !(
            (todayEditable && today.trim()) ||
            (yesterdayEditable && yesterday.trim()) ||
            (tomorrowEditable && tomorrow.trim())
          )
        }
        onPress={submit}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 12,
          backgroundColor: colors.accent,
          opacity:
            upsertMutation.isPending ||
            !activeZone ||
            !(
              (todayEditable && today.trim()) ||
              (yesterdayEditable && yesterday.trim()) ||
              (tomorrowEditable && tomorrow.trim())
            )
              ? 0.6
              : 1,
          paddingVertical: 12,
        }}
      >
        {upsertMutation.isPending ? <ActivityIndicator color="#fff" /> : null}
        <Text style={{ color: "#FFFFFF", fontFamily: BOLD, fontSize: 13 }}>{t("Save hub rates")}</Text>
      </Pressable>

      {upsertMutation.isError ? (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#FEF2F2" }}>
          <Ionicons color="#B91C1C" name="alert-circle-outline" size={16} />
          <Text style={{ flex: 1, color: "#B91C1C", fontFamily: REGULAR, fontSize: 11 }}>
            {getApiErrorMessage(upsertMutation.error) ?? t("Could not save rates. Check zone and permissions.")}
          </Text>
        </View>
      ) : null}

      {saved ? (
        <Text style={{ color: "#15803D", fontFamily: SEMIBOLD, fontSize: 11 }}>
          {t("Rates saved. Dashboard refreshes within a minute.")}
        </Text>
      ) : null}
    </View>
  );
}
