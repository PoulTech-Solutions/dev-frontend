import type { Ref, ReactNode } from "react";
import { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  prefix?: string;
  error?: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "number-pad";
  onBlur?: () => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  accessibilityLabel: string;
  autoComplete?:
    | "tel"
    | "email"
    | "sms-otp"
    | "off"
    | "current-password"
    | "new-password";
  maxLength?: number;
  secureTextEntry?: boolean;
  rightElement?: ReactNode;
  returnKeyType?: "next" | "done" | "go";
  inputRef?: Ref<TextInput>;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  prefix,
  error,
  keyboardType = "default",
  onBlur,
  onFocus,
  onSubmitEditing,
  accessibilityLabel,
  autoComplete = "off",
  maxLength,
  secureTextEntry = false,
  rightElement,
  returnKeyType,
  inputRef,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ width: "100%" }}>
      <Text
        style={{
          marginBottom: 8,
          color: "#0F172A",
          fontFamily: "Poppins_600SemiBold",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 14,
          borderWidth: error ? 1.5 : isFocused ? 1.5 : 1,
          borderColor: error ? "#DC2626" : isFocused ? "#16A34A" : "#E2E8F0",
          backgroundColor: "#F8FAFC",
          paddingHorizontal: 16,
          ...(isFocused && !error
            ? {
                shadowColor: "#DCFCE7",
                shadowOpacity: 1,
                shadowRadius: 0,
                shadowOffset: { width: 0, height: 0 },
                elevation: 0,
                ...(Platform.OS === "web"
                  ? { boxShadow: "0 0 0 4px #DCFCE7" }
                  : {}),
              }
            : {}),
        }}
      >
        {prefix ? (
          <Text
            style={{
              marginRight: 12,
              overflow: "hidden",
              borderRadius: 10,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 10,
              paddingVertical: 7,
              color: "#0B2A5B",
              fontFamily: "Poppins_600SemiBold",
              fontSize: 13,
            }}
          >
            {prefix}
          </Text>
        ) : null}
        {icon ? <View style={{ marginRight: 10 }}>{icon}</View> : null}
        <TextInput
          ref={inputRef}
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="none"
          autoComplete={autoComplete}
          autoCorrect={false}
          className="auth-input min-w-0 flex-1 outline-none"
          keyboardType={keyboardType}
          maxLength={maxLength}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          style={{
            height: 50,
            minWidth: 0,
            flex: 1,
            color: "#0F172A",
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
            paddingVertical: 0,
          }}
          value={value}
        />
        {rightElement}
      </View>
      {error ? (
        <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
          <Text
            accessibilityLiveRegion="polite"
            style={{
              marginLeft: 5,
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
