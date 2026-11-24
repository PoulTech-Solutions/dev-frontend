import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutRectangle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlanPicker } from "../../components/subscription/PlanPicker";
import { Button } from "../../components/ui/Button";
import { MainCard } from "../../components/ui/MainCard";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { pageToneColor, SectionTitle, type CardTone } from "../../components/ui/SectionTitle";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { getAuthErrorMessage, isMockAuthEnabled } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { BACKEND_PASSWORD_HINT, BACKEND_PASSWORD_REGEX } from "../../utils/authValidation";
import { isInternalAccount } from "../../utils/permissions";
import { MarketLocationPrompt } from "../../components/market/MarketLocationPrompt";
import { AccountSecurityPanel } from "../../components/profile/AccountSecurityPanel";
import { pickImage } from "../../services/pickImage";
import { useAuthStore } from "../../store/useAuthStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useThemeStore, type AppAppearance } from "../../store/useThemeStore";
import { planById } from "../../utils/subscriptionPlans";
import { LANGUAGE_NAMES, useLanguage } from "../../utils/i18n";

function SettingsCard({
  children,
  tone = "green",
  style,
}: {
  children: ReactNode;
  tone?: CardTone;
  style?: object;
}) {
  return (
    <MainCard tone={tone} style={[{ marginBottom: 14 }, style]}>
      {children}
    </MainCard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, minWidth: "45%", paddingVertical: 6 }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ marginTop: 3, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
        {value || "—"}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
  secureTextEntry?: boolean;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, minWidth: "45%", paddingVertical: 6 }}>
      <Text style={{ marginBottom: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" || secureTextEntry ? "none" : "words"}
        autoComplete={keyboardType === "email-address" ? "email" : "off"}
        autoCorrect={keyboardType !== "email-address"}
        editable={editable}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        onChangeText={onChangeText}
        placeholder={`${t("Enter")} ${label}`}
        placeholderTextColor={colors.muted}
        style={{
          minHeight: 42,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          backgroundColor: editable ? colors.cardSoft : colors.page,
          paddingHorizontal: 10,
          color: colors.ink,
          fontFamily: "Poppins_400Regular",
          fontSize: 13,
          opacity: editable ? 1 : 0.9,
        }}
        value={value}
      />
    </View>
  );
}

function SimpleDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  hint?: string;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<LayoutRectangle | null>(null);
  const selected = options.find((item) => item.value === value);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuBox({ x, y, width, height });
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setMenuBox(null);
  };

  return (
    <View style={{ marginTop: 2, zIndex: open ? 40 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ flexShrink: 1, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 12, paddingRight: 8 }}>
          {label}
        </Text>
        <View ref={triggerRef} collapsable={false} style={{ width: 148, flexShrink: 0 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            className="cursor-pointer hover:bg-slate-50"
            onPress={() => {
              if (open) closeMenu();
              else openMenu();
            }}
            style={{
              minHeight: 36,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 8,
              backgroundColor: colors.card,
              paddingHorizontal: 12,
            }}
          >
            <Text numberOfLines={1} style={{ flex: 1, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
              {selected?.label ?? "—"}
            </Text>
            <Ionicons color={colors.muted} name={open ? "chevron-up" : "chevron-down"} size={14} style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
      </View>
      {hint ? (
        <Text
          style={{
            marginTop: 10,
            color: colors.muted,
            fontFamily: "Poppins_400Regular",
            fontSize: 11,
            lineHeight: 16,
            paddingRight: 4,
          }}
        >
          {hint}
        </Text>
      ) : null}

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
                width: Math.max(menuBox.width, 148),
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 8,
                backgroundColor: colors.card,
                overflow: "hidden",
                elevation: 8,
                shadowColor: "#0F172A",
                shadowOpacity: 0.16,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              {options.map((item, index) => {
                const active = item.value === value;
                return (
                  <Pressable
                    key={item.value}
                    accessibilityRole="button"
                    className="cursor-pointer hover:bg-green-50"
                    onPress={() => {
                      onChange(item.value);
                      closeMenu();
                    }}
                    style={{
                      minHeight: 36,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      backgroundColor: active ? colors.promoBg : "transparent",
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.line,
                    }}
                  >
                    <Text style={{ flex: 1, color: active ? colors.accent : colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                      {item.label}
                    </Text>
                    {active ? <Ionicons color={colors.accent} name="checkmark" size={14} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { t, language, setLanguage, n } = useLanguage();
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("navy", isDark, colors.page);
  const user = useAuthStore((state) => state.user);
  const completeProfile = useAuthStore((state) => state.completeProfile);
  const setUser = useAuthStore((state) => state.setUser);
  const signOut = useAuthStore((state) => state.signOut);
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
  const [district, setDistrict] = useState(user?.district ?? "");
  const [tehsil, setTehsil] = useState(user?.tehsil ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordOk, setPasswordOk] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const profileLocked = isInternalAccount(user?.backendRole);
  const contentWidth = Math.min(Math.max(0, width - 36), 920);
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
    setDistrict(user?.district ?? "");
    setTehsil(user?.tehsil ?? "");
    setPincode(user?.pincode ?? "");
  }, [user]);

  const savePassword = async () => {
    setPasswordMessage("");
    setPasswordOk(false);
    if (!BACKEND_PASSWORD_REGEX.test(newPassword)) {
      setPasswordMessage(BACKEND_PASSWORD_HINT);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const { changePassword } = await import("../../services/authService");
      const result = await changePassword({
        current_password: currentPassword,
        password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordOk(true);
      setPasswordMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(getApiErrorMessage(error) ?? getAuthErrorMessage(error) ?? "Could not change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const saveProfile = async () => {
    setMessage("");
    if (profileLocked) {
      setMessage("Staff and admin accounts can change password only, not profile.");
      return;
    }
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
      const useBackend = !isMockAuthEnabled && !user.id.startsWith("mock-");
      if (useBackend) {
        const { splitPersonName } = await import("../../utils/personName");
        const { first_name, last_name } = splitPersonName(name);
        const { patchMyProfile } = await import("../../services/authService");
        const updated = await patchMyProfile({
          first_name,
          last_name,
          phone: phone.trim() || undefined,
          village_city: city.trim() || undefined,
          state: state.trim() || undefined,
          district: district.trim() || undefined,
          tehsil: tehsil.trim() || undefined,
          pincode: pincode.trim() || undefined,
          region: user.role === "poultry_owner" ? farmName.trim() || undefined : undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ["market"] });
        await setUser({
          ...updated,
          photoUri: user.photoUri,
          role: user.role ?? updated.role,
          email: updated.email ?? (email.trim() || undefined),
        });
      } else {
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
      }
      setMessage("");
      setEditingProfile(false);
    } catch (error) {
      console.error("Could not save profile changes.", error);
      setMessage(getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const changePhoto = async () => {
    if (!editingProfile) return;
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
    if (!editingProfile || !user) return;
    setPhotoNote("");
    try {
      await setUser({ ...user, photoUri: undefined });
    } catch (error) {
      console.error("Could not remove profile photo.", error);
      setPhotoNote("Could not remove profile photo.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Could not sign out.", error);
    } finally {
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader
            title="My settings"
            subtitle="Manage your profile, appearance, language, and plan."
            tone="navy"
            leading={
              <Pressable
                accessibilityLabel={t("Back to dashboard")}
                accessibilityRole="button"
                className="cursor-pointer"
                onPress={() => router.replace("/(tabs)/dashboard")}
                style={{ minHeight: 36, marginBottom: 6, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }}
              >
                <Ionicons color={colors.accent} name="arrow-back" size={18} />
                <Text style={{ marginLeft: 7, color: colors.accent, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                  {t("Dashboard")}
                </Text>
              </Pressable>
            }
            trailing={
              <Pressable
                accessibilityLabel={t("Log out")}
                accessibilityRole="button"
                className="cursor-pointer hover:bg-red-50"
                onPress={() => void handleLogout()}
                style={{
                  minHeight: 40,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FECACA",
                  backgroundColor: "#FEF2F2",
                  paddingHorizontal: 14,
                }}
              >
                <Ionicons color="#B91C1C" name="log-out-outline" size={18} />
                <Text style={{ color: "#B91C1C", fontFamily: "Poppins_700Bold", fontSize: 13 }}>{t("Log out")}</Text>
              </Pressable>
            }
          />

          <SettingsCard tone="green">
            <SectionTitle
              size="sm"
              title="Profile"
              tone="green"
              trailing={
                profileLocked ? undefined : !editingProfile ? (
                  <Pressable
                    accessibilityLabel={t("Update profile")}
                    className="cursor-pointer hover:bg-green-50"
                    onPress={() => setEditingProfile(true)}
                    style={{
                      minHeight: 36,
                      justifyContent: "center",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      backgroundColor: colors.promoBg,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: 12, textTransform: "uppercase" }}>
                      {t("Update profile")}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={t("Cancel")}
                    className="cursor-pointer"
                    onPress={() => {
                      setEditingProfile(false);
                      setName(user?.name ?? "");
                      setEmail(user?.email ?? "");
                      setPhone(user?.phone ?? "");
                      setFarmName(user?.farmName ?? "");
                      setCity(user?.city ?? "");
                      setState(user?.state ?? "");
                      setMessage("");
                    }}
                    style={{
                      minHeight: 36,
                      justifyContent: "center",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.line,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Cancel")}</Text>
                  </Pressable>
                )
              }
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  overflow: "hidden",
                  backgroundColor: colors.promoBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {user?.photoUri ? (
                  <Image contentFit="cover" source={{ uri: user.photoUri }} style={{ width: 56, height: 56 }} />
                ) : (
                  <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: 20 }}>
                    {(name || "?").trim().slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 15 }}>{name || t("Your profile")}</Text>
                <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                  {email || t("No email")}
                </Text>
              </View>
              {editingProfile ? (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Pressable
                    className="cursor-pointer"
                    onPress={() => void changePhoto()}
                    style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}
                  >
                    <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>
                      {t(user?.photoUri ? "Change" : "Add")}
                    </Text>
                  </Pressable>
                  {user?.photoUri ? (
                    <Pressable
                      className="cursor-pointer"
                      onPress={() => void removePhoto()}
                      style={{ borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, backgroundColor: "#FEF2F2", paddingHorizontal: 10, paddingVertical: 7 }}
                    >
                      <Text style={{ color: "#B91C1C", fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{t("Remove")}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
            {photoNote ? (
              <Text style={{ marginBottom: 8, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(photoNote)}</Text>
            ) : null}

            {profileLocked ? (
              <Text style={{ marginBottom: 8, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                {t("Staff and admin can change password only. Profile details stay as registered.")}
              </Text>
            ) : null}

            {editingProfile && !profileLocked ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Field label={t("Full name")} onChangeText={setName} value={name} />
                <Field editable={false} keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} value={email} />
                <Field keyboardType="phone-pad" label={t("Phone number")} onChangeText={setPhone} value={phone} />
                {user?.role === "poultry_owner" ? <Field label={t("Farm name")} onChangeText={setFarmName} value={farmName} /> : null}
                <Field label={t("City")} onChangeText={setCity} value={city} />
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <DetailRow label={t("Full name")} value={name} />
                <DetailRow label={t("Email address")} value={email} />
                <DetailRow label={t("Phone number")} value={phone} />
                {user?.role === "poultry_owner" ? <DetailRow label={t("Farm name")} value={farmName} /> : null}
                <DetailRow label={t("City")} value={city} />
              </View>
            )}

            {message ? (
              <Text style={{ marginTop: 8, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(message)}</Text>
            ) : null}
            {editingProfile && !profileLocked ? (
              <View style={{ marginTop: 12, alignSelf: "flex-start", minWidth: 180 }}>
                <Button accessibilityLabel="Save profile changes" label={t("Save changes")} loading={isSaving} onPress={() => void saveProfile()} />
              </View>
            ) : null}
          </SettingsCard>

          {!profileLocked ? (
            <SettingsCard tone="amber">
              <SectionTitle size="sm" title="Farm location" tone="amber" />
              <MarketLocationPrompt compact startCollapsed />
            </SettingsCard>
          ) : null}

          <SettingsCard tone="navy">
            <SectionTitle size="sm" title="Password" tone="navy" />
            <Text style={{ marginBottom: 8, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
              {t("Change your password. Other devices will be signed out.")}
            </Text>
            <View style={{ gap: 8 }}>
              <Field label={t("Current password")} onChangeText={setCurrentPassword} secureTextEntry value={currentPassword} />
              <Field label={t("New password")} onChangeText={setNewPassword} secureTextEntry value={newPassword} />
              <Field label={t("Confirm new password")} onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
            </View>
            {passwordMessage ? (
              <Text
                style={{
                  marginTop: 8,
                  color: passwordOk ? "#15803D" : "#B91C1C",
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                }}
              >
                {t(passwordMessage)}
              </Text>
            ) : null}
            <View style={{ marginTop: 12, alignSelf: "flex-start", minWidth: 180 }}>
              <Button
                accessibilityLabel="Change password"
                label={t("Change password")}
                loading={isChangingPassword}
                onPress={() => void savePassword()}
              />
            </View>
          </SettingsCard>

          {!isMockAuthEnabled && user && !user.id.startsWith("mock-") ? (
            <SettingsCard tone="navy">
              <SectionTitle size="sm" title="Account security" tone="navy" />
              <AccountSecurityPanel />
            </SettingsCard>
          ) : null}

          <View
            style={{
              flexDirection: contentWidth >= 700 ? "row" : "column",
              alignItems: "stretch",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <SettingsCard tone="blue" style={{ flex: 1, marginBottom: 0, minWidth: contentWidth >= 700 ? 0 : "100%" }}>
              <SectionTitle size="sm" title="Language" tone="blue" />
              <SimpleDropdown
                hint={t("Changes labels across the app. Numbers follow your selected language.")}
                label={t("App language")}
                onChange={(next) => {
                  void (async () => {
                    try {
                      await setLanguage(next);
                      if (!isMockAuthEnabled && user && !user.id.startsWith("mock-")) {
                        const { patchMyProfile } = await import("../../services/authService");
                        await patchMyProfile({ preferred_language: next });
                      }
                    } catch (error) {
                      console.error("Could not save the selected language.", error);
                      Alert.alert(t("Unable to change language"), t("Please try again."));
                    }
                  })();
                }}
                options={(
                  [
                    ["en", LANGUAGE_NAMES.en],
                    ["hi", LANGUAGE_NAMES.hi],
                    ["mr", LANGUAGE_NAMES.mr],
                  ] as const
                ).map(([value, label]) => ({ value, label }))}
                value={language}
              />
            </SettingsCard>

            <SettingsCard tone="navy" style={{ flex: 1, marginBottom: 0, minWidth: contentWidth >= 700 ? 0 : "100%" }}>
              <SectionTitle size="sm" title="Appearance" tone="navy" />
              <SimpleDropdown
                hint={t("Bright or dark look for the whole app. Changes apply immediately across all screens.")}
                label={t("Theme")}
                onChange={(next) => {
                  void setAppearance(next as AppAppearance);
                }}
                options={[
                  { value: "light", label: t("Light") },
                  { value: "dark", label: t("Dark") },
                ]}
                value={appearance}
              />
            </SettingsCard>
          </View>

          <SettingsCard tone="amber">
            <SectionTitle
              size="sm"
              title="Subscription"
              tone="amber"
              trailing={
                !showPlanPicker ? (
                  <Pressable
                    accessibilityLabel={t("Update")}
                    className="cursor-pointer hover:bg-green-50"
                    onPress={() => setShowPlanPicker(true)}
                    style={{
                      minHeight: 36,
                      justifyContent: "center",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: plan.color,
                      backgroundColor: plan.background,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ color: plan.color, fontFamily: "Poppins_700Bold", fontSize: 12, textTransform: "uppercase" }}>
                      {t("Update")}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    className="cursor-pointer"
                    onPress={() => setShowPlanPicker(false)}
                    style={{ minHeight: 36, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 }}
                  >
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Close")}</Text>
                  </Pressable>
                )
              }
            />

            {!showPlanPicker ? (
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(plan.name)}</Text>
                    <Text style={{ marginTop: 3, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>{t(plan.summary)}</Text>
                  </View>
                  <View style={{ borderRadius: 10, backgroundColor: plan.background, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: plan.color, fontFamily: "Poppins_700Bold", fontSize: 12 }}>{t(plan.name)}</Text>
                  </View>
                </View>
                <Text style={{ marginTop: 10, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                  ₹{n(plan.price)} {t(plan.period)} · {t("Renews on")} {renewLabel}
                </Text>
                <View style={{ marginTop: 10, gap: 5 }}>
                  {plan.features.slice(0, 4).map((feature) => (
                    <View key={feature} style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons color={plan.color} name="checkmark-circle" size={15} />
                      <Text style={{ marginLeft: 7, color: colors.ink, fontFamily: "Poppins_500Medium", fontSize: 12 }}>{t(feature)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 6 }}>
                <Text style={{ marginBottom: 10, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                  {t("Choose the plan that fits your farm.")}
                </Text>
                <PlanPicker
                  onSelect={(next) => {
                    if (!user?.id) return;
                    void choosePlan(user.id, next).then(() => setShowPlanPicker(false));
                  }}
                  selected={planId}
                />
              </View>
            )}
          </SettingsCard>

          <SettingsCard tone="teal">
            <SectionTitle size="sm" title="Company" tone="teal" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 }}>
              {(
                [
                  ["Privacy policy", "/company/privacy", "shield-checkmark-outline"],
                  ["Contact us", "/company/contact", "mail-outline"],
                  ["Office address", "/company/office", "location-outline"],
                ] as const
              ).map(([title, href, icon]) => (
                <View key={href} style={{ width: "33.333%", padding: 5 }}>
                  <Pressable
                    accessibilityLabel={t(title)}
                    accessibilityRole="button"
                    className="cursor-pointer hover:bg-slate-50"
                    onPress={() => router.push(href as Href)}
                    style={{
                      minHeight: 96,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.line,
                      backgroundColor: colors.cardSoft,
                      padding: 12,
                    }}
                  >
                    <Ionicons color={colors.accent} name={icon} size={20} />
                    <Text
                      style={{
                        marginTop: 10,
                        color: colors.ink,
                        fontFamily: "Poppins_700Bold",
                        fontSize: 11,
                        textTransform: "uppercase",
                        lineHeight: 15,
                      }}
                    >
                      {t(title)}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </SettingsCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
