/**
 * Web: Google Identity Services (JWT credential). Configure via EXPO_PUBLIC_* in frontend/.env.
 */
import { useCallback, useEffect, useState } from "react";
import { googleAuthEnv, googleOriginSetupMessage } from "../config/googleAuth";
import { isMockAuthEnabled, useGoogleLogin as useBackendGoogleLogin } from "./useAuth";

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

let gsiLoad: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  gsiLoad ??= new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = GSI_SCRIPT;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(tag);
  });
  return gsiLoad;
}

type GsiId = NonNullable<NonNullable<Window["google"]>["accounts"]>["id"];

export function useGoogleAuth() {
  const webClientId = googleAuthEnv.webClientId;
  const backend = useBackendGoogleLogin();
  const [isPrompting, setIsPrompting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!webClientId || isMockAuthEnabled) return;
    let cancelled = false;
    void loadGsiScript().then(() => {
      if (!cancelled) setReady(Boolean(window.google?.accounts?.id));
    });
    return () => {
      cancelled = true;
    };
  }, [webClientId]);

  const signInWithGoogle = useCallback(async () => {
    if (isMockAuthEnabled) return backend.mutateAsync("mock-google-id-token");
    if (!webClientId) throw new Error("Google Sign-In not configured");

    await loadGsiScript();
    const gsi: GsiId | undefined = window.google?.accounts?.id;
    if (!gsi) throw new Error("Google Sign-In is still initializing. Try again shortly.");

    setIsPrompting(true);
    let host: HTMLDivElement | null = null;
    try {
      const idToken = await new Promise<string>((resolve, reject) => {
        let settled = false;
        let timer = 0;

        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          fn();
        };

        const cleanup = () => {
          host?.remove();
          host = null;
        };

        gsi.initialize({
          client_id: webClientId,
          callback: (response) => {
            finish(() => {
              cleanup();
              if (response.credential) resolve(response.credential);
              else reject(new Error("Google did not return an ID token."));
            });
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });

        host = document.createElement("div");
        host.style.position = "fixed";
        host.style.inset = "0";
        host.style.display = "flex";
        host.style.alignItems = "center";
        host.style.justifyContent = "center";
        host.style.background = "rgba(15, 23, 42, 0.45)";
        host.style.zIndex = "99999";
        document.body.appendChild(host);

        const panel = document.createElement("div");
        panel.style.background = "#fff";
        panel.style.borderRadius = "12px";
        panel.style.padding = "20px";
        host.appendChild(panel);

        const title = document.createElement("p");
        title.textContent = "Continue with Google";
        title.style.margin = "0 0 12px";
        title.style.fontFamily = "system-ui, sans-serif";
        title.style.fontSize = "14px";
        title.style.color = "#334155";
        panel.appendChild(title);

        const buttonMount = document.createElement("div");
        panel.appendChild(buttonMount);

        gsi.renderButton(buttonMount, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 300,
        });

        host.addEventListener("click", (ev) => {
          if (ev.target === host) {
            finish(() => {
              cleanup();
              reject(new Error("Google sign-in cancelled."));
            });
          }
        });

        timer = window.setTimeout(() => {
          finish(() => {
            cleanup();
            reject(new Error(googleOriginSetupMessage("Google sign-in timed out.")));
          });
        }, 180_000);
      });

      return await backend.mutateAsync(idToken);
    } finally {
      setIsPrompting(false);
      host?.remove();
    }
  }, [webClientId, backend]);

  return {
    signInWithGoogle,
    isLoading: isPrompting || backend.isPending || (Boolean(webClientId) && !ready),
    isConfigured: Boolean(webClientId) || isMockAuthEnabled,
  };
}