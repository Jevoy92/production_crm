import * as React from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

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
  const reduce = useReducedMotion();
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          style={{ background: "rgba(21,19,28,0.42)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}
            style={{
              background: "var(--ph-surface)",
              border: "1px solid var(--ph-border-soft)",
              borderRadius: "var(--ph-radius-lg)",
              boxShadow: "var(--ph-shadow-pop)",
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={spring.soft}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ph-text-primary)" }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className="ph-btn ph-btn-soft ph-btn-icon ph-btn-sm"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
            {footer && (
              <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--ph-text-secondary)",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: "var(--ph-text-muted)", marginTop: 5 }}>{hint}</div>
      )}
    </label>
  );
}

export const inputCls = "ph-input";

export function Btn({
  variant = "primary",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "ph-btn-primary"
      : variant === "ghost"
        ? "ph-btn-ghost"
        : variant === "danger"
          ? "ph-btn-danger"
          : "ph-btn-soft";
  return (
    <button
      {...rest}
      className={`ph-btn ph-btn-sm ${cls} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}
