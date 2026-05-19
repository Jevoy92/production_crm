import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { useStore, checklistProgress, readinessScore } from "@/lib/store";
import { PAL_TYPES } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics · Palmer House" }] }),
});

function AnalyticsPage() {
  const role = useStore((s) => s.activeRole);
  const setRole = useStore((s) => s.setRole);

  return (
    <Shell title="Analytics" subtitle={`${role.toUpperCase()} dashboard`}>
      <div className="flex items-center gap-1 rounded-lg bg-surface-2 ring-inset-soft p-0.5 w-fit mb-4">
        {(["owner", "cfo", "pa"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-3 py-1.5 text-[12.5px] rounded-md capitalize ${role === r ? "bg-card text-foreground ring-inset-soft" : "text-muted-foreground"}`}
          >
            {r === "pa" ? "Production Assistant" : r === "cfo" ? "CFO (Adrienne)" : "Owner (Jevoy)"}
          </button>
        ))}
      </div>

      {role === "owner" && <OwnerDash />}
      {role === "cfo" && <CFODash />}
      {role === "pa" && <PADash />}
    </Shell>
  );
}

function OwnerDash() {
  const projects = useStore((s) => s.projects);
  const active = projects.filter((p) => p.stage !== "Archived" && p.stage !== "Delivered");
  const byPal = PAL_TYPES.map((t) => ({
    name: t,
    value: active.filter((p) => p.palType === t).length,
  }));
  const quoted = active.reduce((a, p) => a + (p.quoted ?? 0), 0);
  const shippedMonth = projects.filter(
    (p) =>
      p.stage === "Delivered" &&
      p.deliveryDate &&
      new Date(p.deliveryDate).getMonth() === new Date().getMonth(),
  ).length;
  const byStage = ["Lead", "Strategy Call", "Proposal Sent", "Booked"].map((s) => ({
    name: s,
    count: projects.filter((p) => p.stage === s).length,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Kpi label="Active projects" value={active.length} />
      <Kpi label="Quoted (active)" value={`$${quoted.toLocaleString()}`} />
      <Kpi label="Shipped this month" value={shippedMonth} />

      <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Active by Pal type
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">
          Creative throughput
        </h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={byPal}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Sales funnel
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">Top of pipeline</h3>
        <div className="space-y-2.5">
          {byStage.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="w-28 text-[12px] text-muted-foreground">{s.name}</span>
              <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, s.count * 25)}%` }}
                />
              </div>
              <span className="num text-[12px] w-6 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CFODash() {
  const finance = useStore((s) => s.finance);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const byPal = PAL_TYPES.map((t) => {
    const ps = projects.filter((p) => p.palType === t);
    const quoted = ps.reduce((a, p) => a + (p.quoted ?? 0), 0);
    const cost = ps.reduce((a, p) => a + (p.cost ?? 0), 0);
    return {
      name: t,
      margin: quoted ? Math.round(((quoted - cost) / quoted) * 100) : 0,
      quoted,
      cost,
    };
  });
  const topClients = clients
    .map((c) => {
      const ltv = projects
        .filter((p) => p.clientId === c.id)
        .reduce((a, p) => a + (p.quoted ?? 0), 0);
      return { name: c.company ?? c.name, ltv };
    })
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Kpi label="Cash collected (mo)" value={`$${finance.cashCollectedMonth.toLocaleString()}`} />
      <Kpi label="Outstanding" value={`$${finance.outstanding.toLocaleString()}`} />
      <Kpi
        label="Tool + AI spend"
        value={`$${(finance.toolSpend + finance.aiSpend).toLocaleString()}`}
      />

      <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Margin by Pal type
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">Where the money is</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={byPal}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
                width={32}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${v}%`}
              />
              <Bar dataKey="margin" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Top clients by LTV
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">Loyalty</h3>
        <div className="space-y-2">
          {topClients.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-[12.5px]">
              <span className="truncate pr-2">{c.name}</span>
              <span className="num text-foreground">${c.ltv.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PADash() {
  const projects = useStore((s) => s.projects);
  const shoots = useStore((s) => s.shoots);
  const upcoming = shoots.filter((s) => {
    const d = new Date(s.date);
    return d >= new Date(new Date().toDateString()) && d <= new Date(Date.now() + 7 * 86400000);
  });
  const readinessRows = projects
    .filter((p) => p.shootDate && new Date(p.shootDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => +new Date(a.shootDate!) - +new Date(b.shootDate!))
    .slice(0, 6)
    .map((p) => ({ name: p.title.slice(0, 22), score: readinessScore(p) }));
  const overdue = projects.filter((p) => {
    const pre = p.checklists["Pre-Production"];
    return (
      pre.some((i) => !i.done) &&
      p.shootDate &&
      new Date(p.shootDate) < new Date(Date.now() + 3 * 86400000) &&
      new Date(p.shootDate) >= new Date()
    );
  });

  const completion = projects.reduce(
    (acc, p) => {
      const c = checklistProgress(p);
      acc.done += c.done;
      acc.total += c.total;
      return acc;
    },
    { done: 0, total: 0 },
  );
  const compPct = completion.total ? Math.round((completion.done / completion.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Kpi label="Upcoming shoots (7d)" value={upcoming.length} />
      <Kpi label="Checklist completion" value={`${compPct}%`} />
      <Kpi label="Prep at-risk" value={overdue.length} />

      <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Readiness by upcoming shoot
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">
          What needs attention
        </h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={readinessRows} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
                width={140}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${v}%`}
              />
              <Bar dataKey="score" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          At-risk shoots
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">Within 3 days</h3>
        {overdue.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">Nothing flagged. Nice.</p>
        )}
        <div className="space-y-2">
          {overdue.map((p) => (
            <div key={p.id} className="rounded-lg bg-surface-2 ring-inset-soft p-2.5">
              <div className="text-[12.5px] font-medium truncate">{p.title}</div>
              <div className="text-[11px] text-muted-foreground">
                Shoot {p.shootDate ? new Date(p.shootDate).toLocaleDateString() : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="num text-[30px] font-semibold mt-2">{value}</div>
    </div>
  );
}
