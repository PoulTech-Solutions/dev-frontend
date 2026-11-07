import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { useAuthStore } from "../../../store/useAuthStore";
import { useWalletStore } from "../../../store/useWalletStore";
import { DEMO_WALLET } from "../../../utils/demoData";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useLanguage } from "../../../utils/i18n";

function formatCurrency(value: number | null, language: string) {
  if (value === null) return "—";
  return `₹${value.toLocaleString(`${language}-IN`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WalletScreen() {
  const { width } = useAppLayout();
  const { language, t } = useLanguage();
  const isDemoSession = useAuthStore((state) => Boolean(state.user?.id.startsWith("mock-")));
  const balance = useWalletStore((state) => state.balance);
  const referralBalance = useWalletStore((state) => state.referralBalance);
  const referralCode = useWalletStore((state) => state.referralCode);
  const [shareError, setShareError] = useState("");
  const contentWidth = Math.min(width - 36, 920);
  const displayedBalance = isDemoSession ? DEMO_WALLET.balance : balance;
  const displayedReferralBalance = isDemoSession ? DEMO_WALLET.referralBalance : referralBalance;
  const displayedReferralCode = isDemoSession ? DEMO_WALLET.referralCode : referralCode;

  const shareReferralCode = async () => {
    if (!displayedReferralCode) return;
    setShareError("");
    try {
      await Share.share({ message: t("Join me on Poultech Solutions with my referral code: {code}").replace("{code}", displayedReferralCode) });
    } catch (error) {
      console.error("Could not share referral code.", error);
      setShareError("Could not open sharing. Please try again.");
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader
            title="Wallet"
            subtitle="Your wallet and referral rewards in one place."
          />
          {isDemoSession ? (
            <View style={{ marginBottom: 14, flexDirection: "row", alignItems: "center", borderRadius: 13, backgroundColor: "#FFFBEB", padding: 11 }}>
              <Ionicons color="#A16207" name="information-circle-outline" size={17} />
              <Text style={{ flex: 1, marginLeft: 7, color: "#854D0E", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>
                {t("Demo wallet · sample balances and transactions; no real funds")}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              overflow: "hidden",
              borderRadius: 24,
              backgroundColor: "#0B2A5B",
              padding: 22,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: -40,
                top: -60,
                width: 190,
                height: 190,
                borderRadius: 100,
                backgroundColor: "rgba(34,197,94,0.12)",
              }}
            />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Ionicons color="#FFFFFF" name="wallet-outline" size={21} />
              </View>
              <Text style={{ marginLeft: 11, color: "rgba(255,255,255,0.82)", fontFamily: "Poppins_500Medium", fontSize: 13 }}>
                {t("Available balance")}
              </Text>
            </View>
            <Text style={{ marginTop: 20, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 32 }}>
              {formatCurrency(displayedBalance, language)}
            </Text>
            <Text style={{ marginTop: 4, color: "rgba(255,255,255,0.68)", fontFamily: "Poppins_400Regular", fontSize: 11 }}>
              {t(isDemoSession ? "Sample balance for preview only." : "Balance details will update when wallet data is connected.")}
            </Text>
          </View>

          <View
            style={{
              marginTop: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              padding: 18,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#EAF8EC" }}>
                <Ionicons color="#14532D" name="gift-outline" size={19} />
              </View>
              <View style={{ flex: 1, marginLeft: 11 }}>
                <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>
                  {t("Referral rewards")}
                </Text>
                <Text style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                  {displayedReferralCode ? t("Your code: {code}").replace("{code}", displayedReferralCode) : t("Your referral code will appear here when available.")}
                </Text>
              </View>
              <Text style={{ color: "#14532D", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                {formatCurrency(displayedReferralBalance, language)}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t("Share referral code")}
              accessibilityRole="button"
              accessibilityState={{ disabled: !displayedReferralCode }}
              className={displayedReferralCode ? "cursor-pointer hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-accent" : ""}
              disabled={!displayedReferralCode}
              onPress={() => void shareReferralCode()}
              style={{
                minHeight: 46,
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                backgroundColor: displayedReferralCode ? "#16A34A" : "#DCFCE7",
              }}
            >
              <Ionicons color={displayedReferralCode ? "#FFFFFF" : "#64748B"} name="share-social-outline" size={17} />
              <Text style={{ marginLeft: 8, color: displayedReferralCode ? "#FFFFFF" : "#64748B", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                {t(displayedReferralCode ? "Share referral code" : "Referral sharing unavailable")}
              </Text>
            </Pressable>
            {shareError ? (
              <Text accessibilityLiveRegion="polite" style={{ marginTop: 8, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                {t(shareError)}
              </Text>
            ) : null}
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ marginBottom: 12, color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
              {t("Recent activity")}
            </Text>
            {isDemoSession ? (
              <View style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 16 }}>
                {DEMO_WALLET.transactions.map((transaction) => (
                  <View key={`${transaction.title}-${transaction.date}`} style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingVertical: 13 }}>
                    <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: transaction.type === "credit" ? "#DCFCE7" : "#EFF6FF" }}>
                      <Ionicons color={transaction.type === "credit" ? "#15803D" : "#1D4ED8"} name={transaction.type === "credit" ? "arrow-down-outline" : "cart-outline"} size={18} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 11 }}>
                      <Text style={{ color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{t(transaction.title)}</Text>
                      <Text style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 9 }}>{t(transaction.detail)} · {t(transaction.date)}</Text>
                    </View>
                    <Text style={{ color: transaction.type === "credit" ? "#15803D" : "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                      {transaction.amount > 0 ? "+" : "−"}{formatCurrency(Math.abs(transaction.amount), language)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="receipt-outline"
                title={t("No wallet activity yet")}
                description={t("Wallet transactions and referral earnings will appear here when available.")}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
