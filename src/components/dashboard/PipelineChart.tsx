import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const seed = [
  { prep: 3, shoot: 2, edit: 4, review: 2, delivered: 5 },
  { prep: 4, shoot: 3, edit: 5, review: 1, delivered: 4 },
  { prep: 2, shoot: 4, edit: 6, review: 3, delivered: 6 },
  { prep: 5, shoot: 2, edit: 4, review: 2, delivered: 7 },
  { prep: 3, shoot: 5, edit: 5, review: 4, delivered: 5 },
  { prep: 4, shoot: 6, edit: 7, review: 3, delivered: 8 },
  { prep: 6, shoot: 4, edit: 8, review: 5, delivered: 9 },
  { prep: 5, shoot: 7, edit: 6, review: 4, delivered: 11 },
];

const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const today = new Date();
const data = seed.map((d, i) => {
  const date = new Date(today);
  date.setDate(today.getDate() - (seed.length - 1 - i) * 7);
  return { ...d, label: fmt.format(date) };
});

const stages = [
  { key: "prep", label: "Pre-Prod", color: "var(--color-chart-5)" },
  { key: "shoot", label: "Shoot", color: "var(--color-chart-1)" },
  { key: "edit", label: "Edit", color: "var(--color-chart-2)" },
  { key: "review", label: "Review", color: "var(--color-chart-4)" },
  { key: "delivered", label: "Delivered", color: "var(--color-chart-3)" },
];

export function PipelineChart() {
  return (
    <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Production Pipeline
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">
            Stage flow · last 8 weeks
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {stages.map((s) => (
            <div
              key={s.key}
              className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground"
            >
              <span className="size-2 rounded-sm" style={{ background: s.color }} /> {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="22%">
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
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
            />
            <Tooltip
              cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "var(--shadow-card)",
              }}
            />
            {stages.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                radius={i === stages.length - 1 ? [6, 6, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
