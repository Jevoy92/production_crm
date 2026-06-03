import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { m: "Jan", actual: 38, forecast: 35 },
  { m: "Feb", actual: 42, forecast: 40 },
  { m: "Mar", actual: 51, forecast: 48 },
  { m: "Apr", actual: 49, forecast: 52 },
  { m: "May", actual: 64, forecast: 58 },
  { m: "Jun", actual: 0, forecast: 72 },
  { m: "Jul", actual: 0, forecast: 78 },
];

export function RevenueChart() {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Revenue
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Booked vs Forecast</h2>
        </div>
        <div className="text-right">
          <div className="num text-[22px] font-semibold text-gradient-amber">$284K</div>
          <div className="text-[11px] text-muted-foreground">YTD recognized</div>
        </div>
      </div>

      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="m"
              tickLine={false}
              axisLine={false}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              width={28}
              tickFormatter={(v) => `${v}K`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => `$${v}K`}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="var(--color-chart-2)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="var(--color-chart-2)"
              fillOpacity={0.08}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="var(--color-chart-1)"
              fillOpacity={0.14}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
