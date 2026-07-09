import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function ymdET() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function shiftDays(ymd: string, days: number) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(d);
}

function extractPalmerInsights(md: string): string | null {
  const m = md.match(/<!--\s*palmer-insights:start\s*-->([\s\S]*?)<!--\s*palmer-insights:end\s*-->/);
  if (m) {
    const body = m[1].trim();
    if (body.length) return body;
  }
  // Fallback: parse a "Palmer House" section header from the digest body.
  const h = md.match(/(?:^|\n)#{0,6}\s*\**\s*(?:6\.\s*)?Palmer\s+House[^\n]*\n([\s\S]*?)(?=\n#{1,6}\s|\n\*\*[A-Z][^\n]*\*\*\s*\n|$)/i);
  if (h) {
    const body = h[1].trim();
    if (body.length) return body;
  }
  return null;
}

export const getTodayDigest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const date = ymdET();
    const { data, error } = await context.supabase
      .from("morning_digests")
      .select("date, body_md, updated_at")
      .eq("date", date)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { date, generated: false as const, palmerInsights: null, updatedAt: null };
    return {
      date: data.date as string,
      generated: true as const,
      palmerInsights: extractPalmerInsights(data.body_md ?? ""),
      updatedAt: (data.updated_at ?? null) as string | null,
    };
  });

export const regeneratePalmerInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { generatePalmerInsightsForToday } = await import("./palmerInsights.server");
    const insights = await generatePalmerInsightsForToday();

    const date = ymdET();
    const { data: row } = await context.supabase
      .from("morning_digests")
      .select("body_md")
      .eq("date", date)
      .maybeSingle();

    const existing = row?.body_md ?? "";
    const block = `\n\n<!-- palmer-insights:start -->\n${insights}\n<!-- palmer-insights:end -->\n`;
    const stripped = existing.replace(/\n*<!--\s*palmer-insights:start\s*-->[\s\S]*?<!--\s*palmer-insights:end\s*-->\n*/g, "\n");
    const nextBody = (stripped.trimEnd() + block).trim();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("morning_digests")
      .upsert({ date, body_md: nextBody, updated_at: new Date().toISOString() }, { onConflict: "date" });
    if (upErr) throw new Error(upErr.message);

    return { date, palmerInsights: insights };
  });

export { shiftDays };