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
import type { AdminUserItem, InternalRole } from "../../services/adminService";
import { FormModal } from "../ui/FormModal";

const REGULAR = "Poppins_400Regular";
const SEMIBOLD = "Poppins_600SemiBold";
const BOLD = "Poppins_700Bold";

function displayName(row: AdminUserItem) {
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  if (name) return name;
  const local = row.email?.split("@")[0]?.trim();
  return local || "User";
}

function Tag({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "slate" | "blue" | "red";
}) {
  const palette = {
    green: { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
    slate: { bg: "#F8FAFC", border: "#E2E8F0", text: "#475569" },
    blue: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
    red: { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" },
  }[tone];

  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: palette.text, fontFamily: SEMIBOLD, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

function roleTone(role: string): "blue" | "slate" | "green" {
  const r = role.toLowerCase();
  if (r === "admin" || r === "super_admin") return "blue";
  if (r === "staff") return "green";
  return "slate";
}

function roleLabel(role: string, t: (s: string) => string) {
  const r = role.toLowerCase();
  if (r === "super_admin") return t("Super admin");
  if (r === "admin") return t("Admin");
  if (r === "staff") return t("Staff");
  if (r === "farmer" || r === "user") return t("Farmer");
  return role;
}

export function InternalUsersPanel({
  createOpen = false,
  onCreateOpenChange,
}: {
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}) {
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
    setRole("staff");
    setOtp("");
    setOtpSessionId("");
    setMasked("");
    setHint("");
    startMutation.reset();
    confirmMutation.reset();
  };

  const closeCreate = () => {
    onCreateOpenChange?.(false);
    resetForm();
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
      {
        onSuccess: () => {
          resetForm();
          onCreateOpenChange?.(false);
        },
      },
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
  const users = listQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={{ gap: 10 }}>
      {listQuery.isLoading ? <ActivityIndicator color={colors.ink} /> : null}

      {!listQuery.isLoading && users.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 14,
            backgroundColor: colors.card,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 13 }}>
            {t("No users in the directory yet.")}
          </Text>
        </View>
      ) : null}

      {users.map((row) => (
        <View
          key={row.user_id}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 160, gap: 4 }}>
            <Text style={{ color: colors.ink, fontFamily: BOLD, fontSize: 14 }} numberOfLines={1}>
              {displayName(row)}
            </Text>
            <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }} numberOfLines={1}>
              {row.email}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              <Tag label={roleLabel(row.role, t)} tone={roleTone(row.role)} />
              <Tag
                label={row.is_email_verified ? t("Verified") : t("Not verified")}
                tone={row.is_email_verified ? "green" : "amber"}
              />
              <Tag
                label={row.is_active ? t("Active") : t("Deactivated")}
                tone={row.is_active ? "green" : "red"}
              />
            </View>
          </View>

          {canCreateAndManage ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: "auto" }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => statusMutation.mutate({ userId: row.user_id, isActive: !row.is_active })}
                style={{
                  borderRadius: 8,
                  backgroundColor: "#EFF6FF",
                  borderWidth: 1,
                  borderColor: "#BFDBFE",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: "#1D4ED8", fontFamily: SEMIBOLD, fontSize: 12 }}>
                  {row.is_active ? t("Deactivate") : t("Reactivate")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => deleteMutation.mutate(row.user_id)}
                style={{
                  borderRadius: 8,
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FECACA",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
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
          style={{
            alignSelf: "flex-start",
            borderRadius: 8,
            backgroundColor: "#EFF6FF",
            borderWidth: 1,
            borderColor: "#BFDBFE",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          {listQuery.isFetchingNextPage ? (
            <ActivityIndicator color="#1D4ED8" />
          ) : (
            <Text style={{ color: "#1D4ED8", fontFamily: SEMIBOLD, fontSize: 12 }}>{t("Load more")}</Text>
          )}
        </Pressable>
      ) : null}

      {canCreateAndManage ? (
        <FormModal
          onClose={closeCreate}
          title={allowAdminRole ? "Add staff or admin" : "Add staff"}
          visible={createOpen}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 11, lineHeight: 16, marginBottom: 8 }}>
              {t(
                allowAdminRole
                  ? "Create admin or staff. We email a code to their address first. After it is verified the account is created with email verified."
                  : "Create staff. We email a code to their address first. After it is verified the account is created with email verified.",
              )}
            </Text>

            <TextInput
              onChangeText={setFirstName}
              placeholder={t("First name")}
              placeholderTextColor={colors.muted}
              style={fieldStyle}
              value={firstName}
            />
            <TextInput
              onChangeText={setLastName}
              placeholder={t("Last name")}
              placeholderTextColor={colors.muted}
              style={fieldStyle}
              value={lastName}
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={t("Email")}
              placeholderTextColor={colors.muted}
              style={fieldStyle}
              value={email}
            />
            <TextInput
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder={t("Mobile number")}
              placeholderTextColor={colors.muted}
              style={fieldStyle}
              value={phone}
            />
            <TextInput
              onChangeText={setPassword}
              placeholder={t("Temporary password")}
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={fieldStyle}
              value={password}
            />

            {allowAdminRole ? (
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
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
                    <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 12 }}>
                      {t(item === "admin" ? "Admin" : "Staff")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={sendCode}
              style={{
                alignSelf: "flex-start",
                borderRadius: 10,
                backgroundColor: "#15803D",
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 8,
              }}
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
                      <Text style={{ color: "#fff", fontFamily: SEMIBOLD, fontSize: 13 }}>
                        {t("Verify and create")}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable disabled={!cooldown.canResend || pending} onPress={resend}>
                    <Text
                      style={{
                        color: cooldown.canResend ? colors.accent : colors.muted,
                        fontFamily: SEMIBOLD,
                        fontSize: 12,
                      }}
                    >
                      {cooldown.canResend ? t("Resend code") : `${t("Resend in")} ${cooldown.secondsLeft}s`}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {stepError ? (
              <Text style={{ color: "#B91C1C", fontFamily: REGULAR, fontSize: 12, marginTop: 4 }}>
                {getApiErrorMessage(stepError) ?? t("Could not create account.")}
              </Text>
            ) : null}
          </View>
        </FormModal>
      ) : null}
    </View>
  );
}
