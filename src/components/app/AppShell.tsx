import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { PalsLauncher } from "@/components/pals/PalsLauncher";

export function AppShell({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="app-page">
      <div className={`app-shell${rightPanel ? "" : " no-right-panel"}`}>
        <AppSidebar />
        <main className="app-main">{children}</main>
        {rightPanel && <aside className="app-panel">{rightPanel}</aside>}
      </div>
      <PalsLauncher />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  soft = false,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  soft?: boolean;
  className?: string;
}) {
  return (
    <section className={`${soft ? "ph-card-soft" : "ph-card"} ${className ?? ""}`}>
      {(title || action) && (
        <header className="ph-card-header">
          {title && <h3 className="ph-card-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaDirection,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  delta?: string;
  deltaDirection?: "up" | "down";
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-body">
        <div className="metric-label">{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="metric-value">{value}</span>
          {delta && <span className={`metric-delta ${deltaDirection ?? ""}`}>{delta}</span>}
        </div>
      </div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="ph-progress">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}