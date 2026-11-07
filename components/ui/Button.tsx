import { useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useLanguage } from "../../utils/i18n";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const { t } = useLanguage();
  const isDisabled = disabled || loading;
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      accessibilityLabel={t(accessibilityLabel)}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className="cursor-pointer"
      disabled={isDisabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={{
        width: "100%",
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        paddingHorizontal: 20,
        backgroundColor:
          variant === "primary"
            ? isDisabled
              ? "#86EFAC"
              : isPressed
                ? "#15803D"
                : "#16A34A"
            : variant === "secondary"
              ? isPressed
                ? "#F8FAFC"
                : "#FFFFFF"
              : "transparent",
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: variant === "secondary" ? "#E2E8F0" : "transparent",
        opacity: isDisabled && variant !== "primary" ? 0.55 : 1,
        transform: [{ scale: isPressed && !isDisabled ? 0.98 : 1 }],
        ...(variant === "primary"
          ? {
              shadowColor: "#16A34A",
              shadowOpacity: isDisabled ? 0 : 0.22,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: isDisabled ? 0 : 4,
            }
          : {}),
      }}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityLabel={t("Loading")}
          color={variant === "primary" ? "#FFFFFF" : "#0B2A5B"}
        />
      ) : (
        <Text
          style={{
            color: variant === "primary" ? "#FFFFFF" : "#0B2A5B",
            fontFamily: "Poppins_600SemiBold",
            fontSize: 15,
          }}
        >
          {t(label)}
        </Text>
      )}
    </Pressable>
  );
}
