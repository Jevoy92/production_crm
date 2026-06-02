import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { KpiCard, usd } from "@/components/kpi/KpiPrimitives";
import { useStore } from "@/lib/store";
import { useCCStore, platformColor } from "@/lib/ccStore";
import { ownerKpis, cfoKpis, paKpis } from "@/lib/kpis";

export const Route = createFileRoute("/")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Palmer House OS" }] }),
});

function RoleKpis() {
  const role = useStore((s) => s.activeRole);
  useStore((s) => s.projects); // subscribe
  if (role === "owner") {
    const k = ownerKpis();
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Active projects" value={k.activeCount} sub="across all Pal types" accent="var(--color-chart-1)" />
        <KpiCard label="Quoted (active)" value={usd(k.quotedTotal)} sub="pipeline value" accent="var(--color-chart-2)" />
        <KpiCard label="Delivered MTD" value={k.deliveredThisMonth} sub="this month" accent="var(--color-chart-3)" />
        <KpiCard label="Shoots this month" value={k.shootsThisMonth} sub={`${k.internalCount} internal`} accent="var(--color-chart-4)" />
      </div>
    );
  }
  if (role === "cfo") {
    const k = cfoKpis();
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Booked revenue" value={usd(k.bookedRevenue ?? 0)} sub="confirmed" accent="var(--color-chart-1)" />
        <KpiCard label="Cash collected MTD" value={usd(k.cashCollectedMonth ?? 0)} accent="var(--color-chart-2)" />
        <KpiCard label="Outstanding" value={usd(k.outstanding ?? 0)} sub="AR" accent="var(--color-chart-3)" />
        <KpiCard label="Active projects" value={k.activeCount ?? 0} accent="var(--color-chart-4)" />
      </div>
    );
  }
  const k = paKpis();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard label="Open tasks" value={k.openTasks ?? 0} accent="var(--color-chart-1)" />
      <KpiCard label="Shoots this week" value={k.shootsThisWeek ?? 0} accent="var(--color-chart-2)" />
      <KpiCard label="Projects in flight" value={k.activeProjects ?? 0} accent="var(--color-chart-3)" />
      <KpiCard label="Checklists ready" value={k.readyChecklists ?? 0} accent="var(--color-chart-4)" />
    </div>
  );
}

function Today() {
  const role = useStore((s) => s.activeRole);
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const me = team.find((m) => m.role === role);

  const myTasks = tasks
    .filter((t) => t.status !== "done")
    .filter((t) => (me ? t.assigneeId === me.id : true))
    .slice(0, 6);

  const { core12, library, shoots } = useCCStore();
  const c12Published = core12.filter((c) => c.publishedDone).length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7Key = in7.toISOString().slice(0, 10);
  const upcomingPublish = library
    .filter((l) => l.publishDate && l.publishDate >= todayKey && l.publishDate <= in7Key)
    .sort((a, b) => (a.publishDate ?? "").localeCompare(b.publishDate ?? ""))
    .slice(0, 6);
  const nextShoot = [...shoots].filter((s) => s.date).sort((a, b) => a.date.localeCompare(b.date))[0];

  const subtitle = me ? `${me.name} · ${role === "pa" ? "PA" : role}` : "Palmer House OS";

  return (
    <Shell title="Today" subtitle={subtitle}>
      <div className="mb-5">
        <RoleKpis />
        <div className="mt-2 text-[11px] text-muted-foreground">
          Switch role from the avatar menu, top-right. Deeper KPI pages:{" "}
          <Link to="/kpis/owner" className="text-primary">Owner</Link> ·{" "}
          <Link to="/kpis/cfo" className="text-primary">CFO</Link> ·{" "}
          <Link to="/kpis/pa" className="text-primary">PA</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">My open tasks</div>
            <Link to="/tasks" className="text-[12px] text-primary">All tasks →</Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="text-[12px] text-muted-foreground">Nothing on your plate. Add one in Tasks.</div>
          ) : (
            <ul className="space-y-1.5">
              {myTasks.map((t) => (
                <li key={t.id} className="text-[13px] leading-snug flex items-start gap-2">
                  <span className={`mt-1 size-1.5 rounded-full ${t.priority === "High" ? "bg-destructive" : t.priority === "Med" ? "bg-warning" : "bg-muted-foreground/60"}`} />
                  <span className="flex-1">{t.title}</span>
                  <span className="text-[10.5px] text-muted-foreground capitalize">{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Content sprint</div>
            <Link to="/cc" className="text-[12px] text-primary">Open Content →</Link>
          </div>
          <div className="text-[13px]">
            <div><span className="num font-semibold">{c12Published}</span><span className="text-muted-foreground"> / 12 Core 12 published</span></div>
            <div className="mt-1"><span className="num font-semibold">{library.filter((l) => l.status === "Published").length}</span><span className="text-muted-foreground"> library pieces published</span></div>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-4 mb-1">Next shoot</div>
          {nextShoot ? (
            <Link to="/cc/shoots/$id" params={{ id: nextShoot.id }} className="block text-[13px] hover:text-primary">
              {nextShoot.theme || "Untitled shoot"} <span className="text-muted-foreground">· {nextShoot.date || "TBD"}</span>
            </Link>
          ) : (
            <div className="text-[12px] text-muted-foreground">No shoots planned.</div>
          )}
        </div>

        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Publishing · next 7 days</div>
            <Link to="/schedule" search={{ view: "publishing" }} className="text-[12px] text-primary">Calendar →</Link>
          </div>
          {upcomingPublish.length === 0 ? (
            <div className="text-[12px] text-muted-foreground">Nothing scheduled. Drop something on the calendar.</div>
          ) : (
            <ul className="space-y-1.5">
              {upcomingPublish.map((it) => {
                const color = platformColor(it.platform);
                const d = new Date((it.publishDate ?? "") + "T00:00:00");
                return (
                  <li key={it.id} className="text-[13px] flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full" style={{ background: color }} />
                    <span className="flex-1 leading-snug">{it.title}</span>
                    <span className="num text-[10.5px] text-muted-foreground whitespace-nowrap">
                      {d.toLocaleString(undefined, { weekday: "short", day: "numeric" })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
