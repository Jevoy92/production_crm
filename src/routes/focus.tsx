import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { motion } from "motion/react";
import { AppShell } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { useFocusStore, fmtDuration, todayStats, last7Days } from "@/lib/focusStore";
import { useNotifications } from "@/lib/notifications";
import { celebrate } from "@/lib/confetti";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Check,
  ListTodo,
  Zap,
  Plus,
  Coffee,
  ArrowLeft,
  GripVertical,
  Timer,
} from "lucide-react";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

const SearchSchema = z.object({
  task: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/focus")({
  validateSearch: zodValidator(SearchSchema),
  component: FocusPage,
  head: () => ({ meta: [{ title: "Focus Mode · Production OS" }] }),
});

const DURATIONS = [25, 45, 60, 90];
const R = 126;
const CIRC = 2 * Math.PI * R;

function FocusPage() {
  const { task: taskParam } = Route.useSearch();
  const tasks = useStore((s) => s.tasks);
  const updateTask = useStore((s) => s.updateTask);
  const team = useStore((s) => s.team);
  const activeRole = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === activeRole);

  const fs = useFocusStore();
  const notify = useNotifications((s) => s.notify);

  // Re-render every second while running.
  const [, forceTick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!fs.running) return;
    const iv = setInterval(() => {
      useFocusStore.getState().settle();
      forceTick();
    }, 1000);
    return () => clearInterval(iv);
  }, [fs.running]);

  // Deep-link: /focus?task=ID starts a session for that task.
  React.useEffect(() => {
    if (taskParam && fs.activeTaskId !== taskParam) {
      const t = tasks.find((x) => x.id === taskParam);
      if (t) fs.start(t.id, t.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskParam]);

  const activeTask = tasks.find((t) => t.id === fs.activeTaskId);
  const plannedSec = fs.plannedMin * 60;
  const remaining = Math.max(0, plannedSec - fs.elapsedSec);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = plannedSec > 0 ? Math.min(1, fs.elapsedSec / plannedSec) : 0;
  const sessionUp = fs.sessionStartedAt != null && remaining === 0;

  // Tab title shows the countdown while focused.
  React.useEffect(() => {
    if (fs.sessionStartedAt && fs.running) document.title = `${mm}:${ss} · Focus — Production OS`;
    else document.title = "Focus Mode · Production OS";
    return () => {
      document.title = "Production OS";
    };
  }, [mm, ss, fs.running, fs.sessionStartedAt]);

  /** Log time to the synced task + bell, optionally complete the task. */
  const endSession = (completeTask: boolean, e?: React.MouseEvent) => {
    const t = activeTask;
    const focused = fs.end(completeTask);
    if (t && focused > 0) {
      updateTask(t.id, {
        focusedSec: (t.focusedSec ?? 0) + focused,
        ...(completeTask ? { status: "done" as const } : {}),
      });
      notify({
        kind: "task",
        title: completeTask ? "Task completed in Focus" : "Focus session logged",
        description: `${t.title} · ${fmtDuration(focused)}`,
        to: "/tasks",
      });
      toast.success(completeTask ? "Task completed 🎉" : "Session logged", {
        description: `${fmtDuration(focused)} on “${t.title}”`,
      });
    } else if (focused > 0) {
      toast.success("Session logged", { description: fmtDuration(focused) });
    }
    if (completeTask) celebrate(e ?? null, 80);
    // Auto-advance to next queued task.
    const next = useFocusStore.getState().queue[0];
    if (next) {
      const nt = useStore.getState().tasks.find((x) => x.id === next);
      if (nt) useFocusStore.getState().start(nt.id, nt.title);
    }
  };

  // Queue + suggestions
  const myOpen = tasks.filter((t) => t.status !== "done" && (!me || t.assigneeId === me.id));
  const queueTasks = fs.queue
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean) as typeof tasks;
  const suggestions = myOpen
    .filter((t) => t.id !== fs.activeTaskId && !fs.queue.includes(t.id))
    .sort((a, b) => (a.priority === "High" ? -1 : 1) - (b.priority === "High" ? -1 : 1))
    .slice(0, 5);

  const stats = todayStats(fs.sessions);
  const week = last7Days(fs.sessions);
  const weekMax = Math.max(1, ...week.map((d) => d.sec));

  const subDone = activeTask?.subtasks?.filter((s) => s.done).length ?? 0;
  const subTotal = activeTask?.subtasks?.length ?? 0;
  const taskProgress =
    subTotal > 0
      ? Math.round((subDone / subTotal) * 100)
      : fs.sessionStartedAt
        ? Math.round(progress * 100)
        : 0;

  return (
    <AppShell
      eyebrow="Deep work"
      title="Focus Mode"
      subtitle={
        fs.sessionStartedAt
          ? `In session · ${fs.activeTaskTitle ?? "untitled"}`
          : "Pick a task, start the timer, ship it"
      }
      actions={
        <Link to="/tasks" className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5">
          <ArrowLeft size={13} /> Tasks
        </Link>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* ── Center: timer ── */}
        <div className="flex flex-col items-center gap-7 py-2">
          <div className="text-center">
            <p className="text-[10.5px] font-bold text-lo uppercase tracking-[0.18em] mb-1">
              Focus session · Pomodoro
            </p>
            <h2 className="font-display font-bold text-hi text-lg">
              {fs.sessionStartedAt
                ? fs.running
                  ? "Deep work — active"
                  : "Paused"
                : "Ready when you are"}
            </h2>
          </div>

          {/* Ring */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
            <svg width="280" height="280" viewBox="0 0 280 280">
              <defs>
                <linearGradient id="focusRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-500)" />
                  <stop offset="100%" stopColor="var(--accent-violet)" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
              <motion.circle
                cx="140"
                cy="140"
                r={R}
                fill="none"
                stroke="url(#focusRing)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animate={{ strokeDashoffset: CIRC * progress }}
                transition={{ duration: 0.9, ease: "linear" }}
                transform="rotate(-90 140 140)"
              />
              <circle
                cx="140"
                cy="140"
                r={R - 11}
                fill="none"
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.4"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-0.5 num">
                <span className="text-6xl lg:text-7xl font-bold text-hi font-display leading-none">
                  {mm}
                </span>
                <span
                  className={`text-5xl lg:text-6xl font-light text-brand-400 leading-none ${fs.running ? "animate-pulse" : ""}`}
                >
                  :
                </span>
                <span className="text-6xl lg:text-7xl font-bold text-hi font-display leading-none">
                  {ss}
                </span>
              </div>
              <p className="text-[10.5px] font-semibold text-lo mt-2 uppercase tracking-[0.18em]">
                {sessionUp ? "Time's up — take a break" : "Remaining"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                fs.settle();
                useFocusStore.setState({ elapsedSec: Math.max(0, fs.elapsedSec - 60) });
              }}
              className="w-10 h-10 rounded-full bg-panel border border-line flex items-center justify-center text-mid hover:text-hi transition-colors"
              aria-label="Back 1 minute"
              title="Back 1 minute"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={() => {
                if (!fs.sessionStartedAt) {
                  const first = queueTasks[0] ?? suggestions[0];
                  fs.start(first?.id, first?.title ?? "Untitled focus");
                } else if (fs.running) fs.pause();
                else fs.resume();
              }}
              className={`w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 flex items-center justify-center text-white transition-all shadow-lg shadow-brand-600/30 ${fs.running ? "focus-pulse" : ""}`}
              aria-label={fs.running ? "Pause" : "Start"}
            >
              {fs.running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button
              onClick={() => {
                fs.settle();
                useFocusStore.setState({ elapsedSec: Math.min(plannedSec, fs.elapsedSec + 60) });
              }}
              className="w-10 h-10 rounded-full bg-panel border border-line flex items-center justify-center text-mid hover:text-hi transition-colors"
              aria-label="Forward 1 minute"
              title="Forward 1 minute"
            >
              <SkipForward size={14} />
            </button>
          </div>

          {/* Duration pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {DURATIONS.map((m) => (
              <button
                key={m}
                onClick={() => fs.setPlannedMin(m)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  fs.plannedMin === m
                    ? "border-brand-500 text-brand-400 bg-brand-600/10"
                    : "border-line text-lo hover:text-mid hover:border-line-strong"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>

          {/* Now in focus */}
          <div className="w-full max-w-xl bg-panel border border-line rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-violet" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {fs.running && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${fs.sessionStartedAt ? "bg-emerald" : "bg-line-strong"}`}
                  />
                </span>
                <span
                  className={`text-[10.5px] font-bold uppercase tracking-wider ${fs.sessionStartedAt ? "text-emerald" : "text-lo"}`}
                >
                  {fs.sessionStartedAt ? "Now in focus" : "No active task"}
                </span>
              </div>
              {activeTask && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet/10 text-violet border border-violet/25 uppercase tracking-wide">
                  {activeTask.priority} priority
                </span>
              )}
            </div>

            {fs.sessionStartedAt ? (
              <>
                <h3 className="font-display text-xl font-bold text-hi leading-snug mb-1.5">
                  {fs.activeTaskTitle}
                </h3>
                {activeTask?.notes && (
                  <p className="text-sm text-mid mb-4 leading-relaxed line-clamp-2">
                    {activeTask.notes}
                  </p>
                )}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-lo font-medium">
                      {subTotal > 0 ? `Subtasks ${subDone}/${subTotal}` : "Session progress"}
                    </span>
                    <span className="text-xs text-hi font-semibold num">{taskProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-sunken rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${taskProgress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => (fs.running ? fs.pause() : fs.resume())}
                    className="flex-1 ph-btn ph-btn-primary flex items-center justify-center gap-2"
                  >
                    {fs.running ? <Pause size={14} /> : <Play size={14} />}
                    {fs.running ? "Pause task" : "Resume task"}
                  </button>
                  <button
                    onClick={(e) => endSession(true, e)}
                    className="ph-btn ph-btn-soft flex items-center gap-2 hover:text-emerald"
                  >
                    <Check size={14} /> Complete
                  </button>
                  <button
                    onClick={() => endSession(false)}
                    className="ph-btn ph-btn-soft"
                    title="End session without completing"
                  >
                    End
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Timer size={22} className="mx-auto text-lo mb-2" />
                <p className="text-sm text-mid mb-4">
                  Pick a task from the queue — or hit play to start an open-ended session.
                </p>
                {suggestions[0] && (
                  <button
                    onClick={() => fs.start(suggestions[0].id, suggestions[0].title)}
                    className="ph-btn ph-btn-primary ph-btn-sm"
                  >
                    <Play size={13} /> Focus “{suggestions[0].title.slice(0, 36)}
                    {suggestions[0].title.length > 36 ? "…" : ""}”
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-lo text-center opacity-70">
            <Coffee size={11} className="inline mr-1 -mt-0.5" />
            Time logs to the task when the session ends — visible on Tasks, synced to the team, and
            in Pals' context.
          </p>
        </div>

        {/* ── Right rail: queue + stats ── */}
        <div className="space-y-4">
          <div className="bg-panel border border-line rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-sunken border border-line flex items-center justify-center text-mid">
                  <ListTodo size={13} />
                </span>
                <h3 className="font-display font-bold text-hi text-sm">Up next</h3>
              </div>
              <span className="text-[11px] text-lo bg-sunken border border-line rounded-md px-2 py-0.5 num">
                {queueTasks.length || suggestions.length} tasks
              </span>
            </div>
            <div className="p-3 space-y-2">
              {(queueTasks.length > 0 ? queueTasks : suggestions).map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => fs.start(t.id, t.title)}
                  className="w-full text-left group bg-sunken border border-line hover:border-brand-500/40 rounded-xl p-3.5 transition-all hover:translate-x-0.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-md bg-panel border border-line flex items-center justify-center text-[10px] font-bold text-lo num">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${t.priority === "High" ? "bg-rose/10 text-rose border border-rose/25" : "bg-sunken text-lo border border-line"}`}
                        >
                          {t.priority}
                        </span>
                        {(t.focusedSec ?? 0) > 0 && (
                          <span className="text-[10px] text-brand-400 num">
                            {fmtDuration(t.focusedSec!)} logged
                          </span>
                        )}
                      </span>
                      <span className="block text-sm font-medium text-mid group-hover:text-hi transition-colors truncate">
                        {t.title}
                      </span>
                      {t.dueDate && (
                        <span className="block text-[11px] text-lo mt-0.5">
                          Due{" "}
                          {new Date(t.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </span>
                    <GripVertical
                      size={12}
                      className="text-lo opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                    />
                  </div>
                </button>
              ))}
              {queueTasks.length === 0 && suggestions.length === 0 && (
                <p className="text-center text-mid text-xs py-6">No open tasks — enjoy it.</p>
              )}
              <Link
                to="/tasks"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-line hover:border-brand-500/40 text-lo hover:text-brand-400 transition-all text-sm"
              >
                <Plus size={13} /> Manage tasks
              </Link>
            </div>
          </div>

          {/* Session stats */}
          <div className="bg-panel border border-line rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-sunken border border-line flex items-center justify-center text-mid">
                <Zap size={13} />
              </span>
              <h3 className="font-display font-bold text-hi text-sm">Session stats</h3>
              <span className="ml-auto text-[11px] text-lo">Today</span>
            </div>

            <div className="bg-sunken rounded-xl border border-line p-4">
              <p className="text-[10px] text-lo font-bold mb-1 uppercase tracking-wider">
                Total focus time
              </p>
              <p className="num text-3xl font-bold text-hi font-display">
                {fmtDuration(stats.totalSec + (fs.sessionStartedAt ? fs.elapsedSec : 0))}
              </p>
              <div className="flex items-end gap-1 mt-3 h-9">
                {week.map((d, i) => (
                  <motion.div
                    key={d.day + i}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(8, (d.sec / weekMax) * 100)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 rounded-sm"
                    style={{
                      background: `color-mix(in oklab, var(--brand-500) ${35 + (i / 6) * 65}%, transparent)`,
                    }}
                    title={`${d.day}: ${fmtDuration(d.sec)}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-lo mt-1">Last 7 days</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sunken rounded-xl border border-line p-3 text-center">
                <p className="num text-2xl font-bold text-hi font-display">
                  {stats.sessions + (fs.sessionStartedAt ? 1 : 0)}
                </p>
                <p className="text-[10px] text-lo mt-0.5 uppercase tracking-wide">Sessions</p>
              </div>
              <div className="bg-sunken rounded-xl border border-line p-3 text-center">
                <p className="num text-2xl font-bold text-hi font-display">{stats.tasksDone}</p>
                <p className="text-[10px] text-lo mt-0.5 uppercase tracking-wide">Tasks done</p>
              </div>
            </div>

            {fs.sessionStartedAt && remaining > 0 && remaining < 8 * 60 && (
              <div className="bg-brand-600/8 border border-brand-500/20 rounded-xl p-3 flex items-start gap-3">
                <Coffee size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-brand-400 mb-0.5">
                    Break in {Math.ceil(remaining / 60)} min
                  </p>
                  <p className="text-[11px] text-mid leading-relaxed">
                    Step away from the screen when the ring closes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
