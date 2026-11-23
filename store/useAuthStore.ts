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
  district?: string;
  tehsil?: string;
  pincode?: string;
  photoUri?: string;
  role?: UserRole | null;
  /** Raw RBAC name from API (`staff`, `farm_owner`, …). */
  backendRole?: string;
  isProfileComplete?: boolean;
  mustVerifyEmail?: boolean;
}

export type SelfSelectedRole = Exclude<UserRole, "admin">;

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isRemembered: boolean;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
  completeSignIn: (
    user: AuthUser,
    accessToken: string,
    rememberMe?: boolean,
    refreshToken?: string | null,
  ) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  completeProfile: (profile: {
    name: string;
    email?: string;
    phone?: string;
    farmName?: string;
    city?: string;
    state?: string;
    district?: string;
    tehsil?: string;
    pincode?: string;
    photoUri?: string;
    role: UserRole;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  setAccessToken: (accessToken: string, refreshToken?: string | null) => Promise<void>;
}

const initialSession = {
  user: null,
  accessToken: null,
  refreshToken: null as string | null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialSession,
  isHydrated: false,
  isRemembered: false,
  hydrate: async () => {
    try {
      const { loadAuthSession, clearAuthSession, saveAuthSession } = await import("../services/authStorage");
      const { refreshAccessToken, fetchProfile } = await import("../services/authService");
      const session = await loadAuthSession();
      let accessToken = session.accessToken;
      let refreshToken = session.refreshToken ?? null;
      let user = session.user;
      const shouldRestore = Boolean(session.user) || Boolean(refreshToken);

      if (shouldRestore) {
        try {
          const tokens = await refreshAccessToken(refreshToken);
          accessToken = tokens.access_token;
          if (tokens.refresh_token) refreshToken = tokens.refresh_token;
          user = await fetchProfile(tokens.access_token);
          await saveAuthSession(
            { user, accessToken, refreshToken },
            { persist: Boolean(user) },
          );
        } catch {
          await clearAuthSession();
          set({ ...initialSession, isHydrated: true, isRemembered: false });
          return;
        }
      }

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken && user),
        isRemembered: Boolean(user),
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
  completeSignIn: async (user, accessToken, rememberMe = true, refreshToken?: string | null) => {
    const { clearAuthSession, saveAuthSession } = await import("../services/authStorage");
    const nextRefresh = refreshToken ?? get().refreshToken;
    if (rememberMe) await saveAuthSession({ user, accessToken, refreshToken: nextRefresh }, { persist: true });
    else await clearAuthSession();
    set({
      user,
      accessToken,
      refreshToken: nextRefresh,
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
      district: profile.district?.trim() || undefined,
      tehsil: profile.tehsil?.trim() || undefined,
      pincode: profile.pincode?.trim() || undefined,
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
    if (get().accessToken) {
      try {
        const { logoutSession } = await import("../services/authService");
        await logoutSession();
      } catch {
        // Local sign-out still proceeds if the server session is already gone.
      }
    }
    try {
      const { clearAuthSession } = await import("../services/authStorage");
      await clearAuthSession();
    } catch {
      // Drop in-memory session even if storage clear fails.
    }
    try {
      const { appQueryClient } = await import("../services/appQueryClient");
      appQueryClient.clear();
    } catch {
      // Cache clear is best-effort.
    }
    set({ ...initialSession, isHydrated: true, isRemembered: false });
  },
  setAccessToken: async (accessToken, refreshToken) => {
    const { saveAuthSession } = await import("../services/authStorage");
    const state = get();
    const nextRefresh = refreshToken === undefined ? state.refreshToken : refreshToken;
    if (state.isRemembered && state.user) {
      await saveAuthSession(
        { user: state.user, accessToken, refreshToken: nextRefresh },
        { persist: true },
      );
    }
    set({
      accessToken,
      refreshToken: nextRefresh,
      isAuthenticated: Boolean(accessToken && state.user),
    });
  },
}));
