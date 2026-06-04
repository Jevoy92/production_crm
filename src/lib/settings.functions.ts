import { createServerFn } from "@tanstack/react-start";

export const getConnectionsStatus = createServerFn({ method: "GET" }).handler(async () => {
  const has = (k: string) => Boolean(process.env[k] && String(process.env[k]).length > 0);
  return {
    limitless: { connected: has("LIMITLESS_API_KEY"), label: "Limitless pendant" },
    gmail: { connected: has("GOOGLE_MAIL_API_KEY"), label: "Gmail (Jevoy)" },
    calendar: { connected: has("GOOGLE_CALENDAR_API_KEY"), label: "Google Calendar (Jevoy)" },
    lovableAi: { connected: has("LOVABLE_API_KEY"), label: "Lovable AI Gateway" },
    supabase: { connected: has("SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY"), label: "Backend (database & auth)" },
  };
});

export const runMorningDigestNow = createServerFn({ method: "POST" }).handler(async () => {
  // Calls the public hook so we reuse the exact same code path the 7am cron uses.
  const base = process.env.SITE_URL || "https://project--27304dab-73aa-43fc-a2f0-0454c62ae55f.lovable.app";
  const res = await fetch(`${base}/api/public/hooks/morning-digest`, { method: "POST" });
  const text = await res.text();
  if (!res.ok) throw new Error(`Digest failed (${res.status}): ${text.slice(0, 200)}`);
  return { ok: true, status: res.status, body: text.slice(0, 500) };
});