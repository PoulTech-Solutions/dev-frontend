import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { LocationCascade } from "../profile/LocationCascade";
import { useAppTheme } from "../../hooks/useAppTheme";
import { isMockAuthEnabled } from "../../hooks/useAuth";
import { patchMyProfile } from "../../services/authService";
import { fetchPincode, type GeoPincodeItem } from "../../services/geoService";
import { useAuthStore } from "../../store/useAuthStore";
import { resolveAreaFromBrowserLocation } from "../../utils/geolocatePincode.web";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { useLanguage } from "../../utils/i18n";

export function MarketLocationPrompt({
  compact = false,
  startCollapsed = false,
}: {
  compact?: boolean;
  /** Profile settings: show summary + Update location until opened */
  startCollapsed?: boolean;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(!startCollapsed);
  const [pin, setPin] = useState(user?.pincode ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [stateName, setStateName] = useState(user?.state ?? "");
  const [tehsil, setTehsil] = useState(user?.tehsil ?? "");

  useEffect(() => {
    setPin(user?.pincode ?? "");
    setDistrict(user?.district ?? "");
    setStateName(user?.state ?? "");
    setTehsil(user?.tehsil ?? "");
  }, [user?.pincode, user?.district, user?.state, user?.tehsil]);

  const saveGeo = async (geo: GeoPincodeItem) => {
    const updated = await patchMyProfile({
      pincode: geo.pincode,
      state: geo.state,
      district: geo.district,
      tehsil: geo.tehsil ?? undefined,
      village_city: geo.tehsil || geo.district,
    });
    await setUser({ ...updated, photoUri: user?.photoUri, role: user?.role ?? updated.role });
    await queryClient.invalidateQueries({ queryKey: ["market"] });
    setPin(geo.pincode);
    setDistrict(geo.district);
    setStateName(geo.state);
    setTehsil(geo.tehsil ?? "");
    setNote(t("Location saved. Loading rates for your area…"));
    if (startCollapsed) setEditing(false);
  };

  const useMyLocation = async () => {
    if (isMockAuthEnabled || user?.id?.startsWith("mock-")) {
      setNote(t("Sign in with the real API and disable mock auth to use location."));
      return;
    }
    if (Platform.OS !== "web") {
      setNote(t("Enter a 6-digit pincode below."));
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const area = await resolveAreaFromBrowserLocation();
      if (!area?.pincode) {
        setNote(t("Could not detect a valid India pincode. Type it below."));
        return;
      }
      try {
        await saveGeo(await fetchPincode(area.pincode));
      } catch {
        await saveGeo({
          pincode: area.pincode,
          state: area.state || "Maharashtra",
          district: area.district || area.village_city || "Pune",
          tehsil: area.village_city ?? null,
          label: `${area.pincode} · ${area.district ?? ""}`,
        });
      }
    } catch {
      setNote(t("Location lookup failed. Type your 6-digit pincode below."));
    } finally {
      setBusy(false);
    }
  };

  const onSelectPincode = (item: GeoPincodeItem) => {
    setDistrict(item.district);
    setStateName(item.state);
    if (item.tehsil) setTehsil(item.tehsil);
    if (!/^[1-9][0-9]{5}$/.test(item.pincode)) {
      setPin("");
      return;
    }
    setBusy(true);
    setNote("");
    void saveGeo(item)
      .catch((error) => {
        setNote(getApiErrorMessage(error) ?? t("Could not save pincode. Pick a pincode from the list."));
      })
      .finally(() => setBusy(false));
  };

  const summary = [pin, tehsil, district, stateName].filter((part) => part?.trim()).join(" · ");

  return (
    <View
      style={{
        marginBottom: compact ? 0 : 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FCD34D",
        backgroundColor: "#FFFBEB",
        paddingHorizontal: 12,
        paddingVertical: compact ? 10 : 12,
        gap: 10,
      }}
    >
      <Text style={{ color: "#92400E", fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 }}>
        {t("Rates follow your profile pincode. Nearest NECC hub is chosen when your city is not on the sheet.")}
        {!pin.trim() ? ` ${t("Showing")} Pune.` : ""}
      </Text>

      {!editing ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: "#78350F", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
            {summary || t("No location saved yet")}
          </Text>
          <Pressable
            accessibilityLabel={t("Update location")}
            accessibilityRole="button"
            onPress={() => {
              setEditing(true);
              setNote("");
            }}
            style={{
              alignSelf: "flex-start",
              minHeight: 40,
              borderRadius: 10,
              backgroundColor: colors.accent,
              paddingHorizontal: 14,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 12, textTransform: "uppercase" }}>
              {t("Update location")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            {Platform.OS === "web" ? (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void useMyLocation()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  opacity: busy ? 0.7 : 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons color="#fff" name="locate-outline" size={16} />}
                <Text style={{ color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 }}>{t("Use my location")}</Text>
              </Pressable>
            ) : null}
            {startCollapsed ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(false)}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#F59E0B",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: "#92400E", fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{t("Cancel")}</Text>
              </Pressable>
            ) : null}
          </View>
          <LocationCascade
            district={district}
            editable={!busy}
            onSelect={onSelectPincode}
            pincode={pin}
            state={stateName}
            tehsil={tehsil}
          />
        </>
      )}

      {note ? (
        <Text style={{ color: "#78350F", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>{note}</Text>
      ) : null}
    </View>
  );
}
