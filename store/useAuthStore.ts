import { Platform } from "react-native";
import { create } from "zustand";

export type UserRole = "admin" | "customer" | "poultry_owner";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  farmName?: string;
  city?: string;
  state?: string;
  photoUri?: string;
  role?: UserRole | null;
  isProfileComplete?: boolean;
  mustVerifyEmail?: boolean;
}

export type SelfSelectedRole = Exclude<UserRole, "admin">;

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isRemembered: boolean;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
  completeSignIn: (
    user: AuthUser,
    accessToken: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  completeProfile: (profile: {
    name: string;
    email?: string;
    phone?: string;
    farmName?: string;
    city?: string;
    state?: string;
    photoUri?: string;
    role: UserRole;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
}

const initialSession = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialSession,
  isHydrated: false,
  isRemembered: false,
  hydrate: async () => {
    try {
      const { loadAuthSession, clearAuthSession } = await import("../services/authStorage");
      const session = await loadAuthSession();
      let accessToken = session.accessToken;
      const remembered = Boolean(session.user);

      if (Platform.OS === "web" && session.user && !accessToken) {
        try {
          const { refreshAccessToken } = await import("../services/authService");
          const tokens = await refreshAccessToken();
          accessToken = tokens.access_token;
        } catch {
          await clearAuthSession();
          set({ ...initialSession, isHydrated: true, isRemembered: false });
          return;
        }
      }

      set({
        user: session.user,
        accessToken,
        isAuthenticated: Boolean(accessToken && session.user),
        isRemembered: remembered,
        isHydrated: true,
      });
    } catch (error) {
      set({ isHydrated: true });
      throw error;
    }
  },
  setUser: async (user) => {
    const state = get();
    const { saveAuthSession } = await import("../services/authStorage");
    await saveAuthSession(
      { user, accessToken: state.accessToken },
      { persist: state.isRemembered },
    );
    set({ user });
  },
  completeSignIn: async (user, accessToken, rememberMe = true) => {
    const { clearAuthSession, saveAuthSession } = await import("../services/authStorage");
    if (rememberMe) await saveAuthSession({ user, accessToken }, { persist: true });
    else await clearAuthSession();
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isRemembered: rememberMe,
    });
  },
  setRole: async (role) => {
    const currentUser = get().user;
    if (!currentUser) throw new Error("Cannot set a role before a user is signed in.");

    const user = { ...currentUser, role };
    const { saveAuthSession } = await import("../services/authStorage");
    if (get().isRemembered) {
      await saveAuthSession(
        { user, accessToken: get().accessToken },
        { persist: true },
      );
    }
    set({ user });
  },
  completeProfile: async (profile) => {
    const currentUser = get().user;
    if (!currentUser) throw new Error("Cannot complete a profile before signing in.");

    const user: AuthUser = {
      ...currentUser,
      ...profile,
      name: profile.name.trim(),
      email: profile.email?.trim() || undefined,
      phone: profile.phone?.trim() || undefined,
      farmName: profile.farmName?.trim() || undefined,
      city: profile.city?.trim() || undefined,
      state: profile.state?.trim() || undefined,
      photoUri: profile.photoUri ?? currentUser.photoUri,
    };
    const { saveAuthSession } = await import("../services/authStorage");
    if (get().isRemembered) {
      await saveAuthSession(
        { user, accessToken: get().accessToken },
        { persist: true },
      );
    }
    set({ user });
  },
  signOut: async () => {
    const { clearAuthSession } = await import("../services/authStorage");
    const token = get().accessToken;
    if (token) {
      try {
        const { logoutSession } = await import("../services/authService");
        await logoutSession();
      } catch {
        // Local sign-out still proceeds if the server session is already gone.
      }
    }
    await clearAuthSession();
    set({ ...initialSession, isHydrated: true, isRemembered: false });
  },
  setAccessToken: async (accessToken) => {
    const { saveAuthSession } = await import("../services/authStorage");
    const state = get();
    if (state.isRemembered && state.user) {
      await saveAuthSession({ user: state.user, accessToken }, { persist: true });
    }
    set({ accessToken, isAuthenticated: Boolean(accessToken && state.user) });
  },
}));
