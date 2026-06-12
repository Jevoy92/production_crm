import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * In-app notification center backing the topbar bell.
 * Fed by useTaskNotifications (task events) — and anything else via notify().
 * Persisted locally so unread state survives reloads (per device, not synced).
 */

export type AppNotification = {
  id: string;
  title: string;
  description?: string;
  kind: "task" | "schedule" | "content" | "system";
  /** Router path to jump to when clicked. */
  to?: string;
  ts: number;
  read: boolean;
};

type NotificationState = {
  items: AppNotification[];
  notify: (n: Omit<AppNotification, "id" | "ts" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
};

export const useNotifications = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      notify: (n) =>
        set({
          items: [
            {
              ...n,
              id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              ts: Date.now(),
              read: false,
            },
            ...get().items,
          ].slice(0, 50), // keep it bounded
        }),
      markAllRead: () => set({ items: get().items.map((i) => ({ ...i, read: true })) }),
      markRead: (id) =>
        set({ items: get().items.map((i) => (i.id === id ? { ...i, read: true } : i)) }),
      clear: () => set({ items: [] }),
    }),
    { name: "po-notifications:v1" },
  ),
);

export const useUnreadCount = () =>
  useNotifications((s) => s.items.reduce((n, i) => (i.read ? n : n + 1), 0));
