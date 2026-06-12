import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { MetricCard, Card } from "@/components/app/AppShell";
import { Field, inputCls } from "@/components/ui-bits/Modal";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";
import { KpiBar, KpiDonut } from "@/components/kpi/KpiPrimitives";
import { useStore } from "@/lib/store";
import { cfoKpis } from "@/lib/kpis";
import { DollarSign, TrendingDown, TrendingUp, Wallet, Clock, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/finance")({
  component: FinancePage,
  head: () => ({ meta: [{ title: "Finance Overview · Production OS" }] }),
});

const usd = (n: number) => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(Math.abs(n) >= 10000 ? 0 : 1)}K`;
  return `$${Math.round(n)}`;
};

function FinancePage() {
  const finance = useStore((s) => s.finance);
  const setF = useStore((s) => s.setFinance);
  const projects = useStore((s) => s.projects);
  const cf = cfoKpis();

  const expenses = finance.toolSpend + finance.aiSpend + finance.contractorSpend;
  const profit = finance.cashCollectedMonth - expenses;
  const missingQuoted = projects.filter((p) => !p.quoted && p.stage !== "Lead" && p.stage !== "Strategy Call").length;
  const missingCost = projects.filter((p) => !p.cost && (p.stage === "Delivered" || p.stage === "In Post")).length;

  const kpis = [
    { icon: <DollarSign size={16} />, accent: "brand" as const, label: "Booked Revenue", value: cf.booked },
    { icon: <Wallet size={16} />, accent: "cyan" as const, label: "Cash Collected", value: finance.cashCollectedMonth },
    { icon: <TrendingDown size={16} />, accent: "amber" as const, label: "Expenses", value: expenses },
    { icon: <TrendingUp size={16} />, accent: "emerald" as const, label: "Net Profit", value: profit },
    { icon: <Clock size={16} />, accent: "violet" as const, label: "Outstanding", value: finance.outstanding },
    { icon: <TriangleAlert size={16} />, accent: "rose" as const, label: "AR 90+ days", value: cf.aging[2]?.value ?? 0 },
  ];

  return (
    <Shell title="Finance Overview" subtitle="Adrienne · CFO view">
      {/* KPI strip */}
      <Stagger className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6" stagger={0.05}>
        {kpis.map((k) => (
          <StaggerItem key={k.label} variant="scaleIn">
            <MetricCard icon={k.icon} accent={k.accent} label={k.label} value={usd(k.value)} animateTo={k.value} format={usd} />
          </StaggerItem>
        ))}
      </Stagger>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Reveal delay={0.05}>
          <Card title="Margin by Pal" description="Average gross margin %">
            <KpiBar data={cf.marginByPal} color="var(--brand-500)" tickFormatter={(v) => `${v}%`} height={180} />
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card title="Spend breakdown" description="This month">
            <KpiDonut data={cf.spend} height={180} />
          </Card>
        </Reveal>
        <Reveal delay={0.15}>
          <Card title="AR aging" description="Receivables by age">
            <KpiBar data={cf.aging} color="var(--accent-amber)" tickFormatter={usd} height={180} />
          </Card>
        </Reveal>
      </div>

      {/* Lower */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Reveal className="xl:col-span-2" delay={0.05}>
          <Card title="Project P&L" description="Quoted vs cost by project" noPad>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-lo text-[11px] uppercase tracking-wide border-b border-line">
                    <th className="text-left font-bold px-5 py-3">Project</th>
                    <th className="text-left font-bold px-3 py-3">Pal</th>
                    <th className="text-right font-bold px-3 py-3">Quoted</th>
                    <th className="text-right font-bold px-3 py-3">Cost</th>
                    <th className="text-right font-bold px-3 py-3">Margin</th>
                    <th className="text-right font-bold px-5 py-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-mid py-10 text-sm">No projects yet.</td></tr>
                  )}
                  {projects.map((p) => {
                    const q = p.quoted ?? 0, c = p.cost ?? 0, m = q - c;
                    return (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-hover transition-colors">
                        <td className="px-5 py-3 text-hi font-medium">{p.title}</td>
                        <td className="px-3 py-3 text-mid">{p.palType}</td>
                        <td className="px-3 py-3 text-right num text-mid">{q ? `$${q.toLocaleString()}` : "—"}</td>
                        <td className="px-3 py-3 text-right num text-mid">{c ? `$${c.toLocaleString()}` : "—"}</td>
                        <td className={`px-3 py-3 text-right num ${m > 0 ? "text-emerald" : m < 0 ? "text-rose" : "text-mid"}`}>{q ? `$${m.toLocaleString()}` : "—"}</td>
                        <td className="px-5 py-3 text-right num text-hi">{q ? `${Math.round((m / q) * 100)}%` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-4">
            <Card title="Manual entries" description="From HoneyBook">
              <div className="grid grid-cols-1 gap-3">
                <Field label="Cash collected ($)">
                  <input className={inputCls} value={finance.cashCollectedMonth} onChange={(e) => setF({ cashCollectedMonth: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="Outstanding ($)">
                  <input className={inputCls} value={finance.outstanding} onChange={(e) => setF({ outstanding: Number(e.target.value) || 0 })} />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Tools"><input className={inputCls} value={finance.toolSpend} onChange={(e) => setF({ toolSpend: Number(e.target.value) || 0 })} /></Field>
                  <Field label="AI"><input className={inputCls} value={finance.aiSpend} onChange={(e) => setF({ aiSpend: Number(e.target.value) || 0 })} /></Field>
                  <Field label="Crew"><input className={inputCls} value={finance.contractorSpend} onChange={(e) => setF({ contractorSpend: Number(e.target.value) || 0 })} /></Field>
                </div>
              </div>
            </Card>
            <Card title="Data hygiene" description="What's missing">
              <HygieneRow label="Projects missing quoted value" value={missingQuoted} bad={missingQuoted > 0} />
              <HygieneRow label="Projects missing cost estimate" value={missingCost} bad={missingCost > 0} />
              <HygieneRow label="Aged AR · 30 days" value={usd(cf.aging[0]?.value ?? 0)} />
              <HygieneRow label="Aged AR · 60 days" value={usd(cf.aging[1]?.value ?? 0)} />
            </Card>
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}

function HygieneRow({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <span className="text-sm text-mid">{label}</span>
      <span
        className={`num font-semibold ${
          bad
            ? "text-xs text-rose bg-rose/10 border border-rose/25 px-2 py-0.5 rounded-full"
            : "text-sm text-hi"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
