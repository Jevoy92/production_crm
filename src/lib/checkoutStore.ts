import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CheckoutEntry = {
  stars: number;
  toolsOk: boolean;
  toolsMissing?: string;
  issues?: string;
  savedAt: number;
};

type CheckoutState = {
  dailyCheckouts: Record<string, CheckoutEntry>;
  saveCheckout: (dateISO: string, entry: Omit<CheckoutEntry, "savedAt">) => void;
  clearCheckout: (dateISO: string) => void;
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      dailyCheckouts: {},
      saveCheckout: (dateISO, entry) =>
        set((s) => ({
          dailyCheckouts: {
            ...s.dailyCheckouts,
            [dateISO]: { ...entry, savedAt: Date.now() },
          },
        })),
      clearCheckout: (dateISO) =>
        set((s) => {
          const next = { ...s.dailyCheckouts };
          delete next[dateISO];
          return { dailyCheckouts: next };
        }),
    }),
    { name: "production-os-checkouts-v1" },
  ),
);

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};