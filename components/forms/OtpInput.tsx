import { useRef, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  error?: string;
}

const OTP_LENGTH = 6;

export function OtpInput({ value, onChange, onComplete, error }: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const updateDigit = (index: number, input: string) => {
    const digits = input.replace(/\D/g, "");
    const next = value.split("");

    if (digits.length > 1) {
      digits
        .slice(0, OTP_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });
      onChange(next.join("").slice(0, OTP_LENGTH));
      inputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    next[index] = digits;
    onChange(next.join("").slice(0, OTP_LENGTH));
    if (digits && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== "Backspace") return;
    if (value[index]) {
      const next = value.split("");
      next[index] = "";
      onChange(next.join(""));
    } else if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = value.split("");
      next[index - 1] = "";
      onChange(next.join(""));
    }
  };

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            accessibilityLabel={`Verification code digit ${index + 1}`}
            autoComplete={index === 0 ? "sms-otp" : "off"}
            className="outline-none"
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            onBlur={() => setFocusedIndex(null)}
            onChangeText={(text) => updateDigit(index, text)}
            onFocus={() => setFocusedIndex(index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            onSubmitEditing={index === OTP_LENGTH - 1 ? onComplete : undefined}
            returnKeyType={index === OTP_LENGTH - 1 ? "done" : "next"}
            textContentType={index === 0 ? "oneTimeCode" : "none"}
            style={{
              width: 52,
              maxWidth: 52,
              minWidth: 0,
              height: 56,
              flex: 1,
              borderRadius: 14,
              borderWidth: error ? 1.5 : focusedIndex === index ? 1.5 : 1,
              borderColor: error
                ? "#DC2626"
                : focusedIndex === index
                  ? "#16A34A"
                  : "#E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#0B2A5B",
              fontFamily: "Poppins_600SemiBold",
              fontSize: 20,
              textAlign: "center",
              ...(focusedIndex === index && !error
                ? {
                    ...(Platform.OS === "web"
                      ? { boxShadow: "0 0 0 4px #DCFCE7" }
                      : {}),
                  }
                : {}),
            }}
            value={value[index] ?? ""}
          />
        ))}
      </View>
      {error ? (
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: "#DC2626",
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
