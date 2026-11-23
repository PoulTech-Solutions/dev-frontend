import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FormModal } from "../../../components/ui/FormModal";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { pageToneColor } from "../../../components/ui/SectionTitle";
import { ModuleOption } from "../../../components/ui/ModuleOption";
import { PictureSymbol } from "../../../components/ui/PictureSymbol";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { addShedToFarm, createShedRecord, loadFarms, saveFarm, type SavedFarm } from "../../../services/localRecords";
import { useAuthStore } from "../../../store/useAuthStore";
import { useLanguage } from "../../../utils/i18n";

export default function FarmRecordsScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("green", isDark, colors.page);
  const { t, n } = useLanguage();
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const isCustomer = role === "customer";
  const [farms, setFarms] = useState<SavedFarm[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [farmOpen, setFarmOpen] = useState(false);
  const [shedOpen, setShedOpen] = useState(false);
  const [farmName, setFarmName] = useState("");
  const [place, setPlace] = useState("");
  const [shedName, setShedName] = useState("");
  const [birds, setBirds] = useState("");
  const [age, setAge] = useState("");
  const [eggs, setEggs] = useState("");
  const [note, setNote] = useState("");
  const columns = width >= 900 ? 3 : width >= 560 ? 2 : 1;
  const fieldStyle = {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.ink,
    fontFamily: "Poppins_500Medium",
    backgroundColor: colors.cardSoft,
  } as const;
  const selected = farms.find((farm) => farm.id === selectedId) ?? farms[0];

  useEffect(() => {
    if (!userId || isCustomer) return;
    void loadFarms(userId).then((next) => {
      setFarms(next);
      setSelectedId((current) => current ?? next[0]?.id ?? null);
    });
  }, [userId, isCustomer]);

  const createFarm = async () => {
    if (!userId || !farmName.trim()) return;
    const farm: SavedFarm = {
      id: `farm-${Date.now()}`,
      userId,
      name: farmName.trim(),
      place: place.trim(),
      source: "user",
      sheds: [],
    };
    await saveFarm(farm);
    setFarms((current) => [...current, farm]);
    setSelectedId(farm.id);
    setFarmName("");
    setPlace("");
    setFarmOpen(false);
  };

  const createShed = async () => {
    if (!userId || !selected || !shedName.trim() || !birds.trim()) {
      setNote("Enter the shed name and number of birds.");
      return;
    }
    const shed = createShedRecord({
      name: shedName,
      birds,
      age,
      eggs,
    });
    const next = await addShedToFarm(selected, shed);
    setFarms((current) => current.map((farm) => (farm.id === next.id ? next : farm)));
    setSelectedId(next.id);
    setShedName("");
    setBirds("");
    setAge("");
    setEggs("");
    setNote("");
    setShedOpen(false);
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
        <View style={{ width: "100%", maxWidth: 1080, alignSelf: "center" }}>
          <ModuleHeader
            title={isCustomer ? "Farm" : "My Farm"}
            subtitle={isCustomer ? "Farm management tools are available to Poultry Owner accounts." : "Each farm can hold more than one shed."}
            tone="green"
          />

          {isCustomer ? (
            <EmptyState
              description="You can explore products and book services from the other sections."
              icon="information-circle-outline"
              title="This section is for farm owners"
              tone="green"
            />
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ flex: 1, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t("Farms")}</Text>
                <Pressable accessibilityLabel={t("Add a farm")} onPress={() => setFarmOpen(true)} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#15803D" }}>
                  <Ionicons color="#FFFFFF" name="add" size={26} />
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                {farms.map((farm) => {
                  const active = farm.id === selected?.id;
                  return (
                    <View key={farm.id} style={{ width: columns === 1 ? "100%" : "50%", padding: 6 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => setSelectedId(farm.id)}
                        style={{ minHeight: 92, flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: active ? "#15803D" : colors.line, borderRadius: 18, backgroundColor: colors.card, padding: 12 }}
                      >
                        <PictureSymbol name="barn" size={56} />
                        <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                          <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(farm.name)}</Text>
                          <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>{t(farm.place)} · {n(farm.sheds.length)} {t("Sheds")}</Text>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {selected ? (
                <View style={{ marginTop: 18 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ flex: 1, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t(selected.name)}</Text>
                    <Pressable accessibilityLabel={t("Add shed")} onPress={() => setShedOpen(true)} style={{ minHeight: 40, flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: isDark ? colors.headerBg : "#0B2A5B", paddingHorizontal: 12 }}>
                      <Ionicons color="#FFFFFF" name="add" size={18} />
                      <Text style={{ marginLeft: 4, color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{t("Add shed")}</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                    {selected.sheds.map((shed) => (
                      <View key={shed.id} style={{ width: columns === 3 ? "33.333%" : columns === 2 ? "50%" : "100%", padding: 6 }}>
                        <Pressable
                          onPress={() =>
                            router.push(
                              `/(tabs)/(farm)/shed-book?farmId=${encodeURIComponent(selected.id)}&shedId=${encodeURIComponent(shed.id)}` as Href,
                            )
                          }
                          style={{ borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 14 }}
                        >
                          <PictureSymbol name="chicken" size={64} />
                          <Text style={{ marginTop: 10, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(shed.name)}</Text>
                          <Text style={{ marginTop: 4, color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{n(shed.birds)} {t("Live birds")}</Text>
                          <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                            {t("Open record book")} · {n(shed.flockBook?.dailyRecords?.length ?? 0)} {t("days")}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={{ marginTop: 18 }}>
                <ModuleOption background="#EFF6FF" color="#1D4ED8" icon="receipt-outline" onPress={() => router.push("/(tabs)/(farm)/billing")} subtitle={t("Create and share customer invoices")} title={t("Billing Software")} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <FormModal onClose={() => setFarmOpen(false)} title="Add a farm" visible={farmOpen}>
        <View style={{ gap: 10 }}>
          <TextInput onChangeText={setFarmName} placeholder={t("Farm name")} placeholderTextColor="#94A3B8" style={fieldStyle} value={farmName} />
          <TextInput onChangeText={setPlace} placeholder={t("Place")} placeholderTextColor="#94A3B8" style={fieldStyle} value={place} />
          <Pressable onPress={() => void createFarm()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#15803D" }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>{t("Save farm")}</Text>
          </Pressable>
        </View>
      </FormModal>

      <FormModal onClose={() => setShedOpen(false)} title="Add shed" visible={shedOpen}>
        <View style={{ gap: 10 }}>
          <TextInput onChangeText={setShedName} placeholder={t("Shed name")} placeholderTextColor="#94A3B8" style={fieldStyle} value={shedName} />
          <TextInput keyboardType="number-pad" onChangeText={setBirds} placeholder={t("Number of birds")} placeholderTextColor="#94A3B8" style={fieldStyle} value={birds} />
          <TextInput onChangeText={setAge} placeholder={t("Age")} placeholderTextColor="#94A3B8" style={fieldStyle} value={age} />
          <TextInput onChangeText={setEggs} placeholder={t("Egg count")} placeholderTextColor="#94A3B8" style={fieldStyle} value={eggs} />
          {note ? <Text style={{ color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(note)}</Text> : null}
          <Pressable onPress={() => void createShed()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#15803D" }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>{t("Save shed")}</Text>
          </Pressable>
        </View>
      </FormModal>

    </SafeAreaView>
  );
}
