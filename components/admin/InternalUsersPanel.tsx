import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import {
  useAdminUsers,
  useConfirmInternalUser,
  useDeleteInternalUser,
  useSetInternalUserActive,
  useStartInternalUser,
} from "../../hooks/useAdminUsers";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useResendOtp } from "../../hooks/useAuth";
import { useOtpResendCooldown } from "../../hooks/useOtpResendCooldown";
import { useAuthStore } from "../../store/useAuthStore";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { useLanguage } from "../../utils/i18n";
import { canManageAdmins, canManageStaff } from "../../utils/permissions";
import type { InternalRole } from "../../services/adminService";

const REGULAR = "Poppins_400Regular";
const SEMIBOLD = "Poppins_600SemiBold";

export function InternalUsersPanel() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const backendRole = useAuthStore((state) => state.user?.backendRole);
  const allowAdminRole = canManageAdmins(backendRole);
  const canCreateAndManage = canManageStaff(backendRole);
  const listQuery = useAdminUsers();
  const startMutation = useStartInternalUser();
  const confirmMutation = useConfirmInternalUser();
  const resendOtp = useResendOtp();
  const cooldown = useOtpResendCooldown();
  const statusMutation = useSetInternalUserActive();
  const deleteMutation = useDeleteInternalUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<InternalRole>("staff");
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [masked, setMasked] = useState("");
  const [hint, setHint] = useState("");

  const fieldStyle = {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: REGULAR,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  } as const;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setOtp("");
    setOtpSessionId("");
    setMasked("");
    setHint("");
  };

  const sendCode = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password.trim()) return;
    startMutation.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: allowAdminRole ? role : "staff",
      },
      {
        onSuccess: (challenge) => {
          setOtpSessionId(challenge.otp_session_id);
          setMasked(challenge.masked_destination ?? email.trim());
          setHint(challenge.hint ?? "");
          cooldown.startFromChallenge(challenge.resend_after);
        },
      },
    );
  };

  const confirm = () => {
    if (!otpSessionId || !/^\d{6}$/.test(otp)) return;
    confirmMutation.mutate(
      { otp_session_id: otpSessionId, otp, purpose: "internal_signup" },
      { onSuccess: () => resetForm() },
    );
  };

  const resend = () => {
    if (!otpSessionId || !cooldown.canResend) return;
    resendOtp.mutate(
      { otp_session_id: otpSessionId, purpose: "internal_signup" },
      {
        onSuccess: (challenge) => {
          setHint(challenge.hint ?? "");
          cooldown.startFromChallenge(challenge.resend_after);
        },
      },
    );
  };

  const pending = startMutation.isPending || confirmMutation.isPending || resendOtp.isPending;
  const stepError = startMutation.error ?? confirmMutation.error ?? resendOtp.error;

  const na = (value?: string | null) => (value?.trim() ? value.trim() : t("N/A"));

  return (
    <View style={{ gap: 14 }}>
      {canCreateAndManage ? (
        <>
      <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 11, lineHeight: 16 }}>
        {t(
          allowAdminRole
            ? "Create admin or staff. We email a code to their address first. After it is verified the account is created with email verified."
            : "Create staff. We email a code to their address first. After it is verified the account is created with email verified.",
        )}
      </Text>

      <TextInput onChangeText={setFirstName} placeholder={t("First name")} placeholderTextColor={colors.muted} style={fieldStyle} value={firstName} />
      <TextInput onChangeText={setLastName} placeholder={t("Last name")} placeholderTextColor={colors.muted} style={fieldStyle} value={lastName} />
      <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder={t("Email")} placeholderTextColor={colors.muted} style={fieldStyle} value={email} />
      <TextInput keyboardType="phone-pad" onChangeText={setPhone} placeholder={t("Mobile number")} placeholderTextColor={colors.muted} style={fieldStyle} value={phone} />
      <TextInput onChangeText={setPassword} placeholder={t("Temporary password")} placeholderTextColor={colors.muted} secureTextEntry style={fieldStyle} value={password} />

      {allowAdminRole ? (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
          {(["staff", "admin"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setRole(item)}
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: role === item ? "#15803D" : colors.line,
                backgroundColor: role === item ? "#F0FDF4" : colors.card,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 12 }}>{t(item === "admin" ? "Admin" : "Staff")}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={sendCode}
        style={{ alignSelf: "flex-start", borderRadius: 10, backgroundColor: "#15803D", paddingHorizontal: 14, paddingVertical: 10 }}
      >
        {startMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontFamily: SEMIBOLD, fontSize: 13 }}>
            {t(otpSessionId ? "Send a new code" : "Send verification code")}
          </Text>
        )}
      </Pressable>

      {otpSessionId ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
            {hint || t("Enter the 6-digit code sent to")} {masked}
          </Text>
          <TextInput
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setOtp}
            placeholder="000000"
            placeholderTextColor={colors.muted}
            style={fieldStyle}
            value={otp}
          />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pressable
              onPress={confirm}
              style={{ borderRadius: 10, backgroundColor: "#15803D", paddingHorizontal: 14, paddingVertical: 10 }}
            >
              {confirmMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontFamily: SEMIBOLD, fontSize: 13 }}>{t("Verify and create")}</Text>
              )}
            </Pressable>
            <Pressable disabled={!cooldown.canResend || pending} onPress={resend}>
              <Text style={{ color: cooldown.canResend ? colors.accent : colors.muted, fontFamily: SEMIBOLD, fontSize: 12 }}>
                {cooldown.canResend ? t("Resend code") : `${t("Resend in")} ${cooldown.secondsLeft}s`}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {stepError ? (
        <Text style={{ color: "#B91C1C", fontFamily: REGULAR, fontSize: 12 }}>
          {getApiErrorMessage(stepError) ?? t("Could not create account.")}
        </Text>
      ) : null}
      {confirmMutation.isSuccess ? (
        <Text style={{ color: "#15803D", fontFamily: REGULAR, fontSize: 12 }}>
          {t("Account created. Email is verified. They can sign in with email, password, and OTP.")}
        </Text>
      ) : null}
        </>
      ) : (
        <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 11, lineHeight: 16 }}>
          {t("Farmer contacts only. You cannot create or remove accounts.")}
        </Text>
      )}

      {listQuery.isLoading ? <ActivityIndicator color={colors.ink} /> : null}
      {listQuery.data?.pages.flatMap((page) => page.items).map((row) => (
        <View
          key={row.user_id}
          style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, gap: 6 }}
        >
          <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 14 }}>
            {row.first_name} {row.last_name} · {row.role}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>{row.email}</Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
            {t("Phone")}: {na(row.phone)}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
            {t("Address")}: {na(row.address_line1)}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
            {na(row.village_city)}, {na(row.tehsil)}, {na(row.district)}, {na(row.state)} {na(row.pincode)}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
            {row.is_active ? t("Active") : t("Deactivated")}
            {row.is_email_verified ? ` · ${t("Email verified")}` : ` · ${t("Email not verified")}`}
          </Text>
          {canCreateAndManage ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <Pressable
              onPress={() => statusMutation.mutate({ userId: row.user_id, isActive: !row.is_active })}
              style={{ borderRadius: 8, backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <Text style={{ color: "#1D4ED8", fontFamily: SEMIBOLD, fontSize: 12 }}>
                {row.is_active ? t("Deactivate") : t("Reactivate")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => deleteMutation.mutate(row.user_id)}
              style={{ borderRadius: 8, backgroundColor: "#FEF2F2", paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <Text style={{ color: "#B91C1C", fontFamily: SEMIBOLD, fontSize: 12 }}>{t("Delete")}</Text>
            </Pressable>
          </View>
          ) : null}
        </View>
      ))}
      {listQuery.hasNextPage ? (
        <Pressable
          onPress={() => void listQuery.fetchNextPage()}
          style={{ alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 8 }}
        >
          {listQuery.isFetchingNextPage ? (
            <ActivityIndicator color="#1D4ED8" />
          ) : (
            <Text style={{ color: "#1D4ED8", fontFamily: SEMIBOLD, fontSize: 12 }}>{t("Load more")}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
