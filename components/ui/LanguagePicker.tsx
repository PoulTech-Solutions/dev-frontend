import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { LANGUAGE_NAMES, type AppLanguage, useLanguage } from "../../utils/i18n";

const LANGUAGES: AppLanguage[] = ["en", "hi", "mr"];

export function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const selectLanguage = async (nextLanguage: AppLanguage) => {
    try {
      await setLanguage(nextLanguage);
      setIsOpen(false);
    } catch (error) {
      console.error("Could not save the selected language.", error);
      Alert.alert(t("Unable to change language"), t("Please try again."));
    }
  };

  return (
    <>
      <Pressable
        accessibilityLabel={t("Choose language")}
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={{
          minHeight: 38,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 10,
        }}
      >
        <Ionicons color="#0B2A5B" name="globe-outline" size={17} />
        <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_500Medium", fontSize: 11 }}>
          {LANGUAGE_NAMES[language]}
        </Text>
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsOpen(false)}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15,23,42,0.35)",
            padding: 24,
          }}
        >
          <Pressable
            accessibilityLabel={t("Choose language")}
            onPress={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 340,
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              padding: 20,
            }}
          >
            <Text style={{ marginBottom: 12, color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 17 }}>
              {t("Choose language")}
            </Text>
            <View style={{ gap: 8 }}>
              {LANGUAGES.map((item) => {
                const selected = language === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => void selectLanguage(item)}
                    style={{
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 12,
                      backgroundColor: selected ? "#F0FDF4" : "#F8FAFC",
                      paddingHorizontal: 14,
                    }}
                  >
                    <Text style={{ color: "#0F172A", fontFamily: "Poppins_500Medium", fontSize: 14 }}>
                      {LANGUAGE_NAMES[item]}
                    </Text>
                    {selected ? <Ionicons color="#16A34A" name="checkmark-circle" size={20} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
