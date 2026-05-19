import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const data = [
  { name: "Footage", value: 42, color: "var(--color-chart-1)" },
  { name: "Audio", value: 18, color: "var(--color-chart-2)" },
  { name: "Graphics", value: 14, color: "var(--color-chart-3)" },
  { name: "Music", value: 9, color: "var(--color-chart-4)" },
  { name: "Stills", value: 17, color: "var(--color-chart-5)" },
];

export function AssetDonut() {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Media Library
      </div>
      <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Asset Mix</h2>

      <div className="relative h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="num text-[24px] font-semibold leading-none">
              12.4<span className="text-muted-foreground text-[14px]"> TB</span>
            </div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5">Total managed</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-[11.5px]">
            <span className="size-2 rounded-sm" style={{ background: d.color }} />
            <span className="text-foreground/85">{d.name}</span>
            <span className="num ml-auto text-muted-foreground">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
