import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isMockAuthEnabled } from "../../hooks/useAuth";
import {
  listGeoDistricts,
  listGeoPincodes,
  listGeoStates,
  listGeoTehsils,
  searchPincodes,
  type GeoPincodeItem,
} from "../../services/geoService";
import { useLanguage } from "../../utils/i18n";

const DEMO_STATES = ["Maharashtra", "Delhi", "Tamil Nadu"];
const DEMO_DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Pune", "Pune District", "Mumbai"],
  Delhi: ["New Delhi"],
  "Tamil Nadu": ["Chennai"],
};
const DEMO_TEHSILS: Record<string, Record<string, string[]>> = {
  Maharashtra: {
    Pune: ["Pune", "Haveli", "Pimpri-Chinchwad"],
    "Pune District": ["Pune", "Haveli", "Pimpri-Chinchwad"],
    Mumbai: ["Mumbai"],
  },
  Delhi: { "New Delhi": ["Connaught Place"] },
  "Tamil Nadu": { Chennai: ["Chennai"] },
};
const DEMO_PINS: GeoPincodeItem[] = [
  { pincode: "411001", state: "Maharashtra", district: "Pune", tehsil: "Pune", label: "411001 · Pune, Maharashtra" },
  { pincode: "411045", state: "Maharashtra", district: "Pune", tehsil: "Haveli", label: "411045 · Pune, Maharashtra" },
  { pincode: "411062", state: "Maharashtra", district: "Pune District", tehsil: "Pimpri-Chinchwad", label: "411062 · Pimpri-Chinchwad, Maharashtra" },
  { pincode: "400001", state: "Maharashtra", district: "Mumbai", tehsil: "Mumbai", label: "400001 · Mumbai, Maharashtra" },
  { pincode: "110001", state: "Delhi", district: "New Delhi", tehsil: "Connaught Place", label: "110001 · New Delhi, Delhi" },
  { pincode: "600001", state: "Tamil Nadu", district: "Chennai", tehsil: "Chennai", label: "600001 · Chennai, Tamil Nadu" },
];

function filterOptions(options: string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return options.slice(0, 40);
  return options.filter((name) => name.toLowerCase().includes(needle)).slice(0, 40);
}

