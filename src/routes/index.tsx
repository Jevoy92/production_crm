import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, RotateCw, History, CircleCheck, Info, Inbox,
  CalendarDays, TriangleAlert, Lightbulb, ChevronLeft, ChevronRight,
  Plus, ListChecks, Loader2, Wand2,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { useCalendarEvents } from "@/components/calendar/GoogleCalendar";
import { generateTaskAssist, type TaskAssistantResult } from "@/lib/taskAssistant.functions";
import { toast } from "sonner";
import {
  SHANNEN_BLOCKS, SHANNEN_WEEK, ACCENT_CLASS, SHANNEN_OWNS, SHANNEN_NEVER,
} from "@/lib/shannenPlaybook";
import type { Block, WeekDay } from "@/lib/shannenPlaybook";
import {
  JEVOY_BLOCKS, JEVOY_WEEK, JEVOY_OWNS, JEVOY_NEVER,
} from "@/lib/jevoyPlaybook";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip,
} from "recharts";

export const Route = createFileRoute("/")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Production OS" }] }),
});

type Tone = "admin" | "meeting" | "creative" | "prep";
const TONE: Record<Tone, string> = {
  admin: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
  meeting: "bg-blue-900/40 text-blue-300 border-blue-800/50",
  creative: "bg-purple-900/40 text-purple-300 border-purple-800/50",
  prep: "bg-orange-900/40 text-orange-300 border-orange-800/50",
};

