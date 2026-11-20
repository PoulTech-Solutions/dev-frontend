import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";

export function FormModal({
  visible,
  title,
  onClose,
  children,
  size = "default",
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "default" | "large";
}) {
  const { t } = useLanguage();
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const large = size === "large";
  const maxWidth = large ? 760 : 460;
  const maxBodyHeight = Math.min(height * (large ? 0.78 : 0.7), large ? 640 : 420);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: "center", padding: 18, backgroundColor: colors.overlay }}>
        <Pressable accessibilityLabel={t("Close")} onPress={onClose} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <View
          style={{
            width: "100%",
            maxWidth,
            alignSelf: "center",
            borderRadius: 22,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.line,
            padding: large ? 20 : 18,
            maxHeight: height * 0.9,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <Text
              style={{
                flex: 1,
                color: colors.primary,
                fontFamily: "Poppins_700Bold",
                fontSize: large ? 20 : 18,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {t(title)}
            </Text>
            <Pressable
              accessibilityLabel={t("Close")}
              onPress={onClose}
              style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.cardSoft }}
            >
              <Ionicons color={colors.ink} name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: maxBodyHeight }}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
