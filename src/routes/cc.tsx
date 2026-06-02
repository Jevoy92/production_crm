import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav, LaneBadge, StatusBadge } from "@/components/cc/CCNav";
import { useCCStore } from "@/lib/ccStore";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cc")({
  component: CCDashboard,
  head: () => ({ meta: [{ title: "Content Command Center · Palmer House" }] }),
});

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="card-elevated rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="num text-2xl font-semibold mt-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Bar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span>{label}</span>
        <span className="num text-muted-foreground">{done} / {total} · {pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CCDashboard() {
  const { core12, library, shoots, tasks } = useCCStore();

  const count = (s: string) => core12.filter((c) => c.status === s).length + library.filter((l) => l.status === s).length;
  const shortsCount = library.filter((l) => l.type === "Short").length;
  const websiteDone = library.filter((l) => l.type === "Website" && l.status === "Published").length;
  const photoDone = library.filter((l) => l.type === "Photo-to-Video" && l.status === "Published").length;
  const sysDone = library.filter((l) => l.type === "System" && l.status === "Published").length;

  const c12Done = core12.filter((c) => c.publishedDone).length;
  const websiteTotal = library.filter((l) => l.type === "Website").length;
  const sysTotal = library.filter((l) => l.type === "System").length;

  const bottlenecks = core12.filter((c) => c.status === "Needs Jevoy Review");
  const nextShoot = [...shoots].filter((s) => s.date).sort((a, b) => a.date.localeCompare(b.date))[0]
    ?? shoots.find((s) => s.status === "Planned");

  const todayTask = tasks.find((t) => t.status !== "done");

  return (
    <Shell title="Content Command Center" subtitle="30-day internal production sprint">
      <CCNav />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <StatCard label="Total planned" value={core12.length + library.length} />
        <StatCard label="Ready to film" value={count("Ready to Film")} accent="var(--info)" />
        <StatCard label="Filmed" value={count("Filmed") + count("Logged")} accent="var(--lane-evergreen)" />
        <StatCard label="With editor" value={count("Sent to Editor") + count("Editing")} accent="var(--warning)" />
        <StatCard label="Ready to publish" value={count("Ready to Publish") + count("Scheduled")} accent="var(--info)" />
        <StatCard label="Published" value={count("Published") + count("Repurposed")} accent="var(--success)" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Shorts created" value={shortsCount} sub="library entries" />
        <StatCard label="Website videos done" value={`${websiteDone}/${websiteTotal}`} />
        <StatCard label="Photo-to-video" value={photoDone} sub="published" />
        <StatCard label="System videos" value={`${sysDone}/${sysTotal}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated rounded-xl p-4 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Sprint progress</div>
          <div className="space-y-3">
            <Bar label="Core 12 published" done={c12Done} total={12} />
            <Bar label="Website trust library" done={websiteDone} total={websiteTotal} />
            <Bar label="Shorts captured" done={shortsCount} total={70} />
            <Bar label="Photo-to-video assets" done={photoDone} total={15} />
            <Bar label="System / onboarding videos" done={sysDone} total={sysTotal} />
          </div>
        </div>

        <div className="card-elevated rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Today's focus</div>
          {todayTask ? (
            <Link to="/cc/tasks" className="block">
              <div className="text-[14px] font-medium hover:text-primary">{todayTask.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{todayTask.category} · {todayTask.priority}</div>
            </Link>
          ) : <div className="text-[12px] text-muted-foreground">All tasks done. Add one in Shannen Tasks.</div>}

          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-4 mb-2">Next shoot</div>
          {nextShoot ? (
            <Link to="/cc/shoots/$id" params={{ id: nextShoot.id }} className="block hover:text-primary">
              <div className="text-[14px] font-medium">{nextShoot.theme || "Untitled shoot"}</div>
              <div className="text-[11px] text-muted-foreground">{nextShoot.date || "Date TBD"} · {nextShoot.location}</div>
            </Link>
          ) : <div className="text-[12px] text-muted-foreground">No shoots planned yet.</div>}

          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-4 mb-2">Bottlenecks · Needs Jevoy</div>
          {bottlenecks.length === 0 ? (
            <div className="text-[12px] text-muted-foreground">Nothing waiting on you. ✅</div>
          ) : bottlenecks.slice(0, 5).map((b) => (
            <Link key={b.id} to="/cc/core12/$num" params={{ num: String(b.number) }} className="block py-1 text-[13px] hover:text-primary">
              <span className="num text-muted-foreground mr-2">#{b.number}</span>{b.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 card-elevated rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Core 12 snapshot</div>
          <Link to="/cc/core12" className="text-[12px] text-primary">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {core12.map((c) => (
            <Link key={c.id} to="/cc/core12/$num" params={{ num: String(c.number) }} className="rounded-lg border border-border p-2.5 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="num text-[11px] text-muted-foreground">#{c.number}</span>
                <LaneBadge lane={c.palLane} />
              </div>
              <div className="text-[12px] font-medium leading-tight mb-1.5 line-clamp-2">{c.title}</div>
              <StatusBadge status={c.status} />
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
