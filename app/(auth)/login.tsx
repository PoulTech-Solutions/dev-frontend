import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LanguagePicker } from "../../components/ui/LanguagePicker";
import {
  getAuthErrorMessage,
  getLoginFailureMessage,
  getOtpFailureMessage,
  isAlreadySignedInError,
  shouldSuggestRegistration,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_EMAIL,
  DEMO_OWNER_EMAIL,
  DEMO_OWNER_PASSWORD,
  DEMO_PASSWORD,
  isMockAuthEnabled,
  useCompleteLoginOtp,
  useForgotPassword,
  useLoginChallenge,
  useResendOtp,
  useResetPassword,
  DEMO_OTP,
} from "../../hooks/useAuth";
import { OtpInput } from "../../components/forms/OtpInput";
import { useOtpResendCooldown } from "../../hooks/useOtpResendCooldown";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useAuthStore } from "../../store/useAuthStore";
import type { AuthUser } from "../../store/useAuthStore";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { BACKEND_PASSWORD_HINT, BACKEND_PASSWORD_REGEX, registerPathFromLogin } from "../../utils/authValidation";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address you can access (for example, name@example.com)."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(BACKEND_PASSWORD_REGEX, BACKEND_PASSWORD_HINT),
});
type EmailForm = z.infer<typeof emailSchema>;

const FONT_REGULAR = "Poppins_400Regular";
const FONT_MEDIUM = "Poppins_500Medium";
const FONT_SEMIBOLD = "Poppins_600SemiBold";
const FONT_BOLD = "Poppins_700Bold";
const COLOR_FOREST = "#14532D";
const COLOR_ACCENT = "#16A34A";

function haptic(type: "success" | "error") {
  if (Platform.OS === "web") return;
  const feedback =
    type === "success"
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error;
  void Haptics.notificationAsync(feedback).catch((error: unknown) => {
    console.warn("Haptic feedback is unavailable.", error);
  });
}

function GoogleLogo() {
  return (
    <Svg accessibilityLabel="Google" height={20} viewBox="0 0 48 48" width={20}>
      <Path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <Path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8V33A20 20 0 0 0 24 44Z"
      />
      <Path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4v-5.2H5.8a20 20 0 0 0 0 17.8l6.8-5.2Z"
      />
      <Path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </Svg>
  );
}

function FeatureChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
        backgroundColor: "rgba(255,255,255,0.14)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <Ionicons color="#FFFFFF" name={icon} size={14} />
      <Text
        style={{
          marginLeft: 6,
          color: "#FFFFFF",
          fontFamily: FONT_MEDIUM,
          fontSize: 11,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function AuthHeroPanel() {
  const zoom = useSharedValue(1);
  const imageEntrance = useSharedValue(0);

  useEffect(() => {
    imageEntrance.value = withTiming(1, { duration: 700 });
    zoom.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 12_000 }),
        withTiming(1, { duration: 12_000 }),
      ),
      -1,
      false,
    );
  }, [imageEntrance, zoom]);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageEntrance.value,
    transform: [{ scale: zoom.value }],
  }));

  return (
    <View style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
          imageStyle,
        ]}
      >
        <Image
          accessibilityLabel="Poultry farmer caring for chickens on a farm"
          contentFit="cover"
          source={require("../../assets/images/login-hero.jpg")}
          style={{ width: "100%", height: "100%" }}
          transition={300}
        />
      </Animated.View>
      <LinearGradient
        colors={["rgba(11,42,91,0.03)", "rgba(11,42,91,0.35)", "rgba(11,42,91,0.85)"]}
        locations={[0, 0.44, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View
        style={{
          position: "absolute",
          top: 22,
          right: 22,
          overflow: "hidden",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.3)",
          backgroundColor: "rgba(255,255,255,0.15)",
        }}
      >
        <BlurView intensity={18} tint="light">
          <Text
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              color: "#FFFFFF",
              fontFamily: FONT_MEDIUM,
              fontSize: 11,
            }}
          >
            🌿 Made for poultry farming
          </Text>
        </BlurView>
      </View>

      <View style={{ position: "absolute", left: 32, right: 28, bottom: 30 }}>
        <Text
          style={{
            maxWidth: 420,
            color: "#FFFFFF",
            fontFamily: FONT_BOLD,
            fontSize: 30,
            lineHeight: 39,
          }}
        >
          Grow your farm with confidence.
        </Text>
        <Text
          style={{
            maxWidth: 430,
            marginTop: 10,
            color: "rgba(255,255,255,0.88)",
            fontFamily: FONT_REGULAR,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          Track flocks, bill customers, shop supplies and book vets, all in one place.
        </Text>
        <View style={{ marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <FeatureChip icon="leaf-outline" label="Farm Records" />
          <FeatureChip icon="storefront-outline" label="Marketplace" />
          <FeatureChip icon="medkit-outline" label="Vet Booking" />
        </View>
      </View>
    </View>
  );
}

function MobileHero({ height }: { height: number }) {
  const heroHeight = Math.min(390, Math.max(270, Math.round(height * 0.4)));
  const zoom = useSharedValue(1);
  useEffect(() => {
    zoom.value = withTiming(1.035, { duration: 10_000 });
  }, [zoom]);
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.value }],
  }));

  return (
    <View
      style={{
        width: "100%",
        height: heroHeight,
        overflow: "hidden",
        backgroundColor: COLOR_FOREST,
      }}
    >
      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
          imageStyle,
        ]}
      >
        <Image
          accessibilityLabel="Poultry farmer caring for chickens on a farm"
          contentFit="cover"
          source={require("../../assets/images/login-hero.jpg")}
          style={{ width: "100%", height: "100%" }}
          transition={300}
        />
      </Animated.View>
      <LinearGradient
        colors={["rgba(11,42,91,0.3)", "rgba(11,42,91,0.76)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, justifyContent: "space-between", padding: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            accessibilityLabel="Poultech Solutions logo"
            contentFit="contain"
            source={require("../../assets/images/logo-mark.png")}
            style={{ width: 40, height: 40 }}
          />
          <Text
            style={{
              marginLeft: 10,
              color: "#FFFFFF",
              fontFamily: FONT_BOLD,
              fontSize: 16,
            }}
          >
            Poultech Solutions
          </Text>
        </View>
        <View>
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: FONT_BOLD,
              fontSize: 23,
            }}
          >
            Welcome back, Farmer 👋
          </Text>
          <Text
            style={{
              marginTop: 4,
              color: "rgba(255,255,255,0.88)",
              fontFamily: FONT_REGULAR,
              fontSize: 13,
            }}
          >
            Manage your farm, shop smarter.
          </Text>
        </View>
      </View>
    </View>
  );
}

function Checkbox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return (
    <Pressable
      accessibilityLabel={t("Remember me")}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
      onPress={onPress}
      style={{ minHeight: 38, flexDirection: "row", alignItems: "center" }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 5,
          borderWidth: 1,
          borderColor: checked ? COLOR_ACCENT : "#CBD5E1",
          backgroundColor: checked ? COLOR_ACCENT : colors.card,
        }}
      >
        {checked ? <Ionicons color="#FFFFFF" name="checkmark" size={13} /> : null}
      </View>
      <Text
        style={{
          marginLeft: 8,
          color: colors.ink,
          fontFamily: FONT_REGULAR,
          fontSize: 12,
        }}
      >
        {t("Remember me")}
      </Text>
    </Pressable>
  );
}

