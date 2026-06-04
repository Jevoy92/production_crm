import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

/**
 * Watches the shared tasks list and fires a toast when something changes
 * that matters to the current operator. Mount once near the app root.
 *
 * Triggers (only for the *current operator*, set in Settings → Acting as):
 *  - A new task is created and assigned to you
 *  - An existing task is reassigned TO you
 *  - A task assigned to you is marked done by someone else
 *  - The due date on one of your tasks changes
 */
export function useTaskNotifications() {
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const activeRole = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === activeRole);

  const prevRef = useRef<Map<string, { assigneeId: string; status: string; dueDate?: string }> | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    const snapshot = new Map(
      tasks.map((t) => [t.id, { assigneeId: t.assigneeId, status: t.status, dueDate: t.dueDate }]),
    );

    // Skip toasts on the first render — that's just hydration, not real change.
    if (!seededRef.current) {
      seededRef.current = true;
      prevRef.current = snapshot;
      return;
    }

    const prev = prevRef.current;
    prevRef.current = snapshot;
    if (!prev || !me) return;

    for (const t of tasks) {
      const before = prev.get(t.id);
      const isMine = t.assigneeId === me.id;

      if (!before) {
        // Newly created
        if (isMine) {
          toast(`New task assigned to you`, {
            description: t.title,
          });
        }
        continue;
      }

      // Reassigned to me
      if (before.assigneeId !== t.assigneeId && isMine) {
        toast(`Task reassigned to you`, { description: t.title });
        continue;
      }

      if (!isMine) continue;

      // Status flipped to done by someone (could be you — that's OK, light toast)
      if (before.status !== "done" && t.status === "done") {
        toast.success(`Task completed`, { description: t.title });
        continue;
      }

      // Due date changed
      if ((before.dueDate ?? "") !== (t.dueDate ?? "")) {
        toast(`Due date updated`, {
          description: `${t.title}${t.dueDate ? ` → ${new Date(t.dueDate).toLocaleDateString()}` : " (cleared)"}`,
        });
      }
    }
  }, [tasks, me]);
}