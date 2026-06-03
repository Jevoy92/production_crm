import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Shared premium tooltip rendered with the .ph-tooltip styles. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ph-tooltip">
      {label != null && <div className="ph-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="ph-tooltip-row">
          <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color || p.stroke }} />
          <span style={{ textTransform: "capitalize" }}>{p.name}</span>
          <span className="num" style={{ marginLeft: "auto", fontWeight: 700, color: "var(--ph-text-primary)" }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * AreaTrend — a single-series gradient area chart. Premium defaults:
 * soft dashed grid, no axis lines, gradient fill, animated draw-on.
 */
export function AreaTrend({
  data,
  dataKey = "value",
  xKey = "name",
  color = "var(--ph-primary)",
  height = 220,
  formatter,
  showAxis = true,
}: {
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  formatter?: (v: number) => string;
  showAxis?: boolean;
}) {
  const gradId = React.useId().replace(/:/g, "");
  return (
    <div style={{ height }} className="ph-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: showAxis ? -12 : 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--ph-border-soft)" vertical={false} strokeDasharray="3 3" />
          {showAxis && (
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} stroke="var(--ph-text-muted)" fontSize={11} dy={4} />
          )}
          {showAxis && (
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="var(--ph-text-muted)"
              fontSize={11}
              width={34}
              tickFormatter={formatter}
            />
          )}
          <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ stroke: "var(--ph-border-medium)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.4}
            fill={`url(#${gradId})`}
            animationDuration={900}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--ph-surface)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Sparkline — tiny inline area chart for metric cards. */
export function Sparkline({
  data,
  color = "var(--ph-primary)",
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const gradId = React.useId().replace(/:/g, "");
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="ph-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
