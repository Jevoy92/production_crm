import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Personal Google Calendar "secret iCal address" — stored per device. */
export const useCalendarStore = create<{
  icsUrl: string;
  setIcsUrl: (u: string) => void;
}>()(
  persist(
    (set) => ({ icsUrl: "", setIcsUrl: (u) => set({ icsUrl: u.trim() }) }),
    { name: "po-calendar:v1" },
  ),
);
