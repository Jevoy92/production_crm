import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DollarSign, FolderKanban, FileVideo, Users, Video, TriangleAlert,
  ChartArea, ListChecks, Zap, ArrowRight, ChevronRight, Plus, CircleCheck, Mail, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Reveal, Stagger, StaggerItem, AnimatedNumber } from "@/components/motion/Motion";
import { AreaTrend } from "@/components/charts/Charts";
import { useStore } from "@/lib/store";
import { useCCStore, platformColor } from "@/lib/ccStore";
import { ownerKpis, cfoKpis } from "@/lib/kpis";

export const Route = createFileRoute("/")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Production OS" }] }),
});

function usd(n: number) {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `$${Math.round(n)}`;
}

function monthlyRevenue(projects: any[]) {
  const now = new Date();
  const months: { name: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "short" });
    const value = projects
      .filter((p) => {
        const ds = p.deliveryDate || p.createdAt;
        return ds && ds.slice(0, 7) === key;
      })
      .reduce((a, p) => a + (p.quoted ?? 0), 0);
    months.push({ name: label, value });
  }
  return months;
}

const SHOOT_ACCENT: Record<string, { text: string; bg: string }> = {
  Planned: { text: "text-violet", bg: "bg-violet/10 border border-violet/20" },
  "In Progress": { text: "text-emerald", bg: "bg-emerald/10 border border-emerald/20" },
  Wrapped: { text: "text-cyan", bg: "bg-cyan/10 border border-cyan/20" },
  Cancelled: { text: "text-rose", bg: "bg-rose/10 border border-rose/20" },
};

