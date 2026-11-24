import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/Button";
import { useAppTheme } from "../../hooks/useAppTheme";
import { getAuthErrorMessage, isMockAuthEnabled } from "../../hooks/useAuth";
import {
  confirmEmailChange,
  deleteMyAccount,
  listMySessions,
  revokeMySession,
  startEmailChange,
  type AuthSessionItem,
} from "../../services/authService";
import { useAuthStore } from "../../store/useAuthStore";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { useLanguage } from "../../utils/i18n";

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  editable?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, minWidth: "45%" }}>
      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TextInput
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.cardSoft,
          color: colors.ink,
          fontFamily: "Poppins_500Medium",
          fontSize: 14,
        }}
        value={value}
      />
    </View>
  );
}

export function AccountSecurityPanel() {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const completeSignIn = useAuthStore((s) => s.completeSignIn);
  const signOut = useAuthStore((s) => s.signOut);
  const live = !isMockAuthEnabled && Boolean(user) && !user?.id.startsWith("mock-");

  const sessionsQuery = useQuery({
    queryKey: ["me", "sessions"],
    queryFn: listMySessions,
    enabled: live,
    staleTime: 30_000,
  });

  const [emailNext, setEmailNext] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailOtpSession, setEmailOtpSession] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteNote, setDeleteNote] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refreshSessions = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["me", "sessions"] });
  }, [queryClient]);

  useEffect(() => {
    if (live) refreshSessions();
  }, [live, refreshSessions]);

  if (!live) {
    return (
      <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
        {t("Sign in with the real API to manage email, sessions, and account deletion.")}
      </Text>
    );
  }

  const startEmail = async () => {
    setEmailNote("");
    if (!emailNext.trim() || !emailPassword) {
      setEmailNote(t("Enter the new email and your current password."));
      return;
    }
    setEmailBusy(true);
    try {
      const challenge = await startEmailChange({ email: emailNext.trim(), password: emailPassword });
      setEmailOtpSession(challenge.otp_session_id);
      setEmailNote(
        challenge.hint ||
          t("We sent a code to your new email.") +
            (challenge.masked_destination ? ` (${challenge.masked_destination})` : ""),
      );
    } catch (error) {
      setEmailNote(getApiErrorMessage(error) ?? getAuthErrorMessage(error));
    } finally {
      setEmailBusy(false);
    }
  };

  const confirmEmail = async () => {
    setEmailNote("");
    if (!emailOtpSession || emailOtp.length !== 6) {
      setEmailNote(t("Enter the 6-digit code from your new email."));
      return;
    }
    setEmailBusy(true);
    try {
      const result = await confirmEmailChange({ otp_session_id: emailOtpSession, otp: emailOtp });
      await completeSignIn(result.user, result.access_token, true);
      setEmailNext("");
      setEmailPassword("");
      setEmailOtp("");
      setEmailOtpSession("");
      setEmailNote(t("Email updated. Other devices were signed out."));
      refreshSessions();
    } catch (error) {
      setEmailNote(getApiErrorMessage(error) ?? getAuthErrorMessage(error));
    } finally {
      setEmailBusy(false);
    }
  };

  const revoke = async (session: AuthSessionItem) => {
    if (session.current) return;
    try {
      await revokeMySession(session.session_id);
      refreshSessions();
    } catch (error) {
      setDeleteNote(getApiErrorMessage(error) ?? getAuthErrorMessage(error));
    }
  };

  const deactivate = async () => {
    setDeleteNote("");
    if (!deletePassword) {
      setDeleteNote(t("Enter your password to deactivate the account."));
      return;
    }
    setDeleteBusy(true);
    try {
      const result = await deleteMyAccount(deletePassword);
      setDeleteNote(result.message);
      await signOut();
    } catch (error) {
      setDeleteNote(getApiErrorMessage(error) ?? getAuthErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  const sessions = sessionsQuery.data?.items ?? [];

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 13 }}>{t("Change email")}</Text>
        <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
          {t("We verify the new address with a code. Your current password is required.")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Field
            label={t("New email")}
            onChangeText={setEmailNext}
            placeholder={t("you@example.com")}
            value={emailNext}
          />
          <Field
            label={t("Current password")}
            onChangeText={setEmailPassword}
            secureTextEntry
            value={emailPassword}
          />
        </View>
        {!emailOtpSession ? (
          <Button
            accessibilityLabel={t("Send email code")}
            label="Send code"
            loading={emailBusy}
            onPress={() => void startEmail()}
          />
        ) : (
          <View style={{ gap: 8 }}>
            <Field label={t("Verification code")} onChangeText={setEmailOtp} placeholder={t("6 digits")} value={emailOtp} />
            <Button
              accessibilityLabel={t("Confirm new email")}
              label="Confirm email"
              loading={emailBusy}
              onPress={() => void confirmEmail()}
            />
          </View>
        )}
        {emailNote ? (
          <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>{emailNote}</Text>
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: colors.line }} />

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 13 }}>{t("Active sessions")}</Text>
        <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
          {t("One device at a time is enforced. You can close other sessions here.")}
        </Text>
        {sessionsQuery.isLoading ? <ActivityIndicator color={colors.ink} /> : null}
        {sessions.map((session) => (
          <View
            key={session.session_id}
            style={{
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              padding: 10,
              backgroundColor: colors.cardSoft,
              gap: 4,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
              {session.current ? t("This device") : t("Other device")}
            </Text>
            <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
              {session.user_agent?.slice(0, 80) || t("Unknown browser")}
            </Text>
            <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>
              {t("Last used")}: {new Date(session.last_used_at).toLocaleString()}
            </Text>
            {!session.current ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void revoke(session)}
                style={{ alignSelf: "flex-start", marginTop: 4 }}
              >
                <Text style={{ color: "#B91C1C", fontFamily: "Poppins_700Bold", fontSize: 11 }}>
                  {t("Sign out this device")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {!sessionsQuery.isLoading && sessions.length === 0 ? (
          <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
            {t("No open sessions returned.")}
          </Text>
        ) : null}
      </View>

      <View style={{ height: 1, backgroundColor: colors.line }} />

      <View style={{ gap: 8 }}>
        <Text style={{ color: "#B91C1C", fontFamily: "Poppins_700Bold", fontSize: 13 }}>
          {t("Deactivate account")}
        </Text>
        <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
          {t('Soft-deletes access. You can reactivate later from login with "Reactivate account".')}
        </Text>
        {!confirmDelete ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmDelete(true)}
            style={{
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: "#FECACA",
              backgroundColor: "#FEF2F2",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#B91C1C", fontFamily: "Poppins_700Bold", fontSize: 11 }}>
              {t("Deactivate…")}
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 8 }}>
            <Field
              label={t("Password")}
              onChangeText={setDeletePassword}
              secureTextEntry
              value={deletePassword}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <View style={{ minWidth: 140 }}>
                <Button
                  accessibilityLabel={t("Confirm deactivate")}
                  label={t("Confirm deactivate")}
                  loading={deleteBusy}
                  onPress={() => void deactivate()}
                />
              </View>
              <Pressable
                onPress={() => {
                  setConfirmDelete(false);
                  setDeletePassword("");
                }}
                style={{ justifyContent: "center", paddingHorizontal: 8 }}
              >
                <Text style={{ color: colors.muted, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                  {t("Cancel")}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        {deleteNote ? (
          <Text style={{ color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{deleteNote}</Text>
        ) : null}
      </View>
    </View>
  );
}
