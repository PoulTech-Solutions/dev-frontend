import { ResponseType } from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";
import { isMockAuthEnabled, useGoogleLogin } from "./useAuth";

WebBrowser.maybeCompleteAuthSession();

const fallbackClientId = "google-client-not-configured.apps.googleusercontent.com";

export function useGoogleAuth() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const hasClientId =
    Platform.OS === "web"
      ? Boolean(webClientId)
      : Platform.OS === "android"
        ? Boolean(androidClientId)
        : Boolean(iosClientId);
  const [request, , promptAsync] = useIdTokenAuthRequest({
    clientId: fallbackClientId,
    webClientId: webClientId || fallbackClientId,
    androidClientId: androidClientId || fallbackClientId,
    iosClientId: iosClientId || fallbackClientId,
    responseType: ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
  });
  const googleLogin = useGoogleLogin();
  const [isPrompting, setIsPrompting] = useState(false);

  const signInWithGoogle = async () => {
    if (isMockAuthEnabled) return googleLogin.mutateAsync("mock-google-id-token");
    if (!hasClientId) throw new Error("Google Sign-In not configured");
    if (!request) throw new Error("Google Sign-In is still initializing. Try again shortly.");

    setIsPrompting(true);
    try {
      const result = await promptAsync();
      if (result.type === "cancel" || result.type === "dismiss") return null;
      if (result.type !== "success") {
        throw new Error(
          result.type === "error"
            ? result.error?.message ?? "Google Sign-In could not be completed."
            : "Google Sign-In could not be completed.",
        );
      }

      const idToken = result.params.id_token ?? result.authentication?.idToken;
      if (!idToken) throw new Error("Google did not return an ID token.");
      return await googleLogin.mutateAsync(idToken);
    } finally {
      setIsPrompting(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading: isPrompting || googleLogin.isPending || (hasClientId && !request),
    isConfigured: hasClientId || isMockAuthEnabled,
  };
}
