import { MapPin, Camera, Mic, Sun } from "lucide-react";

const shoots = [
  {
    day: "TUE",
    date: "19",
    title: "Recruiting Sizzle · Final Review",
    time: "10:00 — 11:30",
    loc: "Studio A",
    crew: ["JP", "MR"],
    type: "Review",
    accent: "var(--color-chart-4)",
  },
  {
    day: "WED",
    date: "20",
    title: "Beacon Co. Training Delivery",
    time: "All day",
    loc: "Remote",
    crew: ["AP"],
    type: "Delivery",
    accent: "var(--color-chart-3)",
  },
  {
    day: "THU",
    date: "21",
    title: "Helix Robotics — Launch Reel",
    time: "08:00 — 18:00",
    loc: "Helix HQ, Bay 4",
    crew: ["JP", "DH", "SL"],
    type: "Shoot",
    accent: "var(--color-chart-1)",
    featured: true,
  },
  {
    day: "FRI",
    date: "22",
    title: "Northwind Founder Story Pt.2",
    time: "Edit deadline",
    loc: "Edit Bay 2",
    crew: ["MR"],
    type: "Edit",
    accent: "var(--color-chart-2)",
  },
  {
    day: "SAT",
    date: "23",
    title: "Vanta Conference Coverage",
    time: "07:30 — 20:00",
    loc: "Pier 27",
    crew: ["DH", "SL"],
    type: "Shoot",
    accent: "var(--color-chart-1)",
  },
];

export function UpcomingShoots() {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            This Week
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Upcoming Shoots</h2>
        </div>
        <button className="text-[11.5px] text-muted-foreground hover:text-foreground">
          Open calendar →
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {shoots.map((s) => (
          <div
            key={s.title}
            className={`relative flex items-center gap-4 rounded-xl p-3 ring-inset-soft transition-colors ${
              s.featured ? "bg-surface-3" : "bg-surface-2/60 hover:bg-surface-2"
            }`}
          >
            <div
              className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
              style={{ background: s.accent }}
            />
            <div className="text-center w-12">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.day}
              </div>
              <div className="num text-[22px] font-semibold leading-none mt-0.5">{s.date}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{s.title}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Sun className="size-3" /> {s.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {s.loc}
                </span>
                {s.type === "Shoot" && (
                  <span className="flex items-center gap-1">
                    <Camera className="size-3" /> 3 cam · <Mic className="size-3" /> 2 mic
                  </span>
                )}
              </div>
            </div>
            <div className="flex -space-x-1.5">
              {s.crew.map((c, i) => (
                <div
                  key={i}
                  className="size-6 rounded-full grid place-items-center text-[9.5px] font-semibold text-primary-foreground ring-2 ring-card"
                  style={{ background: s.accent }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
