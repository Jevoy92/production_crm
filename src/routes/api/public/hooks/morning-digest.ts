import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import palmerSkillMd from "@/content/scripts/Skills/jevoy-palmer-operating-manual/references/palmer-script-writer.md?raw";
import blueprintMd from "@/content/scripts/Strategy/00 - Script Blueprint - Award-Winning Rules.md?raw";
import monthPlanMd from "@/content/scripts/Strategy/21 — Month Plan — Wonder-Keyed + Mirror With Memory Reels.md?raw";

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
 *   • Today's Google Calendar events (primary calendar)
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

async function fetchTodayCalendar(today: string) {
  const lovKey = process.env.LOVABLE_API_KEY;
  const calKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!lovKey || !calKey) return { error: "no Calendar connector", events: [] as Array<{ summary: string; start: string; end: string; location: string; attendees: number }> };
  // Build a UTC window covering "today" in ET (handles DST safely with a wide range).
  const startIso = new Date(`${today}T00:00:00-05:00`).toISOString();
  const endIso = new Date(`${today}T23:59:59-04:00`).toISOString();
  const url = new URL("https://connector-gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", startIso);
  url.searchParams.set("timeMax", endIso);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "25");
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${lovKey}`,
      "X-Connection-Api-Key": calKey,
      Accept: "application/json",
    },
  });
  if (!res.ok) return { error: `Calendar ${res.status}`, events: [] };
  const json = (await res.json()) as {
    items?: Array<{
      summary?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: Array<unknown>;
      status?: string;
    }>;
  };
  const events = (json.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => ({
      summary: e.summary ?? "(no title)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      location: e.location ?? "",
      attendees: e.attendees?.length ?? 0,
    }));
  return { events };
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

        // 1b) Important Gmail from the last 24h
        const gmail = await fetchGmailYesterday();

        // 1c) Today's calendar
        const cal = await fetchTodayCalendar(today);

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

        sections.push("\n## Important emails (last 24h)");
        if (!gmail.messages.length) {
          sections.push(`(none${gmail.error ? ` — ${gmail.error}` : ""})`);
        } else {
          for (const m of gmail.messages) {
            sections.push(`- **${m.subject || "(no subject)"}** — ${m.from}\n  ${m.snippet}`);
          }
        }

        sections.push("\n## Today's calendar");
        if (!cal.events.length) {
          sections.push(`(nothing scheduled${cal.error ? ` — ${cal.error}` : ""})`);
        } else {
          for (const e of cal.events) {
            const loc = e.location ? ` @ ${e.location}` : "";
            const att = e.attendees ? ` · ${e.attendees} attendees` : "";
            sections.push(`- ${e.start} → ${e.end} — **${e.summary}**${loc}${att}`);
          }
        }

        const gateway = createLovableAiGatewayProvider(LOVABLE_KEY);
        const sys = [
          "You are Pals — Jevoy & Shannen's production operating-system AI.",
          "Generate Jevoy's MORNING DIGEST for today in tight markdown. Sections, in order:",
          "1. **Yesterday in one paragraph** — synthesize what actually happened (from pendant, completed tasks, and inbox).",
          "2. **Threads to close** — explicit next actions for open commitments mentioned yesterday or sitting in the inbox.",
          "3. **Today's plan** — a numbered, prioritized list of 5–8 concrete actions for today, written in Jevoy's voice (direct, action-first). Slot work AROUND today's calendar events; call out conflicts.",
          "4. **Watch-outs** — 1–3 risks, conflicts, or follow-ups that could slip.",
          "5. **Script ideas (Palmer ventures)** — 2–4 concrete script/title/concept suggestions for Jevoy Palmer, Palmer House, or MindYourBizniz. Pull from yesterday's pendant transcripts, today's news/email themes, and the Month Plan attached below. Each idea must include: venture, working title (Johnny Harris / Veritasium / Leila Hormozi packaging), the felt-moment hook, and the verified mechanism/study it would rest on. Obey the Palmer Script Writer skill rules — Twelve Laws, Altitude Rule, launch-stage honesty, no fabricated anecdotes, no soft numbers.",
          "6. **Palmer House Daily Insights** — a dedicated Palmer-House-only section derived STRICTLY from yesterday's Limitless pendant transcripts. Pull anything relevant to Palmer House Productions: explicit mentions of Palmer House / PH / clients, plus production, sales, ops, hiring, finance, or business decisions. Use your judgment on borderline material. Format: 3–6 tight bullets (names, numbers, decisions, next step). If nothing qualifies, emit exactly this single line: `_No Palmer House activity captured yesterday._` — no other text in that section. Wrap ONLY this section's bullets/line between the exact HTML comment markers `<!-- palmer-insights:start -->` and `<!-- palmer-insights:end -->` on their own lines, immediately after the section heading.",
          "Be specific. No filler, no preamble, no 'Good morning'. Use names and numbers from the inputs.",
          "",
          "--- PALMER SCRIPT WRITER SKILL (authoritative) ---",
          palmerSkillMd,
          "",
          "--- SCRIPT BLUEPRINT (Twelve Laws) ---",
          blueprintMd,
          "",
          "--- CURRENT MONTH PLAN (ideas already banked / in flight) ---",
          monthPlanMd,
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
                gmail_count: gmail.messages.length,
                gmail_error: gmail.error ?? null,
                calendar_count: cal.events.length,
                calendar_error: cal.error ?? null,
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