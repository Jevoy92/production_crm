import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { KpiCard, KpiBar, KpiDonut, KpiList, Section, usd } from "@/components/kpi/KpiPrimitives";
import { ownerKpis } from "@/lib/kpis";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/kpis/owner")({
  component: OwnerKpis,
  head: () => ({ meta: [{ title: "Owner KPIs · Palmer House" }] }),
});

function OwnerKpis() {
  useStore((s) => s.projects); // subscribe for live updates
  const k = ownerKpis();
  const finance = useStore((s) => s.finance);
  const projects = useStore((s) => s.projects);

  const proposalsSent = projects.filter((p) => p.stage === "Proposal Sent").length;
  const booked = projects.filter((p) => p.stage === "Booked").length;
  const ratings = projects
    .map((p) => p.clientRating)
    .filter((r): r is number => !!r);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : "—";

  return (
    <Shell title="Owner Dashboard" subtitle="Jevoy · revenue, throughput, momentum">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Active projects"
          value={k.activeCount}
          sub="across all Pal types"
          accent="var(--color-chart-1)"
        />
        <KpiCard
          label="Quoted (active)"
          value={usd(k.quotedTotal)}
          sub="pipeline value"
          accent="var(--color-chart-2)"
        />
        <KpiCard
          label="Delivered MTD"
          value={k.deliveredThisMonth}
          sub="this month"
          accent="var(--color-chart-3)"
        />
        <KpiCard
          label="Shoots this month"
          value={k.shootsThisMonth}
          sub={`${k.internalCount} internal projects`}
          accent="var(--color-chart-4)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Section title="Active by Pal type" eyebrow="Mix">
          <KpiDonut data={k.activeByPal} />
        </Section>
        <Section title="Delivered by Pal · MTD" eyebrow="Throughput">
          <KpiBar data={k.deliveredByPal} />
        </Section>
        <Section
          title="What's stuck"
          eyebrow="Needs you"
          right={<span className="num text-[11px] text-destructive">{k.stuck.length}</span>}
        >
          <KpiList
            rows={k.stuck.slice(0, 6).map((p) => ({
              label: (
                <Link to="/projects/$id" params={{ id: p.id }} className="hover:text-primary">
                  {p.title}
                </Link>
              ),
              sub: p.blocker ?? `${p.stage} · stale`,
              value: <span className="text-[11px] text-muted-foreground">{p.stage}</span>,
            }))}
          />
        </Section>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <KpiCard label="Proposals sent" value={proposalsSent} sub="awaiting response" />
        <KpiCard label="Booked · queue" value={booked} sub="confirmed, not started" />
        <KpiCard
          label="Booked · quarter"
          value={usd(finance.bookedQuarter)}
          sub="manual entry in Finance"
        />
        <KpiCard label="Avg client rating" value={avgRating} sub={`${ratings.length} rated`} />
        <KpiCard label="Playbook pages" value={k.playbookCount} sub="SOP library" />
        <KpiCard label="Internal projects" value={k.internalCount} sub="Palmer House content" />
      </div>
    </Shell>
  );
}
