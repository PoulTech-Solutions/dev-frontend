import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SIDEBAR_WIDTH, useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useAuthStore } from "../../store/useAuthStore";
import { useLanguage } from "../../utils/i18n";

type MenuItem =
  | { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; danger?: false }
  | { label: string; icon: keyof typeof Ionicons.glyphMap; action: "logout"; danger: true };

const ITEMS: MenuItem[] = [
  { label: "Settings", icon: "settings-outline", href: "/(tabs)/profile" },
  { label: "Contact Us", icon: "chatbubbles-outline", href: "/company/contact" },
  { label: "Report Issue", icon: "warning-outline", href: "/company/contact" },
  { label: "Log out", icon: "log-out-outline", action: "logout", danger: true },
];

export function ProfileMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  const { sidebarVisible } = useAppLayout();
  const signOut = useAuthStore((state) => state.signOut);
  const menuWidth = sidebarVisible ? SIDEBAR_WIDTH - 24 : Math.min(SIDEBAR_WIDTH - 8, 220);

  const handleLogout = async () => {
    try {
      onClose();
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Could not sign out.", error);
      Alert.alert(t("Unable to log out"), t("Please try again."));
    }
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityLabel={t("Close")}
          onPress={onClose}
          style={{ flex: 1, backgroundColor: colors.overlay }}
        />
        <View
          style={{
            position: "absolute",
            left: sidebarVisible ? 12 : 16,
            bottom: Math.max(insets.bottom, 16) + (sidebarVisible ? 78 : 88),
            width: menuWidth,
            maxWidth: SIDEBAR_WIDTH - 24,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.card,
            padding: 8,
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {ITEMS.map((item) => {
              const danger = Boolean(item.danger);
              return (
                <View key={item.label} style={{ width: "50%", padding: 4 }}>
                  <Pressable
                    accessibilityRole="button"
                    className="cursor-pointer hover:bg-slate-50"
                    onPress={() => {
                      if ("action" in item && item.action === "logout") {
                        void handleLogout();
                        return;
                      }
                      onClose();
                      if ("href" in item) router.push(item.href);
                    }}
                    style={{
                      minHeight: 64,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: danger ? "#FECACA" : colors.line,
                      backgroundColor: danger ? "#FEF2F2" : colors.cardSoft,
                      paddingHorizontal: 6,
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons color={danger ? "#B91C1C" : colors.ink} name={item.icon} size={18} />
                    <Text
                      numberOfLines={2}
                      style={{
                        marginTop: 6,
                        color: danger ? "#B91C1C" : colors.ink,
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 10,
                        textAlign: "center",
                        lineHeight: 13,
                      }}
                    >
                      {t(item.label)}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
