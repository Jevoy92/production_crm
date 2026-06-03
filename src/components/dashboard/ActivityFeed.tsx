import { CheckCircle2, Upload, MessageSquare, Camera, FileCheck } from "lucide-react";

const items = [
  {
    icon: Upload,
    color: "var(--color-chart-2)",
    who: "Marco",
    what: "uploaded 4.2 GB",
    target: "Northwind · Founder Story",
    time: "12m",
  },
  {
    icon: MessageSquare,
    color: "var(--color-chart-4)",
    who: "Atrium Partners",
    what: "approved cut v3",
    target: "CEO Interview Series",
    time: "1h",
  },
  {
    icon: Camera,
    color: "var(--color-chart-1)",
    who: "Jevoy",
    what: "marked shoot day complete",
    target: "Helix Launch Reel · Day 1",
    time: "3h",
  },
  {
    icon: CheckCircle2,
    color: "var(--color-chart-3)",
    who: "Sasha",
    what: "closed 7 prep tasks",
    target: "Vanta Conference Coverage",
    time: "4h",
  },
  {
    icon: FileCheck,
    color: "var(--color-chart-5)",
    who: "Adrienne",
    what: "finalized invoice",
    target: "Beacon Co. · Training 03–05",
    time: "Yesterday",
  },
];

export function ActivityFeed() {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Activity
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Live Stream</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-success">
          <span className="size-1.5 rounded-full bg-success animate-pulse" /> Live
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="size-8 rounded-lg grid place-items-center ring-inset-soft"
              style={{ background: `color-mix(in oklab, ${it.color} 20%, transparent)` }}
            >
              <it.icon className="size-3.5" style={{ color: it.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] leading-snug">
                <span className="font-medium text-foreground">{it.who}</span>
                <span className="text-muted-foreground"> {it.what} · </span>
                <span className="text-foreground/85">{it.target}</span>
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5">{it.time} ago</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
