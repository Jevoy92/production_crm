import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function ymdET() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function extractPalmerInsights(md: string): string | null {
  const m = md.match(/<!--\s*palmer-insights:start\s*-->([\s\S]*?)<!--\s*palmer-insights:end\s*-->/);
  if (!m) return null;
  const body = m[1].trim();
  return body.length ? body : null;
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