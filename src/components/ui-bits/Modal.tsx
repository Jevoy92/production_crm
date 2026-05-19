import * as React from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`card-elevated w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-2xl p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="size-7 rounded-md grid place-items-center hover:bg-surface-2"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
        {label}
      </div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg bg-surface-2 ring-inset-soft px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-ring";

export function Btn({
  variant = "primary",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-95"
      : variant === "ghost"
        ? "text-muted-foreground hover:text-foreground hover:bg-surface-2"
        : variant === "danger"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
          : "bg-surface-2 text-foreground ring-inset-soft hover:bg-surface-3";
  return (
    <button
      {...rest}
      className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${cls} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}
