import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Film,
  Calendar,
  Users,
  Folder,
  BarChart3,
  Wallet,
  Boxes,
  ClipboardList,
  Settings,
  Sparkles,
  CheckSquare,
  Contact,
  SlidersHorizontal,
  Clapperboard,
  Target,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";

import { AiAssistantModal } from "./AiAssistantModal";

const nav = [
  { label: "Team & KPIs", to: "/team", icon: Users },
  { label: "Scoreboard", to: "/scoreboard", icon: Target },
  { label: "Productions", to: "/productions", icon: Film },
  { label: "Schedule", to: "/schedule", icon: Calendar },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Clients", to: "/clients", icon: Contact },
  { label: "Assets", to: "/assets", icon: Folder },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Finance", to: "/finance", icon: Wallet },
  { label: "Gear", to: "/gear", icon: Boxes },
  { label: "Playbooks", to: "/playbook", icon: ClipboardList },
  { label: "Content Pipeline", to: "/content", icon: Clapperboard },
  { label: "Templates", to: "/admin/templates", icon: SlidersHorizontal },
] as const;

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeProjects = useStore(
    (s) => s.projects.filter((p) => p.stage !== "Archived" && p.stage !== "Delivered").length,
  );
  const clearSeedData = useStore((s) => s.clearSeedData);
  const hasData = useStore((s) => s.projects.length > 0 || s.clients.length > 0);
  const [aiOpen, setAiOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside 
      className={`w-64 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar z-40 transition-transform duration-300 ease-in-out fixed lg:static h-full inset-y-0 left-0 ${
        mobileOpen ? "translate-x-0 flex" : "-translate-x-full lg:translate-x-0 hidden lg:flex"
      }`}
    >
      <div className="px-5 pt-5 pb-3 flex justify-between items-center">
        <Link to="/" onClick={onCloseMobile} className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl grid place-items-center bg-primary">
            <span className="text-[15px] font-semibold text-primary-foreground">P</span>
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">Palmer House</div>
            <div className="text-[11px] text-muted-foreground">Production OS</div>
          </div>
        </Link>
      </div>

      <div className="px-3 flex-1 flex flex-col gap-0.5">
        <div className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
          Workspace
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={onCloseMobile}
                className={`group flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-inset-soft"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="size-[15px] opacity-80" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.to === "/productions" && (
                  <span className="num text-[10px] rounded-md bg-surface-3 px-1.5 py-0.5 text-muted-foreground">
                    {activeProjects}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3 flex flex-col gap-1 border-t border-sidebar-border/50 shrink-0">
        <button
          onClick={() => { setAiOpen(true); onCloseMobile?.(); }}
          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-primary hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="size-[15px]" />
          <span className="font-medium">Pals AI Assistant</span>
        </button>

        {hasData && (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete all seed data? This cannot be undone.")) {
                clearSeedData();
              }
            }}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="size-[15px]" /> Delete Seed Data
          </button>
        )}

        <Link
          to="/settings"
          onClick={onCloseMobile}
          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="size-[15px]" /> Settings
        </Link>
      </div>

      <AiAssistantModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </aside>
  );
}
