import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

/**
 * Daily 7am AM digest generator.
 * Triggered by pg_cron at 11:00 UTC (7am ET while EDT) → POST /api/public/hooks/morning-digest
 * Body: { date?: "YYYY-MM-DD" } — defaults to today (America/New_York).
 *
 * Pulls:
 *   • Yesterday's Limitless pendant transcripts
 *   • Yesterday's completed checklist items
 *   • Yesterday's overview log entries
 *   • Yesterday's important Gmail (inbox, unread/important, last 24h)
 * Generates today's plan via Lovable AI, upserts into morning_digests.
 */

const TZ = "America/New_York";

function ymdInTZ(d: Date, tz = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}
function shiftDays(ymd: string, days: number) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymdInTZ(d, "UTC");
}

async function fetchLimitless(date: string) {
  const key = process.env.LIMITLESS_API_KEY;
  if (!key) return { error: "no LIMITLESS_API_KEY", lifelogs: [] };
  const url = new URL("https://api.limitless.ai/v1/lifelogs");
  url.searchParams.set("date", date);
  url.searchParams.set("timezone", TZ);
  url.searchParams.set("limit", "20");
  url.searchParams.set("includeMarkdown", "true");
  url.searchParams.set("direction", "asc");
  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": key, Accept: "application/json" },
  });
  if (!res.ok) return { error: `Limitless ${res.status}`, lifelogs: [] };
  const json = (await res.json()) as {
    data?: { lifelogs?: Array<{ title?: string; startTime?: string; markdown?: string }> };
  };
  return {
    lifelogs: (json.data?.lifelogs ?? []).map((l) => ({
      title: l.title,
      startTime: l.startTime,
      markdown: l.markdown?.slice(0, 3000) ?? "",
    })),
  };
}

