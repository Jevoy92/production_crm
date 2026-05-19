import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Film, Clock, DollarSign, CheckCircle2 } from "lucide-react";

type Kpi = {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: React.ElementType;
  gradient: string;
  data: { v: number }[];
  sub: string;
};

const spark = (seed: number) =>
  Array.from({ length: 24 }, (_, i) => ({
    v: 30 + Math.sin(i / 2 + seed) * 10 + (i * (seed % 3)) / 4 + Math.random() * 6,
  }));

const kpis: Kpi[] = [
  {
    label: "Active Productions",
    value: "18",
    delta: "+3",
    up: true,
    icon: Film,
    gradient: "var(--gradient-amber)",
    data: spark(1),
    sub: "6 in shoot · 9 in edit · 3 review",
  },
  {
    label: "Shoots This Week",
    value: "7",
    delta: "+2",
    up: true,
    icon: Clock,
    gradient: "var(--gradient-blue)",
    data: spark(2),
    sub: "4 client · 3 internal",
  },
  {
    label: "Pipeline Revenue",
    value: "$184.2K",
    delta: "+12.4%",
    up: true,
    icon: DollarSign,
    gradient: "var(--gradient-mint)",
    data: spark(3),
    sub: "Q2 forecast tracking +8%",
  },
  {
    label: "On-Time Delivery",
    value: "94%",
    delta: "-1.2%",
    up: false,
    icon: CheckCircle2,
    gradient: "var(--gradient-rose)",
    data: spark(4),
    sub: "Last 30 days · 28 / 30 deliveries",
  },
];

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div key={k.label} className="card-elevated relative overflow-hidden rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div
              className="size-10 rounded-xl grid place-items-center ring-inset-soft"
              style={{ background: k.gradient }}
            >
              <k.icon className="size-[18px] text-primary-foreground" />
            </div>
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                k.up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {k.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {k.delta}
            </div>
          </div>
          <div className="mt-5">
            <div className="text-[12px] text-muted-foreground">{k.label}</div>
            <div className="num mt-1 text-[34px] font-semibold leading-none">{k.value}</div>
            <div className="mt-1.5 text-[11.5px] text-muted-foreground/85">{k.sub}</div>
          </div>
          <div className="mt-4 h-12 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={k.data}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={k.gradient}
                  strokeWidth={1.75}
                  fill={k.gradient}
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