function Today() {
  const role = useStore((s) => s.activeRole);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const me = team.find((m) => m.role === role) ?? team[0];

  const ok = ownerKpis();
  const cf = cfoKpis();
  const { core12, library, shoots } = useCCStore();

  const todayKey = new Date().toISOString().slice(0, 10);
  const upcomingShoots = [...shoots]
    .filter((s) => s.date && s.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const doneToday = tasks.filter((t) => t.status === "done");
  const alerts = [
    ...ok.stuck.slice(0, 3).map((p: any) => ({
      tone: "rose" as const, tag: "STUCK", title: p.title ?? p.name ?? "Project blocked",
      sub: p.blocker ? String(p.blocker) : "No activity in 14+ days",
    })),
    ...openTasks.filter((t) => t.priority === "High").slice(0, 3).map((t) => ({
      tone: "amber" as const, tag: "HIGH PRIORITY", title: t.title, sub: "Needs attention today",
    })),
  ].slice(0, 5);

  const revenue = monthlyRevenue(projects);
  const c12Published = core12.filter((c) => c.publishedDone).length;

  const firstName = me?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // ── Day at a glance (synthesized from Production OS data) ──
  const todayStr = new Date().toDateString();
  const dueToday = openTasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === todayStr);
  const shootsToday = shoots.filter((s) => s.date === todayKey);
  const publishingToday = library.filter((l) => l.publishDate === todayKey);
  const outstanding = cf.outstanding ?? 0;
  const glanceStats = [
    { label: "Shoots today", value: shootsToday.length, icon: <Video size={14} />, accent: "brand" },
    { label: "Due today", value: dueToday.length, icon: <ListChecks size={14} />, accent: "amber" },
    { label: "Need attention", value: alerts.length, icon: <TriangleAlert size={14} />, accent: "rose" },
    { label: "Publishing", value: publishingToday.length, icon: <Zap size={14} />, accent: "violet" },
  ];
  const glanceParts: string[] = [];
  if (shootsToday.length) glanceParts.push(`${shootsToday.length} shoot${shootsToday.length === 1 ? "" : "s"}`);
  if (dueToday.length) glanceParts.push(`${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due`);
  if (alerts.length) glanceParts.push(`${alerts.length} item${alerts.length === 1 ? "" : "s"} needing attention`);
  if (outstanding > 0) glanceParts.push(`${usd(outstanding)} outstanding`);
  const glanceSummary = glanceParts.length
    ? `You've got ${glanceParts.slice(0, -1).join(", ")}${glanceParts.length > 1 ? " and " : ""}${glanceParts.slice(-1)} on the board.`
    : "Nothing pressing on the board — a good day to get ahead.";
  const GLANCE_ACCENT: Record<string, string> = {
    brand: "bg-brand-600/15 text-brand-400", amber: "bg-amber/15 text-amber",
    rose: "bg-rose/15 text-rose", violet: "bg-violet/15 text-violet",
  };

  const kpis = [
    {
      icon: <DollarSign size={16} />, accent: "brand", chip: "bg-brand-600/15 border border-brand-500/20 text-brand-400",
      value: cf.booked, format: usd, label: "Booked Revenue",
      foot: <Sub>{ok.deliveredThisMonth} delivered MTD · {cf.outstanding ? `${usd(cf.outstanding)} outstanding` : "all collected"}</Sub>,
    },
    {
      icon: <FolderKanban size={16} />, chip: "bg-violet-600/15 border border-violet-500/20 text-violet",
      value: ok.activeCount, format: (n: number) => String(Math.round(n)), label: "Active Projects",
      foot: <Sub>{ok.activeByPal.map((p) => `${p.value} ${p.name.toLowerCase()}`).slice(0, 3).join(" · ")}</Sub>,
    },
    {
      icon: <FileVideo size={16} />, chip: "bg-amber-600/15 border border-amber-500/20 text-amber",
      value: 12 - c12Published, format: (n: number) => String(Math.round(n)), label: "Pending Core 12",
      foot: <Sub>{c12Published} of 12 published · {library.length} in library</Sub>,
    },
    {
      icon: <Users size={16} />, chip: "bg-cyan-600/15 border border-cyan-500/20 text-cyan",
      value: team.length, format: (n: number) => String(Math.round(n)), label: "Team Members",
      foot: (
        <div className="flex -space-x-2">
          {team.slice(0, 5).map((m) => (
            <div key={m.id} className="w-6 h-6 rounded-full border-2 border-panel bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold">
              {m.name.charAt(0)}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      eyebrow="Today"
      title={`${greeting}, ${firstName}`}
      subtitle={`${todayLabel} · ${upcomingShoots.length} shoot${upcomingShoots.length === 1 ? "" : "s"} ahead`}
      actions={
        <Link to="/productions" className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={14} /> New Project
        </Link>
      }
    >
      {/* Day at a glance */}
      <Reveal>
        <div className="bg-panel border border-line rounded-2xl p-5 mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-[var(--elev-sm)]"><Sparkles size={16} className="text-white" /></div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-lo mb-0.5">Day at a glance</div>
              <p className="text-hi text-sm font-medium leading-snug">{glanceSummary}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {glanceStats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 bg-sunken border border-line rounded-xl px-3 py-2.5">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${GLANCE_ACCENT[s.accent]}`}>{s.icon}</span>
                <div>
                  <div className="text-hi font-bold text-lg leading-none num">{s.value}</div>
                  <div className="text-lo text-[11px]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-lo text-xs font-medium self-center">Focus:</span>
              {alerts.slice(0, 3).map((a, i) => (
                <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${a.tone === "rose" ? "bg-rose/10 text-rose border-rose/20" : "bg-amber/10 text-amber border-amber/20"}`}>{a.title}</span>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-line flex items-center gap-2 text-lo text-xs">
            <Mail size={12} />
            <span>Inbox triage &amp; calendar sync activate once Gmail/Google Calendar is connected in Settings.</span>
          </div>
        </div>
      </Reveal>

      {/* KPI row */}
      <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" stagger={0.06}>
        {kpis.map((k) => (
          <StaggerItem key={k.label} variant="scaleIn">
            <div className="relative bg-panel border border-line rounded-2xl p-5 overflow-hidden group hover:border-brand-500/40 transition-colors h-full">
              <div className="absolute top-0 right-0 w-28 h-28 bg-brand-600/5 rounded-full -translate-y-8 translate-x-8" />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${k.chip}`}>{k.icon}</div>
              <div className="text-3xl font-display font-bold text-hi mb-1 num">
                <AnimatedNumber value={k.value} format={k.format} />
              </div>
              <div className="text-mid text-sm font-medium mb-3">{k.label}</div>
              {k.foot}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Reveal className="lg:col-span-2" delay={0.05}>
          <Panel
            icon={<Video size={14} className="text-brand-400" />}
            title="Upcoming Shoots"
            sub={`${upcomingShoots.length} scheduled`}
            action={<Link to="/schedule" className="text-brand-400 text-xs font-semibold hover:text-brand-300 flex items-center gap-1">View Calendar <ArrowRight size={12} /></Link>}
          >
            {upcomingShoots.length === 0 ? (
              <Empty>No upcoming shoots scheduled.</Empty>
            ) : (
              <div className="space-y-3">
                {upcomingShoots.map((s) => {
                  const acc = SHOOT_ACCENT[s.status] ?? SHOOT_ACCENT.Planned;
                  const d = new Date(s.date + "T00:00:00");
                  return (
                    <Link
                      key={s.id}
                      to="/shoots/$id"
                      params={{ id: s.id }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-sunken/60 border border-line hover:border-brand-500/30 transition-all group"
                    >
                      <div className="flex-shrink-0 text-center w-12">
                        <div className="text-[10px] text-lo font-medium mb-1 uppercase">{d.toLocaleString(undefined, { month: "short" })}</div>
                        <div className="text-hi font-bold text-lg leading-none">{d.getDate()}</div>
                        <div className="text-lo text-xs mt-0.5">{d.toLocaleString(undefined, { weekday: "short" })}</div>
                      </div>
                      <div className="w-px h-14 bg-line flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${acc.bg} ${acc.text}`}>{s.status}</span>
                        </div>
                        <h3 className="text-hi font-semibold text-sm mb-1 truncate">{s.theme || "Untitled shoot"}</h3>
                        <p className="text-mid text-xs truncate">{s.location || "Location TBD"}{s.videos ? ` · ${s.videos}` : ""}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-brand-600/20 group-hover:bg-brand-600/40 flex items-center justify-center transition-colors flex-shrink-0">
                        <ArrowRight size={13} className="text-brand-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <Panel
            icon={<TriangleAlert size={14} className="text-rose" />}
            iconBg="bg-rose/15"
            title="Priority Alerts"
            sub="Needs your attention"
            action={alerts.length > 0 ? <span className="w-5 h-5 rounded-full bg-rose flex items-center justify-center text-white text-xs font-bold">{alerts.length}</span> : undefined}
          >
            {alerts.length === 0 ? (
              <Empty>You're all caught up. No alerts.</Empty>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${a.tone === "rose" ? "bg-rose/8 border border-rose/20 hover:border-rose/40" : "bg-amber/8 border border-amber/20 hover:border-amber/40"}`}>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${a.tone === "rose" ? "text-rose" : "text-amber"}`}>{a.tag}</span>
                      <p className="text-hi text-xs font-semibold leading-snug mt-0.5 truncate">{a.title}</p>
                      <p className="text-mid text-xs mt-0.5 truncate">{a.sub}</p>
                    </div>
                    <ChevronRight size={13} className="text-lo mt-1 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Reveal>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Reveal delay={0.05}>
          <Panel
            icon={<ChartArea size={14} className="text-emerald" />}
            iconBg="bg-emerald/15"
            title="Revenue Trend"
            sub="Last 6 months"
            action={<span className="text-emerald text-sm font-bold">{usd(cf.booked)}</span>}
            noPad
          >
            <div className="px-3 pt-3 pb-1">
              <AreaTrend data={revenue} color="var(--brand-500)" height={180} formatter={(v) => usd(v)} />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <Panel
            icon={<ListChecks size={14} className="text-brand-400" />}
            title="Today's Tasks"
            sub={`${openTasks.length} remaining`}
            action={<Link to="/tasks" className="text-brand-400 text-xs font-semibold hover:text-brand-300">+ Add</Link>}
          >
            {tasks.length === 0 ? (
              <Empty>No tasks yet.</Empty>
            ) : (
              <div className="space-y-1">
                {[...doneToday.slice(0, 2), ...openTasks.slice(0, 6)].slice(0, 7).map((t) => {
                  const done = t.status === "done";
                  const urgency = t.priority === "High" ? { t: "Urgent", c: "text-rose" } : t.priority === "Med" ? { t: "Today", c: "text-amber" } : { t: "Soon", c: "text-lo" };
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover transition-colors cursor-pointer">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald border-2 border-emerald" : "border-2 border-line-strong"}`}>
                        {done && <CircleCheck size={10} className="text-white" />}
                      </div>
                      <span className={`text-sm flex-1 truncate ${done ? "text-lo line-through" : "text-hi"}`}>{t.title}</span>
                      <span className={`text-xs font-semibold ${done ? "text-lo" : urgency.c}`}>{done ? "Done" : urgency.t}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.15}>
          <Panel
            icon={<Zap size={14} className="text-violet" />}
            iconBg="bg-violet/15"
            title="Publishing Queue"
            sub="Next 7 days"
            action={<Link to="/schedule" search={{ view: "publishing" } as any} className="text-brand-400 text-xs font-semibold hover:text-brand-300">View all</Link>}
          >
            <PublishingFeed />
          </Panel>
        </Reveal>
      </div>
    </AppShell>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="text-lo text-xs">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-mid text-sm py-6 text-center">{children}</div>;
}

function Panel({
  icon, iconBg = "bg-brand-600/20", title, sub, action, children, noPad = false,
}: {
  icon: React.ReactNode; iconBg?: string; title: string; sub?: string;
  action?: React.ReactNode; children: React.ReactNode; noPad?: boolean;
}) {
  return (
    <section className="bg-panel border border-line rounded-2xl overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-hi text-base leading-tight truncate">{title}</h2>
            {sub && <p className="text-lo text-xs">{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={noPad ? "" : "p-4"}>{children}</div>
    </section>
  );
}

function PublishingFeed() {
  const { library } = useCCStore();
  const todayKey = new Date().toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7Key = in7.toISOString().slice(0, 10);
  const items = library
    .filter((l) => l.publishDate && l.publishDate >= todayKey && l.publishDate <= in7Key)
    .sort((a, b) => (a.publishDate ?? "").localeCompare(b.publishDate ?? ""))
    .slice(0, 7);

  if (items.length === 0) return <Empty>Nothing scheduled this week.</Empty>;
  return (
    <div className="space-y-2.5">
      {items.map((it) => {
        const color = platformColor(it.platform);
        const d = new Date((it.publishDate ?? "") + "T00:00:00");
        return (
          <div key={it.id} className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-hi text-xs flex-1 truncate">{it.title}</span>
            <span className="text-lo text-xs whitespace-nowrap">{d.toLocaleString(undefined, { weekday: "short", day: "numeric" })}</span>
          </div>
        );
      })}
    </div>
  );
}
