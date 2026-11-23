import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isMockAuthEnabled } from "../../hooks/useAuth";
import {
  listGeoDistricts,
  listGeoOffices,
  listGeoPincodes,
  listGeoStates,
  listGeoTehsils,
  type GeoOfficeItem,
  type GeoPincodeItem,
} from "../../services/geoService";
import { useLanguage } from "../../utils/i18n";
import { PincodeField } from "./PincodeField";

const DEMO_STATES = ["Maharashtra", "Delhi", "Tamil Nadu"];
const DEMO_DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Pune", "Mumbai"],
  Delhi: ["New Delhi"],
  "Tamil Nadu": ["Chennai"],
};
const DEMO_TEHSILS: Record<string, Record<string, string[]>> = {
  Maharashtra: { Pune: ["Pune", "Haveli"], Mumbai: ["Mumbai"] },
  Delhi: { "New Delhi": ["Connaught Place"] },
  "Tamil Nadu": { Chennai: ["Chennai"] },
};
const DEMO_PINS: GeoPincodeItem[] = [
  { pincode: "411001", state: "Maharashtra", district: "Pune", tehsil: "Pune", label: "411001 · Pune, Maharashtra" },
  { pincode: "411045", state: "Maharashtra", district: "Pune", tehsil: "Haveli", label: "411045 · Pune, Maharashtra" },
  { pincode: "400001", state: "Maharashtra", district: "Mumbai", tehsil: "Mumbai", label: "400001 · Mumbai, Maharashtra" },
  { pincode: "110001", state: "Delhi", district: "New Delhi", tehsil: "Connaught Place", label: "110001 · New Delhi, Delhi" },
  { pincode: "600001", state: "Tamil Nadu", district: "Chennai", tehsil: "Chennai", label: "600001 · Chennai, Tamil Nadu" },
];

