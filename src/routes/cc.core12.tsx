import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav, LaneBadge, StatusBadge } from "@/components/cc/CCNav";
import { useCCStore, CC_STATUSES, type CCStatus } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/core12")({
  component: Core12Page,
  head: () => ({ meta: [{ title: "Core 12 · Content Command Center" }] }),
});

type View = "grid" | "kanban" | "table" | "narrative";

function Core12Page() {
  const core12 = useCCStore((s) => s.core12);
  const [view, setView] = useState<View>("grid");

  return (
    <Shell title="Core 12" subtitle="The Palmer House YouTube series">
      <CCNav />

      <div className="flex gap-2 mb-4">
        {(["grid","kanban","table","narrative"] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 text-[12px] rounded-md capitalize ${view === v ? "bg-primary text-primary-foreground" : "bg-surface-3 text-muted-foreground hover:text-foreground"}`}>
            {v}
          </button>
        ))}
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {core12.map((c) => (
            <Link key={c.id} to="/cc/core12/$num" params={{ num: String(c.number) }}
              className="card-elevated rounded-xl p-4 hover:border-primary/50 transition-colors block">
              <div className="flex items-center justify-between mb-2">
                <span className="num text-[11px] text-muted-foreground">Core 12 · #{c.number}</span>
                <LaneBadge lane={c.palLane} />
              </div>
              <h3 className="text-[15px] font-semibold leading-tight mb-1">{c.title}</h3>
              <div className="text-[11px] text-muted-foreground mb-2">{c.series}</div>
              <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">{c.hypothesis}</p>
              <div className="flex items-center justify-between">
                <StatusBadge status={c.status} />
                <div className="flex gap-1">
                  {[c.scriptDone, c.filmedDone, c.editorDone, c.publishedDone].map((d, i) => (
                    <span key={i} className={`size-1.5 rounded-full ${d ? "bg-success" : "bg-surface-3"}`} style={{ background: d ? "var(--success)" : "var(--surface-3)" }} />
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {CC_STATUSES.map((status) => {
            const items = core12.filter((c) => c.status === status);
            return (
              <div key={status} className="w-64 shrink-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
                  <span>{status}</span>
                  <span className="num">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <Link key={c.id} to="/cc/core12/$num" params={{ num: String(c.number) }}
                      className="block card-elevated rounded-lg p-2.5 hover:border-primary/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="num text-[10px] text-muted-foreground">#{c.number}</span>
                        <LaneBadge lane={c.palLane} />
                      </div>
                      <div className="text-[12px] leading-tight">{c.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <div className="card-elevated rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-surface-3">
              <tr className="text-left">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Series</th>
                <th className="px-3 py-2">Lane</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Shoot</th>
              </tr>
            </thead>
            <tbody>
              {core12.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-3 py-2 num text-muted-foreground">{c.number}</td>
                  <td className="px-3 py-2">
                    <Link to="/cc/core12/$num" params={{ num: String(c.number) }} className="hover:text-primary">{c.title}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.series}</td>
                  <td className="px-3 py-2"><LaneBadge lane={c.palLane} /></td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2 num text-muted-foreground">{c.shootDate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "narrative" && (
        <div className="space-y-3">
          {core12.map((c, i) => (
            <div key={c.id} className="flex gap-4 items-start">
              <div className="flex flex-col items-center">
                <div className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center num text-[13px] font-semibold">{c.number}</div>
                {i < core12.length - 1 && <div className="w-px flex-1 bg-border my-1 min-h-[40px]" />}
              </div>
              <Link to="/cc/core12/$num" params={{ num: String(c.number) }} className="flex-1 card-elevated rounded-xl p-3 hover:border-primary/50">
                <div className="flex items-center gap-2 mb-1">
                  <LaneBadge lane={c.palLane} />
                  <span className="text-[11px] text-muted-foreground">{c.series}</span>
                </div>
                <div className="text-[14px] font-medium">{c.title}</div>
                <div className="text-[12px] text-muted-foreground italic mt-0.5">"{c.hook}"</div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
