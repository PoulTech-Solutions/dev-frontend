import { create } from "zustand";

interface WalletState {
  balance: number | null;
  referralBalance: number | null;
  referralCode: string | null;
  setWallet: (details: {
    balance: number;
    referralBalance: number;
    referralCode: string | null;
  }) => void;
  setBalance: (balance: number) => void;
  setReferralCode: (code: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  referralBalance: null,
  referralCode: null,
  setWallet: ({ balance, referralBalance, referralCode }) =>
    set({ balance, referralBalance, referralCode }),
  setBalance: (balance) => set({ balance }),
  setReferralCode: (referralCode) => set({ referralCode }),
}));
