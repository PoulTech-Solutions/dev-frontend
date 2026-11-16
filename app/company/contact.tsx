import { Linking, Pressable, Text } from "react-native";
import { CompanyLine, CompanyScreen } from "../../components/company/CompanyScreen";
import { useLanguage } from "../../utils/i18n";

const SUPPORT_EMAIL = "support@poultech.in";

export default function ContactScreen() {
  const { t } = useLanguage();

  return (
    <CompanyScreen title="Contact us" icon="call" color="#0369A1" background="#E0F2FE">
      <CompanyLine icon="mail" color="#0369A1" background="#E0F2FE" text="Email the Poultech team about your farm, rates, services, or marketplace." />
      <Pressable
        accessibilityLabel={t("Open email")}
        accessibilityRole="button"
        className="cursor-pointer"
        onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        style={{
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          backgroundColor: "#0B2A5B",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>
          {SUPPORT_EMAIL}
        </Text>
      </Pressable>
    </CompanyScreen>
  );
}
