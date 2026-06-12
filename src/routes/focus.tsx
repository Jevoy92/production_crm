import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AppShell } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import {
  useFocusStore,
  fmtDuration,
  fmtClock,
  todayStats,
  last7Days,
  isSameDay,
} from "@/lib/focusStore";
import { useNotifications } from "@/lib/notifications";
import { celebrate } from "@/lib/confetti";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Square,
  Check,
  ListTodo,
  Plus,
  Coffee,
  ArrowLeft,
  Flag,
  NotebookPen,
  BarChart3,
  Timer,
  ListChecks,
  CircleDot,
  SkipBack,
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
const R = 158;
const CIRC = 2 * Math.PI * R;

type RightTab = "log" | "notes" | "analytics";

function FocusPage() {
  const { task: taskParam } = Route.useSearch();
  const tasks = useStore((s) => s.tasks);
  const updateTask = useStore((s) => s.updateTask);
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);
  const activeRole = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === activeRole);

  const fs = useFocusStore();
  const notify = useNotifications((s) => s.notify);
  const [tab, setTab] = React.useState<RightTab>("log");
  const [noteDraft, setNoteDraft] = React.useState("");
  const [lapDraft, setLapDraft] = React.useState("");

  // 100ms ticker while running (drives deciseconds + smooth ring).
  const [, forceTick] = React.useReducer((n: number) => n + 1, 0);
  const msRef = React.useRef(0);
  React.useEffect(() => {
    if (!fs.running) return;
    const iv = setInterval(() => {
      msRef.current = (msRef.current + 1) % 10;
      if (msRef.current === 0) useFocusStore.getState().settle();
      forceTick();
    }, 100);
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
  const activeProject = projects.find((p) => p.id === activeTask?.projectId);
  const pomodoro = fs.mode === "pomodoro";
  const plannedSec = fs.plannedMin * 60;
  const remaining = Math.max(0, plannedSec - fs.elapsedSec);
  // Stopwatch counts UP (no racing the clock); pomodoro counts down.
  const displaySec = pomodoro ? remaining : fs.elapsedSec;
  const hh = Math.floor(displaySec / 3600);
  const mm = String(Math.floor((displaySec % 3600) / 60)).padStart(2, "0");
  const ss = String(displaySec % 60).padStart(2, "0");
  const ds = fs.running
    ? pomodoro
      ? String((9 - msRef.current + 10) % 10)
      : String(msRef.current)
    : "0";
  // Ring: pomodoro fills toward the target; stopwatch sweeps once per hour.
  const progress = pomodoro
    ? plannedSec > 0
      ? Math.min(1, fs.elapsedSec / plannedSec)
      : 0
    : (fs.elapsedSec % 3600) / 3600;
  const inSession = fs.sessionStartedAt != null;

  // Tab title countdown.
  React.useEffect(() => {
    document.title =
      inSession && fs.running
        ? `${hh > 0 ? `${String(hh).padStart(2, "0")}:` : ""}${mm}:${ss} · Focus — Production OS`
        : "Focus Mode · Production OS";
    return () => {
      document.title = "Production OS";
    };
  }, [hh, mm, ss, fs.running, inSession]);

  /** Log time + notes to the synced task, optionally complete it. */
  const endSession = React.useCallback((completeTask: boolean, e?: React.MouseEvent) => {
    const t = useStore.getState().tasks.find((x) => x.id === useFocusStore.getState().activeTaskId);
    const sessionNotes = useFocusStore.getState().notes;
    const focused = useFocusStore.getState().end(completeTask);
    if (t && focused > 0) {
      const noteAppendix = sessionNotes.length
        ? `\n\n[Focus ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${fmtDuration(focused)}] ${sessionNotes.map((n) => n.text).join(" · ")}`
        : "";
      useStore.getState().updateTask(t.id, {
        focusedSec: (t.focusedSec ?? 0) + focused,
        ...(noteAppendix ? { notes: `${t.notes ?? ""}${noteAppendix}` } : {}),
        ...(completeTask ? { status: "done" as const } : {}),
      });
      useNotifications.getState().notify({
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
    const next = useFocusStore.getState().queue[0];
    if (next) {
      const nt = useStore.getState().tasks.find((x) => x.id === next);
      if (nt) useFocusStore.getState().start(nt.id, nt.title);
    }
  }, []);

  const playPause = React.useCallback(() => {
    const st = useFocusStore.getState();
    if (!st.sessionStartedAt) {
      const open = useStore.getState().tasks.filter((t) => t.status !== "done");
      const first = st.queue.map((id) => open.find((t) => t.id === id)).find(Boolean) ?? open[0];
      st.start(first?.id, first?.title ?? "Untitled focus");
    } else if (st.running) st.pause();
    else st.resume();
  }, []);

  // Keyboard shortcuts: Space play/pause · Esc stop · L lap.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        playPause();
      } else if (e.code === "Escape" && useFocusStore.getState().sessionStartedAt)
        endSession(false);
      else if ((e.key === "l" || e.key === "L") && useFocusStore.getState().sessionStartedAt) {
        useFocusStore.getState().lap();
        toast("Lap marked", { description: fmtClock(useFocusStore.getState().elapsedSec) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playPause, endSession]);

  // ── Data for rails ──
  const today = Date.now();
  const myOpen = tasks.filter((t) => t.status !== "done" && (!me || t.assigneeId === me.id));
  const queueTasks = fs.queue
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean) as typeof tasks;
  const suggestions = myOpen
    .filter((t) => t.id !== fs.activeTaskId && !fs.queue.includes(t.id))
    .sort((a, b) => (a.priority === "High" ? -1 : 1) - (b.priority === "High" ? -1 : 1))
    .slice(0, 6);
  const queued = queueTasks.length > 0 ? queueTasks : suggestions;

  const sessionsToday = fs.sessions.filter((s) => isSameDay(s.startedAt, today));
  const completedToday = sessionsToday.filter((s) => s.completedTask);
  const stats = todayStats(fs.sessions);
  const liveTotalSec = stats.totalSec + (inSession ? fs.elapsedSec : 0);
  const week = last7Days(fs.sessions);
  const weekMax = Math.max(1, ...week.map((d) => d.sec));
  const sessionNumber = sessionsToday.length + (inSession ? 1 : 0);

  // Daily goal
  const goalSec = fs.dailyGoalMin * 60;
  const goalPct = Math.min(100, Math.round((liveTotalSec / goalSec) * 100));

  // Top task today by focused time
  const byTask = new Map<string, number>();
  sessionsToday.forEach((s) =>
    byTask.set(s.taskTitle, (byTask.get(s.taskTitle) ?? 0) + s.focusedSec),
  );
  if (inSession && fs.activeTaskTitle)
    byTask.set(fs.activeTaskTitle, (byTask.get(fs.activeTaskTitle) ?? 0) + fs.elapsedSec);
  const topTasks = [...byTask.entries()].sort((a, b) => b[1] - a[1]);
  const topTaskMax = Math.max(1, topTasks[0]?.[1] ?? 1);

  // Billable (only when the acting member has a rate set)
  const rate = me?.rate;
  const earnedToday = rate ? (liveTotalSec / 3600) * rate : null;

  const lastLapAt = fs.laps[fs.laps.length - 1]?.atSec ?? 0;

  return (
    <AppShell
      eyebrow="Deep work"
      title="Focus Mode"
      subtitle={
        inSession
          ? `Session ${sessionNumber} of the day · ${fs.activeTaskTitle ?? "untitled"}`
          : "Pick a task, start the timer, ship it"
      }
      actions={
        <Link to="/tasks" className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5">
          <ArrowLeft size={13} /> Tasks
        </Link>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_330px] gap-5 items-start">
        {/* ═══ LEFT RAIL: queue ═══ */}
        <div className="order-2 xl:order-1 bg-panel border border-line rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-sunken/40">
            <span className="text-[10px] font-bold text-lo uppercase tracking-[0.14em]">
              Task queue
            </span>
            <Link
              to="/tasks"
              className="w-6 h-6 rounded-md bg-sunken border border-line flex items-center justify-center text-lo hover:text-hi transition-colors"
              aria-label="Manage tasks"
            >
              <Plus size={10} />
            </Link>
          </div>
          <div className="p-3 space-y-1.5 max-h-[70vh] overflow-y-auto">
            {/* Active */}
            <div className="px-1 py-0.5 flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-lo uppercase tracking-[0.14em]">
                Active
              </span>
              {inSession && <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />}
            </div>
            {inSession ? (
              <div className="rounded-xl px-3 py-3 bg-brand-600/10 border border-brand-500/30">
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/35 flex items-center justify-center flex-shrink-0 focus-pulse">
                    <CircleDot size={12} className="text-brand-400" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-hi text-xs font-semibold truncate">
                      {fs.activeTaskTitle}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                      {activeProject && (
                        <span className="text-lo truncate">{activeProject.title}</span>
                      )}
                      <span className="font-mono num text-brand-400 font-semibold">
                        {fmtClock(fs.elapsedSec)}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium mt-1.5 ${fs.running ? "bg-emerald/10 border border-emerald/25 text-emerald" : "bg-amber/10 border border-amber/25 text-amber"}`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${fs.running ? "bg-emerald animate-pulse" : "bg-amber"}`}
                      />{" "}
                      {fs.running ? "Running" : "Paused"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11.5px] text-lo px-1 pb-1">
                Nothing running — hit play or pick below.
              </p>
            )}

            {/* Queued */}
            <div className="px-1 py-0.5 flex items-center justify-between mt-2">
              <span className="text-[9.5px] font-bold text-lo uppercase tracking-[0.14em]">
                Queued
              </span>
              <span className="text-[10px] text-lo num">{queued.length} tasks</span>
            </div>
            {queued.map((t) => (
              <div
                key={t.id}
                className="group rounded-xl px-3 py-2.5 border border-line hover:border-brand-500/40 hover:bg-sunken/50 transition-all cursor-pointer"
                onClick={() => fs.start(t.id, t.title)}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${t.priority === "High" ? "bg-rose/10 border-rose/25 text-rose" : "bg-sunken border-line text-mid"}`}
                  >
                    <ListTodo size={11} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-mid group-hover:text-hi text-xs font-semibold truncate transition-colors">
                      {t.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-lo">
                      <span>{projects.find((p) => p.id === t.projectId)?.title ?? "General"}</span>
                      {(t.focusedSec ?? 0) > 0 && (
                        <span className="font-mono num text-brand-400">
                          {fmtDuration(t.focusedSec!)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center flex-shrink-0 transition-all shadow-[0_0_10px_color-mix(in_oklab,var(--brand-500)_40%,transparent)]">
                    <Play size={9} className="text-white ml-px" />
                  </span>
                </div>
              </div>
            ))}
            {queued.length === 0 && <p className="text-[11px] text-lo px-1">No open tasks.</p>}

            {/* Completed today */}
            <div className="px-1 py-0.5 flex items-center justify-between mt-2">
              <span className="text-[9.5px] font-bold text-lo uppercase tracking-[0.14em]">
                Completed today
              </span>
              <span className="text-[10px] text-lo num">{completedToday.length} done</span>
            </div>
            {completedToday.length === 0 && (
              <p className="text-[11px] text-lo px-1 pb-1">None yet — go get one.</p>
            )}
            {completedToday.map((s) => (
              <div key={s.id} className="rounded-xl px-3 py-2.5 border border-line opacity-60">
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-emerald" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-lo text-xs font-semibold truncate line-through">
                      {s.taskTitle}
                    </div>
                    <span className="font-mono num text-[10.5px] text-emerald">
                      {fmtClock(s.focusedSec)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CENTER: the timer ═══ */}
        <div className="order-1 xl:order-2 bg-panel border border-line rounded-2xl overflow-hidden">
          {/* Task context bar */}
          <div className="px-5 py-3 border-b border-line bg-sunken/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${inSession ? "bg-brand-600/20 border-brand-500/40 focus-pulse" : "bg-sunken border-line"}`}
              >
                <Timer size={11} className={inSession ? "text-brand-400" : "text-lo"} />
              </span>
              <div className="min-w-0">
                <div className="text-hi text-sm font-semibold truncate">
                  {inSession ? fs.activeTaskTitle : "No task selected"}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-lo flex-wrap">
                  {activeProject && <span>{activeProject.title}</span>}
                  {inSession && (
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${fs.running ? "text-emerald" : "text-amber"}`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${fs.running ? "bg-emerald animate-pulse" : "bg-amber"}`}
                      />
                      {fs.running ? "Running" : "Paused"}
                    </span>
                  )}
                  {inSession && <span>· Session #{sessionNumber} today</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-0.5 p-0.5 bg-sunken border border-line rounded-full">
                {(["stopwatch", "pomodoro"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => fs.setMode(m)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition-all ${fs.mode === m ? "bg-brand-600 text-white" : "text-lo hover:text-mid"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {pomodoro &&
                DURATIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => fs.setPlannedMin(m)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${fs.plannedMin === m ? "border-brand-500 text-brand-400 bg-brand-600/10" : "border-line text-lo hover:text-mid"}`}
                  >
                    {m}m
                  </button>
                ))}
            </div>
          </div>

          {/* Timer canvas */}
          <div
            className="relative flex flex-col items-center px-6 pt-8 pb-4"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 38%, color-mix(in oklab, var(--brand-500) 7%, transparent), transparent 75%)",
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ width: 340, height: 340 }}
            >
              <svg width="340" height="340" viewBox="0 0 340 340" className="absolute inset-0">
                <circle cx="170" cy="170" r={R} fill="none" stroke="var(--line)" strokeWidth="2" />
                <motion.circle
                  cx="170"
                  cy="170"
                  r={R}
                  fill="none"
                  stroke="var(--brand-500)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  animate={{ strokeDashoffset: CIRC * progress }}
                  transition={{ duration: 0.5, ease: "linear" }}
                  transform="rotate(-90 170 170)"
                  style={{
                    filter:
                      "drop-shadow(0 0 6px color-mix(in oklab, var(--brand-500) 50%, transparent))",
                  }}
                />
                <g opacity="0.25" stroke="var(--brand-500)" strokeWidth="1.5">
                  <line x1="170" y1="6" x2="170" y2="14" />
                  <line x1="170" y1="326" x2="170" y2="334" />
                  <line x1="6" y1="170" x2="14" y2="170" />
                  <line x1="326" y1="170" x2="334" y2="170" />
                </g>
              </svg>

              <div
                className={`relative flex flex-col items-center justify-center rounded-full ${inSession && fs.running ? "timer-ring-active" : "timer-ring-idle"}`}
                style={{
                  width: 300,
                  height: 300,
                  background: "radial-gradient(circle at center, var(--sunken) 0%, var(--bg) 100%)",
                  border: "1px solid color-mix(in oklab, var(--brand-500) 18%, transparent)",
                }}
              >
                <div className="absolute inset-0 rounded-full scanlines" />
                <div className="flex items-center gap-1.5 mb-2 z-[1]">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400/80">
                    <span
                      className={`w-1 h-1 rounded-full ${fs.running ? "bg-emerald animate-pulse" : "bg-line-strong"}`}
                    />{" "}
                    Focus
                  </span>
                </div>
                <div
                  className={`font-mono num leading-none select-none z-[1] ${inSession && fs.running ? "timer-glow-active" : "timer-glow"}`}
                  style={{
                    fontSize: hh > 0 ? "3rem" : "3.8rem",
                    fontWeight: 700,
                    color: "var(--text-hi)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {hh > 0 && (
                    <>
                      <span>{String(hh).padStart(2, "0")}</span>
                      <span className="sep-blink text-brand-400/60">:</span>
                    </>
                  )}
                  <span>{mm}</span>
                  <span className="sep-blink text-brand-400/60">:</span>
                  <span style={{ color: "var(--brand-400)" }}>{ss}</span>
                </div>
                <div
                  className="font-mono mt-1 z-[1] num"
                  style={{
                    fontSize: "1.05rem",
                    color: "color-mix(in oklab, var(--brand-500) 45%, transparent)",
                    letterSpacing: "0.05em",
                  }}
                >
                  .{ds}
                </div>
                <div className="mt-2.5 z-[1]">
                  <span className="font-mono text-[10px] text-lo tracking-[0.12em] uppercase">
                    {pomodoro
                      ? remaining === 0 && inSession
                        ? "Time's up — break"
                        : "Remaining"
                      : "Elapsed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily goal */}
            <div className="mt-7 w-full max-w-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-lo tracking-[0.1em] uppercase">
                  Daily goal
                </span>
                <span className="font-mono num text-[11px] text-mid">
                  {fmtClock(liveTotalSec)} / {fmtClock(goalSec)}
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-sunken overflow-hidden">
                <motion.div
                  animate={{ width: `${goalPct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-1 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--brand-600), var(--brand-400))",
                    boxShadow: "0 0 8px color-mix(in oklab, var(--brand-500) 40%, transparent)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-lo">
                <span className="num">{goalPct}% complete</span>
                <span className="num">
                  {fmtDuration(Math.max(0, goalSec - liveTotalSec))} remaining
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-5 flex items-center gap-5 flex-wrap justify-center">
              <div className="text-center">
                <div className="font-mono num text-hi font-semibold text-sm">
                  {fmtClock(liveTotalSec)}
                </div>
                <div className="text-lo text-[9.5px] mt-0.5 tracking-[0.08em] uppercase">
                  Today total
                </div>
              </div>
              <div className="w-px h-8 bg-line" />
              <div className="text-center">
                <div className="font-mono num text-hi font-semibold text-sm">{sessionNumber}</div>
                <div className="text-lo text-[9.5px] mt-0.5 tracking-[0.08em] uppercase">
                  Sessions
                </div>
              </div>
              <div className="w-px h-8 bg-line" />
              <div className="text-center">
                <div className="font-mono num text-emerald font-semibold text-sm">
                  {stats.tasksDone}
                </div>
                <div className="text-lo text-[9.5px] mt-0.5 tracking-[0.08em] uppercase">
                  Tasks done
                </div>
              </div>
              {earnedToday != null && (
                <>
                  <div className="w-px h-8 bg-line" />
                  <div className="text-center">
                    <div className="font-mono num text-emerald font-semibold text-sm">
                      ${earnedToday.toFixed(2)}
                    </div>
                    <div className="text-lo text-[9.5px] mt-0.5 tracking-[0.08em] uppercase">
                      Billable today
                    </div>
                  </div>
                </>
              )}
              {topTasks[0] && (
                <>
                  <div className="w-px h-8 bg-line" />
                  <div className="text-center max-w-[140px]">
                    <div className="font-mono text-brand-400 font-semibold text-sm truncate">
                      {topTasks[0][0]}
                    </div>
                    <div className="text-lo text-[9.5px] mt-0.5 tracking-[0.08em] uppercase">
                      Top task
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dock controls */}
          <div className="px-6 py-5 border-t border-line bg-sunken/40">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (inSession) {
                    fs.lap(lapDraft);
                    setLapDraft("");
                    toast("Lap marked", { description: fmtClock(fs.elapsedSec) });
                  }
                }}
                disabled={!inSession}
                className="flex flex-col items-center gap-1 w-16 h-16 rounded-2xl border border-line text-lo hover:text-hi hover:bg-sunken transition-all disabled:opacity-40"
                title="Mark a lap (L)"
              >
                <Flag size={14} />
                <span className="font-mono text-[9px] tracking-[0.08em]">LAP</span>
              </button>
              <button
                onClick={() => {
                  fs.settle();
                  useFocusStore.setState({ elapsedSec: Math.max(0, fs.elapsedSec - 60) });
                }}
                className="w-12 h-12 rounded-2xl border border-line flex items-center justify-center text-lo hover:text-hi hover:bg-sunken transition-all"
                aria-label="Back 1 minute"
              >
                <SkipBack size={13} />
              </button>

              <button
                onClick={playPause}
                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold transition-all min-w-[160px] bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 ${fs.running ? "focus-pulse" : ""}`}
                style={{
                  boxShadow: "0 0 30px color-mix(in oklab, var(--brand-500) 40%, transparent)",
                }}
                aria-label={!inSession ? "Start" : fs.running ? "Pause" : "Resume"}
              >
                {fs.running ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                <span className="font-mono tracking-[0.12em] text-sm">
                  {!inSession ? "START" : fs.running ? "PAUSE" : "RESUME"}
                </span>
              </button>

              <button
                onClick={() => endSession(false)}
                disabled={!inSession}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 bg-rose/10 border border-rose/30 text-rose hover:bg-rose/20"
                aria-label="Stop session (Esc)"
                title="Stop & log session (Esc)"
              >
                <Square size={13} />
              </button>
              <button
                onClick={(e) => endSession(true, e)}
                disabled={!inSession}
                className="flex flex-col items-center gap-1 w-16 h-16 rounded-2xl border border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20 transition-all disabled:opacity-40"
                title="Complete task + log session"
              >
                <Check size={14} />
                <span className="font-mono text-[9px] tracking-[0.08em]">DONE</span>
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
              {[
                ["SPACE", "Play/Pause"],
                ["ESC", "Stop"],
                ["L", "Lap"],
              ].map(([k, v]) => (
                <span key={k} className="text-lo flex items-center gap-1.5 font-mono text-[10px]">
                  <kbd className="px-1.5 py-0.5 rounded bg-sunken border border-line text-[9px]">
                    {k}
                  </kbd>{" "}
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL: log / notes / analytics ═══ */}
        <div className="order-3 bg-panel border border-line rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center border-b border-line bg-sunken/40">
            {(
              [
                ["log", "Session Log", ListChecks],
                ["notes", "Notes", NotebookPen],
                ["analytics", "Analytics", BarChart3],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key as RightTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11.5px] font-semibold transition-colors border-b-2 ${tab === key ? "border-brand-500 text-brand-400" : "border-transparent text-lo hover:text-mid"}`}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[68vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {tab === "log" && (
                  <>
                    {/* Current session */}
                    <div className="px-4 py-4 border-b border-line">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-5 h-5 rounded-md bg-brand-600/15 border border-brand-500/30 flex items-center justify-center">
                          <Timer size={9} className="text-brand-400" />
                        </span>
                        <span className="text-mid text-xs font-bold">Current session</span>
                        {inSession && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-emerald animate-pulse" /> Live
                          </span>
                        )}
                      </div>
                      {inSession ? (
                        <div className="bg-sunken rounded-xl p-3 border border-line grid grid-cols-2 gap-3">
                          <div>
                            <div className="font-mono num text-hi font-bold text-base leading-none">
                              {fmtClock(fs.elapsedSec)}
                            </div>
                            <div className="text-lo text-[9.5px] mt-1 tracking-[0.06em] uppercase">
                              Elapsed
                            </div>
                          </div>
                          <div>
                            <div className="font-mono num text-hi font-bold text-base leading-none">
                              {new Date(fs.sessionStartedAt!).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-lo text-[9.5px] mt-1 tracking-[0.06em] uppercase">
                              Started
                            </div>
                          </div>
                          <div>
                            <div className="font-mono num text-brand-400 font-bold text-base leading-none">
                              {pomodoro ? `${fs.plannedMin}m` : "∞"}
                            </div>
                            <div className="text-lo text-[9.5px] mt-1 tracking-[0.06em] uppercase">
                              {pomodoro ? "Planned" : "Open-ended"}
                            </div>
                          </div>
                          {rate ? (
                            <div>
                              <div className="font-mono num text-emerald font-bold text-base leading-none">
                                ${((fs.elapsedSec / 3600) * rate).toFixed(2)}
                              </div>
                              <div className="text-lo text-[9.5px] mt-1 tracking-[0.06em] uppercase">
                                Earned
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-mono num text-amber font-bold text-base leading-none">
                                {fs.laps.length}
                              </div>
                              <div className="text-lo text-[9.5px] mt-1 tracking-[0.06em] uppercase">
                                Laps
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11.5px] text-lo">No session running.</p>
                      )}
                    </div>

                    {/* Lap markers */}
                    <div className="px-4 py-3 border-b border-line">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-lo uppercase tracking-[0.12em]">
                          Lap markers
                        </span>
                        <span className="text-[10px] text-lo num">{fs.laps.length} laps</span>
                      </div>
                      {fs.laps.length === 0 ? (
                        <p className="text-[11px] text-lo">
                          Hit{" "}
                          <kbd className="px-1 py-0.5 rounded bg-sunken border border-line text-[9px] font-mono">
                            L
                          </kbd>{" "}
                          or the LAP button to mark phases of the work.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {fs.laps.map((l, i) => {
                            const prev = i === 0 ? 0 : fs.laps[i - 1].atSec;
                            return (
                              <div
                                key={l.id}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 border border-line hover:bg-sunken/60 transition-colors"
                              >
                                <span className="w-5 h-5 rounded-md bg-brand-600/12 border border-brand-500/20 flex items-center justify-center font-mono text-[8px] text-brand-400">
                                  {i + 1}
                                </span>
                                <span className="text-mid text-xs flex-1 truncate">{l.label}</span>
                                <span className="font-mono num text-[10.5px] text-lo" title="Split">
                                  +{fmtClock(l.atSec - prev)}
                                </span>
                                <span
                                  className="font-mono num text-[10.5px] text-mid"
                                  title="Total at lap"
                                >
                                  {fmtClock(l.atSec)}
                                </span>
                              </div>
                            );
                          })}
                          {inSession && (
                            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 border border-brand-500/25 bg-brand-600/5">
                              <span className="w-5 h-5 rounded-md bg-brand-600/15 border border-brand-500/25 flex items-center justify-center font-mono text-[8px] text-brand-400">
                                {fs.laps.length + 1}
                              </span>
                              <span className="text-mid text-xs flex-1">Current · running</span>
                              <span className="font-mono num text-[10.5px] text-brand-400">
                                +{fmtClock(fs.elapsedSec - lastLapAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {inSession && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <input
                            value={lapDraft}
                            onChange={(e) => setLapDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                fs.lap(lapDraft);
                                setLapDraft("");
                              }
                            }}
                            placeholder="Label next lap (optional)…"
                            className="ph-input flex-1 text-xs"
                            style={{ paddingBlock: 6 }}
                          />
                          <button
                            onClick={() => {
                              fs.lap(lapDraft);
                              setLapDraft("");
                            }}
                            className="ph-btn ph-btn-soft ph-btn-sm"
                            aria-label="Mark lap"
                          >
                            <Flag size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Today's log */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-bold text-lo uppercase tracking-[0.12em]">
                          Today's log
                        </span>
                        <span className="text-[10px] text-lo num">
                          {sessionsToday.length + (inSession ? 1 : 0)} entries
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {inSession && (
                          <div className="rounded-xl p-3 border border-brand-500/25 bg-brand-600/5">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-md bg-brand-600/12 border border-brand-500/20 flex items-center justify-center mt-0.5">
                                <CircleDot size={9} className="text-brand-400" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-mid text-xs font-semibold truncate">
                                  {fs.activeTaskTitle}
                                </div>
                                <span className="font-mono num text-[10.5px] text-lo">
                                  {new Date(fs.sessionStartedAt!).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  – ongoing
                                </span>
                              </div>
                              <span className="font-mono num text-brand-400 text-xs font-semibold">
                                {fmtClock(fs.elapsedSec)}
                              </span>
                            </div>
                          </div>
                        )}
                        {sessionsToday.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-xl p-3 border border-line hover:bg-sunken/50 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 border ${s.completedTask ? "bg-emerald/10 border-emerald/20" : "bg-sunken border-line"}`}
                              >
                                {s.completedTask ? (
                                  <Check size={9} className="text-emerald" />
                                ) : (
                                  <Timer size={9} className="text-mid" />
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-mid text-xs font-semibold truncate">
                                  {s.taskTitle}
                                </div>
                                <span className="font-mono num text-[10.5px] text-lo">
                                  {new Date(s.startedAt).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  –{" "}
                                  {s.endedAt
                                    ? new Date(s.endedAt).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-mono num text-mid text-xs font-semibold">
                                  {fmtClock(s.focusedSec)}
                                </div>
                                {rate != null && (
                                  <div className="text-emerald text-[10px] num">
                                    ${((s.focusedSec / 3600) * rate).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {sessionsToday.length === 0 && !inSession && (
                          <p className="text-[11px] text-lo">No sessions logged today.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {tab === "notes" && (
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-bold text-lo uppercase tracking-[0.12em]">
                        Session notes
                      </span>
                      <span className="text-[10px] text-lo num">{fs.notes.length}</span>
                    </div>
                    {!inSession && (
                      <p className="text-[11.5px] text-lo mb-3">
                        Start a session to attach notes — they're appended to the task when the
                        session ends (and feed the AI's context).
                      </p>
                    )}
                    <div className="space-y-1.5 mb-3">
                      {fs.notes.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-lg px-3 py-2 border border-line bg-sunken/50"
                        >
                          <p className="text-mid text-xs leading-relaxed">{n.text}</p>
                          <span className="font-mono num text-[9.5px] text-lo">
                            {new Date(n.ts).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl p-2.5 bg-sunken border border-line">
                      <textarea
                        rows={3}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder={
                          inSession ? "Add a note to this session…" : "Start a session first…"
                        }
                        disabled={!inSession}
                        className="w-full bg-transparent text-mid text-xs placeholder-lo resize-none outline-none leading-relaxed"
                      />
                      <div className="flex items-center justify-end mt-1.5 pt-1.5 border-t border-line">
                        <button
                          onClick={() => {
                            fs.addNote(noteDraft);
                            setNoteDraft("");
                          }}
                          disabled={!inSession || !noteDraft.trim()}
                          className="ph-btn ph-btn-primary ph-btn-sm disabled:opacity-40"
                        >
                          <Plus size={11} /> Log note
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "analytics" && (
                  <div className="px-4 py-4 space-y-4">
                    <div className="bg-sunken rounded-xl border border-line p-4">
                      <p className="text-[10px] text-lo font-bold mb-1 uppercase tracking-wider">
                        Total focus time · today
                      </p>
                      <p className="font-mono num text-2xl font-bold text-hi">
                        {fmtClock(liveTotalSec)}
                      </p>
                      <div className="flex items-end gap-1 mt-3 h-14">
                        {week.map((d, i) => (
                          <div
                            key={d.day + i}
                            className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
                          >
                            <span className="font-mono num text-[8px] text-lo leading-none">
                              {d.sec > 0 ? fmtDuration(d.sec) : ""}
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(6, (d.sec / weekMax) * 70)}%` }}
                              transition={{ delay: i * 0.04, duration: 0.4 }}
                              className="w-full rounded-sm"
                              style={{
                                background: `color-mix(in oklab, var(--brand-500) ${35 + (i / 6) * 65}%, transparent)`,
                                minHeight: 3,
                              }}
                            />
                            <span className="text-[8px] text-lo leading-none">{d.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-lo uppercase tracking-[0.12em]">
                          Time by task · today
                        </span>
                      </div>
                      <div className="space-y-2">
                        {topTasks.length === 0 && (
                          <p className="text-[11px] text-lo">Nothing logged yet today.</p>
                        )}
                        {topTasks.slice(0, 6).map(([title, sec]) => (
                          <div key={title}>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-mid truncate flex-1 mr-2">{title}</span>
                              <span className="font-mono num text-lo">{fmtDuration(sec)}</span>
                            </div>
                            <div className="h-1.5 bg-sunken rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(sec / topTaskMax) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{
                                  background:
                                    "linear-gradient(90deg, var(--brand-600), var(--brand-400))",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-sunken rounded-xl border border-line p-3 text-center">
                        <p className="font-mono num text-xl font-bold text-hi">{sessionNumber}</p>
                        <p className="text-[9.5px] text-lo mt-0.5 uppercase tracking-wide">
                          Sessions
                        </p>
                      </div>
                      <div className="bg-sunken rounded-xl border border-line p-3 text-center">
                        <p className="font-mono num text-xl font-bold text-emerald">
                          {stats.tasksDone}
                        </p>
                        <p className="text-[9.5px] text-lo mt-0.5 uppercase tracking-wide">
                          Tasks done
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-lo uppercase tracking-[0.12em]">
                          Daily goal
                        </span>
                        <span className="font-mono num text-[10px] text-lo">
                          {(goalSec / 3600).toFixed(1).replace(/\.0$/, "")}h
                        </span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={720}
                        step={30}
                        value={fs.dailyGoalMin}
                        onChange={(e) => fs.setDailyGoalMin(Number(e.target.value))}
                        className="w-full accent-[var(--brand-500)]"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="text-xs text-lo text-center opacity-70 mt-5">
        <Coffee size={11} className="inline mr-1 -mt-0.5" />
        Time + notes log to the task when the session ends — visible on Tasks, synced to the team,
        and in Pals' AI context.
      </p>
    </AppShell>
  );
}
