import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Command, Film, Calendar, CheckSquare, FileText, PenLine,
  Contact, Users, Target, Folder, Boxes, ClipboardList, Wallet,
  BarChart3, Palette, SlidersHorizontal, Settings, Sparkles, Scissors,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";

type NavItem = { label: string; to: string; icon: LucideIcon; badge?: number };
type NavGroup = { heading: string; items: NavItem[] };

function useNav(): NavGroup[] {
  const activeProjects = useStore(
    (s) => s.projects.filter((p) => p.stage !== "Archived" && p.stage !== "Delivered").length,
  );
  return [
    {
      heading: "Work",
      items: [
        { label: "Today", to: "/", icon: Home },
        { label: "Content", to: "/content", icon: Command },
        { label: "Productions", to: "/productions", icon: Film, badge: activeProjects || undefined },
        { label: "Schedule", to: "/schedule", icon: Calendar },
        { label: "Tasks", to: "/tasks", icon: CheckSquare },
        { label: "Scripts", to: "/scripts", icon: FileText },
        { label: "Repurpose", to: "/repurpose", icon: Scissors },
        { label: "Studio", to: "/studio", icon: PenLine },
      ],
    },
    {
      heading: "Clients & Team",
      items: [
        { label: "Clients", to: "/clients", icon: Contact },
        { label: "Team & KPIs", to: "/team", icon: Users },
        { label: "Scoreboard", to: "/scoreboard", icon: Target },
      ],
    },
    {
      heading: "Operations",
      items: [
        { label: "Assets", to: "/assets", icon: Folder },
        { label: "Gear", to: "/gear", icon: Boxes },
        { label: "Checklists", to: "/checklists", icon: ClipboardList },
        { label: "Playbooks", to: "/playbook", icon: ClipboardList },
        { label: "Finance", to: "/finance", icon: Wallet },
        { label: "Analytics", to: "/analytics", icon: BarChart3 },
      ],
    },
    {
      heading: "Admin",
      items: [
        { label: "Brand", to: "/brand", icon: Palette },
        { label: "Templates", to: "/admin/templates", icon: SlidersHorizontal },
      ],
    },
  ];
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNav();
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="app-sidebar">
      <Link to="/" className="sidebar-logo">
        <span className="logo-mark">P</span>
        <span>
          Palmer House
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ph-text-secondary)", letterSpacing: 0 }}>
            Production OS
          </div>
        </span>
      </Link>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, overflowY: "auto" }}>
        {nav.map((group) => (
          <div key={group.heading} className="sidebar-section">
            <div className="sidebar-section-title">{group.heading}</div>
            <nav className="sidebar-nav">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`sidebar-link${active ? " active" : ""}`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.badge != null && <span className="nav-badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 12, borderTop: "1px solid var(--ph-border-soft)" }}>
        <Link to="/settings" className="sidebar-link">
          <Settings size={16} /> Settings
        </Link>
        <Link to="/cc" className="sidebar-link" style={{ color: "var(--ph-primary)" }}>
          <Sparkles size={16} /> Pals AI Assistant
        </Link>
      </div>
    </aside>
  );
}