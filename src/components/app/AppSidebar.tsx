import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sun, Command, Film, Calendar, CheckSquare, FileText, PenLine,
  Contact, Users, Target, Folder, Boxes, ClipboardList, Wallet,
  BarChart3, Palette, SlidersHorizontal, Settings, Bot, Scissors, Clapperboard, NotebookPen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePalsUI } from "@/lib/palsUI";

type NavItem = { label: string; to: string; icon: LucideIcon; badge?: number; ai?: boolean };
type NavGroup = { heading: string; items: NavItem[] };

function useNav(): NavGroup[] {
  const activeProjects = useStore(
    (s) => s.projects.filter((p) => p.stage !== "Archived" && p.stage !== "Delivered").length,
  );
  return [
    {
      heading: "Workspace",
      items: [
        { label: "Today", to: "/", icon: Sun },
        { label: "Content Library", to: "/content", icon: Command },
        { label: "Productions", to: "/productions", icon: Film, badge: activeProjects || undefined },
        { label: "Schedule", to: "/schedule", icon: Calendar },
        { label: "Tasks", to: "/tasks", icon: CheckSquare },
        { label: "Meetings", to: "/meetings", icon: NotebookPen },
        { label: "Scripts", to: "/scripts", icon: FileText },
        { label: "Repurpose", to: "/repurpose", icon: Scissors },
        { label: "Studio", to: "/studio", icon: Clapperboard },
      ],
    },
    {
      heading: "Management",
      items: [
        { label: "Clients", to: "/clients", icon: Contact },
        { label: "Team & KPIs", to: "/team", icon: Users },
        { label: "Scoreboard", to: "/scoreboard", icon: Target },
        { label: "Finance", to: "/finance", icon: Wallet },
        { label: "Analytics", to: "/analytics", icon: BarChart3 },
      ],
    },
    {
      heading: "Operations",
      items: [
        { label: "Assets", to: "/assets", icon: Folder },
        { label: "Gear", to: "/gear", icon: Boxes },
        { label: "Checklists", to: "/checklists", icon: ClipboardList },
        { label: "Playbooks", to: "/playbook", icon: ClipboardList },
        { label: "Brand", to: "/brand", icon: Palette },
        { label: "Templates", to: "/admin/templates", icon: SlidersHorizontal },
      ],
    },
    {
      heading: "AI",
      items: [{ label: "Pals AI Assistant", to: "/cc", icon: Bot, ai: true }],
    },
  ];
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNav();
  const team = useStore((s) => s.team);
  const role = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === role) ?? team[0];
  const togglePals = usePalsUI((s) => s.toggle);
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="w-64 min-w-[256px] flex-shrink-0 bg-panel border-r border-line flex flex-col z-40">
      {/* Logo */}
      <Link to="/" className="px-5 py-5 border-b border-line flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-[0_8px_20px_-8px_rgba(79,70,229,0.6)]">
          <Film size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-hi text-[15px] tracking-tight leading-none">Production OS</div>
          <div className="text-lo text-xs mt-1">Palmer House</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.heading}>
            <div className="px-3 py-1.5 mb-1 mt-2 first:mt-0">
              <span className="text-lo text-[10.5px] font-bold uppercase tracking-[0.14em]">{group.heading}</span>
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              const inner = (
                <>
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      active
                        ? "bg-white/20"
                        : item.ai
                          ? "bg-gradient-to-br from-violet-600/30 to-brand-600/30 border border-violet-500/30"
                          : "bg-sunken group-hover:bg-raised"
                    }`}
                  >
                    <Icon size={14} className={active ? "text-white" : item.ai ? "text-violet-400" : "text-mid group-hover:text-hi"} />
                  </span>
                  <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                  {item.badge != null && (
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : "bg-sunken text-mid"}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.ai && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                </>
              );
              const cls = `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left ${
                active ? "bg-brand-600 text-white" : "text-mid hover:bg-hover hover:text-hi"
              }`;
              if (item.ai) {
                return (
                  <button key={item.label} type="button" onClick={togglePals} className={cls}>
                    {inner}
                  </button>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cls}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      active
                        ? "bg-white/20"
                        : item.ai
                          ? "bg-gradient-to-br from-violet-600/30 to-brand-600/30 border border-violet-500/30"
                          : "bg-sunken group-hover:bg-raised"
                    }`}
                  >
                    <Icon size={14} className={active ? "text-white" : item.ai ? "text-violet-400" : "text-mid group-hover:text-hi"} />
                  </span>
                  <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                  {item.badge != null && (
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : "bg-sunken text-mid"}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.ai && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-line">
        <Link to="/settings" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-hover transition-colors">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
            {me?.name?.charAt(0) ?? "P"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-hi text-sm font-semibold truncate">{me?.name ?? "Palmer House"}</div>
            <div className="text-lo text-xs truncate capitalize">{role === "pa" ? "Producer" : role}</div>
          </div>
          <Settings size={14} className="text-lo flex-shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