function Today() {
  const team = useStore((s) => s.team);
  const activeRole = useStore((s) => s.activeRole);
  const tasks = useStore((s) => s.tasks);
  const me = team.find((m) => m.role === activeRole) ?? team[0];
  const firstName = me?.name?.split(" ")[0] ?? "there";

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const { data: calEvents } = useCalendarEvents();
  const todayStr = new Date().toDateString();
  const todayEvents = (calEvents ?? [])
    .filter((e) => new Date(e.start).toDateString() === todayStr)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const threadsToClose = openTasks
    .filter((t) => t.priority === "High" || (t.dueDate && new Date(t.dueDate).toDateString() === todayStr))
    .slice(0, 4);

  const jevoy = team.find((m) => m.id === "u_jevoy");
  const shannen = team.find((m) => m.id === "u_shannen");

  // Today's high-level plan context (phase, theme, blocks)
  const dow = new Date().getDay();
  const todayPhase: WeekDay = JEVOY_WEEK[dow] ?? JEVOY_WEEK[1];
  // Hour ranges for the 4 standing blocks (6am→8pm window)
  const TL_START = 6;
  const TL_END = 20;
  const TL_SPAN = TL_END - TL_START;
  const BLOCK_HOURS: { id: string; label: string; from: number; to: number; tone: string }[] = [
    { id: "deep",    label: "Deep",    from: 8,    to: 10.5, tone: "bg-brand-500/35 border-brand-500/50" },
    { id: "lead",    label: "Lead",    from: 10.5, to: 12.5, tone: "bg-amber-500/30 border-amber-500/50" },
    { id: "produce", label: "Produce", from: 13.5, to: 16.5, tone: "bg-violet-500/30 border-violet-500/50" },
    { id: "review",  label: "Review",  from: 16.5, to: 17.5, tone: "bg-emerald/30 border-emerald/50" },
  ];
  const nowHours = (() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  })();
  const nowPct = Math.max(0, Math.min(100, ((nowHours - TL_START) / TL_SPAN) * 100));
  const eventHours = todayEvents
    .filter((e) => !e.allDay)
    .map((e) => {
      const d = new Date(e.start);
      const h = d.getHours() + d.getMinutes() / 60;
      return { uid: e.uid, title: e.title, h, pct: ((h - TL_START) / TL_SPAN) * 100 };
    })
    .filter((x) => x.pct >= 0 && x.pct <= 100);

  return (
    <AppShell
      eyebrow="Today"
      title={`${greeting}, ${firstName}`}
      subtitle={`${todayLabel}`}
      actions={
        <Link to="/productions" className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={14} /> New Project
        </Link>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Morning brief banner */}
        <div className="bg-brand-600/10 border border-brand-500/20 rounded-xl p-4 flex items-start gap-4">
          <div className="mt-1 w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-brand-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                Morning Brief · Auto-Generated 7AM
              </h3>
              <button className="text-xs text-lo hover:text-hi flex items-center gap-1 transition-colors">
                <RotateCw size={12} /> Refresh
              </button>
            </div>
            <p className="text-sm text-mid leading-relaxed">
              Today's plan is drafted from yesterday's pendant transcripts, important inbox, completed tasks,
              overview log, and today's calendar.
            </p>
          </div>
        </div>

        {/* KPI stat strip */}
        <StatStrip
          openCount={openTasks.length}
          eventsCount={todayEvents.length}
          threadsCount={threadsToClose.length}
          highCount={openTasks.filter((t) => t.priority === "High").length}
        />

        {/* Recap & Threads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={<History size={14} className="text-lo" />} iconBg="bg-zinc-800" title="Yesterday Recap">
            <p className="text-sm text-mid mb-4">
              Focused on technical setup and administrative foundation. A day of "gathering" before creative pushes.
            </p>
            <ul className="space-y-3">
              <Recap ok>Troubleshot Limitless pendant charging states and app integration.</Recap>
              <Recap ok>Washington state registration mail arrived via Middesk/Gusto.</Recap>
              <Recap>No logged shoots or completed tasks recorded.</Recap>
            </ul>
          </Panel>

          <Panel
            icon={<Inbox size={14} className="text-brand-400" />}
            iconBg="bg-brand-600/15"
            title="Threads to Close"
            badge={`${threadsToClose.length} Items`}
          >
            <div className="space-y-2">
              {threadsToClose.length === 0 && (
                <p className="text-sm text-mid py-6 text-center">Nothing urgent — clear runway.</p>
              )}
              {threadsToClose.map((t) => (
                <label
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-hover border border-transparent hover:border-line cursor-pointer transition-all group"
                >
                  <div className="w-4 h-4 rounded border border-lo mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-hi group-hover:text-brand-400 transition-colors truncate">
                      {t.title}
                    </p>
                    {t.notes && <p className="text-xs text-lo mt-1 line-clamp-2">{t.notes}</p>}
                  </div>
                </label>
              ))}
            </div>
          </Panel>
        </div>

        {/* Schedule & Watch-outs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel icon={<CalendarDays size={14} className="text-lo" />} iconBg="bg-zinc-800" title="Today's Plan">
              {/* Day theme */}
              <div className={`rounded-lg border p-3 mb-4 ${ACCENT_CLASS[todayPhase.accent]}`}>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{todayPhase.phase} · Day Theme</span>
                  {todayPhase.sync && <span className="text-[10px] text-mid truncate">⏰ {todayPhase.sync}</span>}
                </div>
                <h4 className="text-sm font-semibold text-hi mb-1.5">{todayPhase.title}</h4>
                <ul className="space-y-1">
                  {todayPhase.bullets.slice(0, 2).map((b, i) => (
                    <li key={i} className="text-xs text-mid flex items-start gap-1.5">
                      <span className="opacity-60">•</span><span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { k: "Events", v: todayEvents.length, hint: "on calendar" },
                  { k: "Threads", v: threadsToClose.length, hint: "to close" },
                  { k: "Blocks", v: BLOCK_HOURS.length, hint: "structured" },
                ].map((s) => (
                  <div key={s.k} className="bg-sunken/60 border border-line rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-lo">{s.k}</p>
                    <p className="text-base font-bold text-hi num leading-tight">{s.v}</p>
                    <p className="text-[10px] text-lo">{s.hint}</p>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lo">Day Timeline</p>
                  <p className="text-[10px] text-lo num">6 AM → 8 PM</p>
                </div>
                <div className="relative h-12 rounded-md bg-sunken/60 border border-line overflow-hidden">
                  {/* Hour gridlines every 2h */}
                  {Array.from({ length: TL_SPAN / 2 + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-line/60"
                      style={{ left: `${(i * 2 * 100) / TL_SPAN}%` }}
                    />
                  ))}
                  {/* Block bands */}
                  {BLOCK_HOURS.map((b) => {
                    const left = ((b.from - TL_START) / TL_SPAN) * 100;
                    const width = ((b.to - b.from) / TL_SPAN) * 100;
                    return (
                      <div
                        key={b.id}
                        className={`absolute top-1.5 bottom-4 rounded border ${b.tone}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${b.label} block`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-hi/90 truncate px-1">
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
                  {/* Event markers */}
                  {eventHours.map((e) => (
                    <div
                      key={e.uid}
                      className="absolute top-0 bottom-4 w-0.5 bg-rose"
                      style={{ left: `${e.pct}%` }}
                      title={e.title}
                    >
                      <span className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rounded-full bg-rose border-2 border-panel" />
                    </div>
                  ))}
                  {/* Now indicator */}
                  {nowHours >= TL_START && nowHours <= TL_END && (
                    <div
                      className="absolute top-0 bottom-4 w-px bg-brand-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                      style={{ left: `${nowPct}%` }}
                    >
                      <span className="absolute -top-1 -left-[3px] w-1.5 h-1.5 rounded-full bg-brand-400" />
                    </div>
                  )}
                  {/* Hour labels */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between px-1 text-[9px] text-lo num">
                    <span>6a</span><span>10a</span><span>2p</span><span>6p</span><span>8p</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2">Scheduled · {todayEvents.length}</p>
              {todayEvents.length === 0 ? (
                <p className="text-xs text-mid italic py-3 text-center bg-sunken/40 border border-line rounded-lg">
                  No calendar events today — protect the deep work block.
                </p>
              ) : (
                <div className="relative pl-4 border-l border-line space-y-6 min-w-0">
                  {todayEvents.map((e, i) => (
                    <div key={e.uid} className="relative min-w-0">
                      <div
                        className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-panel ${
                          i === 0 ? "bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-line-strong"
                        }`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 min-w-0">
                        <span className={`text-sm font-medium w-14 shrink-0 num ${i === 0 ? "text-brand-400 font-semibold" : "text-mid"}`}>
                          {e.allDay
                            ? "All day"
                            : new Date(e.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className={`min-w-0 flex-1 overflow-hidden ${i === 0 ? "bg-brand-600/5 border border-brand-500/20 rounded-lg p-3 w-full" : ""}`}>
                          <h4 className="text-sm font-semibold text-hi mb-1 truncate">{e.title}</h4>
                          {e.location && (
                            <p className="text-xs text-mid truncate" title={e.location}>
                              {/^https?:\/\//.test(e.location) ? new URL(e.location).hostname : e.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <WatchOuts />
        </div>

        {/* AI-assisted person task panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shannen && (
            <PersonDay
              person={shannen}
              titleSuffix="Day"
              roleLabel="Operations & CX Coordinator"
              blocks={SHANNEN_BLOCKS}
              week={SHANNEN_WEEK}
              owns={SHANNEN_OWNS}
              never={SHANNEN_NEVER}
              tasks={tasks.filter((t) => t.assigneeId === shannen.id && t.status !== "done")}
            />
          )}
          {jevoy && (
            <PersonDay
              person={jevoy}
              titleSuffix="Day"
              roleLabel="Creative Founder & Business Architect"
              blocks={JEVOY_BLOCKS}
              week={JEVOY_WEEK}
              owns={JEVOY_OWNS}
              never={JEVOY_NEVER}
              tasks={tasks.filter((t) => t.assigneeId === jevoy.id && t.status !== "done")}
            />
          )}
        </div>

        {/* Workload chart */}
        <WorkloadChart team={team} tasks={openTasks} />

        {/* Script ideas slider */}
        <ScriptIdeas />
      </div>
    </AppShell>
  );
}

function Recap({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      {ok ? <CircleCheck size={14} className="text-emerald mt-0.5 flex-shrink-0" /> : <Info size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />}
      <span className="text-mid">{children}</span>
    </li>
  );
}

/* ---------------- Watch-outs ---------------- */
function WatchOuts() {
  const items: Array<{ tone: "rose" | "amber" | "violet" | "brand"; title: string; body: React.ReactNode; tag: string }> = [
    {
      tone: "rose", tag: "Compliance",
      title: "Admin Lag — Middesk Mail",
      body: <>Open the WA registration packet today. Unprocessed filings can <strong className="text-hi">freeze payouts and stall contracts</strong> within 30 days.</>,
    },
    {
      tone: "amber", tag: "Energy",
      title: "Midday Crunch",
      body: <>3 back-to-back calls from 12–2:30 PM with no buffer. <strong className="text-hi">Eat by 11:45</strong>, queue water, mute Slack between calls.</>,
    },
    {
      tone: "violet", tag: "Creative Drift",
      title: "No Filming Logged in 48h",
      body: <>Core 12 cadence at risk. Carve a 90-min self-record block tomorrow or push the publish calendar.</>,
    },
    {
      tone: "brand", tag: "Handover",
      title: "Shannen Update Pending",
      body: <>Yesterday's structured daily update from Shannen hasn't landed yet. Ping her before 10 AM so AM blocks aren't blind.</>,
    },
  ];
  const tones: Record<string, string> = {
    rose: "border-rose/30 text-rose",
    amber: "border-amber/30 text-amber",
    violet: "border-violet/30 text-violet",
    brand: "border-brand-500/30 text-brand-400",
  };
  const dots: Record<string, string> = {
    rose: "bg-rose", amber: "bg-amber", violet: "bg-violet", brand: "bg-brand-400",
  };
  return (
    <div className="bg-rose/5 border border-rose/20 rounded-2xl p-5 relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose/20 flex items-center justify-center text-rose shrink-0">
            <TriangleAlert size={14} />
          </div>
          <h3 className="font-display font-bold text-hi text-base truncate">Watch-outs</h3>
        </div>
        <span className="text-[10px] font-semibold text-lo bg-sunken border border-line px-2 py-0.5 rounded-md shrink-0">
          {items.length} signals
        </span>
      </div>
      <div className="space-y-2.5 relative z-10">
        {items.map((it) => (
          <div key={it.title} className={`bg-panel/60 border ${tones[it.tone]} p-3 rounded-lg`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dots[it.tone]} shrink-0`} />
              <h4 className={`text-[13px] font-semibold ${tones[it.tone].split(" ")[1]} truncate`}>{it.title}</h4>
              <span className="text-[9px] uppercase tracking-wider text-lo ml-auto shrink-0">{it.tag}</span>
            </div>
            <p className="text-[11px] leading-snug text-mid">{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({
  icon, iconBg = "bg-zinc-800", title, badge, children,
}: {
  icon: React.ReactNode; iconBg?: string; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <section className="bg-panel border border-line rounded-2xl p-6 hover:border-line-strong/50 transition-colors h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
          <h3 className="font-display font-bold text-hi text-base">{title}</h3>
        </div>
        {badge && <span className="bg-sunken text-xs px-2 py-1 rounded-md text-lo border border-line">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function PersonTasks({
  person, tasks,
}: {
  person: { id: string; name: string; role: string; initials: string; color: string };
  tasks: Array<{ id: string; title: string; priority: string; dueDate?: string; status: string; notes?: string }>;
}) {
  const run = useServerFn(generateTaskAssist);
  const [result, setResult] = useState<TaskAssistantResult | null>(null);
  const [loading, setLoading] = useState(false);

  const ranked = useMemo(() => {
    if (!result) return tasks;
    const byId = new Map(result.suggestions.map((s) => [s.taskId, s.rank]));
    return [...tasks].sort((a, b) => (byId.get(a.id) ?? 99) - (byId.get(b.id) ?? 99));
  }, [tasks, result]);

  const suggestionFor = (id: string) => result?.suggestions.find((s) => s.taskId === id);

  async function runAssist() {
    if (tasks.length === 0) {
      toast("No open tasks to analyze");
      return;
    }
    setLoading(true);
    try {
      const r = await run({
        data: {
          person: person.name,
          role: person.role,
          tasks: tasks.map((t) => ({
            id: t.id, title: t.title, priority: t.priority,
            dueDate: t.dueDate, status: t.status, notes: t.notes,
          })),
        },
      });
      setResult(r);
    } catch (e) {
      toast.error("AI assist failed", { description: String((e as Error).message ?? e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-panel border border-line rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: person.color }}
          >
            {person.initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-hi text-base truncate">{person.name.split(" ")[0]}'s Tasks</h3>
            <p className="text-xs text-lo">{tasks.length} open · {person.role}</p>
          </div>
        </div>
        <button
          onClick={runAssist}
          disabled={loading || tasks.length === 0}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-600/15 border border-brand-500/30 text-brand-400 hover:bg-brand-600/25 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
          {result ? "Re-run" : "AI assist"}
        </button>
      </div>

      {result && (
        <div className="mb-4 bg-brand-600/8 border border-brand-500/20 rounded-lg p-3 flex items-start gap-2.5">
          <Sparkles size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-mid leading-relaxed">{result.summary}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-mid py-8 text-center">All clear — no open tasks.</p>
      ) : (
        <ul className="space-y-2">
          {ranked.slice(0, 6).map((t) => {
            const s = suggestionFor(t.id);
            const tone: Tone = t.priority === "High" ? "creative" : t.priority === "Med" ? "meeting" : "admin";
            return (
              <li key={t.id} className="p-3 rounded-lg border border-line bg-sunken/40 hover:border-line-strong/60 transition-colors">
                <div className="flex items-start gap-3">
                  {s?.rank && (
                    <span className="w-5 h-5 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {s.rank}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-hi truncate">{t.title}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${TONE[tone]} flex-shrink-0`}>
                        {t.priority}
                      </span>
                    </div>
                    {s && <p className="text-xs text-lo italic mb-2">{s.reason}</p>}
                    {s?.nextSteps?.length ? (
                      <ul className="space-y-1 mt-2">
                        {s.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-mid">
                            <ListChecks size={11} className="text-brand-400 mt-0.5 flex-shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!result && tasks.length > 0 && (
        <p className="text-xs text-lo text-center mt-4">
          Click <strong className="text-mid">AI assist</strong> to prioritize, summarize, and suggest next steps.
        </p>
      )}
    </section>
  );
}

function ScriptIdeas() {
  const ideas = [
    {
      tag: "Human Mechanism", tagColor: "text-blue-400", grad: "from-blue-500 to-purple-500",
      title: "Why Your Brain Files Your Photos in the Trash",
      hook: "You're at the concert recording 4K memory, telling your brain it doesn't need to remember.",
      mech: 'Henkel (2014) "Photo-taking Impairment Effect."',
    },
    {
      tag: "Business/Brand", tagColor: "text-emerald-400", grad: "from-emerald-500 to-teal-500",
      title: "The 100-Millisecond Pitch (Why They Already Said No)",
      hook: "Before the intro animation finishes, the client decided if you're expert or amateur.",
      mech: "Willis & Todorov (2006). Judgments made within 100ms of seeing a frame.",
    },
    {
      tag: "Inner Life", tagColor: "text-purple-400", grad: "from-purple-500 to-pink-500",
      title: 'The Loneliness of the "Always-On" Mask',
      hook: 'Being "known" for your content is the fastest way to feel invisible in real life.',
      mech: "Goffman (1959). Front-stage performance vs backstage reality.",
    },
  ];
  return (
    <div className="pb-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-lo">
            <Lightbulb size={14} />
          </div>
          <div>
            <h3 className="font-display font-bold text-hi text-base">Script Ideas</h3>
            <p className="text-xs text-lo">Palmer Ventures</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-sunken border border-line flex items-center justify-center text-lo hover:text-hi transition-colors">
            <ChevronLeft size={12} />
          </button>
          <button className="w-8 h-8 rounded-full bg-sunken border border-line flex items-center justify-center text-lo hover:text-hi transition-colors">
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {ideas.map((c) => (
          <div
            key={c.title}
            className="min-w-[320px] max-w-[360px] flex-shrink-0 bg-panel border border-line rounded-xl p-5 snap-start hover:border-line-strong/60 transition-colors group relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${c.grad} opacity-60 group-hover:opacity-100 transition-opacity`} />
            <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${c.tagColor}`}>{c.tag}</div>
            <h4 className="text-base font-semibold text-hi mb-3 line-clamp-2">{c.title}</h4>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-lo block mb-1">The Hook</span>
                <p className="text-xs text-mid bg-sunken p-2 rounded border border-line">{c.hook}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-lo block mb-1">Mechanism</span>
                <p className="text-xs text-mid italic">{c.mech}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonDay({
  person, tasks, titleSuffix, roleLabel, blocks, week, owns, never: neverList,
}: {
  person: { id: string; name: string; role: string; initials: string; color: string };
  tasks: Array<{ id: string; title: string; priority: string; dueDate?: string; status: string; notes?: string }>;
  titleSuffix: string;
  roleLabel: string;
  blocks: Block[];
  week: Record<number, WeekDay>;
  owns: string[];
  never: string[];
}) {
  const run = useServerFn(generateTaskAssist);
  const [result, setResult] = useState<TaskAssistantResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const dow = new Date().getDay();
  const today = week[dow];

  async function runAssist() {
    setLoading(true);
    try {
      const focus = `Today is ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow]} — phase: ${today.phase}. Battle-rhythm focus: ${today.title}. Standing blocks: ${blocks.map((b) => b.label).join("; ")}.`;
      const synthTasks = tasks.length
        ? tasks
        : blocks.map((b) => ({
            id: b.id, title: `${b.label} block`, priority: "Med",
            status: "todo", notes: b.objective, dueDate: undefined as string | undefined,
          }));
      const r = await run({
        data: {
          person: person.name,
          role: roleLabel + " — " + focus,
          tasks: synthTasks.map((t) => ({
            id: t.id, title: t.title, priority: t.priority,
            dueDate: "dueDate" in t ? t.dueDate : undefined,
            status: t.status, notes: t.notes,
          })),
        },
      });
      setResult(r);
    } catch (e) {
      toast.error("AI assist failed", { description: String((e as Error).message ?? e) });
    } finally {
      setLoading(false);
    }
  }

  function toggle(k: string) {
    setChecked((c) => ({ ...c, [k]: !c[k] }));
  }

  const blockProgress = blocks.map((b) => {
    const total = b.items.length;
    const done = b.items.reduce((n, _it, i) => n + (checked[`${b.id}-${i}`] ? 1 : 0), 0);
    return { id: b.id, done, total };
  });
  const totalItems = blockProgress.reduce((n, p) => n + p.total, 0);
  const doneItems = blockProgress.reduce((n, p) => n + p.done, 0);
  const overallPct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <section className="bg-panel border border-line rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: person.color }}
          >
            {person.initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-hi text-base truncate">{person.name.split(" ")[0]}'s {titleSuffix}</h3>
            <p className="text-xs text-lo">Battle rhythm · {person.role}</p>
          </div>
        </div>
        <button
          onClick={runAssist}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-600/15 border border-brand-500/30 text-brand-400 hover:bg-brand-600/25 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
          {result ? "Re-run" : "AI assist"}
        </button>
      </div>

      {/* Overall day progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-lo">Day progress</span>
          <span className="text-[11px] text-mid num">
            <span className="text-hi font-semibold">{doneItems}</span>
            <span className="opacity-60"> / {totalItems} completed</span>
            <span className="ml-2 text-brand-400 font-semibold">{overallPct}%</span>
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-sunken border border-line overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Today's battle-rhythm focus */}
      <div className={`rounded-lg border p-3 mb-4 ${ACCENT_CLASS[today.accent]}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{today.phase}</span>
          <span className="text-[10px] text-mid">Battle rhythm</span>
        </div>
        <h4 className="text-sm font-semibold text-hi mb-1.5">{today.title}</h4>
        <ul className="space-y-1">
          {today.bullets.map((b, i) => (
            <li key={i} className="text-xs text-mid flex items-start gap-1.5">
              <span className="opacity-60">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {today.sync && (
          <p className="text-[11px] font-semibold mt-2 opacity-90">⏰ {today.sync}</p>
        )}
      </div>

      {/* AI summary */}
      {result && (
        <div className="mb-4 bg-brand-600/8 border border-brand-500/20 rounded-lg p-3 flex items-start gap-2.5">
          <Sparkles size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-mid leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* Time blocks */}
      <div className="space-y-2.5 flex-1">
        {blocks.map((b, idx) => {
          const sug = result?.suggestions.find((s) => s.taskId === b.id);
          const prog = blockProgress[idx];
          const pct = prog.total ? (prog.done / prog.total) * 100 : 0;
          const complete = prog.total > 0 && prog.done === prog.total;
          return (
            <details key={b.id} open={idx === 0} className="group bg-sunken/50 border border-line rounded-lg">
              <summary className="cursor-pointer list-none p-3 flex items-start gap-3">
                <span className={`w-6 h-6 rounded-md border text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${complete ? "bg-emerald/20 border-emerald/40 text-emerald" : "bg-brand-600/15 border-brand-500/30 text-brand-400"}`}>
                  {complete ? <CircleCheck size={12} /> : idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-hi">{b.label}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-lo border border-line">{b.duration}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border num ml-auto ${complete ? "bg-emerald/15 text-emerald border-emerald/30" : "bg-zinc-800 text-mid border-line"}`}>
                      {prog.done}/{prog.total}
                    </span>
                  </div>
                  <p className="text-[11px] text-lo num">{b.time} <span className="opacity-50">· alt {b.altTime}</span></p>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${complete ? "bg-emerald" : "bg-brand-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ChevronRight size={14} className="text-lo group-open:rotate-90 transition-transform mt-1 flex-shrink-0" />
              </summary>
              <div className="px-3 pb-3 pl-12 space-y-2">
                <p className="text-xs text-mid italic">{b.objective}</p>
                <ul className="space-y-1.5">
                  {b.items.map((it, i) => {
                    const k = `${b.id}-${i}`;
                    const on = !!checked[k];
                    return (
                      <li key={k}>
                        <button
                          onClick={() => toggle(k)}
                          className="flex items-start gap-2 text-left w-full group/item"
                        >
                          <span className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${on ? "bg-brand-600 border-brand-600" : "border-lo group-hover/item:border-mid"}`}>
                            {on && <CircleCheck size={10} className="text-white" />}
                          </span>
                          <span className={`text-xs ${on ? "text-lo line-through" : "text-mid"}`}>{it}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {sug?.nextSteps?.length ? (
                  <div className="mt-2 pt-2 border-t border-line space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1">
                      <Sparkles size={9} /> AI suggested next steps
                    </p>
                    {sug.nextSteps.map((s, i) => (
                      <p key={i} className="text-xs text-mid flex items-start gap-1.5">
                        <ListChecks size={10} className="text-brand-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>

      {/* Open tasks assigned in app */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-2">Assigned in app · {tasks.length}</p>
          <ul className="space-y-1">
            {tasks.slice(0, 4).map((t) => (
              <li key={t.id} className="text-xs text-mid flex items-center gap-2 truncate">
                <span className="w-1 h-1 rounded-full bg-brand-400" />
                <span className="truncate">{t.title}</span>
                {t.priority === "High" && (
                  <span className="text-[10px] text-rose font-semibold ml-auto">High</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ownership boundaries */}
      <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald mb-1.5">Owns</p>
          <ul className="space-y-0.5">
            {owns.map((o) => (
              <li key={o} className="text-[11px] text-mid">• {o}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose mb-1.5">Never</p>
          <ul className="space-y-0.5">
            {neverList.map((o) => (
              <li key={o} className="text-[11px] text-mid">• {o}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- KPI Stat Strip ---------------- */
function StatStrip({
  openCount, eventsCount, threadsCount, highCount,
}: { openCount: number; eventsCount: number; threadsCount: number; highCount: number }) {
  const completionPct = openCount === 0 ? 100 : Math.max(0, Math.round(((openCount - highCount) / Math.max(openCount, 1)) * 100));
  const stats = [
    { label: "Open Tasks", value: openCount, hint: "across team", grad: "from-brand-500 to-indigo-500", spark: [3, 5, 4, 6, 5, 7, openCount || 1] },
    { label: "Today's Calls", value: eventsCount, hint: "on calendar", grad: "from-blue-500 to-cyan-500", spark: [1, 2, 1, 3, 2, 4, eventsCount || 1] },
    { label: "Threads to Close", value: threadsCount, hint: "urgent / today", grad: "from-amber-500 to-rose-500", spark: [2, 3, 2, 4, 3, 5, threadsCount || 1] },
    { label: "High Priority", value: highCount, hint: `${completionPct}% on track`, grad: "from-rose-500 to-purple-500", spark: [1, 2, 3, 2, 3, 2, highCount || 1] },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="relative bg-panel border border-line rounded-xl p-4 overflow-hidden hover:border-line-strong/60 transition-colors">
          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${s.grad} opacity-10 blur-2xl`} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-lo">{s.label}</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-3xl font-bold text-hi num">{s.value}</p>
            <div className="w-16 h-8 -mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.spark.map((v, i) => ({ i, v }))}>
                  <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                    {s.spark.map((_, i) => (
                      <Cell key={i} fill={i === s.spark.length - 1 ? "rgb(129,140,248)" : "rgb(63,63,70)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[11px] text-mid mt-1">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Workload Distribution Chart ---------------- */
function WorkloadChart({
  team, tasks,
}: {
  team: Array<{ id: string; name: string; color: string; initials: string }>;
  tasks: Array<{ id: string; assigneeId?: string; priority: string }>;
}) {
  const data = team
    .map((m) => {
      const mine = tasks.filter((t) => t.assigneeId === m.id);
      return {
        name: m.name.split(" ")[0],
        color: m.color,
        High: mine.filter((t) => t.priority === "High").length,
        Med: mine.filter((t) => t.priority === "Med").length,
        Low: mine.filter((t) => t.priority === "Low").length,
        total: mine.length,
      };
    })
    .filter((d) => d.total > 0);

  const blockData = SHANNEN_BLOCKS.map((b, i) => ({
    name: b.label.split(" ")[0],
    value: parseInt(b.duration),
    fill: ["#818cf8", "#22d3ee", "#fb7185", "#34d399"][i],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 bg-panel border border-line rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-brand-400">
            <ListChecks size={14} />
          </div>
          <div>
            <h3 className="font-display font-bold text-hi text-base">Team Workload</h3>
            <p className="text-xs text-lo">Open tasks by priority · per person</p>
          </div>
        </div>
        {data.length === 0 ? (
          <p className="text-sm text-mid py-8 text-center">No open tasks assigned.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="30%">
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(99,102,241,0.06)" }}
                  contentStyle={{
                    background: "rgb(24,24,27)", border: "1px solid rgb(63,63,70)",
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <Bar dataKey="Low" stackId="a" fill="#52525b" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Med" stackId="a" fill="#3b82f6" />
                <Bar dataKey="High" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center gap-4 mt-2 justify-center text-[11px] text-lo">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500" />High</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-500" />Med</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-zinc-600" />Low</span>
        </div>
      </section>

      <section className="bg-panel border border-line rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-brand-400">
            <CalendarDays size={14} />
          </div>
          <div>
            <h3 className="font-display font-bold text-hi text-base">Shannen's Day Mix</h3>
            <p className="text-xs text-lo">4-hour block allocation</p>
          </div>
        </div>
        <div className="h-44 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={blockData} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={3} stroke="none">
                {blockData.map((b, i) => <Cell key={i} fill={b.fill} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display text-2xl font-bold text-hi num">4h</span>
            <span className="text-[10px] text-lo uppercase tracking-wider">total</span>
          </div>
        </div>
        <ul className="mt-2 space-y-1">
          {blockData.map((b, i) => (
            <li key={i} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-mid">
                <span className="w-2 h-2 rounded-sm" style={{ background: b.fill }} />
                {SHANNEN_BLOCKS[i].label}
              </span>
              <span className="text-lo num">{b.value}m</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
