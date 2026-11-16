import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

export function FormModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: "center", padding: 18, backgroundColor: colors.overlay }}>
        <Pressable accessibilityLabel={t("Close")} onPress={onClose} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ width: "100%", maxWidth: 460, alignSelf: "center", borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ flex: 1, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t(title)}</Text>
            <Pressable
              accessibilityLabel={t("Close")}
              onPress={onClose}
              style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.cardSoft }}
            >
              <Ionicons color={colors.ink} name="close" size={20} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
