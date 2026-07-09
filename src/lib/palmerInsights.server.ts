import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { generateText } from "ai";

const TZ = "America/New_York";

function ymdInTZ(d: Date, tz = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}
function shift(ymd: string, days: number) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymdInTZ(d, "UTC");
}

async function fetchLimitless(date: string) {
  const key = process.env.LIMITLESS_API_KEY;
  if (!key) return { lifelogs: [] as Array<{ title?: string; startTime?: string; markdown: string }>, error: "no LIMITLESS_API_KEY" as string | null };
  const url = new URL("https://api.limitless.ai/v1/lifelogs");
  url.searchParams.set("date", date);
  url.searchParams.set("timezone", TZ);
  url.searchParams.set("limit", "20");
  url.searchParams.set("includeMarkdown", "true");
  url.searchParams.set("direction", "asc");
  const res = await fetch(url.toString(), { headers: { "X-API-Key": key, Accept: "application/json" } });
  if (!res.ok) return { lifelogs: [], error: `Limitless ${res.status}` };
  const json = (await res.json()) as { data?: { lifelogs?: Array<{ title?: string; startTime?: string; markdown?: string }> } };
  return {
    lifelogs: (json.data?.lifelogs ?? []).map((l) => ({
      title: l.title,
      startTime: l.startTime,
      markdown: (l.markdown ?? "").slice(0, 4000),
    })),
    error: null as string | null,
  };
}

export async function generatePalmerInsightsForToday(): Promise<string> {
  const LOVABLE_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_KEY) throw new Error("missing LOVABLE_API_KEY");

  const today = ymdInTZ(new Date());
  const yesterday = shift(today, -1);

  const lim = await fetchLimitless(yesterday);
  if (!lim.lifelogs.length) {
    return `_No Limitless entries found for ${yesterday}${lim.error ? ` — ${lim.error}` : ""}._`;
  }

  const transcript = lim.lifelogs
    .map((l) => `### ${l.startTime ?? "?"} — ${l.title ?? "(untitled)"}\n${l.markdown}`)
    .join("\n\n");

  const gateway = createLovableAiGatewayProvider(LOVABLE_KEY);
  const sys = [
    "You are Pals, extracting Palmer House Productions insights from Jevoy's Limitless pendant transcripts.",
    "Scope (be generous): explicit Palmer House / PH / client mentions, plus production, sales, ops, hiring, finance, brand positioning, pricing, networking, and any business decisions that touch the videography/production business.",
    "Output format (markdown only, no preamble):",
    "- 4–8 tight bullets. Lead with the concrete thing (name, number, decision), then a short 'Next step:' clause where obvious.",
    "- Group under short bold sub-labels if it helps (e.g. **Positioning**, **Pipeline**, **Ops**). Otherwise a flat bullet list.",
    "- No filler, no 'Good morning', no restating the prompt. If truly nothing qualifies, emit exactly: `_No Palmer House activity captured yesterday._`",
  ].join("\n");

  const res = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    system: sys,
    prompt: `Yesterday (${yesterday}) Limitless transcripts:\n\n${transcript}`,
  });
  return res.text.trim() || "_No Palmer House activity captured yesterday._";
}