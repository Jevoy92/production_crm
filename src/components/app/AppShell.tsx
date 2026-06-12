import * as React from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search, Bell, Sun, Moon, Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { PalsLauncher } from "@/components/pals/PalsLauncher";
import { AnimatedNumber } from "@/components/motion/Motion";
import { routeVariants } from "@/lib/motion";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className="relative w-10 h-10 rounded-xl bg-sunken border border-line flex items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function Topbar({
  title,
  subtitle,
  actions,
  eyebrow,
  onMenu,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  onMenu?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-panel/80 backdrop-blur-xl border-b border-line flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="lg:hidden w-10 h-10 -ml-1 rounded-xl bg-sunken border border-line flex items-center justify-center text-mid hover:text-hi shrink-0"
        >
          <Menu size={16} />
        </button>
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="text-lo text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5 sm:mb-1 truncate">{eyebrow}</div>}
          {title && <h1 className="font-display font-bold text-lg sm:text-2xl text-hi tracking-tight leading-tight truncate">{title}</h1>}
          {subtitle && <p className="text-mid text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {actions}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Search…"
            className="bg-sunken border border-line text-hi placeholder-lo text-sm rounded-xl pl-9 pr-4 py-2.5 w-56 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo" />
        </div>
        <button className="relative w-10 h-10 rounded-xl bg-sunken border border-line hidden sm:flex items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors">
          <Bell size={16} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function AppShell({
  children,
  rightPanel,
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const body = (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {reduce ? (
        rightPanel ? <TwoCol main={children} aside={rightPanel} /> : children
      ) : (
        <motion.div variants={routeVariants} initial="hidden" animate="show">
          {rightPanel ? <TwoCol main={children} aside={rightPanel} /> : children}
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="flex h-dvh w-full bg-app text-hi overflow-hidden">
      <AppSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          eyebrow={eyebrow}
          onMenu={() => setMobileNavOpen(true)}
        />
        {body}
      </main>
      <PalsLauncher />
    </div>
  );
}

function TwoCol({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="min-w-0">{main}</div>
      <aside className="space-y-6">{aside}</aside>
    </div>
  );
}

/** Legacy in-body header — kept for pages not yet migrated to topbar titles. */
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow && <div className="text-lo text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1">{eyebrow}</div>}
        <h1 className="font-display font-bold text-xl text-hi tracking-tight">{title}</h1>
        {subtitle && <p className="text-mid text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
    </div>
  );
}

/* ===== Card primitives (Tailwind semantic tokens) ===================== */

export function Card({
  title,
  action,
  children,
  soft = false,
  interactive = false,
  icon,
  description,
  className,
  style,
  noPad = false,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  soft?: boolean;
  interactive?: boolean;
  icon?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPad?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border overflow-hidden ${
        soft ? "bg-sunken border-transparent" : "bg-panel border-line shadow-[var(--elev-card)]"
      } ${interactive ? "hover:border-brand-500/40 transition-colors" : ""} ${className ?? ""}`}
      style={style}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="w-8 h-8 rounded-lg bg-brand-600/15 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="font-display font-bold text-hi text-base leading-tight truncate">{title}</h3>}
              {description && <p className="text-lo text-xs mt-0.5">{description}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaDirection,
  animateTo,
  format,
  accent = "brand",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  delta?: string;
  deltaDirection?: "up" | "down";
  animateTo?: number;
  format?: (n: number) => string;
  accent?: AccentKey;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="relative bg-panel border border-line rounded-2xl p-5 overflow-hidden group hover:border-brand-500/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.chip}`}>{icon}</div>
        {delta && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              deltaDirection === "down" ? "text-rose bg-rose/10" : "text-emerald bg-emerald/10"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-display font-bold text-hi mb-1 num">
        {animateTo != null ? <AnimatedNumber value={animateTo} format={format} /> : value}
      </div>
      <div className="text-mid text-sm font-medium">{label}</div>
    </div>
  );
}

export function Progress({ value, color = "var(--brand-500)" }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const reduce = useReducedMotion();
  return (
    <div className="h-1.5 w-full bg-sunken rounded-full overflow-hidden">
      {reduce ? (
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      ) : (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "100%", background: color, borderRadius: 999 }}
        />
      )}
    </div>
  );
}

