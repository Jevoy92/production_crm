import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { useStore } from "@/lib/store";
import { palColor } from "@/lib/store";
import { PAL_TYPES, CHECKLIST_STAGES } from "@/lib/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getConnectionsStatus, runMorningDigestNow } from "@/lib/settings.functions";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Palmer House" }] }),
});

type Role = "owner" | "cfo" | "pa";
const OPERATORS: { role: Role; name: string; sub: string; color: string; initial: string }[] = [
  { role: "owner", name: "Jevoy", sub: "Owner · creator, films & approves", color: "var(--ph-primary-500)", initial: "J" },
  { role: "cfo",   name: "Adrienne", sub: "CFO · cash, margin, accountability", color: "var(--accent-emerald)", initial: "A" },
  { role: "pa",    name: "Shannen", sub: "PA · prep, organize, publish", color: "var(--accent-violet)", initial: "S" },
];

function SettingsPage() {
  const projects = useStore((s) => s.projects);
  const activeRole = useStore((s) => s.activeRole);
  const setRole = useStore((s) => s.setRole);

  const getStatus = useServerFn(getConnectionsStatus);
  const runDigest = useServerFn(runMorningDigestNow);
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["connections-status"],
    queryFn: () => getStatus({}),
  });
  const [digestMsg, setDigestMsg] = useState<string | null>(null);
  const digestMutation = useMutation({
    mutationFn: () => runDigest({}),
    onSuccess: (r) => setDigestMsg(`Digest run · ${r.status}. Refresh dashboard to see it.`),
    onError: (e: any) => setDigestMsg(e?.message ?? "Failed to run digest"),
  });

  return (
    <Shell title="Settings" subtitle="Templates · Data">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">Acting as</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Switches which dashboard, KPIs, and task lists the app surfaces by default. Saved on this device — all three of you share the same login and data.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">Currently: {OPERATORS.find((o) => o.role === activeRole)?.name}</span>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {OPERATORS.map((op) => {
              const selected = op.role === activeRole;
              return (
                <button
                  key={op.role}
                  type="button"
                  onClick={() => setRole(op.role)}
                  className="text-left rounded-xl p-3 transition-all"
                  style={{
                    background: selected ? "color-mix(in oklab, var(--ph-primary-500) 10%, var(--ph-surface))" : "var(--ph-surface)",
                    border: `1px solid ${selected ? "color-mix(in oklab, var(--ph-primary-500) 50%, transparent)" : "var(--ph-border-soft)"}`,
                    boxShadow: selected ? "var(--ph-shadow-primary)" : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid place-items-center rounded-lg text-white font-bold"
                      style={{ width: 36, height: 36, background: op.color }}
                    >
                      {op.initial}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold tracking-tight truncate">{op.name}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">{op.sub}</div>
                    </div>
                    {selected && (
                      <span className="ml-auto text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--ph-primary-500)" }}>
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">Connections</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Sources powering the morning brief, Pals chat, and dashboard. Manage individual connectors from the project's backend.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refetchStatus()}
                className="ph-btn ph-btn-ghost ph-btn-sm"
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={digestMutation.isPending}
                onClick={() => { setDigestMsg(null); digestMutation.mutate(); }}
                className="ph-btn ph-btn-soft ph-btn-sm"
              >
                {digestMutation.isPending ? "Running…" : "Run morning digest now"}
              </button>
            </div>
          </div>
          {digestMsg && (
            <div className="mt-3 text-[12px] rounded-lg px-3 py-2" style={{ background: "var(--ph-surface-2)", color: "var(--ph-text-secondary)" }}>
              {digestMsg}
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {statusLoading || !status ? (
              <div className="text-[12px] text-muted-foreground">Checking connections…</div>
            ) : (
              Object.entries(status).map(([key, s]) => (
                <div key={key} className="rounded-lg bg-surface-2 ring-inset-soft p-3 flex items-center gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.connected ? "var(--accent-emerald, #10b981)" : "var(--ph-danger, #ef4444)" }}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground">{s.connected ? "Connected" : "Not connected"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Morning digest runs automatically at 7:00 ET (11:00 UTC) and pulls yesterday's Limitless pendant transcripts, completed checklist items, overview log, Gmail highlights, and today's calendar.
          </p>
        </div>

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
            Seed/sample data has been retired — every list starts empty until you add your own.
          </p>
        </div>
      </div>
    </Shell>
  );
}
