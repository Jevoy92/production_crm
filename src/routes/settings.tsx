import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import { palColor } from "@/lib/store";
import { PAL_TYPES, CHECKLIST_STAGES } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Palmer House" }] }),
});

function SettingsPage() {
  const reset = useStore((s) => s.resetData);
  const projects = useStore((s) => s.projects);

  return (
    <Shell title="Settings" subtitle="Templates · Data">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-elevated rounded-2xl p-5">
          <h3 className="text-[15px] font-semibold tracking-tight">Pal types & colors</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            Color tokens drive the pipeline kanban and reports.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PAL_TYPES.map((p) => (
              <div
                key={p}
                className="rounded-lg bg-surface-2 ring-inset-soft p-3 flex items-center gap-2"
              >
                <span className="size-4 rounded-md" style={{ background: palColor(p) }} />
                <span className="text-[13px] font-medium">{p}</span>
                <span className="num text-[11px] text-muted-foreground ml-auto">{palColor(p)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-5">
          <h3 className="text-[15px] font-semibold tracking-tight">Checklist templates</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            Every new project seeds with these universal stage checklists. Edit items per-project
            from the project hub.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CHECKLIST_STAGES.map((s) => (
              <div key={s} className="rounded-lg bg-surface-2 ring-inset-soft p-3">
                <div className="text-[12.5px] font-medium">{s}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Universal · 13 items</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
          <h3 className="text-[15px] font-semibold tracking-tight">Data</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            {projects.length} projects loaded. State persists locally in this browser.
          </p>
          <div className="mt-3 flex gap-2">
            <Btn
              variant="danger"
              onClick={() => {
                if (confirm("Reset all data to seed?")) reset();
              }}
            >
              Reset to seed data
            </Btn>
          </div>
        </div>
      </div>
    </Shell>
  );
}
