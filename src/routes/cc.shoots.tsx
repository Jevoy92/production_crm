import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav } from "@/components/cc/CCNav";
import { useCCStore } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/shoots")({
  component: ShootsPage,
  head: () => ({ meta: [{ title: "Shoot Planner · Content Command Center" }] }),
});

function ShootsPage() {
  const { shoots, addShoot } = useCCStore();
  return (
    <Shell title="Shoot Planner" subtitle="Plan, execute, and wrap every shoot day"
      actions={<button onClick={() => addShoot()} className="text-[13px] px-3 py-1.5 rounded-md bg-primary text-primary-foreground">+ New shoot day</button>}>
      <CCNav />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {shoots.map((s) => {
          const total = s.before.length + s.during.length + s.after.length;
          const done = [...s.before, ...s.during, ...s.after].filter((i) => i.done).length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <Link key={s.id} to="/cc/shoots/$id" params={{ id: s.id }} className="card-elevated rounded-xl p-4 hover:border-primary/50 transition-colors block">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] text-muted-foreground">{s.date || "Date TBD"}</div>
                <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3">{s.status}</div>
              </div>
              <h3 className="text-[14px] font-semibold leading-tight mb-1">{s.theme || "Untitled shoot"}</h3>
              <div className="text-[12px] text-muted-foreground mb-2">{s.location || "Location TBD"}</div>
              <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">{s.videos || "No videos assigned"}</p>
              <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{done}/{total} checklist items</div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