async function fetchGmailYesterday() {
  const lovKey = process.env.LOVABLE_API_KEY;
  const gmailKey = process.env.GOOGLE_MAIL_API_KEY;
  if (!lovKey || !gmailKey) return { error: "no Gmail connector", messages: [] as Array<{ from: string; subject: string; snippet: string; date: string }> };
  const base = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
  const headers = {
    Authorization: `Bearer ${lovKey}`,
    "X-Connection-Api-Key": gmailKey,
    Accept: "application/json",
  };
  // Important or primary-inbox messages from the last day
  const q = encodeURIComponent("newer_than:1d (is:important OR is:starred OR category:primary) -category:promotions -category:social");
  const listRes = await fetch(`${base}/users/me/messages?maxResults=15&q=${q}`, { headers });
  if (!listRes.ok) return { error: `Gmail list ${listRes.status}`, messages: [] };
  const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
  const ids = (list.messages ?? []).slice(0, 15).map((m) => m.id);
  const messages: Array<{ from: string; subject: string; snippet: string; date: string }> = [];
  for (const id of ids) {
    const r = await fetch(`${base}/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers });
    if (!r.ok) continue;
    const m = (await r.json()) as {
      snippet?: string;
      payload?: { headers?: Array<{ name: string; value: string }> };
    };
    const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value ?? "";
    messages.push({
      from: h("From"),
      subject: h("Subject"),
      date: h("Date"),
      snippet: (m.snippet ?? "").slice(0, 400),
    });
  }
  return { messages };
}

export const Route = createFileRoute("/api/public/hooks/morning-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { date?: string } = {};
        try {
          body = (await request.json()) as { date?: string };
        } catch {
          // empty body is fine
        }

        const today = body.date ?? ymdInTZ(new Date());
        const yesterday = shiftDays(today, -1);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const LOVABLE_KEY = process.env.LOVABLE_API_KEY;
        if (!SUPABASE_URL || !SERVICE_KEY || !LOVABLE_KEY) {
          return new Response(JSON.stringify({ error: "missing env" }), { status: 500 });
        }

        const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1) Limitless transcripts from yesterday
        const lim = await fetchLimitless(yesterday);

        // 2) Yesterday's completed checklist items + open ones
        const yStart = `${yesterday}T00:00:00`;
        const yEnd = `${today}T00:00:00`;
        const { data: completedYesterday } = await admin
          .from("checklist_items")
          .select("text,section,tab,updated_at,done")
          .gte("updated_at", yStart)
          .lt("updated_at", yEnd)
          .eq("done", true)
          .limit(80);

        const { data: openItems } = await admin
          .from("checklist_items")
          .select("text,section,tab")
          .eq("done", false)
          .order("sort_order", { ascending: true })
          .limit(80);

        // 3) Recent overview log
        const { data: ovYesterday } = await admin
          .from("overview_logs")
          .select("date,picks,customs,notes")
          .eq("date", yesterday)
          .maybeSingle();

        // 4) Compose the prompt
        const sections: string[] = [];
        sections.push(`# Inputs for ${today} (yesterday: ${yesterday})`);

        sections.push("\n## Limitless pendant transcripts (yesterday)");
        if (lim.lifelogs.length === 0) {
          sections.push(`(none${lim.error ? ` — ${lim.error}` : ""})`);
        } else {
          for (const l of lim.lifelogs) {
            sections.push(`### ${l.startTime ?? "?"} — ${l.title ?? "(untitled)"}\n${l.markdown}`);
          }
        }

        sections.push("\n## Tasks completed yesterday");
        if (!completedYesterday?.length) sections.push("(none logged)");
        else for (const t of completedYesterday) sections.push(`- [${t.tab}/${t.section ?? "-"}] ${t.text}`);

        sections.push("\n## Open tasks (top 80)");
        if (!openItems?.length) sections.push("(none)");
        else for (const t of openItems) sections.push(`- [${t.tab}/${t.section ?? "-"}] ${t.text}`);

        if (ovYesterday) {
          sections.push("\n## Overview log (yesterday)");
          sections.push(`Notes: ${ovYesterday.notes || "(empty)"}`);
          if (Array.isArray(ovYesterday.picks) && ovYesterday.picks.length)
            sections.push(`Picks: ${JSON.stringify(ovYesterday.picks)}`);
          if (Array.isArray(ovYesterday.customs) && ovYesterday.customs.length)
            sections.push(`Customs: ${JSON.stringify(ovYesterday.customs)}`);
        }

        const gateway = createLovableAiGatewayProvider(LOVABLE_KEY);
        const sys = [
          "You are Pals — Jevoy & Shannen's production operating-system AI.",
          "Generate Jevoy's MORNING DIGEST for today in tight markdown. Sections, in order:",
          "1. **Yesterday in one paragraph** — synthesize what actually happened (from pendant + completed tasks).",
          "2. **Threads to close** — explicit next actions for open commitments mentioned yesterday.",
          "3. **Today's plan** — a numbered, prioritized list of 5–8 concrete actions for today, written in Jevoy's voice (direct, action-first).",
          "4. **Watch-outs** — 1–3 risks, conflicts, or follow-ups that could slip.",
          "Be specific. No filler, no preamble, no 'Good morning'. Use names and numbers from the inputs.",
        ].join("\n");

        let digestMd = "";
        try {
          const res = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            system: sys,
            prompt: sections.join("\n"),
          });
          digestMd = res.text;
        } catch (err) {
          digestMd = `_Auto-digest failed: ${String(err)}_`;
        }

        const { error: upErr } = await admin
          .from("morning_digests")
          .upsert(
            {
              date: today,
              body_md: digestMd,
              source: {
                limitless_count: lim.lifelogs.length,
                limitless_error: lim.error ?? null,
                completed_count: completedYesterday?.length ?? 0,
                open_count: openItems?.length ?? 0,
                generated_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "date" },
          );

        if (upErr) {
          return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });
        }

        return new Response(
          JSON.stringify({ ok: true, date: today, length: digestMd.length }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});