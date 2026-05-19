import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { KpiCard, KpiBar, KpiList, Section, usd } from "@/components/kpi/KpiPrimitives";
import { cfoKpis } from "@/lib/kpis";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/kpis/cfo")({
  component: CfoKpis,
  head: () => ({ meta: [{ title: "CFO KPIs · Palmer House" }] }),
});

function CfoKpis() {
  useStore((s) => s.projects);
  useStore((s) => s.finance);
  const k = cfoKpis();
  return (
    <Shell title="CFO Dashboard" subtitle="Adrienne · cash, margin, accountability">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Cash collected · MTD"
          value={usd(k.cashCollected)}
          accent="var(--color-chart-3)"
        />
        <KpiCard label="Outstanding" value={usd(k.outstanding)} accent="var(--color-chart-4)" />
        <KpiCard
          label="Booked revenue"
          value={usd(k.booked)}
          sub="pipeline + active"
          accent="var(--color-chart-1)"
        />
        <KpiCard
          label="Retainer revenue"
          value={usd(k.retainer)}
          sub="recurring / month"
          accent="var(--color-chart-2)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Section title="Margin % by Pal" eyebrow="Profitability">
          <KpiBar
            data={k.marginByPal}
            color="var(--color-chart-2)"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
        </Section>
        <Section title="Aged receivables" eyebrow="AR">
          <KpiBar
            data={k.aging}
            color="var(--color-chart-4)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </Section>
        <Section title="Spend categories" eyebrow="Burn">
          <KpiBar data={k.spend} color="var(--color-chart-5)" />
        </Section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Section title="Top 5 clients by LTV" eyebrow="Relationships">
          <KpiList rows={k.topClients.map((c) => ({ label: c.name, value: usd(c.value) }))} />
        </Section>
        <Section title="Data hygiene" eyebrow="What's missing">
          <KpiList
            rows={[
              { label: "Projects missing quoted value", value: k.missingQuoted },
              { label: "Projects missing cost estimate", value: k.missingCost },
              { label: "Booked this month (manual)", value: usd(k.bookedMonth) },
              { label: "Booked this quarter (manual)", value: usd(k.bookedQuarter) },
            ]}
          />
        </Section>
      </div>
    </Shell>
  );
}
