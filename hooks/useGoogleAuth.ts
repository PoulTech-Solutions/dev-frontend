import * as AuthSession from "expo-auth-session";
import { ResponseType } from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  GOOGLE_WEB_CLIENT_FALLBACK,
  googleAuthEnv,
  googleOriginSetupMessage,
} from "../config/googleAuth";
import { isMockAuthEnabled, useGoogleLogin } from "./useAuth";

WebBrowser.maybeCompleteAuthSession();

function googleWebRedirectUri(): string | undefined {
  if (Platform.OS !== "web" || typeof window === "undefined") return undefined;
  if (googleAuthEnv.webRedirectUri) return googleAuthEnv.webRedirectUri;
  return AuthSession.makeRedirectUri({ path: "" }).replace(/\/$/, "");
}

export function useGoogleAuth() {
  const { webClientId, androidClientId, iosClientId } = googleAuthEnv;
  const redirectUri = useMemo(() => googleWebRedirectUri(), []);
  const hasClientId =
    Platform.OS === "web"
      ? Boolean(webClientId)
      : Platform.OS === "android"
        ? Boolean(androidClientId)
        : Boolean(iosClientId);
  const [request, , promptAsync] = useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_FALLBACK,
    webClientId: webClientId || GOOGLE_WEB_CLIENT_FALLBACK,
    androidClientId: androidClientId || GOOGLE_WEB_CLIENT_FALLBACK,
    iosClientId: iosClientId || GOOGLE_WEB_CLIENT_FALLBACK,
    responseType: ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
    redirectUri,
    extraParams: { prompt: "select_account" },
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
        const raw =
          result.type === "error"
            ? result.error?.message ?? "Google Sign-In could not be completed."
            : "Google Sign-In could not be completed.";
        if (/redirect_uri|origin|OAuth 2.0 policy/i.test(raw)) {
          const extra = redirectUri
            ? ` Authorized redirect URI (if used): ${redirectUri}.`
            : "";
          throw new Error(`${googleOriginSetupMessage()}.${extra}`);
        }
        throw new Error(raw);
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