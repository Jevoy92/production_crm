import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, inputCls } from "@/components/ui-bits/Modal";
import { useStore, palColor } from "@/lib/store";
import { CHECKLIST_STAGES, PAL_TYPES } from "@/lib/types";
import type { PalType, ChecklistStage } from "@/lib/types";
import { Plus, Trash2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/templates")({
  component: TemplatesAdmin,
  head: () => ({ meta: [{ title: "Templates · Palmer House" }] }),
});

function TemplatesAdmin() {
  const templates = useStore((s) => s.templates);
  const setTemplate = useStore((s) => s.setTemplate);
  const resetTemplates = useStore((s) => s.resetTemplates);
  const [pal, setPal] = useState<PalType>("Commercial");
  const [stage, setStage] = useState<ChecklistStage>("Pre-Production");
  const [newItem, setNewItem] = useState("");

  const items = templates[pal][stage];
  const add = () => {
    if (!newItem.trim()) return;
    setTemplate(pal, stage, [...items, newItem.trim()]);
    setNewItem("");
  };
  const remove = (i: number) =>
    setTemplate(
      pal,
      stage,
      items.filter((_, idx) => idx !== i),
    );
  const edit = (i: number, v: string) =>
    setTemplate(
      pal,
      stage,
      items.map((x, idx) => (idx === i ? v : x)),
    );
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setTemplate(pal, stage, next);
  };

  return (
    <Shell
      title="Checklist Templates"
      subtitle="16 templates: 4 Pal types × 4 stages"
      actions={
        <Btn
          variant="subtle"
          onClick={() => {
            if (confirm("Reset all templates to defaults?")) resetTemplates();
          }}
          className="flex items-center gap-1.5"
        >
          <RotateCcw className="size-3.5" /> Reset all
        </Btn>
      }
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {PAL_TYPES.map((p) => (
          <button
            key={p}
            onClick={() => setPal(p)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] ${pal === p ? "bg-card ring-inset-soft text-foreground" : "text-muted-foreground hover:bg-surface-2"}`}
          >
            <span className="size-2 rounded-sm" style={{ background: palColor(p) }} /> {p}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mb-4 rounded-lg bg-surface-2 ring-inset-soft p-0.5 w-fit">
        {CHECKLIST_STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={`px-3 py-1.5 text-[12px] rounded-md ${stage === s ? "bg-card text-foreground ring-inset-soft" : "text-muted-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card-elevated rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
          {pal} · {stage} · {items.length} items
        </div>
        <ul className="space-y-1.5">
          {items.map((text, i) => (
            <li key={i} className="flex items-center gap-2 group">
              <span className="num text-[11px] text-muted-foreground w-6">{i + 1}.</span>
              <input
                className={inputCls + " flex-1"}
                value={text}
                onChange={(e) => edit(i, e.target.value)}
              />
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <Btn variant="subtle" onClick={() => move(i, -1)} className="!px-2">
                  ↑
                </Btn>
                <Btn variant="subtle" onClick={() => move(i, 1)} className="!px-2">
                  ↓
                </Btn>
                <Btn variant="subtle" onClick={() => remove(i)} className="!px-2">
                  <Trash2 className="size-3.5 text-destructive" />
                </Btn>
              </div>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            className={inputCls}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add new checklist item…"
          />
          <Btn variant="primary" type="submit">
            <Plus className="size-3.5" />
          </Btn>
        </form>
        <p className="mt-4 text-[11px] text-muted-foreground">
          New projects with palType <span className="font-medium text-foreground">{pal}</span> will
          clone this list for the <span className="font-medium text-foreground">{stage}</span>{" "}
          stage. Existing projects keep their checklists.
        </p>
      </div>
    </Shell>
  );
}
