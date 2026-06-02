import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav } from "@/components/cc/CCNav";
import { useCCStore } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/sprint")({
  component: SprintPage,
  head: () => ({ meta: [{ title: "30-Day Sprint · Content Command Center" }] }),
});

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      {items.length === 0 ? <div className="text-[12px] text-muted-foreground italic">—</div> :
        <ul className="space-y-1">{items.map((it, i) => <li key={i} className="text-[12px] flex gap-1.5"><span className="text-muted-foreground">·</span>{it}</li>)}</ul>}
    </div>
  );
}

function SprintPage() {
  const { weeks, core12, updateWeek } = useCCStore();
  return (
    <Shell title="30-Day Sprint" subtitle="Four weeks · the Palmer House content engine">
      <CCNav />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {weeks.map((w) => {
          const vids = w.core12Numbers.map((n) => core12.find((c) => c.number === n)).filter(Boolean) as typeof core12;
          return (
            <div key={w.number} className="card-elevated rounded-xl p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-lg font-semibold">Week {w.number}</h2>
                <div className="text-[11px] text-muted-foreground">Shorts {w.shortsTarget} · Photo {w.photoTarget}</div>
              </div>
              <p className="text-[13px] text-muted-foreground mb-4">{w.focus}</p>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Core 12 to film</div>
                <div className="flex flex-wrap gap-1.5">
                  {vids.map((v) => (
                    <Link key={v.id} to="/cc/core12/$num" params={{ num: String(v.number) }}
                      className="text-[12px] px-2 py-1 rounded bg-surface-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                      #{v.number} {v.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <List title="Website videos" items={w.websiteVideos} />
                <List title="Publishing priorities" items={w.publishingPriorities} />
                <List title="Shannen tasks" items={w.shannenTasks} />
                <List title="Jevoy tasks" items={w.jevoyTasks} />
                <List title="Editor handoff" items={w.editorHandoff} />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Weekly review notes</div>
                <textarea
                  className="w-full bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-[13px] min-h-[60px]"
                  value={w.reviewNotes}
                  onChange={(e) => updateWeek(w.number, { reviewNotes: e.target.value })}
                  placeholder="What worked? What dragged? What's next?"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
