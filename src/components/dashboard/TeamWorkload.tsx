import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

const team = [
  {
    name: "Jevoy Palmer",
    role: "Creative Director",
    load: 86,
    color: "var(--color-chart-1)",
    initials: "JP",
    projects: 12,
  },
  {
    name: "Adrienne Palmer",
    role: "CFO",
    load: 52,
    color: "var(--color-chart-3)",
    initials: "AP",
    projects: 6,
  },
  {
    name: "Marco Reed",
    role: "Lead Editor",
    load: 94,
    color: "var(--color-chart-4)",
    initials: "MR",
    projects: 9,
  },
  {
    name: "Sasha Lin",
    role: "Production Asst.",
    load: 68,
    color: "var(--color-chart-2)",
    initials: "SL",
    projects: 14,
  },
  {
    name: "Devon Hart",
    role: "Camera Op.",
    load: 41,
    color: "var(--color-chart-5)",
    initials: "DH",
    projects: 4,
  },
];

export function TeamWorkload() {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Team</div>
          <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Capacity & Workload</h2>
        </div>
        <button className="text-[11.5px] text-muted-foreground hover:text-foreground">
          View all
        </button>
      </div>

      <div className="mt-4 divide-y divide-border">
        {team.map((m) => (
          <div key={m.name} className="flex items-center gap-3 py-3">
            <div
              className="size-9 rounded-full grid place-items-center text-[11.5px] font-semibold text-primary-foreground ring-inset-soft"
              style={{ background: m.color }}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[13px] font-medium truncate">{m.name}</div>
                <div className="num text-[12px] text-muted-foreground">{m.load}%</div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {m.role} · {m.projects} active
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${m.load}%`, background: m.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeliveryRadial() {
  const data = [{ name: "Delivered", value: 78, fill: "var(--color-chart-1)" }];
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        This Quarter
      </div>
      <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Delivery Health</h2>

      <div className="relative h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "var(--color-surface-3)" } as never}
              dataKey="value"
              cornerRadius={20}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="num text-[32px] font-semibold text-gradient-amber leading-none">
              78%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">on-time delivery</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {[
          { l: "On time", v: "47", c: "text-success" },
          { l: "At risk", v: "9", c: "text-warning" },
          { l: "Late", v: "4", c: "text-destructive" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg bg-surface-2 ring-inset-soft py-2">
            <div className={`num text-[16px] font-semibold ${s.c}`}>{s.v}</div>
            <div className="text-[10.5px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
