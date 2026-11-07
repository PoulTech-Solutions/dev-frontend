import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { LanguagePicker } from "../../components/ui/LanguagePicker";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useLanguage } from "../../utils/i18n";

function ProfileField({
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
  return (
    <View>
      <Text style={{ marginBottom: 7, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        autoComplete={keyboardType === "email-address" ? "email" : "off"}
        autoCorrect={keyboardType !== "email-address"}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={`${t("Enter")} ${label}`}
        placeholderTextColor="#94A3B8"
        style={{
          minHeight: 50,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 14,
          backgroundColor: "#F8FAFC",
          paddingHorizontal: 14,
          color: "#0F172A",
          fontFamily: "Poppins_400Regular",
          fontSize: 13,
        }}
        value={value}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const completeProfile = useAuthStore((state) => state.completeProfile);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [farmName, setFarmName] = useState(user?.farmName ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const contentWidth = Math.min(width - 36, 720);

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
        role: user.role,
      });
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error("Could not save profile changes.", error);
      setMessage("Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel =
    user?.role === "admin"
      ? t("Admin")
      : user?.role === "customer"
        ? t("Customer")
        : user?.role === "poultry_owner"
          ? t("Poultry Owner")
          : t("Not selected");

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <View style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <LanguagePicker />
          </View>
          <Pressable
            accessibilityLabel={t("Back to dashboard")}
            accessibilityRole="button"
            className="mb-5 self-start cursor-pointer"
            onPress={() => router.replace("/(tabs)/dashboard")}
            style={{ minHeight: 40, flexDirection: "row", alignItems: "center", paddingRight: 12 }}
          >
            <Ionicons color="#14532D" name="arrow-back" size={18} />
            <Text style={{ marginLeft: 7, color: "#14532D", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
              {t("Dashboard")}
            </Text>
          </Pressable>

          <ModuleHeader
            title={t("Your profile")}
            subtitle={t("Review and update your account information.")}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              padding: 18,
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                backgroundColor: "#E7EFE5",
              }}
            >
              <Text style={{ color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 21 }}>
                {name.trim().slice(0, 1).toUpperCase() || "?"}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>
                {name.trim() || t("Your name")}
              </Text>
              <Text style={{ marginTop: 3, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                {roleLabel}
              </Text>
            </View>
            <Ionicons color="#16A34A" name="checkmark-circle-outline" size={22} />
          </View>

          <View
            style={{
              marginTop: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 22,
              backgroundColor: "#FFFFFF",
              padding: 20,
            }}
          >
            <Text style={{ marginBottom: 16, color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>
              {t("Personal details")}
            </Text>
            <View style={{ gap: 14 }}>
              <ProfileField label={t("Full name")} onChangeText={setName} value={name} />
              <ProfileField keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} value={email} />
              <ProfileField keyboardType="phone-pad" label={t("Phone number")} onChangeText={setPhone} value={phone} />
              {user?.role === "poultry_owner" ? (
                <ProfileField label={t("Farm name")} onChangeText={setFarmName} value={farmName} />
              ) : null}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <ProfileField label={t("City")} onChangeText={setCity} value={city} />
                </View>
                <View style={{ flex: 1 }}>
                  <ProfileField label={t("State")} onChangeText={setState} value={state} />
                </View>
              </View>
            </View>

            {message ? (
              <Text accessibilityLiveRegion="polite" style={{ marginTop: 12, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                {t(message)}
              </Text>
            ) : null}
            <View style={{ marginTop: 18 }}>
              <Button
                accessibilityLabel="Save profile changes"
                label={t("Save changes")}
                loading={isSaving}
                onPress={() => void saveProfile()}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
