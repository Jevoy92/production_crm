import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { startCloudSync, useSyncStatus } from "@/lib/cloudSync";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      startCloudSync();
    }
  }, [session]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return (
    <>
      {children}
      <SyncIndicator />
    </>
  );
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
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-border bg-surface-1 p-6 shadow-lg"
      >
        <div className="mb-1 text-lg font-semibold text-foreground">
          Palmer House Production OS
        </div>
        <div className="mb-5 text-[12.5px] text-muted-foreground">
          Sign in with the shared team account. Everyone uses the same login — all data syncs across devices.
        </div>

        <label className="mb-3 block">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Email</div>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="mb-4 block">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Password</div>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        {err && (
          <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "…" : mode === "signin" ? "Sign in" : "Create shared account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
          }}
          className="mt-3 w-full text-[12px] text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "First time? Create the shared account →"
            : "Already have the shared account? Sign in →"}
        </button>
      </form>
    </div>
  );
}