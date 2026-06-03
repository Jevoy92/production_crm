import { Search, Bell, Command, Menu, Check, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

          <button className="hidden sm:grid size-9 place-items-center rounded-lg bg-surface-2 ring-inset-soft hover:bg-surface-3">
            <Bell className="size-4 text-muted-foreground" />
          </button>

          {actions}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Switch account"
                className="ml-0 md:ml-2 flex items-center gap-2.5 rounded-full pl-1 pr-2.5 md:pr-3 py-1 bg-card ring-1 ring-border hover:ring-primary/60 hover:bg-surface-2 transition-all shadow-sm"
              >
                <div
                  className="size-8 rounded-full grid place-items-center text-[12px] font-semibold text-primary-foreground shrink-0"
                  style={{ background: active.color }}
                >
                  {active.initials}
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <div className="text-[12.5px] font-semibold">{active.name}</div>
                  <div className="text-[10.5px] text-muted-foreground capitalize">{active.role === "pa" ? "PA" : active.role}</div>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                Switch account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {team.map((m) => {
                const isActive = m.role === role;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onSelect={() => setRole(m.role as typeof role)}
                    className="gap-3 py-2 cursor-pointer"
                  >
                    <div
                      className="size-9 rounded-full grid place-items-center text-[12.5px] font-semibold text-primary-foreground shrink-0"
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </div>
                    <div className="flex-1 leading-tight">
                      <div className="text-[13px] font-medium">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">{m.role === "pa" ? "PA" : m.role}</div>
                    </div>
                    {isActive && <Check className="size-4 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
