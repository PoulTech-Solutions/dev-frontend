import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import {
  getAuthErrorMessage,
  getSignupFailureMessage,
  getOtpFailureMessage,
  isMockAuthEnabled,
  useResendOtp,
  useSignup,
  useVerifySignupEmail,
} from "../../hooks/useAuth";
import { useOtpResendCooldown } from "../../hooks/useOtpResendCooldown";
import { useAuthStore } from "../../store/useAuthStore";
import type { AuthUser, SelfSelectedRole } from "../../store/useAuthStore";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import {
  BACKEND_PASSWORD_HINT,
  BACKEND_PASSWORD_REGEX,
  INDIAN_MOBILE_HINT,
  isValidIndianMobile,
  loginPathAfterSignup,
} from "../../utils/authValidation";
import { LocationCascade } from "../../components/profile/LocationCascade";
import type { GeoPincodeItem } from "../../services/geoService";

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
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoComplete?: "name" | "email" | "tel" | "off" | "new-password";
  secureTextEntry?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View>
      <Text style={{ marginBottom: 7, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        autoComplete={autoComplete}
        autoCorrect={keyboardType !== "email-address"}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={{
          minHeight: 50,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 14,
          backgroundColor: colors.cardSoft,
          paddingHorizontal: 14,
          color: colors.ink,
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
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const routeParams = useLocalSearchParams<{ email?: string; from?: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const completeProfile = useAuthStore((state) => state.completeProfile);
  const completeSignIn = useAuthStore((state) => state.completeSignIn);
  const signupMutation = useSignup();
  const verifySignup = useVerifySignupEmail();
  const resendOtp = useResendOtp();
  const signupResendCooldown = useOtpResendCooldown();
  const [signupStep, setSignupStep] = useState<"details" | "verification">("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [farmName, setFarmName] = useState(user?.farmName ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");
  const [tehsil, setTehsil] = useState(user?.tehsil ?? "");
  const [otp, setOtp] = useState("");
  const [selectedRole, setSelectedRole] = useState<SelfSelectedRole>("poultry_owner");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const prefill = typeof routeParams.email === "string" ? routeParams.email.trim().toLowerCase() : "";
    if (prefill && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prefill)) {
      setEmail(prefill);
    }
    if (routeParams.from === "login") {
      setMessage(
        prefill
          ? `No account for ${prefill} yet—or the password was wrong. Register below, then sign in with the same email and password.`
          : "Register below, then sign in with the same email and password.",
      );
    }
  }, [routeParams.email, routeParams.from]);

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
    if (!phone.trim()) {
      setMessage("Phone number is required.");
      return;
    }
    if (!isValidIndianMobile(phone)) {
      setMessage(INDIAN_MOBILE_HINT);
      return;
    }
    if (selectedRole === "poultry_owner" && !farmName.trim()) {
      setMessage("Enter your farm name to continue.");
      return;
    }

    setIsSaving(true);
    try {
      const { splitPersonName } = await import("../../utils/personName");
      const { first_name: firstName, last_name: lastName } = splitPersonName(name);
      if (isAuthenticated && !isMockAuthEnabled) {
        const { patchMyProfile } = await import("../../services/authService");
        const updated = await patchMyProfile({
          first_name: firstName,
          last_name: lastName,
          phone: phone.replace(/\D/g, ""),
          village_city: city.trim() || undefined,
          state: state.trim() || undefined,
          district: district.trim() || undefined,
          tehsil: tehsil.trim() || undefined,
          pincode: pincode.trim() || undefined,
          region: selectedRole === "poultry_owner" ? farmName.trim() || undefined : undefined,
        });
        const token = useAuthStore.getState().accessToken;
        if (token) {
          await completeSignIn(updated, token);
        }
      }
      await completeProfile({
        name,
        email,
        phone,
        farmName: selectedRole === "poultry_owner" ? farmName : undefined,
        city,
        state,
        district,
        tehsil,
        pincode,
        role: selectedRole,
      });
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      const { getAuthErrorMessage } = await import("../../hooks/useAuth");
      setMessage(getAuthErrorMessage(error) || "Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestOtp = () => {
    setMessage("");
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn.length < 2) {
      setMessage("First name must be at least 2 characters.");
      return;
    }
    if (ln.length < 1) {
      setMessage("Enter your last name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage(
        "Enter a valid email address you can access (for example, name@example.com).",
      );
      return;
    }
    if (!phone.trim()) {
      setMessage("Phone number is required.");
      return;
    }
    if (!isValidIndianMobile(phone)) {
      setMessage(INDIAN_MOBILE_HINT);
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (!BACKEND_PASSWORD_REGEX.test(password)) {
      setMessage(BACKEND_PASSWORD_HINT);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setIsSaving(true);
    void signupMutation
      .mutateAsync({
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        first_name: fn,
        last_name: ln,
        phone: phone.replace(/\D/g, ""),
      })
      .then((challenge) => {
        setOtpSessionId(challenge.otp_session_id);
        setSignupStep("verification");
        signupResendCooldown.startFromChallenge(challenge.resend_after);
        setMessage(challenge.hint ?? `Enter the code sent to ${challenge.masked_destination ?? "your email"}.`);
      })
      .catch((error) => {
        setMessage(getSignupFailureMessage(error));
      })
      .finally(() => setIsSaving(false));
  };

  const verifyOtp = () => {
    setMessage("");
    if (!/^\d{6}$/.test(otp)) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }
    setIsSaving(true);
    void verifySignup
      .mutateAsync({ otp_session_id: otpSessionId, otp })
      .then((result) => {
        if (isMockAuthEnabled) {
          const newUser: AuthUser = {
            id: `mock-${email.trim().toLowerCase()}`,
            name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            email: email.trim().toLowerCase(),
            role: null,
          };
          return completeSignIn(newUser, `mock-token-${newUser.id}`).then(() => {
            router.replace("/(auth)/register");
          });
        }
        setMessage(result.message);
        router.replace(loginPathAfterSignup(email));
        return undefined;
      })
      .catch((error) => {
        setMessage(getOtpFailureMessage(error));
      })
      .finally(() => setIsSaving(false));
  };

  const resendSignupOtp = () => {
    if (!otpSessionId || !signupResendCooldown.canResend) return;
    setIsSaving(true);
    void resendOtp
      .mutateAsync({ otp_session_id: otpSessionId, purpose: "signup" })
      .then((challenge) => {
        signupResendCooldown.startFromChallenge(challenge.resend_after);
        setMessage(challenge.hint ?? "A new code was sent to your email.");
      })
      .catch((error) => setMessage(getOtpFailureMessage(error)))
      .finally(() => setIsSaving(false));
  };

  const isProfileSetup = Boolean(
    isAuthenticated && user && user.isProfileComplete === false,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
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
              borderColor: colors.line,
              borderRadius: 28,
              backgroundColor: colors.card,
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

            <Text style={{ marginTop: 18, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 26, lineHeight: 34 }}>
              {isProfileSetup
                ? t("Set up your profile")
                : signupStep === "details"
                  ? t("Create your account")
                  : t("Verify your email")}
            </Text>
            <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 }}>
              {isProfileSetup
                ? t("Choose how you’ll use Poultech and add your profile details.")
                : signupStep === "details"
                  ? t("Create a Poultech account with your email.")
                  : t("Enter the 6-digit verification code for {email}.").replace("{email}", email.trim())}
            </Text>

            {isProfileSetup ? (
              <>
                <Text style={{ marginTop: 22, marginBottom: 10, color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
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
                          borderColor: selected ? "#16A34A" : colors.line,
                          borderRadius: 16,
                          backgroundColor: selected ? colors.promoBg : colors.card,
                          paddingHorizontal: 14,
                        }}
                      >
                        <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: selected ? colors.promoBg : colors.chip }}>
                          <Ionicons color={selected ? colors.accent : colors.muted} name={role.icon} size={19} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                            {t(role.title)}
                          </Text>
                          <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
                            {t(role.description)}
                          </Text>
                        </View>
                        <Ionicons color={selected ? "#16A34A" : "#CBD5E1"} name={selected ? "checkmark-circle" : "ellipse-outline"} size={20} />
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ marginTop: 22, marginBottom: 12, color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                  {t("Your profile")}
                </Text>
                <View style={{ gap: 14 }}>
                  <ProfileField autoComplete="name" label={t("Full name")} onChangeText={setName} placeholder={t("Your full name")} value={name} />
                  <ProfileField autoComplete="email" keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} placeholder={t("you@example.com")} value={email} />
                  <ProfileField autoComplete="tel" keyboardType="phone-pad" label={t("Phone number")} onChangeText={setPhone} placeholder={t("Your phone number")} value={phone} />
                  {selectedRole === "poultry_owner" ? (
                    <ProfileField autoComplete="off" label={t("Farm name")} onChangeText={setFarmName} placeholder={t("Your farm or business name")} value={farmName} />
                  ) : null}
                  <LocationCascade
                    district={district}
                    editable
                    onSelect={(item: GeoPincodeItem) => {
                      setState(item.state);
                      setDistrict(item.district);
                      setCity(item.district || city);
                      if (item.tehsil) setTehsil(item.tehsil);
                      setPincode(/^[1-9][0-9]{5}$/.test(item.pincode) ? item.pincode : "");
                    }}
                    pincode={pincode}
                    state={state}
                  />
                </View>

                <Text style={{ marginTop: 14, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17 }}>
                  {isAuthenticated && !isMockAuthEnabled
                    ? t("Add your phone and details to finish your account (required for Google and email sign-in).")
                    : t("Profile details are saved to this device until the backend profile endpoint is available.")}
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
                  <ProfileField autoComplete="name" label={t("First name")} onChangeText={setFirstName} placeholder={t("First name")} value={firstName} />
                  <ProfileField autoComplete="name" label={t("Last name")} onChangeText={setLastName} placeholder={t("Last name")} value={lastName} />
                  <ProfileField autoComplete="email" keyboardType="email-address" label={t("Email address")} onChangeText={setEmail} placeholder={t("you@example.com")} value={email} />
                  <ProfileField autoComplete="tel" keyboardType="phone-pad" label={t("Phone number")} onChangeText={setPhone} placeholder={t("10-digit Indian mobile")} value={phone} />
                  <ProfileField autoComplete="new-password" label={t("Password")} onChangeText={setPassword} placeholder={t("At least 8 characters")} secureTextEntry value={password} />
                  <ProfileField autoComplete="new-password" label={t("Confirm password")} onChangeText={setConfirmPassword} placeholder={t("Re-enter password")} secureTextEntry value={confirmPassword} />
                </View>
                <Text style={{ marginTop: 14, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17 }}>
                  {t("We’ll email a verification code. After that, sign in with your password.")}
                </Text>
                <View style={{ marginTop: 18 }}>
                  <Button
                    accessibilityLabel={t("Continue signup")}
                    label={t("Continue")}
                    loading={signupMutation.isPending || isSaving}
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
                    loading={isSaving || verifySignup.isPending}
                    onPress={verifyOtp}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  className="mt-3 self-center"
                  disabled={isSaving || !otpSessionId || !signupResendCooldown.canResend || resendOtp.isPending}
                  onPress={resendSignupOtp}
                >
                  <Text
                    style={{
                      color: signupResendCooldown.canResend ? "#16A34A" : "#94A3B8",
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 12,
                    }}
                  >
                    {signupResendCooldown.canResend
                      ? t("Resend code")
                      : t("Resend code in {seconds}s").replace(
                          "{seconds}",
                          String(signupResendCooldown.secondsLeft),
                        )}
                  </Text>
                </Pressable>
                <Text style={{ marginTop: 12, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17, textAlign: "center" }}>
                  {isMockAuthEnabled
                    ? t("Development mode: use 123456 to continue to role and profile setup.")
                    : t("Check your inbox for the 6-digit code.")}
                </Text>
              </View>
            )}

            {message ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  marginTop: 14,
                  color: isMockAuthEnabled && message.includes("123456")
                    ? "#166534"
                    : message.includes("confirmed") || message.includes("sent")
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
                <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
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