function SearchSelect({
  label,
  value,
  placeholder,
  options,
  loading,
  disabled,
  emptyHint,
  onPick,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  loading?: boolean;
  disabled?: boolean;
  emptyHint?: string;
  onPick: (name: string) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => filterOptions(options, query), [options, query]);

  return (
    <View style={{ flex: 1, minWidth: "48%", zIndex: open ? 20 : 1 }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TextInput
        editable={!disabled}
        onBlur={() => {
          setTimeout(() => setOpen(false), 180);
        }}
        onChangeText={(text) => {
          setQuery(text);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: disabled ? colors.cardSoft : colors.card,
          color: colors.ink,
          fontFamily: "Poppins_500Medium",
          fontSize: 14,
          opacity: disabled ? 0.65 : 1,
        }}
        value={query}
      />
      {open && !disabled ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            backgroundColor: colors.card,
            maxHeight: 180,
          }}
        >
          {loading ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : filtered.length > 0 ? (
            filtered.map((name) => (
              <Pressable
                key={name}
                accessibilityRole="button"
                onPress={() => {
                  setQuery(name);
                  setOpen(false);
                  onPick(name);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
              >
                <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{name}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={{ padding: 12, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
              {emptyHint || t("No options found")}
            </Text>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

/** One pincode field: type digits/city → suggestions; also filters cascade pins. */
function PincodeSearchSelect({
  value,
  cascadePins,
  loadingCascade,
  disabled,
  onPick,
}: {
  value: string;
  cascadePins: GeoPincodeItem[];
  loadingCascade?: boolean;
  disabled?: boolean;
  onPick: (item: GeoPincodeItem) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [remoteHits, setRemoteHits] = useState<GeoPincodeItem[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (disabled) return;
    const q = query.trim();
    const digits = q.replace(/\D/g, "");
    const useDigits = digits.length >= 3;
    const usePlace = !useDigits && /[A-Za-z]/.test(q) && q.length >= 2;
    if (!useDigits && !usePlace) {
      setRemoteHits([]);
      return;
    }
    // Exact selected pincode — no need to re-query.
    if (/^[1-9][0-9]{5}$/.test(q) && q === value) {
      setRemoteHits([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        setLoadingRemote(true);
        try {
          if (isMockAuthEnabled) {
            const needle = q.toLowerCase();
            setRemoteHits(
              DEMO_PINS.filter(
                (row) =>
                  row.pincode.startsWith(digits || "x") ||
                  row.district.toLowerCase().includes(needle) ||
                  row.state.toLowerCase().includes(needle) ||
                  (row.tehsil ?? "").toLowerCase().includes(needle),
              ),
            );
          } else {
            const res = await searchPincodes(useDigits ? digits : q);
            setRemoteHits(res.items);
          }
        } catch {
          setRemoteHits([]);
        } finally {
          setLoadingRemote(false);
        }
      })();
    }, 280);
    return () => clearTimeout(timer);
  }, [query, disabled, value]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromCascade = cascadePins.filter((row) => {
      if (!q) return true;
      return (
        row.pincode.includes(q.replace(/\D/g, "") || q) ||
        row.label.toLowerCase().includes(q) ||
        (row.tehsil ?? "").toLowerCase().includes(q)
      );
    });
    const byPin = new Map<string, GeoPincodeItem>();
    for (const row of [...fromCascade, ...remoteHits]) byPin.set(row.pincode, row);
    return Array.from(byPin.values()).slice(0, 40);
  }, [cascadePins, remoteHits, query]);

  const loading = loadingCascade || loadingRemote;

  return (
    <View style={{ flex: 1, minWidth: "48%", zIndex: open ? 20 : 1 }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {t("Pincode")}
      </Text>
      <TextInput
        editable={!disabled}
        keyboardType="default"
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onChangeText={(text) => {
          setQuery(text);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t("Type pincode or city")}
        placeholderTextColor={colors.muted}
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: disabled ? colors.cardSoft : colors.card,
          color: colors.ink,
          fontFamily: "Poppins_500Medium",
          fontSize: 14,
          opacity: disabled ? 0.65 : 1,
        }}
        value={query}
      />
      {open && !disabled ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            backgroundColor: colors.card,
            maxHeight: 180,
          }}
        >
          {loading ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : suggestions.length > 0 ? (
            suggestions.map((item) => (
              <Pressable
                key={`${item.pincode}-${item.label}`}
                accessibilityRole="button"
                onPress={() => {
                  setQuery(item.pincode);
                  setOpen(false);
                  onPick(item);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
              >
                <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{item.label}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={{ padding: 12, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
              {t("Type a pincode or city name")}
            </Text>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

export function LocationCascade({
  pincode,
  district,
  state,
  tehsil: tehsilProp,
  editable,
  onSelect,
}: {
  pincode: string;
  district: string;
  state: string;
  tehsil?: string;
  editable: boolean;
  onSelect: (item: GeoPincodeItem) => void;
  /** @deprecated unused — kept for call-site compatibility */
  showQuickPincodeSearch?: boolean;
}) {
  const { t } = useLanguage();
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [tehsils, setTehsils] = useState<string[]>([]);
  const [tehsil, setTehsil] = useState(tehsilProp ?? "");
  const [pins, setPins] = useState<GeoPincodeItem[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTehsils, setLoadingTehsils] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);
  const [loadNote, setLoadNote] = useState("");

  useEffect(() => {
    setTehsil(tehsilProp ?? "");
  }, [tehsilProp]);

  useEffect(() => {
    if (!editable) return;
    setLoadingStates(true);
    setLoadNote("");
    void (async () => {
      try {
        if (isMockAuthEnabled) {
          setStates(DEMO_STATES);
          return;
        }
        const res = await listGeoStates();
        const names = res.items.map((item) => item.name).filter(Boolean);
        if (names.length) setStates(names);
        else {
          setStates(DEMO_STATES);
          setLoadNote(t("Location list empty — showing sample states."));
        }
      } catch {
        setStates(DEMO_STATES);
        setLoadNote(t("Could not load states from server — showing sample list."));
      } finally {
        setLoadingStates(false);
      }
    })();
  }, [editable, t]);

  useEffect(() => {
    if (!editable || !state) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    void (async () => {
      try {
        if (isMockAuthEnabled) {
          setDistricts(DEMO_DISTRICTS[state] ?? []);
          return;
        }
        const res = await listGeoDistricts(state);
        const names = res.items.map((item) => item.name).filter(Boolean);
        setDistricts(names.length ? names : DEMO_DISTRICTS[state] ?? []);
      } catch {
        setDistricts(DEMO_DISTRICTS[state] ?? []);
      } finally {
        setLoadingDistricts(false);
      }
    })();
  }, [editable, state]);

  useEffect(() => {
    if (!editable || !state || !district) {
      setTehsils([]);
      return;
    }
    setLoadingTehsils(true);
    void (async () => {
      try {
        if (isMockAuthEnabled) {
          setTehsils(DEMO_TEHSILS[state]?.[district] ?? []);
          return;
        }
        const tehsilRes = await listGeoTehsils(state, district);
        const names = tehsilRes.items.map((item) => item.name).filter(Boolean);
        setTehsils(names.length ? names : DEMO_TEHSILS[state]?.[district] ?? []);
      } catch {
        setTehsils(DEMO_TEHSILS[state]?.[district] ?? []);
      } finally {
        setLoadingTehsils(false);
      }
    })();
  }, [editable, state, district]);

  useEffect(() => {
    if (!editable || !state || !district) {
      setPins([]);
      return;
    }
    setLoadingPins(true);
    void (async () => {
      try {
        if (isMockAuthEnabled) {
          setPins(
            DEMO_PINS.filter(
              (row) =>
                row.state === state &&
                row.district === district &&
                (!tehsil || row.tehsil === tehsil),
            ),
          );
          return;
        }
        const pinRes = await listGeoPincodes(state, district, 80, tehsil || undefined);
        setPins(
          pinRes.items.length
            ? pinRes.items
            : DEMO_PINS.filter(
                (row) =>
                  row.state === state &&
                  row.district === district &&
                  (!tehsil || row.tehsil === tehsil),
              ),
        );
      } catch {
        setPins(
          DEMO_PINS.filter(
            (row) =>
              row.state === state &&
              row.district === district &&
              (!tehsil || row.tehsil === tehsil),
          ),
        );
      } finally {
        setLoadingPins(false);
      }
    })();
  }, [editable, state, district, tehsil]);

  const pickState = (name: string) => {
    if (name === state) return;
    setTehsil("");
    onSelect({ pincode: "", state: name, district: "", tehsil: null, label: name });
  };

  const pickDistrict = (name: string) => {
    setTehsil("");
    onSelect({ pincode: "", state, district: name, tehsil: null, label: `${name}, ${state}` });
  };

  return (
    <View style={{ width: "100%", gap: 10 }}>
      {loadNote ? (
        <Text style={{ color: "#92400E", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>{loadNote}</Text>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <SearchSelect
          disabled={!editable}
          emptyHint={t("No states available")}
          label={t("State")}
          loading={loadingStates}
          onPick={pickState}
          options={states}
          placeholder={t("Type to search state")}
          value={state}
        />
        <SearchSelect
          disabled={!editable || !state}
          emptyHint={t("Select a state first")}
          label={t("District")}
          loading={loadingDistricts}
          onPick={pickDistrict}
          options={districts}
          placeholder={t("Type to search district")}
          value={district}
        />
        <SearchSelect
          disabled={!editable || !district}
          emptyHint={t("Select a district first")}
          label={t("Tehsil / city")}
          loading={loadingTehsils}
          onPick={(name) => {
            setTehsil(name);
            onSelect({ pincode: "", state, district, tehsil: name, label: `${name}, ${district}` });
          }}
          options={tehsils}
          placeholder={t("Type to search tehsil")}
          value={tehsil}
        />
        <PincodeSearchSelect
          cascadePins={pins}
          disabled={!editable}
          loadingCascade={loadingPins}
          onPick={(item) => {
            if (item.tehsil) setTehsil(item.tehsil);
            onSelect(item);
          }}
          value={pincode}
        />
      </View>
    </View>
  );
}
