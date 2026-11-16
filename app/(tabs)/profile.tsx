import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlanPicker } from "../../components/subscription/PlanPicker";
import { Button } from "../../components/ui/Button";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { pickImage } from "../../services/pickImage";
import { useAuthStore } from "../../store/useAuthStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useThemeStore, type AppAppearance } from "../../store/useThemeStore";
import { planById } from "../../utils/subscriptionPlans";
import { LANGUAGE_NAMES, useLanguage, type AppLanguage } from "../../utils/i18n";

function SectionLabel({ title }: { title: string }) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return <Text style={{ marginTop: 22, marginBottom: 8, color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(title)}</Text>;
}

function SettingsCard({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.card }}>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
      <Text style={{ marginBottom: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 12 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        autoComplete={keyboardType === "email-address" ? "email" : "off"}
        autoCorrect={keyboardType !== "email-address"}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={`${t("Enter")} ${label}`}
        placeholderTextColor={colors.muted}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          backgroundColor: colors.cardSoft,
          paddingHorizontal: 12,
          color: colors.ink,
          fontFamily: "Poppins_400Regular",
          fontSize: 14,
        }}
        value={value}
      />
    </View>
  );
}

function Divider() {
  const { colors } = useAppTheme();
  return <View style={{ height: 1, backgroundColor: colors.line, marginHorizontal: 16 }} />;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { t, language, setLanguage, n } = useLanguage();
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const completeProfile = useAuthStore((state) => state.completeProfile);
  const setUser = useAuthStore((state) => state.setUser);
  const planId = useSubscriptionStore((state) => state.planId);
  const renewsAt = useSubscriptionStore((state) => state.renewsAt);
  const hydratePlan = useSubscriptionStore((state) => state.hydrate);
  const choosePlan = useSubscriptionStore((state) => state.choosePlan);
  const appearance = useThemeStore((state) => state.appearance);
  const setAppearance = useThemeStore((state) => state.setAppearance);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [farmName, setFarmName] = useState(user?.farmName ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [message, setMessage] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const contentWidth = Math.min(Math.max(0, width - 36), 1080);
  const plan = planById(planId);
  const renewLabel = renewsAt
    ? new Date(renewsAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : t("Not started");

  useEffect(() => {
    if (user?.id) void hydratePlan(user.id);
  }, [hydratePlan, user?.id]);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setFarmName(user?.farmName ?? "");
    setCity(user?.city ?? "");
    setState(user?.state ?? "");
  }, [user]);

  const saveProfile = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Full name is required.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (!user?.role) {
      setMessage("Choose your account role before updating the profile.");
      return;
    }
    setIsSaving(true);
    try {
      await completeProfile({
        name,
        email,
        phone,
        farmName: user.role === "poultry_owner" ? farmName : undefined,
        city,
        state,
        photoUri: user.photoUri,
        role: user.role,
      });
      setMessage("");
    } catch (error) {
      console.error("Could not save profile changes.", error);
      setMessage("Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const changePhoto = async () => {
    setPhotoNote("");
    try {
      const next = await pickImage();
      if (!next || !user) return;
      await setUser({ ...user, photoUri: next });
    } catch (error) {
      console.error("Could not update profile photo.", error);
      setPhotoNote(error instanceof Error ? error.message : "Could not update profile photo.");
    }
  };

  const removePhoto = async () => {
    if (!user) return;
    setPhotoNote("");
    try {
      await setUser({ ...user, photoUri: undefined });
    } catch (error) {
      console.error("Could not remove profile photo.", error);
      setPhotoNote("Could not remove profile photo.");
    }
  };

  const selectLanguage = async (next: AppLanguage) => {
    try {
      await setLanguage(next);
    } catch (error) {
      console.error("Could not save the selected language.", error);
      Alert.alert(t("Unable to change language"), t("Please try again."));
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <Pressable
            accessibilityLabel={t("Back to dashboard")}
            accessibilityRole="button"
            className="cursor-pointer"
            onPress={() => router.replace("/(tabs)/dashboard")}
            style={{ minHeight: 40, marginBottom: 14, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }}
          >
            <Ionicons color={colors.accent} name="arrow-back" size={18} />
            <Text style={{ marginLeft: 7, color: colors.accent, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Dashboard")}</Text>
          </Pressable>

          <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 28 }}>{t("My settings")}</Text>
          <Text style={{ marginTop: 4, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 21 }}>
            {t("Manage your profile, appearance, language, and plan.")}
          </Text>

          <SectionLabel title="Profile" />
          <SettingsCard>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, overflow: "hidden", backgroundColor: "#E7EFE5", alignItems: "center", justifyContent: "center" }}>
                {user?.photoUri ? (
                  <Image contentFit="cover" source={{ uri: user.photoUri }} style={{ width: 64, height: 64 }} />
                ) : (
                  <Text style={{ color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 22 }}>
                    {(name || "?").trim().slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 15 }}>{t("Photo")}</Text>
                <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                  {t("Add or change your profile photo")}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={user?.photoUri ? t("Change") : t("Add")}
                className="cursor-pointer"
                onPress={() => void changePhoto()}
                style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.cardSoft, paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t(user?.photoUri ? "Change" : "Add")}</Text>
              </Pressable>
              {user?.photoUri ? (
                <Pressable
                  accessibilityLabel={t("Remove photo")}
                  className="cursor-pointer"
                  onPress={() => void removePhoto()}
                  style={{ marginLeft: 8, borderWidth: 1, borderColor: "#FECACA", borderRadius: 10, backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: "#B91C1C", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Remove")}</Text>
                </Pressable>
              ) : null}
            </View>
            {photoNote ? (
              <Text style={{ paddingHorizontal: 16, paddingBottom: 8, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(photoNote)}</Text>
            ) : null}
            <Divider />
            <Field label={t("Full name")} onChangeText={setName} value={name} />
            <Field keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} value={email} />
            <Field keyboardType="phone-pad" label={t("Phone number")} onChangeText={setPhone} value={phone} />
            {user?.role === "poultry_owner" ? <Field label={t("Farm name")} onChangeText={setFarmName} value={farmName} /> : null}
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <Field label={t("City")} onChangeText={setCity} value={city} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t("State")} onChangeText={setState} value={state} />
              </View>
            </View>
            {message ? (
              <Text style={{ paddingHorizontal: 16, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(message)}</Text>
            ) : null}
            <View style={{ padding: 16 }}>
              <Button accessibilityLabel="Save profile changes" label={t("Save changes")} loading={isSaving} onPress={() => void saveProfile()} />
            </View>
          </SettingsCard>

          <SectionLabel title="Language" />
          <SettingsCard>
            <View style={{ padding: 14, gap: 8 }}>
              <Text style={{ marginBottom: 4, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>{t("App language")}</Text>
              {(["en", "hi", "mr"] as const).map((item) => {
                const selected = language === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className="cursor-pointer"
                    onPress={() => void selectLanguage(item)}
                    style={{
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.line,
                      backgroundColor: selected ? (appearance === "dark" ? "#052E16" : "#DCFCE7") : colors.cardSoft,
                      paddingHorizontal: 14,
                    }}
                  >
                    <Text style={{ flex: 1, color: selected ? colors.accent : colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                      {LANGUAGE_NAMES[item]}
                    </Text>
                    {selected ? <Ionicons color={colors.accent} name="checkmark-circle" size={18} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </SettingsCard>

          <SectionLabel title="Subscription" />
          <SettingsCard>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(plan.name)}</Text>
                  <Text style={{ marginTop: 4, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>{t(plan.summary)}</Text>
                </View>
                <View style={{ borderRadius: 10, backgroundColor: plan.background, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: plan.color, fontFamily: "Poppins_700Bold", fontSize: 12 }}>{t(plan.name)}</Text>
                </View>
              </View>
              <Text style={{ marginTop: 10, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                ₹{n(plan.price)} {t(plan.period)} · {t("Renews on")} {renewLabel}
              </Text>
              <View style={{ marginTop: 12, gap: 6 }}>
                {plan.features.map((feature) => (
                  <View key={feature} style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons color={plan.color} name="checkmark-circle" size={16} />
                    <Text style={{ marginLeft: 8, color: colors.ink, fontFamily: "Poppins_500Medium", fontSize: 13 }}>{t(feature)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 14 }}>
                <PlanPicker
                  onSelect={(next) => {
                    if (!user?.id) return;
                    void choosePlan(user.id, next);
                  }}
                  selected={planId}
                />
              </View>
            </View>
          </SettingsCard>

          <SectionLabel title="Appearance" />
          <SettingsCard>
            <View style={{ padding: 14 }}>
              <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t("Theme")}</Text>
              <Text style={{ marginTop: 2, marginBottom: 10, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                {t("Bright or dark look for the whole app")}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(
                  [
                    ["light", "Light"],
                    ["dark", "Dark"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = appearance === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className="cursor-pointer"
                      onPress={() => void setAppearance(value as AppAppearance)}
                      style={{
                        flex: 1,
                        minHeight: 48,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: selected ? colors.accent : colors.line,
                        backgroundColor: selected ? (appearance === "dark" ? "#052E16" : "#DCFCE7") : colors.cardSoft,
                      }}
                    >
                      <Text style={{ color: selected ? colors.accent : colors.ink, fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t(label)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </SettingsCard>

          <SectionLabel title="Company" />
          <SettingsCard>
            {(
              [
                ["Privacy policy", "/company/privacy", t("How we keep your farm data safe")],
                ["Contact us", "/company/contact", t("Email the Poultech team")],
                ["Office address", "/company/office", t("Pune, Maharashtra")],
              ] as const
            ).map(([title, href, subtitle], index, list) => (
              <Pressable
                key={href}
                accessibilityLabel={t(title)}
                accessibilityRole="button"
                className="cursor-pointer"
                onPress={() => router.push(href as Href)}
                style={{
                  minHeight: 64,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index === list.length - 1 ? 0 : 1,
                  borderBottomColor: colors.line,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t(title)}</Text>
                  <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>{subtitle}</Text>
                </View>
                <Ionicons color={colors.muted} name="chevron-forward" size={18} />
              </Pressable>
            ))}
          </SettingsCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