/* ===== Accent helpers ================================================= */
export type AccentKey = "brand" | "violet" | "amber" | "emerald" | "cyan" | "rose" | "orange";
export const ACCENTS: Record<AccentKey, { chip: string; text: string; soft: string }> = {
  brand: { chip: "bg-brand-600/15 border border-brand-500/20 text-brand-400", text: "text-brand-400", soft: "bg-brand-600/10" },
  violet: { chip: "bg-violet-600/15 border border-violet-500/20 text-violet", text: "text-violet", soft: "bg-violet/10" },
  amber: { chip: "bg-amber-600/15 border border-amber-500/20 text-amber", text: "text-amber", soft: "bg-amber/10" },
  emerald: { chip: "bg-emerald-600/15 border border-emerald-500/20 text-emerald", text: "text-emerald", soft: "bg-emerald/10" },
  cyan: { chip: "bg-cyan-600/15 border border-cyan-500/20 text-cyan", text: "text-cyan", soft: "bg-cyan/10" },
  rose: { chip: "bg-rose-600/15 border border-rose-500/20 text-rose", text: "text-rose", soft: "bg-rose/10" },
  orange: { chip: "bg-orange-600/15 border border-orange-500/20 text-orange", text: "text-orange", soft: "bg-orange/10" },
};

/* ===== Shared primitives ============================================= */

export function StatTile({
  label, value, delta, deltaDirection, icon, accent = "brand", trailing, animateTo, format,
}: {
  label: string; value?: ReactNode; delta?: string; deltaDirection?: "up" | "down";
  icon?: ReactNode; accent?: AccentKey; trailing?: ReactNode; animateTo?: number; format?: (n: number) => string;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="relative bg-panel border border-line rounded-2xl p-5 overflow-hidden group hover:border-brand-500/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        {icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.chip}`}>{icon}</div>}
        {delta && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${deltaDirection === "down" ? "text-rose bg-rose/10" : "text-emerald bg-emerald/10"}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-display font-bold text-hi mb-1 num">
        {animateTo != null ? <AnimatedNumber value={animateTo} format={format} /> : value}
      </div>
      <div className="text-mid text-sm font-medium">{label}</div>
      {trailing && <div className="mt-3">{trailing}</div>}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value, onChange, options,
}: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-sunken border border-line rounded-xl" role="tablist">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              active ? "bg-brand-600 text-white" : "text-mid hover:text-hi"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pill({
  children, tone = "neutral", className,
}: {
  children: ReactNode; tone?: AccentKey | "neutral"; className?: string;
}) {
  const map: Record<string, string> = {
    neutral: "bg-sunken text-mid border border-line",
    brand: "bg-brand-600/10 text-brand-400 border border-brand-500/20",
    violet: "bg-violet/10 text-violet border border-violet/20",
    amber: "bg-amber/10 text-amber border border-amber/20",
    emerald: "bg-emerald/10 text-emerald border border-emerald/20",
    cyan: "bg-cyan/10 text-cyan border border-cyan/20",
    rose: "bg-rose/10 text-rose border border-rose/20",
    orange: "bg-orange/10 text-orange border border-orange/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map[tone]} ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function SectionHeading({
  title, description, action, eyebrow,
}: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; eyebrow?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && <div className="text-lo text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1.5">{eyebrow}</div>}
        <h2 className="font-display text-xl font-bold text-hi tracking-tight">{title}</h2>
        {description && <p className="text-mid text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-2.5 flex-wrap ${className ?? ""}`}>{children}</div>;
}

export function EmptyState({
  icon, title, description, action,
}: {
  icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-2.5 text-mid">
      {icon && <div className="w-13 h-13 rounded-2xl bg-sunken flex items-center justify-center text-lo mb-1">{icon}</div>}
      <div className="font-semibold text-hi text-base">{title}</div>
      {description && <div className="text-sm max-w-sm">{description}</div>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}
