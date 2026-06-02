import { createFileRoute, Link } from "@tanstack/react-router";
import { ThumbsUp, Clock4, Activity, CheckSquare, Calendar, Sparkles, MoreHorizontal } from "lucide-react";
import { AppShell, PageHeader, Card, MetricCard, Progress } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { useCCStore, platformColor } from "@/lib/ccStore";
import { ownerKpis, cfoKpis, paKpis } from "@/lib/kpis";

export const Route = createFileRoute("/")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Palmer House OS" }] }),
});

function useRoleMetrics() {
  const role = useStore((s) => s.activeRole);
  useStore((s) => s.projects);
  if (role === "owner") {
    const k = ownerKpis();
    return [
      { label: "Active projects", value: String(k.activeCount), icon: <ThumbsUp size={18} /> },
      { label: "Delivered MTD", value: String(k.deliveredThisMonth), icon: <Activity size={18} /> },
      { label: "Shoots this month", value: String(k.shootsThisMonth), icon: <Clock4 size={18} /> },
    ];
  }
  if (role === "cfo") {
    const k = cfoKpis();
    return [
      { label: "Booked revenue", value: usd(k.booked), icon: <ThumbsUp size={18} /> },
      { label: "Cash MTD", value: usd(k.cashCollected), icon: <Activity size={18} /> },
      { label: "Outstanding", value: usd(k.outstanding), icon: <Clock4 size={18} /> },
    ];
  }
  const k = paKpis();
  return [
    { label: "Shoots this week", value: String(k.upcomingThisWeek), icon: <ThumbsUp size={18} /> },
    { label: "Checklist avg", value: `${k.checklistAvg}%`, icon: <Activity size={18} /> },
    { label: "On-time delivery", value: `${k.onTimePct}%`, icon: <Clock4 size={18} /> },
  ];
}

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Today() {
  const role = useStore((s) => s.activeRole);
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const me = team.find((m) => m.role === role);
  const metrics = useRoleMetrics();

  const myTasks = tasks
    .filter((t) => t.status !== "done")
    .filter((t) => (me ? t.assigneeId === me.id : true))
    .slice(0, 6);

  const { core12, library, shoots } = useCCStore();
  const c12Published = core12.filter((c) => c.publishedDone).length;
  const c12Pct = Math.round((c12Published / 12) * 100);

  const todayKey = new Date().toISOString().slice(0, 10);
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7Key = in7.toISOString().slice(0, 10);
  const upcomingPublish = library
    .filter((l) => l.publishDate && l.publishDate >= todayKey && l.publishDate <= in7Key)
    .sort((a, b) => (a.publishDate ?? "").localeCompare(b.publishDate ?? ""))
    .slice(0, 6);

  const nextShoot = [...shoots]
    .filter((s) => s.date)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const firstName = me?.name?.split(" ")[0] ?? "there";

  return (
    <AppShell rightPanel={<RightPanel />}>
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle={`Track team progress here · ${role === "pa" ? "PA" : role.toUpperCase()}`}
        actions={
          <span className="ph-badge ph-badge-neutral">
            <Calendar size={14} /> {today}
          </span>
        }
      />

      <div className="metric-grid" style={{ marginBottom: 28 }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 20 }}>
        <Card
          title="Content sprint"
          action={<Link to="/cc" style={{ fontSize: 12, fontWeight: 700, color: "var(--ph-primary)" }}>Open Content →</Link>}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>
              <span style={{ fontWeight: 800, fontSize: 22, color: "var(--ph-text-primary)" }}>{c12Published}</span>
              <span style={{ marginLeft: 6 }}>of 12 Core 12 published</span>
            </div>
            <span className="ph-badge ph-badge-spotlight">{c12Pct}%</span>
          </div>
          <Progress value={c12Pct} />
          <div style={{ marginTop: 18, fontSize: 12, color: "var(--ph-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 8 }}>
            Next shoot
          </div>
          {nextShoot ? (
            <Link to="/cc/shoots/$id" params={{ id: nextShoot.id }} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--ph-text-primary)", fontSize: 14 }}>
              <span className="metric-icon" style={{ background: "var(--ph-primary-soft)", color: "var(--ph-primary)" }}>
                <Sparkles size={16} />
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{nextShoot.theme || "Untitled shoot"}</div>
                <div style={{ fontSize: 12, color: "var(--ph-text-secondary)" }}>{nextShoot.date || "TBD"}</div>
              </span>
            </Link>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>No shoots planned.</div>
          )}
        </Card>

        <Card
          title="Current tasks"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ph-text-secondary)" }}>
                Done {Math.round((tasks.filter((t) => t.status === "done").length / Math.max(tasks.length, 1)) * 100)}%
              </span>
              <Link to="/tasks" style={{ fontSize: 12, fontWeight: 700, color: "var(--ph-primary)" }}>All →</Link>
            </div>
          }
        >
          {myTasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>Nothing on your plate.</div>
          ) : (
            <div>
              {myTasks.map((t) => {
                const dot =
                  t.priority === "High" ? "danger" :
                  t.priority === "Med" ? "warning" : "muted";
                const badgeCls =
                  t.status === "doing" ? "ph-badge ph-badge-warning" :
                  t.status === "done" ? "ph-badge ph-badge-success" :
                  "ph-badge ph-badge-neutral";
                return (
                  <div key={t.id} className="ph-row">
                    <span className="metric-icon" style={{ width: 36, height: 36, background: "var(--ph-surface-soft)" }}>
                      <CheckSquare size={14} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ph-row-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`ph-dot ${dot}`} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                      </div>
                    </div>
                    <span className={badgeCls} style={{ textTransform: "capitalize" }}>
                      {t.status.replace("_", " ")}
                    </span>
                    <button className="ph-btn ph-btn-soft ph-btn-icon" aria-label="More">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title="Publishing · next 7 days"
          action={<Link to="/schedule" search={{ view: "publishing" }} style={{ fontSize: 12, fontWeight: 700, color: "var(--ph-primary)" }}>Calendar →</Link>}
        >
          {upcomingPublish.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>Nothing scheduled.</div>
          ) : (
            <div>
              {upcomingPublish.map((it) => {
                const color = platformColor(it.platform);
                const d = new Date((it.publishDate ?? "") + "T00:00:00");
                return (
                  <div key={it.id} className="ph-row">
                    <span className="ph-dot" style={{ background: color }} />
                    <div style={{ flex: 1, minWidth: 0 }} className="ph-row-title">
                      {it.title}
                    </div>
                    <span className="ph-row-meta" style={{ whiteSpace: "nowrap" }}>
                      {d.toLocaleString(undefined, { weekday: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function RightPanel() {
  const team = useStore((s) => s.team);
  const role = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === role) ?? team[0];
  const tasks = useStore((s) => s.tasks);
  const recent = tasks.slice(-4).reverse();

  return (
    <>
      <div className="ph-card-soft" style={{ textAlign: "center", padding: 24 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 999, margin: "0 auto 12px",
          background: "var(--ph-accent-gold-soft)",
          display: "grid", placeItems: "center",
          color: "var(--ph-accent-gold)", fontWeight: 800, fontSize: 28,
        }}>
          {me?.name?.charAt(0) ?? "P"}
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ph-text-primary)" }}>{me?.name ?? "Palmer House"}</div>
        <div style={{ fontSize: 12, color: "var(--ph-text-secondary)", marginTop: 2 }}>
          @{(me?.name ?? "team").toLowerCase().replace(/\s+/g, "")}
        </div>
      </div>

      <div>
        <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--ph-text-primary)", marginBottom: 12 }}>
          Activity
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {recent.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--ph-text-secondary)", textAlign: "center" }}>
              No recent activity.
            </div>
          ) : recent.map((t) => {
            const owner = team.find((m) => m.id === t.assigneeId);
            return (
              <div key={t.id} style={{ display: "flex", gap: 10 }}>
                <div className="metric-icon" style={{ width: 32, height: 32, background: "var(--ph-surface-soft)", fontSize: 12, fontWeight: 700, color: "var(--ph-text-secondary)" }}>
                  {(owner?.name ?? "?").charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ph-text-primary)" }}>
                    {owner?.name ?? "Unassigned"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ph-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
