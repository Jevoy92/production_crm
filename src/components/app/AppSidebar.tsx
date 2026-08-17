import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sun,
  Command,
  Film,
  Calendar,
  CheckSquare,
  FileText,
  PenLine,
  Contact,
  Users,
  Target,
  Folder,
  Boxes,
  ClipboardList,
  Wallet,
  BarChart3,
  Palette,
  SlidersHorizontal,
  Settings,
  Bot,
  Scissors,
  Clapperboard,
  NotebookPen,
  X,
  CircleDot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePalsUI } from "@/lib/palsUI";
import { useEffect, useState } from "react";

type NavChild = { label: string; to: string; icon: LucideIcon };
type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
  ai?: boolean;
  children?: NavChild[];
};
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
        {
          label: "Tasks",
          to: "/tasks",
          icon: CheckSquare,
          children: [{ label: "Focus Mode", to: "/focus", icon: CircleDot }],
        },
        {
          label: "Schedule",
          to: "/schedule",
          icon: Calendar,
          children: [{ label: "Meetings", to: "/meetings", icon: NotebookPen }],
        },
        {
          label: "Productions",
          to: "/productions",
          icon: Film,
          badge: activeProjects || undefined,
        },
        {
          label: "Content Library",
          to: "/content",
          icon: Command,
          children: [
            { label: "Scripts", to: "/scripts", icon: FileText },
            { label: "Studio", to: "/studio", icon: Clapperboard },
            { label: "Shorts Lab", to: "/scripts/shorts", icon: Clapperboard },
            { label: "Shorts", to: "/repurpose", icon: Scissors },
          ],
        },
      ],
    },
    {
      heading: "Management",
      items: [
        { label: "Clients", to: "/clients", icon: Contact },
        {
          label: "Team & KPIs",
          to: "/team",
          icon: Users,
          children: [
            { label: "Scoreboard", to: "/scoreboard", icon: Target },
            { label: "Analytics", to: "/analytics", icon: BarChart3 },
          ],
        },
        { label: "Finance", to: "/finance", icon: Wallet },
      ],
    },
    {
      heading: "Operations",
      items: [
        {
          label: "Assets",
          to: "/assets",
          icon: Folder,
          children: [
            { label: "Gear", to: "/gear", icon: Boxes },
            { label: "Brand", to: "/brand", icon: Palette },
          ],
        },
        {
          label: "Checklists",
          to: "/checklists",
          icon: ClipboardList,
          children: [
            { label: "Playbooks", to: "/playbook", icon: ClipboardList },
            { label: "Templates", to: "/admin/templates", icon: SlidersHorizontal },
          ],
        },
      ],
    },
    {
      heading: "AI",
      items: [{ label: "Pals AI Assistant", to: "/cc", icon: Bot, ai: true }],
    },
  ];
}

export function AppSidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
} = {}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNav();
  const team = useStore((s) => s.team);
  const role = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === role) ?? team[0];
  const togglePals = usePalsUI((s) => s.toggle);
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  // Close drawer on route change
  useEffect(() => {
    if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
      <aside
        className={`bg-panel border-r border-line flex flex-col z-50
          fixed inset-y-0 left-0 w-[280px] max-w-[85vw] transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:w-64 lg:min-w-[256px] lg:flex-shrink-0`}
      >
        {/* Mobile close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute top-4 right-3 lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-mid hover:text-hi hover:bg-hover transition-colors"
        >
          <X size={18} />
        </button>
        {/* Logo */}
        <Link to="/" className="px-5 py-5 border-b border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-[0_8px_20px_-8px_rgba(79,70,229,0.6)]">
            <Film size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-hi text-[15px] tracking-tight leading-none">
              Production OS
            </div>
            <div className="text-lo text-xs mt-1">Palmer House</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((group) => (
            <div key={group.heading}>
              <div className="px-3 py-1.5 mb-1 mt-2 first:mt-0">
                <span className="text-lo text-[10.5px] font-bold uppercase tracking-[0.14em]">
                  {group.heading}
                </span>
              </div>
              {group.items.map((item) => (
                <NavRow
                  key={item.label}
                  item={item}
                  isActive={isActive}
                  onAi={item.ai ? togglePals : undefined}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-line">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-hover transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              {me?.name?.charAt(0) ?? "P"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-hi text-sm font-semibold truncate">
                {me?.name ?? "Palmer House"}
              </div>
              <div className="text-lo text-xs truncate capitalize">
                {role === "pa" ? "Producer" : role}
              </div>
            </div>
            <Settings size={14} className="text-lo flex-shrink-0" />
          </Link>
        </div>
      </aside>
    </>
  );
}

/** One nav entry — optionally expandable with child links. */
function NavRow({
  item,
  isActive,
  onAi,
}: {
  item: NavItem;
  isActive: (to: string) => boolean;
  onAi?: () => void;
}) {
  const Icon = item.icon;
  const active = isActive(item.to);
  const childActive = item.children?.some((c) => isActive(c.to)) ?? false;
  const [open, setOpen] = useState(childActive);
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const cls = `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-left ${
    active ? "bg-brand-600 text-white" : "text-mid hover:bg-hover hover:text-hi"
  }`;

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
        <Icon
          size={14}
          className={
            active ? "text-white" : item.ai ? "text-violet-400" : "text-mid group-hover:text-hi"
          }
        />
      </span>
      <span className={`text-sm ${active || childActive ? "font-semibold" : "font-medium"}`}>
        {item.label}
      </span>
      {item.badge != null && (
        <span
          className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : "bg-sunken text-mid"}`}
        >
          {item.badge}
        </span>
      )}
      {item.ai && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
    </>
  );

  if (onAi) {
    return (
      <button type="button" onClick={onAi} className={cls}>
        {inner}
      </button>
    );
  }

  if (!item.children?.length) {
    return (
      <Link to={item.to} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <div>
      <div className={`${cls} pr-1`}>
        <Link
          to={item.to}
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {inner}
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${active ? "text-white/80 hover:bg-white/15" : "text-lo hover:text-hi hover:bg-sunken"}`}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.18s ease",
            }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{ maxHeight: open ? item.children.length * 44 : 0, opacity: open ? 1 : 0 }}
      >
        <div className="ml-[22px] pl-3 border-l border-line space-y-0.5 py-0.5">
          {item.children.map((c) => {
            const CIcon = c.icon;
            const cActive = isActive(c.to);
            return (
              <Link
                key={c.label}
                to={c.to}
                className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-[13px] ${
                  cActive
                    ? "bg-brand-600/15 text-brand-400 font-semibold"
                    : "text-lo hover:bg-hover hover:text-hi font-medium"
                }`}
              >
                <CIcon
                  size={13}
                  className={cActive ? "text-brand-400" : "text-lo group-hover:text-mid"}
                />
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
