import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "../../utils/subscriptionPlans";
import { useLanguage } from "../../utils/i18n";

export function PlanPicker({
  selected,
  onSelect,
}: {
  selected: SubscriptionPlanId;
  onSelect: (planId: SubscriptionPlanId) => void;
}) {
  const { t, n } = useLanguage();
  const { colors } = useAppTheme();

  return (
    <View style={{ gap: 12 }}>
      {SUBSCRIPTION_PLANS.map((plan) => {
        const active = selected === plan.id;
        return (
          <Pressable
            key={plan.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="cursor-pointer"
            onPress={() => onSelect(plan.id)}
            style={{
              borderWidth: 2,
              borderColor: active ? plan.color : colors.line,
              borderRadius: 18,
              backgroundColor: active ? plan.background : colors.cardSoft,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: plan.color, fontFamily: "Poppins_700Bold", fontSize: 17 }}>{t(plan.name)}</Text>
                <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>{t(plan.summary)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{n(plan.price)}</Text>
                <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>{t(plan.period)}</Text>
              </View>
              {active ? <Ionicons color={plan.color} name="checkmark-circle" size={22} style={{ marginLeft: 8 }} /> : null}
            </View>
            <View style={{ marginTop: 12, gap: 6 }}>
              {plan.features.map((feature) => (
                <View key={feature} style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons color={plan.color} name="checkmark" size={16} />
                  <Text style={{ marginLeft: 8, color: colors.ink, fontFamily: "Poppins_500Medium", fontSize: 13 }}>{t(feature)}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
