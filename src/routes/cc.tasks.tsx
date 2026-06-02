import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav } from "@/components/cc/CCNav";
import { useCCStore, CC_TASK_CATEGORIES, type CCTaskCategory } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Shannen Tasks · Content Command Center" }] }),
});

const RANK = { High: 0, Med: 1, Low: 2 } as const;
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri"] as const;

function TasksPage() {
  const { tasks, addTask, updateTask, removeTask, cycleTaskStatus, generateWeekTasks } = useCCStore();
  const [filter, setFilter] = useState<"all" | "recurring" | "oneoff">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState<CCTaskCategory>("Shoot prep");

  const filtered = tasks.filter((t) => filter === "all" ? true : filter === "recurring" ? t.recurring : !t.recurring);

  const grouped = filtered.reduce<Record<string, typeof tasks>>((acc, t) => {
    const k = t.recurring && t.weekday ? t.weekday : t.category;
    (acc[k] ||= []).push(t);
    return acc;
  }, {});
  Object.values(grouped).forEach((arr) => arr.sort((a, b) => RANK[a.priority] - RANK[b.priority]));

  return (
    <Shell title="Shannen Tasks" subtitle="Weekly battle rhythm + ad-hoc work">
      <CCNav />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["all","recurring","oneoff"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[12px] rounded-md capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-surface-3 text-muted-foreground hover:text-foreground"}`}>
            {f === "oneoff" ? "One-off" : f}
          </button>
        ))}
        <button onClick={generateWeekTasks} className="ml-auto text-[12px] px-3 py-1 rounded-md bg-surface-3 hover:bg-surface">
          + Generate this week's tasks
        </button>
      </div>

      <div className="card-elevated rounded-xl p-3 mb-5 flex gap-2">
        <input className="flex-1 bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-[13px]"
          placeholder="New task title…" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) { addTask({ title: newTitle.trim(), category: newCat, status: "todo", priority: "Med", recurring: false }); setNewTitle(""); } }} />
        <select className="bg-surface-2 border border-border rounded-md px-2 text-[13px]" value={newCat} onChange={(e) => setNewCat(e.target.value as CCTaskCategory)}>
          {CC_TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => { if (newTitle.trim()) { addTask({ title: newTitle.trim(), category: newCat, status: "todo", priority: "Med", recurring: false }); setNewTitle(""); } }}
          className="px-3 py-1.5 text-[13px] rounded-md bg-primary text-primary-foreground">Add</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Object.entries(grouped).sort(([a],[b]) => {
          const ai = WEEKDAYS.indexOf(a as any);
          const bi = WEEKDAYS.indexOf(b as any);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1; if (bi !== -1) return 1;
          return a.localeCompare(b);
        }).map(([k, items]) => (
          <div key={k} className="card-elevated rounded-xl p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
              <span>{WEEKDAYS.includes(k as any) ? `${k}day` : k}</span>
              <span className="num">{items.length}</span>
            </div>
            <ul className="space-y-1.5">
              {items.map((t) => {
                const accent = t.priority === "High" ? "var(--destructive)" : t.priority === "Med" ? "var(--primary)" : "var(--muted-foreground)";
                return (
                  <li key={t.id} className="flex items-start gap-2 rounded-md p-2 hover:bg-surface-2 group"
                    style={{ borderLeft: `2px solid ${accent}` }}>
                    <input type="checkbox" checked={t.status === "done"} onChange={() => cycleTaskStatus(t.id)} className="mt-0.5 size-4 accent-primary" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                      <div className="text-[10px] text-muted-foreground flex gap-2">
                        <span>{t.category}</span>
                        <span>·</span>
                        <select className="bg-transparent text-[10px]" value={t.priority} onChange={(e) => updateTask(t.id, { priority: e.target.value as any })}>
                          {["Low","Med","High"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeTask(t.id)} className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive">×</button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Shell>
  );
}
