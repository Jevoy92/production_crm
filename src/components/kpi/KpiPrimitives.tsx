import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function KpiCard({
  label,
  value,
  sub,
  accent,
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-elevated rounded-2xl p-4 relative overflow-hidden">
      {accent && <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />}
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="num text-[26px] font-semibold tracking-tight mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      {children}
    </div>
  );
}

export function KpiBar({
  data,
  height = 140,
  color = "var(--color-primary)",
  domain,
  tickFormatter,
}: {
  data: { name: string; value: number }[];
  height?: number;
  color?: string;
  domain?: [number | string, number | string];
  tickFormatter?: (v: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const yDomain = domain ?? ([0, maxVal] as [number, number]);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={10.5}
            stroke="var(--color-muted-foreground)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={10.5}
            stroke="var(--color-muted-foreground)"
            width={36}
            allowDecimals={false}
            tickCount={5}
            domain={yDomain}
            tickFormatter={tickFormatter}
          />
          <Tooltip
            cursor={{ fill: "oklch(0.5 0 0 / 0.06)" }}
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={tickFormatter ? (v: number) => tickFormatter(v) : undefined}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function KpiDonut({
  data,
  height = 160,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-[11.5px]">
            <span
              className="size-2 rounded-sm"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-muted-foreground flex-1">{d.name}</span>
            <span className="num text-foreground">{d.value}</span>
            <span className="num text-muted-foreground w-9 text-right">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KpiList({
  rows,
}: {
  rows: { label: ReactNode; value: ReactNode; sub?: ReactNode }[];
}) {
  return (
    <div className="divide-y divide-border">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <div className="text-[12.5px] text-foreground truncate">{r.label}</div>
            {r.sub && <div className="text-[11px] text-muted-foreground truncate">{r.sub}</div>}
          </div>
          <div className="num text-[13px] font-medium tabular-nums">{r.value}</div>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="text-[12px] text-muted-foreground py-4 text-center">Nothing here yet.</div>
      )}
    </div>
  );
}

export function KpiProgress({
  pct,
  color = "var(--color-primary)",
}: {
  pct: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

export function Section({
  title,
  eyebrow,
  children,
  right,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          {eyebrow && (
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h3 className="text-[15px] font-semibold tracking-tight mt-0.5">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
