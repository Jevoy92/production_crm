import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Focus Mode — pomodoro-style timer with per-task time tracking.
 *
 * Sessions are logged here (per-device history powering the Focus page
 * analytics). Cumulative per-task time is ALSO written to the synced
 * Task.focusedSec field on session end (see focus.tsx), so time-spent shows
 * on the Tasks page, syncs across the team, and rides into Pals/AI context
 * with the task data.
 */

export type FocusSession = {
  id: string;
  taskId?: string;
  taskTitle: string;
  startedAt: number;
  endedAt?: number;
  plannedMin: number;
  /** Actual focused seconds (pauses excluded). */
  focusedSec: number;
  completedTask: boolean;
  laps?: FocusLap[];
  notes?: FocusNote[];
};

export type FocusLap = { id: string; label: string; atSec: number };
export type FocusNote = { id: string; ts: number; text: string };

type FocusState = {
  /** Completed session log (newest first, capped). */
  sessions: FocusSession[];
  /** Active session (not yet in `sessions`). */
  activeTaskId?: string;
  activeTaskTitle?: string;
  plannedMin: number;
  running: boolean;
  /** Seconds focused so far in the active session. */
  elapsedSec: number;
  /** Epoch ms when the current run segment started (undefined while paused). */
  runStartedTs?: number;
  sessionStartedAt?: number;
  /** Queue of task ids to focus next. */
  queue: string[];
  /** Lap markers + notes for the ACTIVE session. */
  laps: FocusLap[];
  notes: FocusNote[];
  /** Daily focus goal in minutes (default 8h). */
  dailyGoalMin: number;

  start: (taskId: string | undefined, taskTitle: string, plannedMin?: number) => void;
  pause: () => void;
  resume: () => void;
  setPlannedMin: (m: number) => void;
  /** Fold the current run segment into elapsedSec (call before reading). */
  settle: () => void;
  /** End + log the session. Returns the focused seconds. */
  end: (completedTask: boolean) => number;
  enqueue: (taskId: string) => void;
  dequeue: (taskId: string) => void;
  lap: (label?: string) => void;
  addNote: (text: string) => void;
  setDailyGoalMin: (m: number) => void;
};

const now = () => Date.now();

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      plannedMin: 25,
      running: false,
      elapsedSec: 0,
      queue: [],
      laps: [],
      notes: [],
      dailyGoalMin: 480,

      start: (taskId, taskTitle, plannedMin) =>
        set({
          activeTaskId: taskId,
          activeTaskTitle: taskTitle,
          plannedMin: plannedMin ?? get().plannedMin,
          running: true,
          elapsedSec: 0,
          runStartedTs: now(),
          sessionStartedAt: now(),
          queue: get().queue.filter((q) => q !== taskId),
          laps: [],
          notes: [],
        }),

      pause: () => {
        get().settle();
        set({ running: false, runStartedTs: undefined });
      },

      resume: () => set({ running: true, runStartedTs: now() }),

      setPlannedMin: (m) => set({ plannedMin: m }),

      settle: () => {
        const { running, runStartedTs, elapsedSec } = get();
        if (running && runStartedTs) {
          set({
            elapsedSec: elapsedSec + Math.floor((now() - runStartedTs) / 1000),
            runStartedTs: now(),
          });
        }
      },

      end: (completedTask) => {
        get().settle();
        const s = get();
        const focusedSec = s.elapsedSec;
        if (s.sessionStartedAt && focusedSec > 0) {
          const session: FocusSession = {
            id: `fs_${now()}_${Math.random().toString(36).slice(2, 6)}`,
            taskId: s.activeTaskId,
            taskTitle: s.activeTaskTitle ?? "Untitled focus",
            startedAt: s.sessionStartedAt,
            endedAt: now(),
            plannedMin: s.plannedMin,
            focusedSec,
            completedTask,
            laps: s.laps,
            notes: s.notes,
          };
          set({ sessions: [session, ...s.sessions].slice(0, 400) });
        }
        set({
          activeTaskId: undefined,
          activeTaskTitle: undefined,
          running: false,
          elapsedSec: 0,
          runStartedTs: undefined,
          sessionStartedAt: undefined,
          laps: [],
          notes: [],
        });
        return focusedSec;
      },

      enqueue: (taskId) =>
        set({ queue: get().queue.includes(taskId) ? get().queue : [...get().queue, taskId] }),
      dequeue: (taskId) => set({ queue: get().queue.filter((q) => q !== taskId) }),
      lap: (label) => {
        get().settle();
        const s = get();
        if (!s.sessionStartedAt) return;
        set({
          laps: [
            ...s.laps,
            {
              id: `lap_${now()}_${Math.random().toString(36).slice(2, 5)}`,
              label: label?.trim() || `Lap ${s.laps.length + 1}`,
              atSec: s.elapsedSec,
            },
          ],
        });
      },
      addNote: (text) => {
        const t = text.trim();
        if (!t) return;
        set({
          notes: [
            ...get().notes,
            { id: `fn_${now()}_${Math.random().toString(36).slice(2, 5)}`, ts: now(), text: t },
          ],
        });
      },
      setDailyGoalMin: (m) => set({ dailyGoalMin: Math.max(30, Math.min(16 * 60, m)) }),
    }),
    { name: "po-focus:v1" },
  ),
);

/* ── Analytics helpers ─────────────────────────────────────────────────── */

/** hh:mm:ss mono clock string. */
export function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s2 = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s2)}` : `${pad(m)}:${pad(s2)}`;
}

export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function todayStats(sessions: FocusSession[]) {
  const t = Date.now();
  const today = sessions.filter((s) => isSameDay(s.startedAt, t));
  return {
    totalSec: today.reduce((n, s) => n + s.focusedSec, 0),
    sessions: today.length,
    tasksDone: today.filter((s) => s.completedTask).length,
  };
}

/** Last 7 days of focused seconds, oldest → newest (for the mini bar chart). */
export function last7Days(sessions: FocusSession[]): { day: string; sec: number }[] {
  const out: { day: string; sec: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.getTime();
    out.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      sec: sessions
        .filter((s) => isSameDay(s.startedAt, key))
        .reduce((n, s) => n + s.focusedSec, 0),
    });
  }
  return out;
}
