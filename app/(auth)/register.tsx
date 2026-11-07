import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { LanguagePicker } from "../../components/ui/LanguagePicker";
import { useAuthStore } from "../../store/useAuthStore";
import type { AuthUser, SelfSelectedRole } from "../../store/useAuthStore";
import { useLanguage } from "../../utils/i18n";

const useMockAuth = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === "true";

const ROLES: {
  id: SelfSelectedRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "poultry_owner",
    title: "Poultry Owner",
    description: "Manage your farm, flocks, sheds, and operations.",
    icon: "leaf-outline",
  },
  {
    id: "customer",
    title: "Customer",
    description: "Shop poultry products and book farm services.",
    icon: "cart-outline",
  },
];

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoComplete?: "name" | "email" | "tel" | "off";
}) {
  return (
    <View>
      <Text style={{ marginBottom: 7, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        autoComplete={autoComplete}
        autoCorrect={keyboardType !== "email-address"}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
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

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const completeProfile = useAuthStore((state) => state.completeProfile);
  const completeSignIn = useAuthStore((state) => state.completeSignIn);
  const [signupStep, setSignupStep] = useState<"details" | "verification">("details");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [farmName, setFarmName] = useState(user?.farmName ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [otp, setOtp] = useState("");
  const [selectedRole, setSelectedRole] = useState<SelfSelectedRole>("poultry_owner");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const finishProfile = async () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Enter your full name to continue.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (selectedRole === "poultry_owner" && !farmName.trim()) {
      setMessage("Enter your farm name to continue.");
      return;
    }

    setIsSaving(true);
    try {
      await completeProfile({
        name,
        email,
        phone,
        farmName: selectedRole === "poultry_owner" ? farmName : undefined,
        city,
        state,
        role: selectedRole,
      });
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const requestOtp = () => {
    setMessage("");
    if (!name.trim()) {
      setMessage("Enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (useMockAuth) {
      setMessage("Mock verification code: 123456");
    } else {
      setMessage("Email OTP delivery is not connected yet.");
    }
    setSignupStep("verification");
  };

  const verifyOtp = () => {
    setMessage("");
    if (!/^\d{6}$/.test(otp)) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }
    if (!useMockAuth) {
      setMessage("Email OTP verification is not connected yet. No account has been created.");
      return;
    }
    if (otp !== "123456") {
      setMessage("Invalid code. Try 123456 in mock mode.");
      return;
    }

    const newUser: AuthUser = {
      id: `mock-${email.trim().toLowerCase()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: null,
    };
    setMessage("");
    setIsSaving(true);
    void completeSignIn(newUser, `mock-token-${newUser.id}`)
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error ? error.message : "Could not create your account. Please try again.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  const isProfileSetup = Boolean(isAuthenticated && user && !user.role);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={{ alignItems: "flex-end", marginBottom: 14 }}>
            <LanguagePicker />
          </View>
          <View
            style={{
              width: "100%",
              maxWidth: 560,
              alignSelf: "center",
              borderWidth: 1,
              borderColor: "#F1F5F9",
              borderRadius: 28,
              backgroundColor: "#FFFFFF",
              padding: 24,
              ...(Platform.OS === "web"
                ? { boxShadow: "0px 24px 64px rgba(11,42,91,0.10)" }
                : {}),
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                backgroundColor: "#EAF8EC",
              }}
            >
              <Ionicons color="#14532D" name={isProfileSetup ? "person-circle-outline" : "leaf-outline"} size={25} />
            </View>

            <Text style={{ marginTop: 18, color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 26, lineHeight: 34 }}>
              {isProfileSetup
                ? t("Set up your profile")
                : signupStep === "details"
                  ? t("Create your account")
                  : t("Verify your email")}
            </Text>
            <Text style={{ marginTop: 6, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 }}>
              {isProfileSetup
                ? t("Choose how you’ll use Poultech and add your profile details.")
                : signupStep === "details"
                  ? t("Create a Poultech account with your email.")
                  : t("Enter the 6-digit verification code for {email}.").replace("{email}", email.trim())}
            </Text>

            {isProfileSetup ? (
              <>
                <Text style={{ marginTop: 22, marginBottom: 10, color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                  {t("Choose your role")}
                </Text>
                <View style={{ gap: 10 }}>
                  {ROLES.map((role) => {
                    const selected = selectedRole === role.id;
                    return (
                      <Pressable
                        key={role.id}
                        accessibilityLabel={`${t("Select")} ${t(role.title)}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        className="cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
                        onPress={() => setSelectedRole(role.id)}
                        style={{
                          minHeight: 76,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? "#16A34A" : "#E2E8F0",
                          borderRadius: 16,
                          backgroundColor: selected ? "#F0FDF4" : "#FFFFFF",
                          paddingHorizontal: 14,
                        }}
                      >
                        <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: selected ? "#DCFCE7" : "#F1F5F9" }}>
                          <Ionicons color={selected ? "#14532D" : "#64748B"} name={role.icon} size={19} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                            {t(role.title)}
                          </Text>
                          <Text style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
                            {t(role.description)}
                          </Text>
                        </View>
                        <Ionicons color={selected ? "#16A34A" : "#CBD5E1"} name={selected ? "checkmark-circle" : "ellipse-outline"} size={20} />
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ marginTop: 22, marginBottom: 12, color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                  {t("Your profile")}
                </Text>
                <View style={{ gap: 14 }}>
                  <ProfileField autoComplete="name" label={t("Full name")} onChangeText={setName} placeholder={t("Your full name")} value={name} />
                  <ProfileField autoComplete="email" keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} placeholder={t("you@example.com")} value={email} />
                  <ProfileField autoComplete="tel" keyboardType="phone-pad" label={t("Phone number")} onChangeText={setPhone} placeholder={t("Your phone number")} value={phone} />
                  {selectedRole === "poultry_owner" ? (
                    <ProfileField autoComplete="off" label={t("Farm name")} onChangeText={setFarmName} placeholder={t("Your farm or business name")} value={farmName} />
                  ) : null}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <ProfileField autoComplete="off" label={t("City")} onChangeText={setCity} placeholder={t("City")} value={city} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ProfileField autoComplete="off" label={t("State")} onChangeText={setState} placeholder={t("State")} value={state} />
                    </View>
                  </View>
                </View>

                <Text style={{ marginTop: 14, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17 }}>
                  {t("Profile details are saved to this device until the backend profile endpoint is available.")}
                </Text>
                <View style={{ marginTop: 18 }}>
                  <Button
                    accessibilityLabel={t("Save profile and continue")}
                    label={t("Save profile & continue")}
                    loading={isSaving}
                    onPress={() => void finishProfile()}
                  />
                </View>
              </>
            ) : signupStep === "details" ? (
              <>
                <View style={{ marginTop: 24, gap: 16 }}>
                  <ProfileField autoComplete="name" label={t("Full name")} onChangeText={setName} placeholder={t("Your name")} value={name} />
                  <ProfileField autoComplete="email" keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} placeholder={t("you@example.com")} value={email} />
                </View>
                <Text style={{ marginTop: 14, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17 }}>
                  {t("After email verification, you’ll choose a role and complete your profile.")}
                </Text>
                <View style={{ marginTop: 18 }}>
                  <Button
                    accessibilityLabel={t("Continue signup")}
                    label={t("Continue")}
                    onPress={requestOtp}
                  />
                </View>
              </>
            ) : (
              <View style={{ marginTop: 24 }}>
                <ProfileField
                  autoComplete="off"
                  label={t("Verification code")}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={t("6-digit code")}
                  value={otp}
                />
                <Pressable
                  accessibilityLabel={t("Change email address")}
                  accessibilityRole="button"
                  className="mt-4 self-start cursor-pointer"
                  onPress={() => {
                    setSignupStep("details");
                    setOtp("");
                    setMessage("");
                  }}
                >
                  <Text style={{ color: "#16A34A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                    {t("Change email address")}
                  </Text>
                </Pressable>
                <View style={{ marginTop: 18 }}>
                  <Button
                    accessibilityLabel={t("Verify email")}
                    disabled={isSaving}
                    label={t("Verify email")}
                    loading={isSaving}
                    onPress={verifyOtp}
                  />
                </View>
                <Text style={{ marginTop: 12, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17, textAlign: "center" }}>
                  {useMockAuth
                    ? t("Development mode: use 123456 to continue to role and profile setup.")
                    : t("Email OTP delivery and verification will be enabled when the backend endpoint is available.")}
                </Text>
              </View>
            )}

            {message ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  marginTop: 14,
                  color: useMockAuth && message.startsWith("Mock verification")
                    ? "#166534"
                    : "#B91C1C",
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  lineHeight: 18,
                }}
              >
                {t(message)}
              </Text>
            ) : null}

            {!isProfileSetup ? (
              <View style={{ marginTop: 22, flexDirection: "row", justifyContent: "center" }}>
                <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                  {t("Already have an account? ")}
                </Text>
                <Link href="/(auth)/login" style={{ color: "#16A34A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                  {t("Sign in")}
                </Link>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
