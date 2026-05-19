import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { KpiCard, KpiList, KpiProgress, Section } from "@/components/kpi/KpiPrimitives";
import { paKpis } from "@/lib/kpis";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/kpis/pa")({
  component: PaKpis,
  head: () => ({ meta: [{ title: "PA KPIs · Palmer House" }] }),
});

function PaKpis() {
  useStore((s) => s.projects);
  useStore((s) => s.shoots);
  const k = paKpis();
  return (
    <Shell title="PA Dashboard" subtitle="Production Assistant · readiness & hygiene">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Shoots this week"
          value={k.upcomingThisWeek}
          sub={`${k.upcomingAll} upcoming total`}
          accent="var(--color-chart-1)"
        />
        <KpiCard
          label="Pre-prod overdue"
          value={k.overduePre}
          sub="<80% within 7 days"
          accent="var(--color-chart-4)"
        />
        <KpiCard
          label="On-time delivery"
          value={`${k.onTimePct}%`}
          sub="historical"
          accent="var(--color-chart-3)"
        />
        <KpiCard
          label="Drive folders"
          value={`${k.driveOrganized}/${k.driveTotal}`}
          sub="organized"
          accent="var(--color-chart-2)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Readiness · next shoots" eyebrow="At a glance">
          <div className="space-y-3">
            {k.readiness.map(({ shoot, project, score }) => (
              <div key={shoot.id} className="rounded-xl bg-surface-2 ring-inset-soft p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <Link
                    to="/projects/$id"
                    params={{ id: shoot.projectId }}
                    className="text-[13px] font-medium hover:text-primary truncate"
                  >
                    {project?.title ?? "—"}
                  </Link>
                  <span className="num text-[12px] text-foreground">{score}%</span>
                </div>
                <div className="text-[11px] text-muted-foreground mb-1.5">
                  {new Date(shoot.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {shoot.location}
                </div>
                <KpiProgress
                  pct={score}
                  color={
                    score >= 80
                      ? "var(--color-success)"
                      : score >= 50
                        ? "var(--color-warning)"
                        : "var(--color-destructive)"
                  }
                />
              </div>
            ))}
            {k.readiness.length === 0 && (
              <div className="text-[12px] text-muted-foreground text-center py-4">
                No upcoming shoots.
              </div>
            )}
          </div>
        </Section>
        <Section title="Hygiene snapshot" eyebrow="Process">
          <KpiList
            rows={[
              { label: "Avg checklist completion", value: `${k.checklistAvg}%` },
              { label: "Blockers resolved this week", value: k.blockersResolved },
              { label: "Drive folders organized", value: `${k.driveOrganized}/${k.driveTotal}` },
              { label: "On-time delivery", value: `${k.onTimePct}%` },
            ]}
          />
        </Section>
      </div>
    </Shell>
  );
}