function Dropdown({
  label,
  value,
  placeholder,
  options,
  loading,
  disabled,
  onPick,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  loading?: boolean;
  disabled?: boolean;
  onPick: (name: string) => void;
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, minWidth: "48%" }}>
      {label ? (
        <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen((current) => !current)}
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.cardSoft,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text style={{ color: value ? colors.ink : colors.muted, fontFamily: "Poppins_500Medium", fontSize: 14 }}>
          {value || placeholder}
        </Text>
      </Pressable>
      {loading ? <ActivityIndicator color={colors.ink} style={{ marginTop: 8 }} /> : null}
      {open && options.length > 0 ? (
        <ScrollView
          nestedScrollEnabled
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 10,
            backgroundColor: colors.card,
            maxHeight: 200,
          }}
        >
          {options.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              onPress={() => {
                onPick(name);
                setOpen(false);
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
            >
              <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

export function LocationCascade({
  pincode,
  district,
  state,
  editable,
  onSelect,
}: {
  pincode: string;
  district: string;
  state: string;
  editable: boolean;
  onSelect: (item: GeoPincodeItem) => void;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [tehsils, setTehsils] = useState<string[]>([]);
  const [tehsil, setTehsil] = useState("");
  const [villageQuery, setVillageQuery] = useState("");
  const [offices, setOffices] = useState<GeoOfficeItem[]>([]);
  const [pins, setPins] = useState<GeoPincodeItem[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTehsils, setLoadingTehsils] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);

  useEffect(() => {
    if (!editable) return;
    setLoadingStates(true);
    void (async () => {
      try {
        if (isMockAuthEnabled) {
          setStates(DEMO_STATES);
        } else {
          const res = await listGeoStates();
          setStates(res.items.map((item) => item.name));
        }
      } catch {
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    })();
  }, [editable]);

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
        } else {
          const res = await listGeoDistricts(state);
          setDistricts(res.items.map((item) => item.name));
        }
      } catch {
        setDistricts([]);
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
        } else {
          const tehsilRes = await listGeoTehsils(state, district);
          setTehsils(tehsilRes.items.map((item) => item.name));
        }
      } catch {
        setTehsils([]);
      } finally {
        setLoadingTehsils(false);
      }
    })();
  }, [editable, state, district]);

  useEffect(() => {
    if (!editable || !state || !district || !tehsil) {
      setPins([]);
      return;
    }
    setLoadingPins(true);
    void (async () => {
      try {
        if (isMockAuthEnabled) {
          setPins(
            DEMO_PINS.filter(
              (row) => row.state === state && row.district === district && row.tehsil === tehsil,
            ),
          );
        } else {
          const pinRes = await listGeoPincodes(state, district, 80, tehsil);
          setPins(pinRes.items);
        }
      } catch {
        setPins([]);
      } finally {
        setLoadingPins(false);
      }
    })();
  }, [editable, state, district, tehsil]);

  useEffect(() => {
    if (!editable || !state || !district || !tehsil) {
      setOffices([]);
      return;
    }
    const needle = villageQuery.trim();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (isMockAuthEnabled) {
            setOffices([]);
            return;
          }
          const officeRes = await listGeoOffices(
            state,
            district,
            tehsil || undefined,
            80,
            needle.length >= 2 ? needle : undefined,
          );
          setOffices(officeRes.items);
        } catch {
          setOffices([]);
        }
      })();
    }, 280);
    return () => clearTimeout(timer);
  }, [editable, state, district, tehsil, villageQuery]);

  const pickState = (name: string) => {
    if (name === state) return;
    setTehsil("");
    setVillageQuery("");
    onSelect({ pincode: "", state: name, district: "", tehsil: null, label: name });
  };

  const pickDistrict = (name: string) => {
    setTehsil("");
    setVillageQuery("");
    onSelect({ pincode: "", state, district: name, tehsil: null, label: `${name}, ${state}` });
  };

  return (
    <View style={{ width: "100%", gap: 10 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Dropdown
          disabled={!editable}
          label={t("State")}
          loading={loadingStates}
          onPick={pickState}
          options={states}
          placeholder={t("Select state")}
          value={state}
        />
        <Dropdown
          disabled={!editable || !state}
          label={t("District")}
          loading={loadingDistricts}
          onPick={pickDistrict}
          options={districts}
          placeholder={t("Select district")}
          value={district}
        />
        <Dropdown
          disabled={!editable || !district}
          label={t("Tehsil / city")}
          loading={loadingTehsils}
          onPick={(name) => {
            setTehsil(name);
            onSelect({ pincode: "", state, district, tehsil: name, label: `${name}, ${district}` });
          }}
          options={tehsils}
          placeholder={t("Select tehsil")}
          value={tehsil}
        />
        <Dropdown
          disabled={!editable || !tehsil}
          label={t("Pincode")}
          loading={loadingPins}
          onPick={(code) => {
            const item = pins.find((row) => row.pincode === code);
            if (item) onSelect(item);
          }}
          options={pins.map((row) => row.pincode)}
          placeholder={t("Select pincode")}
          value={pincode}
        />
      </View>
      {tehsil ? (
        <View>
          <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
            {t("Village / post office")}
          </Text>
          <TextInput
            editable={editable}
            onChangeText={setVillageQuery}
            placeholder={t("Type village or post office")}
            placeholderTextColor={colors.muted}
            style={{
              marginTop: 6,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.cardSoft,
              color: colors.ink,
              fontFamily: "Poppins_500Medium",
              fontSize: 14,
            }}
            value={villageQuery}
          />
          {offices.length > 0 ? (
            <Dropdown
              disabled={!editable}
              label=""
              onPick={(name) => {
                const office = offices.find((row) => row.name === name);
                if (!office) return;
                setVillageQuery(office.name);
                if (office.taluk) setTehsil(office.taluk);
                onSelect({
                  pincode: office.pincode,
                  state,
                  district,
                  tehsil: office.taluk ?? tehsil,
                  label: office.label,
                });
              }}
              options={offices.map((row) => row.name)}
              placeholder={t("Select village")}
              value={offices.find((row) => row.pincode === pincode)?.name ?? ""}
            />
          ) : null}
        </View>
      ) : null}
      <PincodeField
        district={district}
        editable={editable}
        onSelect={(item) => {
          if (item.tehsil) setTehsil(item.tehsil);
          onSelect(item);
        }}
        state={state}
        value={pincode}
      />
    </View>
  );
}
