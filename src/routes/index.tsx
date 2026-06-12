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
              {todayEvents.length === 0 ? (
                <p className="text-sm text-mid py-6 text-center">No calendar events today.</p>
              ) : (
                <div className="relative pl-4 border-l border-line space-y-6">
                  {todayEvents.map((e, i) => (
                    <div key={e.uid} className="relative">
                      <div
                        className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-panel ${
                          i === 0 ? "bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-line-strong"
                        }`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                        <span className={`text-sm font-medium w-14 shrink-0 ${i === 0 ? "text-brand-400 font-semibold" : "text-mid"}`}>
                          {e.allDay
                            ? "All day"
                            : new Date(e.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className={i === 0 ? "bg-brand-600/5 border border-brand-500/20 rounded-lg p-3 w-full" : ""}>
                          <h4 className="text-sm font-semibold text-hi mb-1 truncate">{e.title}</h4>
                          {e.location && <p className="text-xs text-mid truncate">{e.location}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="bg-rose/5 border border-rose/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-rose/20 flex items-center justify-center text-rose">
                <TriangleAlert size={14} />
              </div>
              <h3 className="font-display font-bold text-hi text-base">Watch-outs</h3>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="bg-panel/60 border border-rose/30 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-rose mb-1">Admin Lag</h4>
                <p className="text-xs text-mid">
                  Don't ignore the Middesk mail; registration issues can halt payments or contracts later.
                </p>
              </div>
              <div className="bg-panel/60 border border-amber/30 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-amber mb-1">Calendar Compression</h4>
                <p className="text-xs text-mid">
                  Back-to-back calls midday. <strong className="text-hi">Eat before 12:30</strong> or you'll fade.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI-assisted person task panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shannen && <PersonTasks person={shannen} tasks={tasks.filter((t) => t.assigneeId === shannen.id && t.status !== "done")} />}
          {jevoy && <PersonTasks person={jevoy} tasks={tasks.filter((t) => t.assigneeId === jevoy.id && t.status !== "done")} />}
        </div>

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
