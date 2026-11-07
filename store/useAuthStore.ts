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
  role?: UserRole | null;
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
    role: UserRole;
  }) => Promise<void>;
  signOut: () => Promise<void>;
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
      const { loadAuthSession } = await import("../services/authStorage");
      const session = await loadAuthSession();
      set({
        ...session,
        isAuthenticated: Boolean(session.accessToken && session.user),
        isRemembered: Boolean(session.accessToken && session.user),
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
    await saveAuthSession({ user, accessToken: state.accessToken });
    set({ user });
  },
  completeSignIn: async (user, accessToken, rememberMe = true) => {
    const { clearAuthSession, saveAuthSession } = await import("../services/authStorage");
    if (rememberMe) await saveAuthSession({ user, accessToken });
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
      await saveAuthSession({ user, accessToken: get().accessToken });
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
    };
    const { saveAuthSession } = await import("../services/authStorage");
    if (get().isRemembered) {
      await saveAuthSession({ user, accessToken: get().accessToken });
    }
    set({ user });
  },
  signOut: async () => {
    const { clearAuthSession } = await import("../services/authStorage");
    await clearAuthSession();
    set({ ...initialSession, isHydrated: true, isRemembered: false });
  },
}));
