import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { startCloudSync, useSyncStatus } from "@/lib/cloudSync";
import { Field } from "@/components/ui-bits/Modal";
import { Toaster } from "@/components/ui/sonner";
import { useTaskNotifications } from "@/lib/useTaskNotifications";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fallback = window.setTimeout(() => {
      if (mounted) setReady(true);
    }, 2500);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    }).catch(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
      window.clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      startCloudSync();
    }
  }, [session]);

  // Dev-only visual-QA bypass. Compiled out of production builds (import.meta.env.DEV
  // is statically false in prod) and only active when VITE_DEV_NO_AUTH=1 is set locally.
  const devBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_NO_AUTH === "1";

  if (!ready && !devBypass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (!session && !devBypass) return <LoginScreen />;
  return (
    <>
      <NotificationsHost />
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        offset={{ top: 72, right: 16 }}
        mobileOffset={{ top: 68, right: 12, left: 12 }}
      />
      <SyncIndicator />
    </>
  );
}

function NotificationsHost() {
  useTaskNotifications();
  return null;
}

function SyncIndicator() {
  const status = useSyncStatus();
  const label =
    status === "loading"
      ? "Loading team data…"
      : status === "syncing"
        ? "Syncing…"
        : status === "error"
          ? "Sync error"
          : "Synced";
  const color =
    status === "error"
      ? "bg-red-500"
      : status === "syncing" || status === "loading"
        ? "bg-amber-400"
        : "bg-emerald-500";
  return (
    <div
      className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] backdrop-blur"
      style={{
        bottom: 28,
        right: 92,
        color: "var(--ph-text-secondary)",
        background: "color-mix(in oklab, var(--ph-surface) 82%, transparent)",
        border: "1px solid var(--ph-border-soft)",
        boxShadow: "var(--ph-shadow-sm)",
        fontWeight: 600,
      }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "radial-gradient(1200px 600px at 15% -10%, var(--ph-primary-soft), transparent 60%), radial-gradient(900px 500px at 100% 110%, var(--ph-accent-gold-soft), transparent 55%), var(--ph-app-bg)",
      }}
    >
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
        style={{
          maxWidth: 400,
          background: "var(--ph-surface)",
          border: "1px solid var(--ph-border-soft)",
          borderRadius: "var(--ph-radius-lg)",
          boxShadow: "var(--ph-shadow-soft)",
          padding: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: "linear-gradient(150deg, var(--ph-primary-500), var(--ph-primary-700))",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 20,
              boxShadow: "var(--ph-shadow-primary)",
            }}
          >
            P
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>Palmer House</div>
            <div style={{ fontSize: 12, color: "var(--ph-text-secondary)" }}>Production OS</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          {mode === "signin" ? "Welcome back" : "Create the shared account"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--ph-text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>
          Sign in with the shared team account — everyone uses the same login and all data syncs across devices.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ph-input"
              placeholder="team@palmerhouse.co"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ph-input"
              placeholder="••••••••"
            />
          </Field>
        </div>

        {err && (
          <div
            style={{
              marginTop: 14,
              borderRadius: 12,
              background: "var(--ph-danger-soft)",
              color: "var(--ph-danger)",
              padding: "10px 12px",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="ph-btn ph-btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 20, padding: "12px 16px" }}
        >
          {loading ? "…" : mode === "signin" ? "Sign in" : "Create shared account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
          }}
          className="ph-btn ph-btn-ghost"
          style={{ width: "100%", justifyContent: "center", marginTop: 8, fontWeight: 600 }}
        >
          {mode === "signin"
            ? "First time? Create the shared account →"
            : "Already have the shared account? Sign in →"}
        </button>
      </motion.form>
    </div>
  );
}