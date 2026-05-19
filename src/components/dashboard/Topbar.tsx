import { Search, Bell, Command, Menu } from "lucide-react";
import { useStore } from "@/lib/store";

const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthName = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function Topbar({
  title,
  subtitle,
  actions,
  onMenuClick,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}) {
  const role = useStore((s) => s.activeRole);
  const setRole = useStore((s) => s.setRole);
  const team = useStore((s) => s.team);
  const active = team.find((m) => m.role === role) ?? team[0];

  const d = new Date();
  const dateLbl = `${dayName[d.getDay()]} · ${monthName[d.getMonth()]} ${d.getDate()}`;

  return (
    <header className="sticky top-0 z-20 -mx-4 md:-mx-6 mb-6 border-b border-border bg-background/80 px-4 md:px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden size-9 grid place-items-center rounded-lg hover:bg-surface-2 ring-inset-soft mr-1"
        >
          <Menu className="size-5" />
        </button>

        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground truncate max-w-[120px] md:max-w-none">
            {subtitle ?? dateLbl}
          </div>
          <h1 className="text-lg md:text-[20px] font-semibold tracking-tight truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 size-3.5 text-muted-foreground" />
            <input
              placeholder="Search projects, clients, gear…"
              className="w-72 rounded-lg bg-surface-2 pl-9 pr-16 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/70 ring-inset-soft outline-none focus:ring-2 focus:ring-ring"
            />
            <kbd className="num absolute right-2 flex items-center gap-0.5 rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Command className="size-2.5" />K
            </kbd>
          </div>

          <div className="hidden lg:flex items-center rounded-lg bg-surface-2 ring-inset-soft p-0.5">
            {(["owner", "cfo", "pa"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-2.5 py-1 text-[11.5px] rounded-md capitalize ${role === r ? "bg-card text-foreground ring-inset-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r === "pa" ? "PA" : r}
              </button>
            ))}
          </div>

          <button className="hidden sm:grid size-9 place-items-center rounded-lg bg-surface-2 ring-inset-soft hover:bg-surface-3">
            <Bell className="size-4 text-muted-foreground" />
          </button>

          {actions}

          <div className="ml-0 md:ml-2 flex items-center gap-2 pl-0 md:pl-3 md:border-l border-border">
            <div
              className="size-8 rounded-full grid place-items-center text-[12px] font-semibold text-primary-foreground"
              style={{ background: active.color }}
            >
              {active.initials}
            </div>
            <div className="hidden xl:block leading-tight">
              <div className="text-[12.5px] font-medium">{active.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{active.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
