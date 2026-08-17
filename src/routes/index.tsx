import { AnimatedNumber } from "@/components/motion/Motion";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, History, CircleCheck, Info, Inbox,
  CalendarDays, TriangleAlert, Lightbulb, ChevronLeft, ChevronRight,
  Plus, ListChecks, Loader2, Wand2, Route as RouteIcon, Check, Clock,
} from "lucide-react";
import { Pencil, Trash2, X } from "lucide-react";
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
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList,
  RadialBarChart, RadialBar, AreaChart, Area,
} from "recharts";
import { ChartTooltip } from "@/components/charts/Charts";
import { DailyCheckout } from "@/components/dashboard/DailyCheckout";
import { PalmerInsightsCard } from "@/components/dashboard/PalmerInsightsCard";

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
  const nowHours = (() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  })();

  return (
    <AppShell
      eyebrow={`Today's Vibe · ${todayPhase.phase} Day`}
      title={`${greeting}, ${firstName}`}
      subtitle={`${todayLabel}`}
      actions={
        <Link to="/productions" className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={14} /> New Project
        </Link>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Script ideas slider — moved to top */}
        <ScriptIdeas />

        {/* Lively day journey: pulse + path on the left, sticky context rail on the right */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-6">
            <PulseMetrics
              openCount={openTasks.length}
              eventsCount={todayEvents.length}
              highCount={openTasks.filter((t) => t.priority === "High").length}
              doneCount={tasks.filter((t) => t.status === "done").length}
              callHours={todayEvents
                .filter((e: any) => !e.allDay)
                .map((e: any) => {
                  const d = new Date(e.start);
                  return d.getHours() + d.getMinutes() / 60;
                })}
            />
            <PalmerInsightsCard />
            <TodaysPath
              phase={todayPhase}
              blocks={JEVOY_BLOCKS}
              nowHours={nowHours}
              events={todayEvents}
            />
          </div>

          <aside className="w-full lg:w-80 lg:shrink-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
            <WatchOuts />
            <YesterdayRecap />
            <ThreadsRail threads={threadsToClose} />
          </aside>
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
              showCheckout
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
    <div className="bg-panel border border-rose/25 rounded-3xl p-6 relative overflow-hidden">
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
            <div className="flex items-start gap-2 mb-1">
              <span className={`w-1.5 h-1.5 mt-1.5 rounded-full ${dots[it.tone]} shrink-0`} />
              <h4 className={`text-[13px] font-semibold leading-snug ${tones[it.tone].split(" ")[1]}`}>{it.title}</h4>
              <span className="text-[9px] uppercase tracking-wider text-lo ml-auto shrink-0 mt-0.5">{it.tag}</span>
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

/* ---------------- Pulse Metrics — 3 compact cards, each with its own recharts visual ---------------- */
function TasksStackedBar({ done, open, color }: { done: number; open: number; color: string }) {
  const total = Math.max(1, done + open);
  const data = [{ name: "t", done, open }];
  const pct = Math.round((done / total) * 100);
  return (
    <div className="w-20">
      <div className="h-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0}>
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="done" stackId="s" fill={color} radius={[4, 0, 0, 4]} isAnimationActive={false} />
            <Bar dataKey="open" stackId="s" fill="var(--line-2)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-lo tabular-nums text-right">{pct}% done</p>
    </div>
  );
}
function CallsAreaTimeline({ hours, color }: { hours: number[]; color: string }) {
  // Bucket calls into hourly bins 8-20 for a small area chart.
  const START = 8, END = 20;
  const bins = Array.from({ length: END - START + 1 }, (_, i) => ({ h: START + i, c: 0 }));
  hours.forEach((h) => {
    const idx = Math.round(Math.max(START, Math.min(END, h))) - START;
    if (bins[idx]) bins[idx].c += 1;
  });
  // With nothing on the calendar an area chart reads as a meaningless grey slab.
  // Show an explicit, quiet empty state instead.
  if (hours.length === 0) {
    return (
      <div className="w-24 h-10 flex flex-col items-end justify-center gap-1.5">
        <span className="w-full border-t border-dashed border-line-strong/70" />
        <span className="text-[10px] text-lo">Clear day</span>
      </div>
    );
  }
  const data = bins.map((b) => ({ ...b, c: b.c + 0.15 }));
  return (
    <div className="w-24 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id="callsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="c" stroke={color} strokeWidth={1.5}
            fill="url(#callsFill)" isAnimationActive={false} dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function OnTrackRadial({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const data = [{ name: "pct", value: clamped, fill: color }];
  return (
    <div className="w-12 h-12 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%" outerRadius="100%"
          data={data} startAngle={90} endAngle={-270}
          barSize={6}
        >
          <RadialBar background={{ fill: "var(--line-2)" }} dataKey="value" cornerRadius={999} isAnimationActive={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-hi tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
function PulseMetrics({
  openCount, eventsCount, highCount, doneCount, callHours,
}: {
  openCount: number; eventsCount: number; highCount: number;
  doneCount: number; callHours: number[];
}) {
  const completionPct = openCount === 0 ? 100 : Math.max(0, Math.round(((openCount - highCount) / Math.max(openCount, 1)) * 100));
  const cards = [
    {
      label: "Open Tasks", value: openCount, hint: "Across team",
      accent: "brand", color: "var(--brand-400)",
      visual: <TasksStackedBar done={doneCount} open={openCount} color="var(--brand-400)" />,
    },
    {
      label: "Today's Calls", value: eventsCount, hint: "On calendar",
      accent: "emerald", color: "var(--emerald)",
      visual: <CallsAreaTimeline hours={callHours} color="var(--emerald)" />,
    },
    {
      label: "High Priority", value: highCount, hint: `${completionPct}% on track`,
      accent: "rose", color: "var(--rose)",
      visual: <OnTrackRadial pct={completionPct} color="var(--rose)" />,
    },
  ];
  const ring: Record<string, string> = {
    brand: "hover:border-brand-500/40",
    emerald: "hover:border-emerald/40",
    rose: "hover:border-rose/40",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((s) => (
        <div
          key={s.label}
          className={`group relative bg-panel border border-line rounded-xl px-4 py-3 transition-colors ${ring[s.accent]}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-lo">{s.label}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-2xl font-bold text-hi num leading-none">
                <AnimatedNumber value={s.value} />
              </p>
              <p className="text-[11px] text-lo mt-1 truncate">{s.hint}</p>
            </div>
            <div className="shrink-0">{s.visual}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Today's Path — vertical guided timeline ---------------- */
function TodaysPath({
  phase, blocks, nowHours, events,
}: {
  phase: WeekDay;
  blocks: Block[];
  nowHours: number;
  events: ReturnType<typeof useCalendarEvents>["data"] extends infer T ? (T extends Array<infer U> ? U[] : never[]) : never[];
}) {
  // Hours for each standing block id (matches the 4 phases in JEVOY_BLOCKS)
  const HOURS: Record<string, { from: number; to: number }> = {
    deep:    { from: 8,    to: 10.5 },
    lead:    { from: 10.5, to: 12.5 },
    produce: { from: 13.5, to: 16.5 },
    review:  { from: 16.5, to: 17.5 },
  };
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  const eventsInWindow = (events ?? []).filter((e: any) => !e.allDay).map((e: any) => {
    const d = new Date(e.start);
    return { uid: e.uid, title: e.title, h: d.getHours() + d.getMinutes() / 60, start: d };
  });

  function statusFor(id: string): "past" | "current" | "future" {
    const h = HOURS[id];
    if (!h) return "future";
    if (nowHours > h.to) return "past";
    if (nowHours >= h.from && nowHours <= h.to) return "current";
    return "future";
  }

  function fmt(h: number) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    const ampm = hh >= 12 ? "PM" : "AM";
    const display = ((hh + 11) % 12) + 1;
    return `${display}:${String(mm).padStart(2, "0")} ${ampm}`;
  }

  return (
    <section className="bg-panel border border-line rounded-3xl p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-hi text-lg flex items-center gap-2">
            <RouteIcon size={16} className="text-brand-400" />
            Today's Path
          </h3>
          <p className="text-sm text-mid mt-0.5 truncate">{phase.title}</p>
        </div>
        <span className="flex items-center gap-1.5 bg-sunken border border-line px-3 py-1.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[11px] font-medium text-mid">In Progress</span>
        </span>
      </div>

      <div className="relative pl-6 space-y-7 border-l-2 border-line">
        {blocks.map((b) => {
          const h = HOURS[b.id];
          const state = statusFor(b.id);
          const range = h ? `${fmt(h.from)} – ${fmt(h.to)}` : b.time;
          const blockEvents = h
            ? eventsInWindow.filter((e) => e.h >= h.from && e.h <= h.to)
            : [];

          const doneCount = b.items.filter((_, i) => checks[`${b.id}-${i}`]).length;
          const allDone = b.items.length > 0 && doneCount === b.items.length;

          const dotBase = "absolute top-1 rounded-full border-4 border-panel flex items-center justify-center";
          const dot = allDone ? (
            <span className={`${dotBase} -left-[27px] w-4 h-4 bg-emerald`}>
              <Check size={8} className="text-white" strokeWidth={3} />
            </span>
          ) : state === "current" ? (
            <>
              <span className={`${dotBase} -left-[29px] w-5 h-5 bg-brand-500 animate-pulse`} />
              <span className="absolute -left-[29px] top-1 w-5 h-5 rounded-full ring-4 ring-brand-500/20 pointer-events-none" />
            </>
          ) : state === "past" ? (
            <span className={`${dotBase} -left-[25px] w-3 h-3 bg-amber-500/70`} />
          ) : (
            <span className={`${dotBase} -left-[25px] w-3 h-3 bg-line-strong`} />
          );

          const cardClass =
            state === "current"
              ? "bg-gradient-to-br from-panel to-sunken rounded-2xl p-5 border border-brand-500/30 shadow-lg shadow-brand-500/5"
              : "bg-sunken/50 rounded-2xl p-5 border border-line hover:border-line-strong/70 transition-colors";

          const rangeColor =
            state === "current" ? "text-brand-400" : state === "past" ? "text-amber-500/80" : "text-lo";

          const tag =
            state === "current" ? (
              <span className="ml-2 text-lo font-normal">· Current Session</span>
            ) : state === "past" ? (
              <span className="ml-2 text-lo font-normal">· Earlier today</span>
            ) : (
              <span className="ml-2 text-lo font-normal">· Upcoming</span>
            );

          return (
            <div key={b.id} className="relative">
              {dot}
              <p className={`text-[11px] font-bold mb-1.5 num ${rangeColor}`}>
                {range}
                {tag}
              </p>
              <div className={cardClass}>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h4 className={`text-base font-bold ${state === "current" ? "text-hi" : "text-mid"}`}>{b.label}</h4>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                      state === "current"
                        ? "bg-brand-500/15 text-brand-400"
                        : "bg-zinc-800 text-lo border border-line"
                    }`}
                  >
                    {b.duration}
                  </span>
                </div>
                <p className="text-xs text-mid italic mb-3">{b.objective}</p>
                <div className="space-y-2">
                  {b.items.map((it, i) => {
                    const k = `${b.id}-${i}`;
                    const on = !!checks[k];
                    return (
                      <button
                        key={k}
                        onClick={() => toggle(k)}
                        className="flex items-start gap-3 w-full text-left group"
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            on ? "bg-brand-600 border-brand-600" : "border-line-strong group-hover:border-mid"
                          }`}
                        >
                          {on && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-sm ${
                            on ? "text-lo line-through" : "text-mid group-hover:text-hi"
                          } transition-colors`}
                        >
                          {it}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {blockEvents.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-line/60 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-lo">In this window</p>
                    {blockEvents.map((e) => (
                      <p key={e.uid} className="text-xs text-mid flex items-center gap-2">
                        <Clock size={11} className="text-brand-400 shrink-0" />
                        <span className="num text-lo shrink-0">{fmt(e.h)}</span>
                        <span className="truncate">{e.title}</span>
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-lo">
                    {doneCount}/{b.items.length} done
                  </span>
                  <div className="flex-1 max-w-[160px] h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        allDone
                          ? "bg-gradient-to-r from-emerald to-emerald/70"
                          : "bg-gradient-to-r from-brand-500 to-brand-400"
                      }`}
                      style={{ width: `${b.items.length ? (doneCount / b.items.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Yesterday Recap (right rail) ---------------- */
function YesterdayRecap() {
  return (
    <div className="bg-panel border border-line rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <History size={14} className="text-lo" />
        <h3 className="font-display font-bold text-hi text-sm">Yesterday Recap</h3>
      </div>
      <p className="text-sm text-mid mb-4 leading-relaxed">
        Focused on technical setup and administrative foundation. A day of "gathering" before creative pushes.
      </p>
      <ul className="space-y-2">
        <Recap ok>Troubleshot Limitless pendant charging states and app integration.</Recap>
        <Recap ok>Washington state registration mail arrived via Middesk/Gusto.</Recap>
        <Recap>No logged shoots or completed tasks recorded.</Recap>
      </ul>
    </div>
  );
}

/* ---------------- Threads to Close (right rail) ---------------- */
function ThreadsRail({ threads }: { threads: Array<{ id: string; title: string; notes?: string; priority: string }> }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <div className="bg-panel border border-line rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-hi text-sm flex items-center gap-2">
          <ListChecks size={14} className="text-brand-400" />
          Threads to Close
        </h3>
        <span className="text-[11px] text-lo">{threads.length} {threads.length === 1 ? "item" : "items"}</span>
      </div>
      {threads.length === 0 ? (
        <p className="text-sm text-mid italic py-2">Nothing urgent — clear runway.</p>
      ) : (
        <ul className="space-y-1 -mx-2">
          {threads.map((t) => {
            const on = !!done[t.id];
            return (
              <li key={t.id}>
                <button
                  onClick={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))}
                  className="w-full flex items-start gap-3 text-left p-2 rounded-lg hover:bg-sunken transition-colors group"
                >
                  <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? "bg-brand-600 border-brand-600" : "border-line-strong group-hover:border-mid"}`}>
                    {on && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className={`text-sm ${on ? "text-lo line-through" : "text-mid"} truncate`}>{t.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
      <div className="flex items-start gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {ideas.map((c) => (
          <div
            key={c.title}
            className="min-w-[320px] max-w-[360px] flex-shrink-0 bg-panel border border-line rounded-xl p-5 snap-start hover:border-line-strong/60 transition-colors group relative overflow-hidden"
          >
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
  person, tasks, titleSuffix, roleLabel, blocks, week, owns, never: neverList, showCheckout,
}: {
  person: { id: string; name: string; role: string; initials: string; color: string };
  tasks: Array<{ id: string; title: string; priority: string; dueDate?: string; status: string; notes?: string }>;
  titleSuffix: string;
  roleLabel: string;
  blocks: Block[];
  week: Record<number, WeekDay>;
  owns: string[];
  never: string[];
  showCheckout?: boolean;
}) {
  const run = useServerFn(generateTaskAssist);
  const [result, setResult] = useState<TaskAssistantResult | null>(null);
  const [loading, setLoading] = useState(false);
  // Checked subtasks reset daily. Persisted under a date-stamped key so reloads
  // within the same day keep state, but a new day starts fresh.
  const todayKey = new Date().toISOString().slice(0, 10);
  const checkedKey = `dayChecked:${person.id}:${todayKey}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(checkedKey) ?? "{}"); } catch { return {}; }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(checkedKey, JSON.stringify(checked)); } catch {}
    // Clean up any prior-day checked entries for this person.
    try {
      const prefix = `dayChecked:${person.id}:`;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix) && k !== checkedKey) localStorage.removeItem(k);
      }
    } catch {}
  }, [checked, checkedKey, person.id]);

  // Per-person editable overrides of the playbook items, persisted to localStorage.
  // Map shape: { [blockId]: string[] }. Missing key = use the source b.items.
  const storageKey = `dayItems:${person.id}`;
  const [overrides, setOverrides] = useState<Record<string, string[]>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "{}"); } catch { return {}; }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(storageKey, JSON.stringify(overrides)); } catch {}
  }, [overrides, storageKey]);

  const itemsFor = (b: Block): string[] => overrides[b.id] ?? b.items;

  const [editing, setEditing] = useState<string | null>(null); // `${blockId}-${index}` or `${blockId}-new`
  const [draft, setDraft] = useState("");

  function commitItems(blockId: string, next: string[]) {
    setOverrides((o) => ({ ...o, [blockId]: next }));
  }
  function updateItem(b: Block, i: number, text: string) {
    const next = itemsFor(b).slice();
    next[i] = text;
    commitItems(b.id, next);
  }
  function deleteItem(b: Block, i: number) {
    const next = itemsFor(b).slice();
    next.splice(i, 1);
    commitItems(b.id, next);
    // also clear any check state on that index by shifting
    setChecked((c) => {
      const out: Record<string, boolean> = {};
      Object.entries(c).forEach(([k, v]) => {
        if (!k.startsWith(`${b.id}-`)) { out[k] = v; return; }
        const idx = Number(k.split("-").pop());
        if (idx === i) return;
        out[idx > i ? `${b.id}-${idx - 1}` : k] = v;
      });
      return out;
    });
  }
  function addItem(b: Block, text: string) {
    if (!text.trim()) return;
    commitItems(b.id, [...itemsFor(b), text.trim()]);
  }

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
    const list = itemsFor(b);
    const total = list.length;
    const done = list.reduce((n, _it, i) => n + (checked[`${b.id}-${i}`] ? 1 : 0), 0);
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
                  {itemsFor(b).map((it, i) => {
                    const k = `${b.id}-${i}`;
                    const on = !!checked[k];
                    const isEditing = editing === k;
                    return (
                      <li key={k} className="group/item flex items-start gap-2">
                        <button
                          onClick={() => toggle(k)}
                          className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${on ? "bg-brand-600 border-brand-600" : "border-lo hover:border-mid"}`}
                          aria-label={on ? "Mark incomplete" : "Mark complete"}
                        >
                          {on && <CircleCheck size={10} className="text-white" />}
                        </button>
                        {isEditing ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={() => { if (draft.trim()) updateItem(b, i, draft.trim()); setEditing(null); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { if (draft.trim()) updateItem(b, i, draft.trim()); setEditing(null); }
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="flex-1 bg-sunken border border-brand-500/40 rounded px-1.5 py-0.5 text-xs text-hi outline-none focus:border-brand-500"
                          />
                        ) : (
                          <button
                            onClick={() => toggle(k)}
                            onDoubleClick={() => { setEditing(k); setDraft(it); }}
                            className={`flex-1 text-left text-xs ${on ? "text-lo line-through" : "text-mid"}`}
                            title="Double-click to edit"
                          >
                            {it}
                          </button>
                        )}
                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditing(k); setDraft(it); }}
                              className="p-1 rounded hover:bg-hover text-lo hover:text-brand-400"
                              aria-label="Edit"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteItem(b, i); }}
                              className="p-1 rounded hover:bg-hover text-lo hover:text-rose"
                              aria-label="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {/* Add new item */}
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded border border-dashed border-line flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <Plus size={9} className="text-lo" />
                    </span>
                    {editing === `${b.id}-new` ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => { addItem(b, draft); setDraft(""); setEditing(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { addItem(b, draft); setDraft(""); setEditing(null); }
                          if (e.key === "Escape") { setDraft(""); setEditing(null); }
                        }}
                        placeholder="Add a sub-task…"
                        className="flex-1 bg-sunken border border-brand-500/40 rounded px-1.5 py-0.5 text-xs text-hi outline-none focus:border-brand-500"
                      />
                    ) : (
                      <button
                        onClick={() => { setEditing(`${b.id}-new`); setDraft(""); }}
                        className="text-xs text-lo hover:text-brand-400 transition-colors"
                      >
                        Add item
                      </button>
                    )}
                  </li>
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
      {showCheckout && <DailyCheckout personName={person.name} />}

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
        <div key={s.label} className="card-lift relative bg-panel border border-line rounded-xl p-4 overflow-hidden hover:border-line-strong/60 transition-colors">
          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${s.grad} opacity-10 blur-2xl`} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-lo">{s.label}</p>
          <div className="flex items-end justify-between mt-1">
            <p className="font-display text-3xl font-bold text-hi num"><AnimatedNumber value={s.value} /></p>
            <div className="w-16 h-8 -mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.spark.map((v, i) => ({ i, v }))}>
                  <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                    {s.spark.map((_, i) => (
                      <Cell key={i} fill={i === s.spark.length - 1 ? "var(--brand-400)" : "var(--line-2)"} />
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
              <BarChart data={data} barCategoryGap="30%" margin={{ top: 18, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-lo)" fontSize={11} axisLine={false} tickLine={false} dy={4} />
                <YAxis allowDecimals={false} stroke="var(--text-lo)" fontSize={10.5} axisLine={false} tickLine={false} width={32} />
                <Tooltip cursor={{ fill: "color-mix(in oklab, var(--brand-500) 6%, transparent)" }} content={<ChartTooltip />} />
                <Bar dataKey="Low" stackId="a" fill="var(--line-2)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Med" stackId="a" fill="var(--brand-500)" />
                <Bar dataKey="High" stackId="a" fill="var(--accent-rose)" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" fill="var(--text-hi)" fontSize={11.5} fontWeight={700} formatter={(v: number) => (v > 0 ? v : "")} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center gap-4 mt-2 justify-center text-[11px] text-lo">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose" />High · <span className="num text-hi font-semibold">{data.reduce((n, d) => n + d.High, 0)}</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--brand-500)" }} />Med · <span className="num text-hi font-semibold">{data.reduce((n, d) => n + d.Med, 0)}</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--line-2)" }} />Low · <span className="num text-hi font-semibold">{data.reduce((n, d) => n + d.Low, 0)}</span></span>
          <span className="text-lo">· {data.reduce((n, d) => n + d.total, 0)} open total</span>
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
              <Pie
                data={blockData} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={3} stroke="none"
                label={({ percent, x, y }) => (
                  <text x={x} y={y} fill="var(--text-mid)" fontSize={10} fontWeight={600} textAnchor="middle" dominantBaseline="central">
                    {Math.round((percent ?? 0) * 100)}%
                  </text>
                )}
                labelLine={{ stroke: "var(--line-2)", strokeWidth: 1 }}
              >
                {blockData.map((b, i) => <Cell key={i} fill={b.fill} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} min`} />} />
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
              <span className="text-lo num">{b.value}m · {Math.round((b.value / blockData.reduce((n, x) => n + x.value, 0)) * 100)}%</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
