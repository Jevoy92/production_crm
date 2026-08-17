import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { Collapsible } from "@/components/app/AppShell";
import { AnimatedNumber } from "@/components/motion/Motion";
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
  const clients = useStore((s) => s.clients);
  const addClient = useStore((s) => s.addClient);
  const addProject = useStore((s) => s.addProject);
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

  const INTERNAL_BRANDS = [
    { name: "Jevoy Palmer", company: "Personal brand · long-form YouTube + speaking", palType: "Visibility" as const },
    { name: "Your Boy Jevoy", company: "Lifestyle / behind-the-scenes channel", palType: "YouTube" as const },
    { name: "MindYourBizniz", company: "Business education channel", palType: "YouTube" as const },
  ];
  const missingBrands = INTERNAL_BRANDS.filter((b) => !clients.some((c) => c.name.toLowerCase() === b.name.toLowerCase()));
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const seedInternal = () => {
    let createdClients = 0;
    let createdProjects = 0;
    for (const b of INTERNAL_BRANDS) {
      let client = clients.find((c) => c.name.toLowerCase() === b.name.toLowerCase());
      if (!client) {
        const id = addClient({ name: b.name, company: b.company, notes: "Internal brand — in-office shoots" });
        client = { id, name: b.name, company: b.company } as any;
        createdClients++;
      }
      const hasActiveProject = projects.some((p) => p.clientId === client!.id && p.internal);
      if (!hasActiveProject) {
        addProject({
          title: `${b.name} · ongoing content`,
          clientId: client!.id,
          internal: true,
          palType: b.palType,
          stage: "Pre-Production",
          priority: "Med",
        });
        createdProjects++;
      }
    }
    setSeedMsg(`Added ${createdClients} brand${createdClients === 1 ? "" : "s"} and ${createdProjects} starter project${createdProjects === 1 ? "" : "s"}.`);
  };

  return (
    <Shell title="Settings" subtitle="Templates · Data">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="card-elevated rounded-2xl p-4 xl:col-span-2">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">Internal brands</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Seeded as clients + internal projects for the in-office shoot workflow.
              </p>
            </div>
            <button
              type="button"
              onClick={seedInternal}
              className="ph-btn ph-btn-primary ph-btn-sm"
              disabled={missingBrands.length === 0 && projects.some((p) => p.internal)}
            >
              {missingBrands.length === 0 ? "Already set up" : `Add ${missingBrands.length} missing brand${missingBrands.length === 1 ? "" : "s"}`}
            </button>
          </div>
          {seedMsg && (
            <div className="mt-3 text-[12px] rounded-lg px-3 py-2" style={{ background: "var(--ph-surface-2)", color: "var(--ph-text-secondary)" }}>
              {seedMsg}
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {INTERNAL_BRANDS.map((b) => {
              const exists = clients.some((c) => c.name.toLowerCase() === b.name.toLowerCase());
              return (
                <div key={b.name} className="rounded-lg bg-surface-2 ring-inset-soft p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: exists ? "var(--accent-emerald, #10b981)" : "var(--ph-text-tertiary, #888)" }} />
                    <div className="text-[13px] font-semibold tracking-tight">{b.name}</div>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mt-1">{b.company}</div>
                  <div className="text-[10.5px] uppercase tracking-wider mt-2" style={{ color: exists ? "var(--accent-emerald)" : "var(--ph-text-tertiary)" }}>
                    {exists ? "Created" : "Will be added"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-4 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">Acting as</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Sets the default dashboard, KPIs & task lists · saved per device.
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

        <div className="card-elevated rounded-2xl p-4 xl:col-span-2">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold tracking-tight">Connections</h3>
                {status && (
                  <span className="num text-[10.5px] font-semibold rounded-full bg-success/12 text-success ring-1 ring-success/25 px-2 py-0.5">
                    {Object.values(status).filter((s) => s.connected).length}/
                    {Object.keys(status).length} connected
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">
                Sources for the morning brief, Pals chat & dashboard.
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
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <span className="rounded-full bg-surface-2 ring-inset-soft px-2 py-0.5 font-medium">
              Auto-run · 7:00 ET
            </span>
            {[
              "Limitless transcripts",
              "Checklist wins",
              "Overview log",
              "Gmail highlights",
              "Today's calendar",
            ].map((s) => (
              <span key={s} className="rounded-full bg-surface-2 ring-inset-soft px-2 py-0.5">
                {s}
              </span>
            ))}
          </div>
        </div>

        <Collapsible
          title="Pal types & colors"
          subtitle={`${PAL_TYPES.length} tokens · drive kanban & reports`}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        </Collapsible>

        <Collapsible
          title="Checklist templates"
          subtitle={`${CHECKLIST_STAGES.length} stages · seeded on every new project`}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHECKLIST_STAGES.map((s) => (
              <div key={s} className="rounded-lg bg-surface-2 ring-inset-soft p-3">
                <div className="text-[12.5px] font-medium">{s}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Universal · 13 items</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <div className="card-elevated rounded-2xl p-4 xl:col-span-2">
          <h3 className="text-[15px] font-semibold tracking-tight">Data</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="rounded-full bg-surface-2 ring-inset-soft px-2.5 py-1 font-medium">
              <span className="num font-semibold">
                <AnimatedNumber value={projects.length} />
              </span>{" "}
              projects
            </span>
            <span className="rounded-full bg-surface-2 ring-inset-soft px-2.5 py-1 font-medium">
              <span className="num font-semibold">
                <AnimatedNumber value={clients.length} />
              </span>{" "}
              clients
            </span>
            <span className="rounded-full bg-surface-2 ring-inset-soft px-2.5 py-1 text-muted-foreground">
              Persists locally in this browser
            </span>
            <span className="rounded-full bg-surface-2 ring-inset-soft px-2.5 py-1 text-muted-foreground">
              No sample data — lists start empty
            </span>
          </div>
        </div>
      </div>
    </Shell>
  );
}
