import type { Ref, ReactNode } from "react";
import { useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../hooks/useAppTheme";

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
  const { colors } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const localRef = useRef<TextInput | null>(null);

  const assignRef = (node: TextInput | null) => {
    localRef.current = node;
    if (typeof inputRef === "function") inputRef(node);
    else if (inputRef && "current" in inputRef) {
      (inputRef as { current: TextInput | null }).current = node;
    }
  };

  // Android Autofill often highlights email+password together and steals focus / hides the IME.
  const nativeAutoComplete = Platform.OS === "android" ? "off" : autoComplete;
  const textContentType =
    Platform.OS === "ios"
      ? autoComplete === "email"
        ? "emailAddress"
        : autoComplete === "current-password"
          ? "password"
          : autoComplete === "new-password"
            ? "newPassword"
            : autoComplete === "tel"
              ? "telephoneNumber"
              : "none"
      : undefined;

  return (
    <View style={{ width: "100%" }}>
      <Text
        style={{
          marginBottom: 8,
          color: colors.ink,
          fontFamily: "Poppins_600SemiBold",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={() => localRef.current?.focus()}
        style={{
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 14,
          borderWidth: error ? 1.5 : isFocused ? 1.5 : 1,
          borderColor: error ? "#DC2626" : isFocused ? "#16A34A" : colors.line,
          backgroundColor: colors.cardSoft,
          paddingHorizontal: 16,
          ...(isFocused && !error && Platform.OS === "web"
            ? { boxShadow: "0 0 0 4px #DCFCE7" }
            : {}),
        }}
      >
        {prefix ? (
          <Text
            style={{
              marginRight: 12,
              overflow: "hidden",
              borderRadius: 10,
              backgroundColor: colors.card,
              paddingHorizontal: 10,
              paddingVertical: 7,
              color: colors.primary,
              fontFamily: "Poppins_600SemiBold",
              fontSize: 13,
            }}
          >
            {prefix}
          </Text>
        ) : null}
        {icon ? <View style={{ marginRight: 10 }} pointerEvents="none">{icon}</View> : null}
        <TextInput
          ref={assignRef}
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="none"
          autoComplete={nativeAutoComplete}
          autoCorrect={false}
          blurOnSubmit={false}
          caretHidden={false}
          className="auth-input"
          editable
          importantForAutofill={Platform.OS === "android" ? "no" : "auto"}
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
          placeholderTextColor={colors.muted}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          showSoftInputOnFocus
          style={{
            height: 50,
            minWidth: 0,
            flex: 1,
            color: colors.ink,
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
            paddingVertical: Platform.OS === "android" ? 8 : 0,
            textAlignVertical: "center",
            ...(Platform.OS === "web" ? ({ outlineStyle: "none", outlineWidth: 0 } as object) : {}),
          }}
          textContentType={textContentType}
          underlineColorAndroid="transparent"
          value={value}
        />
        {rightElement}
      </Pressable>
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
