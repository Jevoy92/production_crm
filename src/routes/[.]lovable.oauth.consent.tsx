import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// The Supabase browser client's `auth.oauth` namespace is currently beta —
// declare a minimal typed shim so TS is happy without reaching into node_modules.
type OAuthDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string } | null;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main style={{ padding: 32, maxWidth: 480, margin: "0 auto" }}>
      Could not load this authorization request:{" "}
      {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauth();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "10vh auto",
        padding: 32,
        borderRadius: 16,
        background: "var(--ph-surface-1, #fff)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        fontFamily: "inherit",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Connect {clientName} to Palmer House OS
      </h1>
      <p style={{ marginTop: 8, color: "var(--ph-text-secondary, #666)", fontSize: 14 }}>
        This will let {clientName} access your Palmer House Production OS data — scripts and
        checklists — as you. You can revoke access anytime.
      </p>
      {error && (
        <p role="alert" style={{ marginTop: 12, color: "#b00020", fontSize: 13 }}>
          {error}
        </p>
      )}
      <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
        <button
          disabled={busy}
          onClick={() => decide(true)}
          className="ph-btn ph-btn-primary"
          style={{ flex: 1 }}
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          className="ph-btn ph-btn-soft"
          style={{ flex: 1 }}
        >
          Deny
        </button>
      </div>
    </main>
  );
}