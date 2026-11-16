import { create } from "zustand";

interface ShellState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