function LoginForm() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const COLOR_PRIMARY = colors.primary;
  const COLOR_MUTED = colors.muted;
  const COLOR_LINE = colors.line;
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const completeSignIn = useAuthStore((state) => state.completeSignIn);
  const loginChallenge = useLoginChallenge();
  const completeLoginOtp = useCompleteLoginOtp();
  const forgotPassword = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  const resendOtp = useResendOtp();
  const loginResendCooldown = useOtpResendCooldown();
  const resetResendCooldown = useOtpResendCooldown();
  const google = useGoogleAuth();
  const [loginPhase, setLoginPhase] = useState<"password" | "otp" | "reset">("password");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [resetOtpSessionId, setResetOtpSessionId] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [confirmDeviceSwitch, setConfirmDeviceSwitch] = useState(false);
  const [showDeviceSwitchPrompt, setShowDeviceSwitchPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [banner, setBanner] = useState("");
  const [bannerIsError, setBannerIsError] = useState(false);
  const [showRegisterHint, setShowRegisterHint] = useState(false);
  const shake = useSharedValue(0);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(-8);
  const entrance = useSharedValue(0);
  const passwordRef = useRef<TextInput>(null);

  const signupParams = useLocalSearchParams<{ email?: string; registered?: string }>();
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });
  const forgotEmailSchema = z
    .string()
    .trim()
    .email("Enter a valid email address you can access (for example, name@example.com).");
  const loginEmailValue = emailForm.watch("email");
  const registerHref = registerPathFromLogin(loginEmailValue);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 400 });
  }, [entrance]);

  useEffect(() => {
    const prefill = typeof signupParams.email === "string" ? signupParams.email.trim() : "";
    if (prefill) {
      emailForm.setValue("email", prefill, { shouldValidate: true });
    }
    if (signupParams.registered === "1") {
      setBanner("Email confirmed. Sign in with the same password, then enter the login code from your email.");
      setBannerIsError(false);
      setShowRegisterHint(false);
    }
  }, [signupParams.email, signupParams.registered, emailForm]);

  useEffect(() => {
    if (!banner) {
      toastOpacity.value = withTiming(0, { duration: 160 });
      toastTranslateY.value = withTiming(-8, { duration: 160 });
      return;
    }
    toastOpacity.value = withTiming(1, { duration: 180 });
    toastTranslateY.value = withTiming(0, { duration: 180 });
  }, [banner, toastOpacity, toastTranslateY]);

  const formEntranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: 16 * (1 - entrance.value) }, { translateX: shake.value }],
  }));
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }],
  }));

  const showError = (message: string) => {
    setShowRegisterHint(false);
    setBanner(message);
    setBannerIsError(true);
    haptic("error");
  };

  const showLoginError = (error: unknown) => {
    setShowRegisterHint(shouldSuggestRegistration(error));
    setBanner(getLoginFailureMessage(error));
    setBannerIsError(true);
    haptic("error");
  };

  const runShake = () => {
    shake.value = withSequence(
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(-5, { duration: 45 }),
      withTiming(5, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
    haptic("error");
  };

  const finishSignIn = async (
    result: {
      accessToken: string;
      user: AuthUser;
      isNewUser?: boolean;
      mustChangePassword?: boolean;
      mustVerifyEmail?: boolean;
    },
    remember: boolean,
  ) => {
    await completeSignIn(result.user, result.accessToken, remember);
    haptic("success");
    const needsProfileSetup =
      Boolean(result.mustVerifyEmail ?? result.user.mustVerifyEmail) ||
      result.user.isProfileComplete === false;
    if (result.mustChangePassword) {
      setBanner("Sign-in succeeded. Change your password in profile settings.");
      setBannerIsError(false);
    }
    router.replace(needsProfileSetup ? "/(auth)/register" : "/(tabs)/dashboard");
  };

  const requestLoginChallenge = async (values: EmailForm, deviceSwitch: boolean) => {
    const challenge = await loginChallenge.mutateAsync({
      email: values.email,
      password: values.password,
      remember_me: rememberMe,
      confirm_device_switch: deviceSwitch,
    });
    setConfirmDeviceSwitch(deviceSwitch);
    setOtpSessionId(challenge.otp_session_id);
    setOtpHint(challenge.masked_destination ?? "");
    loginResendCooldown.startFromChallenge(challenge.resend_after);
    setLoginPhase("otp");
    setShowDeviceSwitchPrompt(false);
    setBanner(
      challenge.hint ??
        `Enter the 6-digit code sent to ${challenge.masked_destination ?? "your email"}.`,
    );
    setBannerIsError(false);
  };

  const submitEmail = async (values: EmailForm) => {
    setBanner("");
    setBannerIsError(false);
    setShowRegisterHint(false);
    setConfirmDeviceSwitch(false);
    setShowDeviceSwitchPrompt(false);
    try {
      if (isMockAuthEnabled) {
        const challenge = await loginChallenge.mutateAsync(values);
        setOtpSessionId(challenge.otp_session_id);
        loginResendCooldown.startFromChallenge(challenge.resend_after);
        setLoginPhase("otp");
        setBanner(`Demo OTP: ${DEMO_OTP}`);
        setBannerIsError(false);
        return;
      }
      await requestLoginChallenge(values, false);
    } catch (error) {
      if (isAlreadySignedInError(error)) {
        setShowDeviceSwitchPrompt(true);
        setBanner("This account is already signed in on another device. Use Sign in on this device.");
        setBannerIsError(false);
        return;
      }
      showLoginError(error);
    }
  };

  const continueOnThisDevice = () => {
    const values = emailForm.getValues();
    setBanner("");
    void requestLoginChallenge(values, true).catch((error) => {
      showLoginError(error);
    });
  };

  const resendLoginOtp = () => {
    if (!otpSessionId || !loginResendCooldown.canResend) return;
    void resendOtp
      .mutateAsync({ otp_session_id: otpSessionId, purpose: "login" })
      .then((challenge) => {
        loginResendCooldown.startFromChallenge(challenge.resend_after);
        setBanner(challenge.hint ?? "A new code was sent to your email.");
        setBannerIsError(false);
      })
      .catch((error) => showError(getOtpFailureMessage(error)));
  };

  const submitLoginOtp = async () => {
    if (otpCode.length !== 6) {
      showError("Enter the 6-digit verification code.");
      return;
    }
    setBanner("");
    try {
      const result = await completeLoginOtp.mutateAsync({
        otp_session_id: otpSessionId,
        otp: otpCode,
        remember_me: rememberMe,
        confirm_device_switch: confirmDeviceSwitch,
      });
      await finishSignIn(result, rememberMe);
    } catch (error) {
      if (isAlreadySignedInError(error)) {
        setShowDeviceSwitchPrompt(true);
        setBanner("This account is already signed in on another device. Use Sign in on this device.");
        setBannerIsError(false);
        return;
      }
      showError(getOtpFailureMessage(error));
    }
  };

  const forgotPasswordRequest = async () => {
    const parsedEmail = forgotEmailSchema.safeParse(emailForm.getValues("email"));
    if (!parsedEmail.success) {
      emailForm.setError("email", {
        type: "validate",
        message: parsedEmail.error.issues[0]?.message ?? "Enter a valid email address.",
      });
      runShake();
      return;
    }

    setBanner("");
    try {
      const result = await forgotPassword.mutateAsync(parsedEmail.data);
      if (result.otp_session_id) {
        setResetOtpSessionId(result.otp_session_id);
        setResetOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        resetResendCooldown.startFromChallenge(result.resend_after);
        setLoginPhase("reset");
      }
      setBanner(
        result.masked_destination
          ? `${result.message} (${result.masked_destination})`
          : result.message,
      );
      setBannerIsError(false);
    } catch (error) {
      showError(getAuthErrorMessage(error));
    }
  };

  const submitPasswordReset = async () => {
    if (resetOtp.length !== 6) {
      showError("Enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showError("Passwords do not match.");
      return;
    }
    setBanner("");
    try {
      const result = await resetPasswordMutation.mutateAsync({
        otp_session_id: resetOtpSessionId,
        otp: resetOtp,
        password: newPassword,
        confirm_password: confirmNewPassword,
      });
      setLoginPhase("password");
      setResetOtpSessionId("");
      setBanner(result.message || "Password updated. Sign in with your new password.");
      setBannerIsError(false);
      emailForm.setValue("password", "");
      haptic("success");
    } catch (error) {
      showError(getAuthErrorMessage(error));
    }
  };

  const resendResetOtp = async () => {
    if (!resetOtpSessionId || !resetResendCooldown.canResend) return;
    try {
      const challenge = await resendOtp.mutateAsync({
        otp_session_id: resetOtpSessionId,
        purpose: "reset",
      });
      resetResendCooldown.startFromChallenge(challenge.resend_after);
      setBanner(challenge.hint ?? "A new code was sent to your email.");
      setBannerIsError(false);
    } catch (error) {
      showError(getOtpFailureMessage(error));
    }
  };

  const signInWithGoogle = async () => {
    setBanner("");
    try {
      const result = await google.signInWithGoogle();
      if (result) await finishSignIn(result, true);
    } catch (error) {
      showError(getAuthErrorMessage(error));
    }
  };

  const demoAccessHint = isMockAuthEnabled ? (
    <View
      style={{
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 14,
        backgroundColor: "#F0FDF4",
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons color="#15803D" name="flask-outline" size={16} />
        <Text
          style={{
            marginLeft: 7,
            color: "#166534",
            fontFamily: FONT_SEMIBOLD,
            fontSize: 11,
          }}
        >
          {t("Demo access · no backend needed")}
        </Text>
      </View>
      <View style={{ marginTop: 8, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ flex: 1, color: "#334155", fontFamily: FONT_REGULAR, fontSize: 10, lineHeight: 16 }}>
              {t("Customer")}: {DEMO_EMAIL}{"\n"}{t("Password")}: {DEMO_PASSWORD}
            </Text>
            <Pressable
              accessibilityLabel="Fill demo customer email and password"
              accessibilityRole="button"
              className="cursor-pointer"
              onPress={() => {
                emailForm.setValue("email", DEMO_EMAIL, { shouldDirty: true, shouldValidate: true });
                emailForm.setValue("password", DEMO_PASSWORD, { shouldDirty: true, shouldValidate: true });
                setBanner("");
              }}
              style={{ minHeight: 34, justifyContent: "center", borderRadius: 10, backgroundColor: "#DCFCE7", paddingHorizontal: 10 }}
            >
              <Text style={{ color: "#166534", fontFamily: FONT_SEMIBOLD, fontSize: 10 }}>{t("Use demo")}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ flex: 1, color: "#334155", fontFamily: FONT_REGULAR, fontSize: 10, lineHeight: 16 }}>
              {t("Admin")}: {DEMO_ADMIN_EMAIL}{"\n"}{t("Password")}: {DEMO_ADMIN_PASSWORD}
            </Text>
            <Pressable
              accessibilityLabel="Fill admin demo email and password"
              accessibilityRole="button"
              className="cursor-pointer"
              onPress={() => {
                emailForm.setValue("email", DEMO_ADMIN_EMAIL, { shouldDirty: true, shouldValidate: true });
                emailForm.setValue("password", DEMO_ADMIN_PASSWORD, { shouldDirty: true, shouldValidate: true });
                setBanner("");
              }}
              style={{ minHeight: 34, justifyContent: "center", borderRadius: 10, backgroundColor: "#DBEAFE", paddingHorizontal: 10 }}
            >
              <Text style={{ color: COLOR_PRIMARY, fontFamily: FONT_SEMIBOLD, fontSize: 10 }}>{t("Use admin")}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ flex: 1, color: "#334155", fontFamily: FONT_REGULAR, fontSize: 10, lineHeight: 16 }}>
              {t("Poultry Owner")}: {DEMO_OWNER_EMAIL}{"\n"}{t("Password")}: {DEMO_OWNER_PASSWORD}
            </Text>
            <Pressable
              accessibilityLabel="Fill poultry owner demo email and password"
              accessibilityRole="button"
              className="cursor-pointer"
              onPress={() => {
                emailForm.setValue("email", DEMO_OWNER_EMAIL, { shouldDirty: true, shouldValidate: true });
                emailForm.setValue("password", DEMO_OWNER_PASSWORD, { shouldDirty: true, shouldValidate: true });
                setBanner("");
              }}
              style={{ minHeight: 34, justifyContent: "center", borderRadius: 10, backgroundColor: "#DCFCE7", paddingHorizontal: 10 }}
            >
              <Text style={{ color: "#166534", fontFamily: FONT_SEMIBOLD, fontSize: 10 }}>{t("Use owner")}</Text>
            </Pressable>
          </View>
      </View>
    </View>
  ) : null;

  const googleAction = (
    <Pressable
      accessibilityLabel="Continue with Google"
      accessibilityRole="button"
      accessibilityState={{ disabled: !google.isConfigured, busy: google.isLoading }}
      className="cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
      disabled={!google.isConfigured || google.isLoading}
      onPress={() => void signInWithGoogle()}
      style={{
        minHeight: 48,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLOR_LINE,
        backgroundColor: colors.card,
        opacity: !google.isConfigured ? 0.6 : 1,
      }}
    >
      {google.isLoading ? (
        <Text style={{ color: COLOR_MUTED, fontFamily: FONT_MEDIUM, fontSize: 12 }}>
          Connecting…
        </Text>
      ) : (
        <>
          <GoogleLogo />
          <Text
            style={{
              marginLeft: 8,
              color: COLOR_PRIMARY,
              fontFamily: FONT_SEMIBOLD,
              fontSize: 13,
            }}
          >
            Google
          </Text>
        </>
      )}
    </Pressable>
  );

  const formContent = (
    <Animated.View
      style={[
        {
          width: "100%",
          maxWidth: 380,
          alignSelf: "center",
        },
        formEntranceStyle,
      ]}
    >
      <View style={{ alignItems: "flex-end", marginBottom: 14 }}>
        <LanguagePicker />
      </View>
      <View style={{ marginBottom: 26 }}>
        <Text
          style={{
            color: COLOR_PRIMARY,
            fontFamily: FONT_BOLD,
            fontSize: 32,
            lineHeight: 40,
          }}
        >
          {t("Welcome back!")}
        </Text>
        <Text
          style={{
            marginTop: 6,
            color: COLOR_MUTED,
            fontFamily: FONT_REGULAR,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          {t("Sign in to manage your farm, orders and services.")}
        </Text>
      </View>

      {demoAccessHint}

      {banner ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            {
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: bannerIsError ? "#FECACA" : "#BBF7D0",
              backgroundColor: bannerIsError ? "#FEF2F2" : "#F0FDF4",
              paddingHorizontal: 12,
              paddingVertical: 10,
            },
            toastStyle,
          ]}
        >
          <Ionicons
            color={bannerIsError ? "#B91C1C" : "#166534"}
            name={bannerIsError ? "alert-circle-outline" : "checkmark-circle-outline"}
            size={17}
          />
          <Text
            style={{
              flex: 1,
              marginLeft: 8,
              color: bannerIsError ? "#991B1B" : "#166534",
              fontFamily: FONT_REGULAR,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {bannerIsError ? banner : t(banner)}
          </Text>
        </Animated.View>
      ) : null}

      {showRegisterHint ? (
        <View style={{ marginTop: 10, alignItems: "center", gap: 6 }}>
          <Text
            style={{
              textAlign: "center",
              color: COLOR_MUTED,
              fontFamily: FONT_REGULAR,
              fontSize: 11,
              lineHeight: 16,
              paddingHorizontal: 8,
            }}
          >
            {t("Use the same email you registered with, or create an account with a valid inbox.")}
          </Text>
          <Link href={registerHref} asChild>
            <TouchableOpacity accessibilityRole="link">
              <Text
                style={{
                  color: COLOR_ACCENT,
                  fontFamily: FONT_SEMIBOLD,
                  fontSize: 13,
                  textDecorationLine: "underline",
                }}
              >
                {t("Create account")}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <View style={{ gap: 16 }}>
            {loginPhase === "reset" ? (
              <View style={{ gap: 14 }}>
                <Text
                  style={{
                    color: COLOR_MUTED,
                    fontFamily: FONT_REGULAR,
                    fontSize: 12,
                    lineHeight: 18,
                    textAlign: "center",
                  }}
                >
                  {t("Enter the code from your email and choose a new password.")}
                </Text>
                <OtpInput
                  value={resetOtp}
                  onChange={setResetOtp}
                  onComplete={() => undefined}
                />
                <Input
                  accessibilityLabel={t("New password")}
                  autoComplete="new-password"
                  icon={<Ionicons color={COLOR_MUTED} name="lock-closed-outline" size={18} />}
                  label={t("New password")}
                  onChangeText={setNewPassword}
                  placeholder={t("At least 8 characters")}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  rightElement={
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => setShowNewPassword((v) => !v)}
                      className="p-2"
                    >
                      <Ionicons
                        color={COLOR_MUTED}
                        name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                      />
                    </TouchableOpacity>
                  }
                />
                <Input
                  accessibilityLabel={t("Confirm new password")}
                  autoComplete="new-password"
                  icon={<Ionicons color={COLOR_MUTED} name="lock-closed-outline" size={18} />}
                  label={t("Confirm new password")}
                  onChangeText={setConfirmNewPassword}
                  placeholder={t("Re-enter new password")}
                  secureTextEntry={!showNewPassword}
                  value={confirmNewPassword}
                />
                <Button
                  accessibilityLabel={t("Reset password")}
                  disabled={resetOtp.length !== 6 || newPassword.length < 8}
                  label={t("Reset password")}
                  loading={resetPasswordMutation.isPending}
                  onPress={() => void submitPasswordReset()}
                />
                <TouchableOpacity
                  onPress={() => void resendResetOtp()}
                  disabled={resendOtp.isPending || !resetResendCooldown.canResend}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: resetResendCooldown.canResend ? COLOR_ACCENT : "#94A3B8",
                      fontFamily: FONT_SEMIBOLD,
                      fontSize: 12,
                    }}
                  >
                    {resetResendCooldown.canResend
                      ? t("Resend code")
                      : t("Resend code in {seconds}s").replace(
                          "{seconds}",
                          String(resetResendCooldown.secondsLeft),
                        )}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLoginPhase("password");
                    setResetOtp("");
                    setBanner("");
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: COLOR_MUTED,
                      fontFamily: FONT_REGULAR,
                      fontSize: 12,
                    }}
                  >
                    {t("Back to sign in")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {loginPhase !== "reset" ? (
            <>
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  accessibilityLabel={t("Email address")}
                  autoComplete="email"
                  error={emailForm.formState.errors.email?.message ? t(emailForm.formState.errors.email.message) : undefined}
                  icon={<Ionicons color={COLOR_MUTED} name="mail-outline" size={18} />}
                  keyboardType="email-address"
                  label={t("Email address")}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    setBanner("");
                    onChange(text);
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder={t("you@example.com")}
                  returnKeyType="next"
                  value={value}
                />
              )}
            />
            <Controller
              control={emailForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  accessibilityLabel={t("Password")}
                  autoComplete="current-password"
                  error={emailForm.formState.errors.password?.message ? t(emailForm.formState.errors.password.message) : undefined}
                  icon={<Ionicons color={COLOR_MUTED} name="lock-closed-outline" size={18} />}
                  inputRef={passwordRef}
                  label={t("Password")}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    setBanner("");
                    onChange(text);
                  }}
                  onSubmitEditing={() =>
                    void emailForm.handleSubmit(submitEmail, runShake)()
                  }
                  placeholder={t("Enter your password")}
                  returnKeyType="done"
                  rightElement={
                    <TouchableOpacity
                      accessibilityLabel={t(showPassword ? "Hide password" : "Show password")}
                      accessibilityRole="button"
                      className="cursor-pointer p-2 focus-visible:ring-2 focus-visible:ring-accent"
                      onPress={() => setShowPassword((visible) => !visible)}
                    >
                      <Ionicons
                        color={COLOR_MUTED}
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                      />
                    </TouchableOpacity>
                  }
                  secureTextEntry={!showPassword}
                  value={value}
                />
              )}
            />
            <View
              style={{
                marginTop: -4,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Checkbox
                checked={rememberMe}
                onPress={() => setRememberMe((current) => !current)}
              />
              <TouchableOpacity
                accessibilityLabel={t("Forgot password?")}
                accessibilityRole="button"
                className="cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
                onPress={() => void forgotPasswordRequest()}
              >
                <Text
                  style={{
                    color: COLOR_ACCENT,
                    fontFamily: FONT_SEMIBOLD,
                    fontSize: 12,
                  }}
                >
                  {t("Forgot password?")}
                </Text>
              </TouchableOpacity>
            </View>
            {loginPhase === "otp" ? (
              <View style={{ gap: 12, marginTop: 8 }}>
                <Text
                  style={{
                    color: COLOR_MUTED,
                    fontFamily: FONT_REGULAR,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {otpHint ? `Code sent to ${otpHint}` : t("Enter your verification code")}
                </Text>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={() => {
                    void submitLoginOtp();
                  }}
                />
                <Button
                  accessibilityLabel={t("Verify and sign in")}
                  disabled={otpCode.length !== 6}
                  label={t("Verify & Sign In  →")}
                  loading={completeLoginOtp.isPending}
                  onPress={() => void submitLoginOtp()}
                />
                <TouchableOpacity
                  disabled={resendOtp.isPending || !loginResendCooldown.canResend}
                  onPress={resendLoginOtp}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: loginResendCooldown.canResend ? COLOR_ACCENT : "#94A3B8",
                      fontFamily: FONT_SEMIBOLD,
                      fontSize: 12,
                    }}
                  >
                    {loginResendCooldown.canResend
                      ? t("Resend code")
                      : t("Resend code in {seconds}s").replace(
                          "{seconds}",
                          String(loginResendCooldown.secondsLeft),
                        )}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLoginPhase("password");
                    setOtpCode("");
                    setBanner("");
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: COLOR_ACCENT,
                      fontFamily: FONT_SEMIBOLD,
                      fontSize: 12,
                    }}
                  >
                    {t("Back to password")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
              <Button
                accessibilityLabel={t("Sign in with email and password")}
                disabled={!emailForm.formState.isValid}
                label={t("Sign In  →")}
                loading={loginChallenge.isPending}
                onPress={() =>
                  void emailForm.handleSubmit(submitEmail, runShake)()
                }
              />
              {showDeviceSwitchPrompt ? (
                <Button
                  accessibilityLabel={t("Sign in on this device")}
                  label={t("Sign in on this device")}
                  loading={loginChallenge.isPending}
                  onPress={continueOnThisDevice}
                />
              ) : null}
              </>
            )}
            </>
            ) : null}
        </View>
      </View>

      <View
        style={{
          marginTop: 20,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ height: 1, flex: 1, backgroundColor: COLOR_LINE }} />
        <Text
          style={{
            marginHorizontal: 12,
            color: COLOR_MUTED,
            fontFamily: FONT_REGULAR,
            fontSize: 11,
          }}
        >
          {t("or continue with")}
        </Text>
        <View style={{ height: 1, flex: 1, backgroundColor: COLOR_LINE }} />
      </View>

      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          gap: 10,
        }}
      >
        {googleAction}
      </View>
      {!google.isConfigured ? (
        <Text
          style={{
            marginTop: 7,
            textAlign: "center",
            color: COLOR_MUTED,
            fontFamily: FONT_REGULAR,
            fontSize: 11,
          }}
        >
          {t("Google Sign-In not configured")}
        </Text>
      ) : null}
    </Animated.View>
  );

  const footer = (
    <View style={{ alignItems: "center", paddingTop: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        <Text style={{ color: "#475569", fontFamily: FONT_REGULAR, fontSize: 12 }}>
          {t("New to Poultech? ")}
        </Text>
        <Link
          accessibilityRole="link"
          className="focus-visible:ring-2 focus-visible:ring-accent"
          href={registerHref}
        >
          <Text style={{ color: COLOR_ACCENT, fontFamily: FONT_SEMIBOLD, fontSize: 12 }}>
            {t("Create account")}
          </Text>
        </Link>
      </View>
      <TouchableOpacity
        accessibilityLabel={t("Continue as Guest")}
        accessibilityRole="button"
        className="cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
        onPress={() => router.push("/(tabs)/(marketplace)/feed")}
        style={{ paddingVertical: 5 }}
      >
        <Text
          style={{
            color: COLOR_MUTED,
            fontFamily: FONT_MEDIUM,
            fontSize: 12,
            textDecorationLine: "underline",
          }}
        >
          {t("Continue as Guest")}
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          marginTop: 2,
          color: COLOR_MUTED,
          fontFamily: FONT_REGULAR,
          fontSize: 10,
          textAlign: "center",
        }}
      >
        {t("By continuing, you agree to our Terms and Privacy Policy.")}
      </Text>
    </View>
  );

  if (isDesktop) {
    const cardWidth = Math.min(1100, width * 0.92);
    const cardHeight = Math.min(680, height * 0.88);
    const panelPadding = Math.min(48, Math.max(24, cardWidth * 0.044));

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: colors.page,
          paddingVertical: 16,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            top: -150,
            left: -140,
            borderRadius: 160,
            backgroundColor: "#DCFCE7",
            opacity: 0.78,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            right: -100,
            bottom: -100,
            borderRadius: 120,
            backgroundColor: "#FDEBB4",
            opacity: 0.72,
          }}
        />
        <View
          style={{
            width: cardWidth,
            height: cardHeight,
            flexDirection: "row",
            overflow: "hidden",
            borderRadius: 32,
            backgroundColor: colors.card,
            shadowColor: colors.primary,
            shadowOpacity: 0.15,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 30 },
            elevation: 14,
            ...(Platform.OS === "web"
              ? { boxShadow: "0px 30px 80px rgba(11,42,91,0.15)" }
              : {}),
          }}
        >
          <View
            style={{
              width: "45%",
              minWidth: 0,
              paddingHorizontal: panelPadding,
              paddingVertical: 32,
              justifyContent: "space-between",
              backgroundColor: colors.card,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                accessibilityLabel="Poultech Solutions logo"
                contentFit="contain"
                source={require("../../assets/images/logo-mark-light.png")}
                style={{ width: 40, height: 40 }}
              />
              <Text
                style={{
                  marginLeft: 10,
                  color: COLOR_PRIMARY,
                  fontFamily: FONT_BOLD,
                  fontSize: 16,
                }}
              >
                Poultech Solutions
              </Text>
              <View
                accessibilityLabel="Language: English"
                style={{
                  marginLeft: "auto",
                  borderWidth: 1,
                  borderColor: COLOR_LINE,
                  borderRadius: 999,
                  backgroundColor: colors.cardSoft,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ color: COLOR_MUTED, fontFamily: FONT_SEMIBOLD, fontSize: 10 }}>
                  EN
                </Text>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "space-between",
                paddingVertical: 12,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              {formContent}
              {footer}
            </ScrollView>
          </View>
          <View style={{ width: "55%", minWidth: 0 }}>
            <AuthHeroPanel />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.page }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        style={{ flex: 1 }}
      >
        <MobileHero height={height} />
        <View
          style={{
            flex: 1,
            marginTop: 14,
            marginHorizontal: 14,
            borderRadius: 28,
            backgroundColor: colors.card,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 22,
          }}
        >
          {formContent}
          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  if (width >= 900) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.page }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <LoginForm />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LoginForm />
    </SafeAreaView>
  );
}
