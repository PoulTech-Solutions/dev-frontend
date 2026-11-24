import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutRectangle,
} from "react-native";
import { FormModal } from "../ui/FormModal";
import { RateTicker } from "../ui/RateTicker";
import {
  useMarketDashboard,
  useMarketZones,
  usePoultryRates,
  useUpsertPoultryRates,
} from "../../hooks/useMarketDashboard";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { getApiErrorMessage } from "../../utils/apiErrors";
import type { MarketRateCard } from "../../services/marketService";

const REGULAR = "Poppins_400Regular";
const SEMIBOLD = "Poppins_600SemiBold";
const BOLD = "Poppins_700Bold";

type ProductId = "culls" | "broilers";

function RateField({
  label,
  value,
  onChangeText,
  editable,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <View style={{ flex: 1, minWidth: 120 }}>
      <Text style={{ color: colors.muted, fontFamily: SEMIBOLD, fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TextInput
        editable={editable}
        keyboardType="decimal-pad"
        onChangeText={onChangeText}
        placeholder="0.00"
        placeholderTextColor={colors.muted}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          backgroundColor: editable ? "#FFFFFF" : colors.cardSoft,
          paddingHorizontal: 12,
          paddingVertical: 11,
          fontFamily: SEMIBOLD,
          fontSize: 15,
          color: colors.ink,
          opacity: editable ? 1 : 0.7,
        }}
        value={value}
      />
    </View>
  );
}

function SearchableSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string; subtitle?: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuBox, setMenuBox] = useState<LayoutRectangle | null>(null);
  const selected = options.find((item) => item.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        (item.subtitle ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const openMenu = () => {
    if (disabled) return;
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuBox({ x, y, width, height });
      setQuery("");
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setMenuBox(null);
    setQuery("");
  };

  return (
    <View style={{ flex: 1, minWidth: 160 }}>
      <Text style={{ color: colors.muted, fontFamily: SEMIBOLD, fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </Text>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open, disabled: Boolean(disabled) }}
          disabled={disabled}
          onPress={() => {
            if (open) closeMenu();
            else openMenu();
          }}
          style={{
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: open ? "#86EFAC" : colors.line,
            borderRadius: 10,
            backgroundColor: disabled ? colors.cardSoft : "#FFFFFF",
            paddingHorizontal: 12,
            opacity: disabled ? 0.65 : 1,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 13 }}>
              {selected?.label || placeholder}
            </Text>
            {selected?.subtitle ? (
              <Text numberOfLines={1} style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
                {selected.subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons color={colors.muted} name={open ? "chevron-up" : "chevron-down"} size={16} />
        </Pressable>
      </View>

      <Modal transparent visible={open} animationType="fade" onRequestClose={closeMenu}>
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityLabel={t("Close")}
            accessibilityRole="button"
            onPress={closeMenu}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          {menuBox ? (
            <View
              style={{
                position: "absolute",
                top: menuBox.y + menuBox.height + 4,
                left: menuBox.x,
                width: Math.max(menuBox.width, 220),
                maxHeight: 280,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 12,
                backgroundColor: colors.card,
                overflow: "hidden",
                elevation: 12,
                shadowColor: "#0F172A",
                shadowOpacity: 0.2,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
              }}
            >
              <TextInput
                autoFocus
                onChangeText={setQuery}
                placeholder={t("Type to search")}
                placeholderTextColor={colors.muted}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.ink,
                  fontFamily: SEMIBOLD,
                  fontSize: 13,
                }}
                value={query}
              />
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 220 }}>
                {filtered.length ? (
                  filtered.map((item) => {
                    const active = item.value === value;
                    return (
                      <Pressable
                        key={item.value}
                        onPress={() => {
                          onChange(item.value);
                          closeMenu();
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: active ? "#F0FDF4" : "transparent",
                          borderBottomWidth: 1,
                          borderBottomColor: colors.line,
                        }}
                      >
                        <Text style={{ color: active ? "#15803D" : colors.ink, fontFamily: SEMIBOLD, fontSize: 13 }}>
                          {item.label}
                        </Text>
                        {item.subtitle ? (
                          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>{item.subtitle}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={{ padding: 12, color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
                    {t("No options found")}
                  </Text>
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

export function PoultryRateAdminPanel() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const zonesQuery = useMarketZones();
  const dashboardQuery = useMarketDashboard(null);
  const upsertMutation = useUpsertPoultryRates();

  const defaultZone =
    dashboardQuery.data?.metadata?.selected_zone ?? zonesQuery.data?.default_zone ?? "";

  const [liveZone, setLiveZone] = useState("");
  const [liveOpen, setLiveOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [zone, setZone] = useState("");
  const [product, setProduct] = useState<ProductId>("culls");
  const [today, setToday] = useState("");
  const [yesterday, setYesterday] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [applyAllZones, setApplyAllZones] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(1);

  const activeLiveZone = liveZone || defaultZone;
  const activeZone = zone || defaultZone;
  const liveDashboard = useMarketDashboard(activeLiveZone || null, Boolean(activeLiveZone));
  const currentQuery = usePoultryRates(product, activeZone || null, manualOpen && Boolean(activeZone));

  useEffect(() => {
    if (!defaultZone) return;
    if (!liveZone) setLiveZone(defaultZone);
    if (!zone) setZone(defaultZone);
  }, [defaultZone, liveZone, zone]);

  useEffect(() => {
    if (!manualOpen) return;
    const data = currentQuery.data;
    if (!data) return;
    setToday(data.today ?? "");
    setYesterday(data.yesterday_carried ? "" : (data.yesterday ?? ""));
    setTomorrow(data.tomorrow ?? "");
  }, [currentQuery.data, manualOpen]);

  const todayEditable = currentQuery.data?.today_editable !== false;
  const yesterdayEditable = currentQuery.data?.yesterday_editable !== false;
  const tomorrowEditable = currentQuery.data?.tomorrow_editable !== false;

  const cities = Array.isArray(zonesQuery.data?.zones) ? zonesQuery.data.zones : [];
  const hubOptions = useMemo(
    () =>
      cities.map((item) => ({
        value: item.name,
        label: item.name,
        subtitle: item.state ?? undefined,
      })),
    [cities],
  );

  const productOptions = useMemo(
    () => [
      { value: "culls", label: t("Culls birds") },
      { value: "broilers", label: t("Broiler rate") },
    ],
    [t],
  );

  const liveCards = useMemo(() => {
    const rates = liveDashboard.data?.rates ?? [];
    const find = (id: string) => rates.find((item) => item.id === id);
    return [
      { id: "eggs", label: t("Eggs"), rate: find("eggs") },
      { id: "culls", label: t("Culls birds"), rate: find("culls") },
      { id: "broilers", label: t("Broiler rate"), rate: find("broilers") },
    ] as { id: string; label: string; rate?: MarketRateCard }[];
  }, [liveDashboard.data?.rates, t]);

  const tickerItems = useMemo(
    () =>
      (liveDashboard.data?.ticker ?? []).map((item) => ({
        label: item.label,
        value: item.value,
        change: item.change,
      })),
    [liveDashboard.data?.ticker],
  );

  const rateTag = (rate?: MarketRateCard) => {
    if (!rate?.value) return null;
    const manual = (rate.source ?? "").toLowerCase() === "manual";
    return {
      label: manual ? t("Manually updated") : t("Live"),
      color: manual ? "#B45309" : "#15803D",
      background: manual ? "#FFFBEB" : "#ECFDF5",
      border: manual ? "#FDE68A" : "#BBF7D0",
    };
  };

  const canSubmit =
    Boolean(activeZone) &&
    ((todayEditable && today.trim()) ||
      (yesterdayEditable && yesterday.trim()) ||
      (tomorrowEditable && tomorrow.trim()));

  const openManual = () => {
    setSaved(false);
    setApplyAllZones(false);
    setZone(activeLiveZone || defaultZone);
    setManualOpen(true);
  };

  const submit = () => {
    if (!activeZone) return;
    const payload: {
      product: ProductId;
      zone: string;
      today?: string;
      yesterday?: string;
      tomorrow?: string;
      apply_all_zones?: boolean;
    } = { product, zone: activeZone, apply_all_zones: applyAllZones };
    if (todayEditable && today.trim()) payload.today = today.trim();
    if (yesterdayEditable && yesterday.trim()) payload.yesterday = yesterday.trim();
    if (tomorrowEditable && tomorrow.trim()) payload.tomorrow = tomorrow.trim();
    if (!payload.today && !payload.yesterday && !payload.tomorrow) return;
    setSaved(false);
    upsertMutation.mutate(payload, {
      onSuccess: (result) => {
        setSavedCount(result.zones_updated ?? (applyAllZones ? Math.max(cities.length, 1) : 1));
        setSaved(true);
        void liveDashboard.refetch();
      },
    });
  };

  const carriedHint =
    currentQuery.data?.today_carried && currentQuery.data.today_source_date
      ? `${t("No rate for today yet. Showing last published")} ${currentQuery.data.today_source_date}. ${t("Save to record it for today.")}`
      : null;

  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 14,
          backgroundColor: colors.card,
          overflow: "hidden",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: liveOpen }}
          onPress={() => setLiveOpen((current) => !current)}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            padding: 14,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ECFDF5",
            }}
          >
            <Ionicons color="#15803D" name="pulse-outline" size={16} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ flexShrink: 1, color: colors.ink, fontFamily: BOLD, fontSize: 14 }}>{t("Live rates")}</Text>
              <Ionicons color={colors.muted} name={liveOpen ? "chevron-up" : "chevron-down"} size={16} />
            </View>
            <Text style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 11 }}>
              {t("Current published rates for the selected hub.")}
            </Text>
          </View>
        </Pressable>

        {liveOpen ? (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
            <SearchableSelect
              label={t("Market hub")}
              value={activeLiveZone}
              placeholder={t("Select hub")}
              options={hubOptions}
              onChange={(next) => setLiveZone(next)}
            />

            {liveDashboard.isLoading ? <ActivityIndicator color={colors.accent} /> : null}

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {liveCards.map((item) => {
                const tag = rateTag(item.rate);
                return (
                  <View
                    key={item.id}
                    style={{
                      flexGrow: 1,
                      flexBasis: 140,
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: 12,
                      backgroundColor: colors.cardSoft,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <Text style={{ flex: 1, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 11 }}>{item.label}</Text>
                      {tag ? (
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: tag.border,
                            borderRadius: 6,
                            backgroundColor: tag.background,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: tag.color, fontFamily: SEMIBOLD, fontSize: 9 }}>{tag.label}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ marginTop: 6, color: colors.primary, fontFamily: BOLD, fontSize: 18 }}>
                      {item.rate?.value ? `₹${item.rate.value}` : "—"}
                    </Text>
                    {item.rate?.unit ? (
                      <Text style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
                        {item.rate.unit}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={openManual}
        style={{
          borderWidth: 1,
          borderColor: "#BFDBFE",
          borderRadius: 14,
          backgroundColor: "#EFF6FF",
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#DBEAFE",
          }}
        >
          <Ionicons color="#1D4ED8" name="create-outline" size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#1E3A8A", fontFamily: BOLD, fontSize: 14 }}>{t("Manage manually")}</Text>
          <Text style={{ marginTop: 2, color: "#1D4ED8", fontFamily: REGULAR, fontSize: 11, lineHeight: 16 }}>
            {t("Update culls or broiler rates for one hub, or apply the same rates to all hubs.")}
          </Text>
        </View>
        <Ionicons color="#1D4ED8" name="chevron-forward" size={18} />
      </Pressable>

      {tickerItems.length ? (
        <View style={{ borderRadius: 14, overflow: "hidden" }}>
          <RateTicker items={tickerItems} />
        </View>
      ) : null}

      <FormModal
        visible={manualOpen}
        title="Manage rates manually"
        size="large"
        onClose={() => {
          setManualOpen(false);
          setSaved(false);
        }}
      >
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <SearchableSelect
              label={t("Market hub")}
              value={activeZone}
              placeholder={t("Select hub")}
              options={hubOptions}
              disabled={applyAllZones}
              onChange={(next) => {
                setZone(next);
                setSaved(false);
              }}
            />
            <SearchableSelect
              label={t("Product")}
              value={product}
              placeholder={t("Select product")}
              options={productOptions}
              onChange={(next) => {
                setProduct(next as ProductId);
                setSaved(false);
              }}
            />
          </View>

          {carriedHint ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#FDE68A",
                backgroundColor: "#FFFBEB",
                padding: 10,
              }}
            >
              <Ionicons color="#B45309" name="information-circle-outline" size={16} />
              <Text style={{ flex: 1, color: "#92400E", fontFamily: REGULAR, fontSize: 11, lineHeight: 16 }}>
                {carriedHint}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 12,
              backgroundColor: colors.cardSoft,
              padding: 14,
              gap: 12,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 13 }}>
              {t("Rates")} · {applyAllZones ? t("All hubs") : activeZone || "—"}
            </Text>
            {currentQuery.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              <RateField
                colors={colors}
                editable={yesterdayEditable}
                label={t(yesterdayEditable ? "Yesterday" : "Yesterday (locked)")}
                onChangeText={setYesterday}
                value={yesterday}
              />
              <RateField
                colors={colors}
                editable={todayEditable}
                label={t(todayEditable ? "Today" : "Today (locked)")}
                onChangeText={setToday}
                value={today}
              />
              <RateField
                colors={colors}
                editable={tomorrowEditable}
                label={t("Tomorrow")}
                onChangeText={setTomorrow}
                value={tomorrow}
              />
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: applyAllZones }}
              onPress={() => {
                setApplyAllZones((current) => !current);
                setSaved(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                borderWidth: 1,
                borderColor: applyAllZones ? "#86EFAC" : colors.line,
                borderRadius: 10,
                backgroundColor: applyAllZones ? "#F0FDF4" : "#FFFFFF",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Ionicons
                color={applyAllZones ? "#15803D" : colors.muted}
                name={applyAllZones ? "checkbox" : "square-outline"}
                size={20}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 13 }}>
                  {t("Apply same rates to all hubs")}
                </Text>
                <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 11, lineHeight: 16 }}>
                  {t("Uses the values below for every market hub, not only the selected one.")}
                </Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={upsertMutation.isPending || !canSubmit}
            onPress={submit}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 12,
              backgroundColor: "#15803D",
              opacity: upsertMutation.isPending || !canSubmit ? 0.55 : 1,
              paddingHorizontal: 18,
              paddingVertical: 12,
            }}
          >
            {upsertMutation.isPending ? <ActivityIndicator color="#fff" /> : null}
            <Text style={{ color: "#FFFFFF", fontFamily: BOLD, fontSize: 13 }}>
              {applyAllZones ? t("Save to all hubs") : t("Save hub rates")}
            </Text>
          </Pressable>

          {saved ? (
            <Text style={{ color: "#15803D", fontFamily: SEMIBOLD, fontSize: 12 }}>
              {applyAllZones || savedCount > 1
                ? `${t("Rates saved for")} ${savedCount} ${t("hubs")}. ${t("Dashboard refreshes within a minute.")}`
                : t("Rates saved. Dashboard refreshes within a minute.")}
            </Text>
          ) : null}

          {upsertMutation.isError ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#FEF2F2",
                borderWidth: 1,
                borderColor: "#FECACA",
              }}
            >
              <Ionicons color="#B91C1C" name="alert-circle-outline" size={16} />
              <Text style={{ flex: 1, color: "#B91C1C", fontFamily: REGULAR, fontSize: 11 }}>
                {getApiErrorMessage(upsertMutation.error) ?? t("Could not save rates. Check zone and permissions.")}
              </Text>
            </View>
          ) : null}
        </View>
      </FormModal>
    </View>
  );
}
