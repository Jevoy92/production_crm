import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  { to: "/cc", label: "Dashboard", exact: true },
  { to: "/cc/core12", label: "Core 12" },
  { to: "/cc/sprint", label: "30-Day Sprint" },
  { to: "/cc/shoots", label: "Shoot Planner" },
  { to: "/cc/photo-to-video", label: "Photo → Video" },
  { to: "/cc/tasks", label: "Shannen Tasks" },
  { to: "/cc/library", label: "Library" },
  { to: "/schedule", label: "Calendar", search: { view: "publishing" as const } },
];

export function CCNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex gap-1 mb-5 overflow-x-auto pb-1 border-b border-border">
      {TABS.map((t) => {
        const active = t.exact ? path === t.to : path === t.to || path.startsWith(t.to + "/");
        return (
          <Link
            key={t.to}
            to={t.to}
            search={t.search as never}
            className={`px-3 py-1.5 text-[13px] rounded-t-md whitespace-nowrap transition-colors ${
              active
                ? "bg-surface text-foreground border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LaneBadge({ lane }: { lane: string }) {
  const color =
    lane === "Reel" ? "var(--lane-reel)" :
    lane === "Spotlight" ? "var(--lane-spotlight)" :
    lane === "Evergreen" ? "var(--lane-evergreen)" : "var(--lane-system)";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
      style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {lane}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  let color = "var(--muted-foreground)";
  if (status === "Published" || status === "Repurposed") color = "var(--success)";
  else if (status === "Needs Jevoy Review") color = "var(--destructive)";
  else if (status === "Scheduled" || status === "Ready to Publish") color = "var(--info)";
  else if (status === "Editing" || status === "Sent to Editor") color = "var(--warning)";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
    >
      {status}
    </span>
  );
}
