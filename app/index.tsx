import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuthStore } from "../store/useAuthStore";

const TITLE_STYLE = {
  marginTop: 24,
  color: "#FFFFFF",
  fontFamily: "Poppins_700Bold",
  fontSize: 34,
  letterSpacing: -0.5,
  textAlign: "center" as const,
};

const TAGLINE_STYLE = {
  marginTop: 8,
  color: "rgba(255,255,255,0.8)",
  fontFamily: "Poppins_400Regular",
  fontSize: 16,
  textAlign: "center" as const,
};

export default function SplashScreenView() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const progress = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoEntranceScale = useSharedValue(0.7);
  const logoPulseScale = useSharedValue(1);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(16);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 450 });
    logoEntranceScale.value = withSpring(1, { damping: 14, stiffness: 150 });
    logoPulseScale.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        false,
      ),
    );
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
    taglineOpacity.value = withDelay(550, withTiming(1, { duration: 600 }));
    taglineTranslateY.value = withDelay(550, withTiming(0, { duration: 600 }));
    progress.value = withTiming(1, { duration: 2400 });
  }, [
    logoOpacity,
    logoEntranceScale,
    logoPulseScale,
    titleOpacity,
    titleTranslateY,
    taglineOpacity,
    taglineTranslateY,
    progress,
  ]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      router.replace(accessToken ? "/(tabs)/dashboard" : "/(auth)/login");
    }, 2800);

    return () => clearTimeout(timer);
  }, [accessToken, isHydrated, router]);

  const logoEntranceStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoEntranceScale.value }],
  }));
  const logoPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoPulseScale.value }],
  }));
  const titleEntranceStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  const taglineEntranceStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));
  const progressStyle = useAnimatedStyle(() => ({
    width: 220 * progress.value,
  }));

  return (
    <LinearGradient
      colors={["#0B2A5B", "#123C85"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ flex: 1, overflow: "hidden" }}
    >
      <Svg
        height={280}
        pointerEvents="none"
        style={{ position: "absolute", left: -140, top: -140 }}
        width={280}
      >
        <Defs>
          <RadialGradient id="topLeftGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#22C55E" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={140} cy={140} fill="url(#topLeftGlow)" r={140} />
      </Svg>
      <Svg
        height={200}
        pointerEvents="none"
        style={{ position: "absolute", right: -100, bottom: -100 }}
        width={200}
      >
        <Defs>
          <RadialGradient id="bottomRightGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#22C55E" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={100} cy={100} fill="url(#bottomRightGlow)" r={100} />
      </Svg>

      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Animated.View
            style={[
              {
                width: 118,
                height: 118,
                borderRadius: 31,
                borderWidth: 3,
                borderColor: "rgba(255,255,255,0.2)",
                overflow: "hidden",
                shadowColor: "#22C55E",
                shadowRadius: 24,
                shadowOpacity: 0.45,
                shadowOffset: { width: 0, height: 0 },
                elevation: 10,
                ...(Platform.OS === "web"
                  ? { boxShadow: "0px 0px 24px rgba(34,197,94,0.45)" }
                  : {}),
              },
              logoPulseStyle,
            ]}
          >
            <Animated.View style={logoEntranceStyle}>
              <Image
                accessibilityLabel="Poultech Solutions logo"
                contentFit="contain"
                source={require("../assets/images/logo.png")}
                style={{ width: 112, height: 112, borderRadius: 28 }}
              />
            </Animated.View>
          </Animated.View>

          <Animated.Text
            style={[TITLE_STYLE, titleEntranceStyle]}
          >
            Poultech Solutions
          </Animated.Text>
          <Animated.Text
            style={[TAGLINE_STYLE, taglineEntranceStyle]}
          >
            Smart Farming. Better Profits.
          </Animated.Text>
        </View>

        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 220,
              height: 4,
              overflow: "hidden",
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Animated.View
              style={[
                {
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#22C55E",
                },
                progressStyle,
              ]}
            />
          </View>
          <Text
            style={{
              marginTop: 12,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "Poppins_400Regular",
              fontSize: 11,
              letterSpacing: 2,
            }}
          >
            GROWING TOGETHER
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
