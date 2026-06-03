import { create } from "zustand";

/** Shared open-state for the Pals AI drawer (used by the launcher + sidebar). */
export const usePalsUI = create<{
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
