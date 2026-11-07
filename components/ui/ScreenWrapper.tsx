import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
  statusBarStyle?: "light" | "dark";
}

export function ScreenWrapper({
  children,
  className = "bg-surface-muted",
  statusBarStyle = "dark",
}: ScreenWrapperProps) {
  return (
    <SafeAreaView className={`flex-1 ${className}`}>
      <StatusBar style={statusBarStyle} />
      {children}
    </SafeAreaView>
  );
}
