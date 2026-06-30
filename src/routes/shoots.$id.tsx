import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Progress } from "@/components/app/AppShell";
import { Btn, inputCls } from "@/components/ui-bits/Modal";
import { useStore, palColor, readinessScore } from "@/lib/store";
import type { ChecklistStage } from "@/lib/types";
import { ArrowLeft, MapPin, Clock, CheckCircle2, Circle, Pencil, Trash2, Check, X, Plus } from "lucide-react";

export const Route = createFileRoute("/shoots/$id")({
  component: ShootDay,
  head: () => ({ meta: [{ title: "Shoot Day · Palmer House" }] }),
});

function ShootDay() {
  const { id } = Route.useParams();
  const shoot = useStore((s) => s.shoots.find((x) => x.id === id));
  const project = useStore((s) => s.projects.find((p) => p.id === shoot?.projectId));
  const team = useStore((s) => s.team);
  const toggle = useStore((s) => s.toggleChecklistItem);
  const addItem = useStore((s) => s.addChecklistItem);
  const updateItem = useStore((s) => s.updateChecklistItem);
  const removeItem = useStore((s) => s.removeChecklistItem);

  if (!shoot || !project)
    return (
      <Shell title="Shoot not found">
        <Link to="/schedule">
          <Btn>Back to Schedule</Btn>
        </Link>
      </Shell>
    );

  const ready = readinessScore(project);
  const crew = team.filter((m) => shoot.crewIds.includes(m.id));
  const pre = project.checklists["Pre-Production"];
  const day = project.checklists["Shoot Day"];

  return (
    <Shell
      title="Shoot Day"
      subtitle={new Date(shoot.date).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      actions={
        <Link to="/schedule">
          <Btn variant="subtle" className="flex items-center gap-1.5">
            <ArrowLeft className="size-3.5" /> Back
          </Btn>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <div
          className="card-elevated rounded-2xl p-5"
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {project.palType}
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight mt-0.5">{project.title}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <Stat icon={<MapPin className="size-4" />} label="Location" value={shoot.location} />
            <Stat
              icon={<Clock className="size-4" />}
              label="Call time"
              value={shoot.arrival || "—"}
            />
            <Stat
              label="Start → End"
              value={[shoot.startTime, shoot.endTime].filter(Boolean).join(" → ") || "—"}
            />
            <Stat
              label="Readiness"
              value={`${ready}%`}
              accent={ready >= 80 ? "var(--color-chart-3)" : "var(--color-destructive)"}
              bar={ready}
            />
          </div>
          {shoot.goals && (
            <div className="mt-4 rounded-xl bg-surface-2 p-3 text-[14px] leading-relaxed">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">
                Goals
              </div>
              {shoot.goals}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {crew.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-1 text-[12px]"
              >
                <span
                  className="size-5 rounded-full grid place-items-center text-[9.5px] font-semibold text-primary-foreground"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
                {m.name}
              </span>
            ))}
          </div>
        </div>

        <BigList
          title="Pre-Production"
          items={pre}
          onToggle={(iid) => toggle(project.id, "Pre-Production", iid)}
          onEdit={(iid, t) => updateItem(project.id, "Pre-Production", iid, t)}
          onRemove={(iid) => removeItem(project.id, "Pre-Production", iid)}
          onAdd={(t) => addItem(project.id, "Pre-Production", t)}
        />
        <BigList
          title="Shoot Day"
          items={day}
          onToggle={(iid) => toggle(project.id, "Shoot Day", iid)}
          onEdit={(iid, t) => updateItem(project.id, "Shoot Day", iid, t)}
          onRemove={(iid) => removeItem(project.id, "Shoot Day", iid)}
          onAdd={(t) => addItem(project.id, "Shoot Day", t)}
        />

        <Link to="/projects/$id" params={{ id: project.id }} className="block">
          <Btn variant="primary" className="w-full">
            Open project hub
          </Btn>
        </Link>
      </div>
    </Shell>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  bar,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  bar?: number;
}) {
  return (
    <div className="rounded-lg bg-surface-2 p-2.5">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div
        className="num text-[15px] font-medium mt-0.5"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {bar != null && (
        <div className="mt-1.5">
          <Progress value={bar} color={accent} />
        </div>
      )}
    </div>
  );
}

function BigList({
  title,
  items,
  onToggle,
  onEdit,
  onRemove,
  onAdd,
}: {
  title: string;
  items: { id: string; text: string; done: boolean }[];
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onAdd: (text: string) => void;
}) {
  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const startEdit = (id: string, text: string) => { setEditingId(id); setEditDraft(text); };
  const commitEdit = () => {
    if (editingId) {
      const t = editDraft.trim();
      if (t) onEdit(editingId, t);
    }
    setEditingId(null);
  };
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <span className="num text-[11px] text-muted-foreground rounded-full bg-surface-2 px-2 py-0.5">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="mb-3">
        <Progress value={pct} />
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id} className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2">
            <button onClick={() => onToggle(i.id)} className="shrink-0" aria-label="Toggle">
              {i.done ? (
                <CheckCircle2 className="size-5 text-primary" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
            </button>
            {editingId === i.id ? (
              <>
                <input
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className={inputCls + " flex-1 text-[14px] py-1"}
                />
                <button onClick={commitEdit} className="text-emerald-500" aria-label="Save"><Check className="size-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground" aria-label="Cancel"><X className="size-4" /></button>
              </>
            ) : (
              <>
                <span
                  onDoubleClick={() => startEdit(i.id, i.text)}
                  onClick={() => onToggle(i.id)}
                  className={`flex-1 text-[14px] cursor-pointer ${i.done ? "line-through text-muted-foreground" : ""}`}
                >
                  {i.text}
                </span>
                <button onClick={() => startEdit(i.id, i.text)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity" aria-label="Edit"><Pencil className="size-4" /></button>
                <button onClick={() => onRemove(i.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-opacity" aria-label="Delete"><Trash2 className="size-4" /></button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (t) { onAdd(t); setDraft(""); } }}
        className="mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add ${title.toLowerCase()} item…`}
          className={inputCls + " text-[13px]"}
        />
        <Btn variant="subtle" type="submit"><Plus className="size-3.5" /></Btn>
      </form>
    </div>
  );
}
