// The Pals "brain": the permanent craft + strategy knowledge of the studio.
// Markdown is inlined at build time so the server always ships with it.
import crossVenture from "@/content/scripts/Strategy/Cross-Venture Master Brief.md?raw";
import strategyEngine from "@/content/scripts/Strategy/YourBoyJevoy - Content Strategy Engine.md?raw";
import investigative from "@/content/scripts/Strategy/Palmer House - The Investigative Universe.md?raw";
import blueprint from "@/content/scripts/Strategy/00 - Script Blueprint - Award-Winning Rules.md?raw";
import operatingManual from "@/content/scripts/Skills/jevoy-palmer-operating-manual/SKILL.md?raw";
import { GOLD_STANDARD_SHORTS, GOLD_STANDARD_LESSONS, FIVE_MOVES } from "@/content/shorts/goldStandard";

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)}\n…(truncated)` : s);

/**
 * Everything Pals needs to write in-house: strategy, venture voices, script
 * blueprint, the approved shorts gold standard and the five moves.
 */
export const PALS_BRAIN = [
  "===== STUDIO BRAIN — permanent knowledge. Write inside this doctrine, never against it. =====",
  "",
  "# Cross-Venture Master Brief",
  clip(crossVenture, 8_000),
  "",
  "# Content Strategy Engine (YourBoyJevoy)",
  clip(strategyEngine, 14_000),
  "",
  "# Palmer House — The Investigative Universe",
  clip(investigative, 14_000),
  "",
  "# Script Blueprint — Award-Winning Rules",
  clip(blueprint, 6_000),
  "",
  "# Operating Manual",
  clip(operatingManual, 7_000),
  "",
  "# Approved shorts — the gold standard (match this bar in craft, not topic)",
  clip(GOLD_STANDARD_SHORTS, 9_000),
  "",
  "# The five moves every short runs",
  FIVE_MOVES,
  "",
  "# Hard lessons from rejected drafts",
  Array.isArray(GOLD_STANDARD_LESSONS) ? GOLD_STANDARD_LESSONS.join("\n") : String(GOLD_STANDARD_LESSONS),
  "",
  "===== END STUDIO BRAIN =====",
].join("\n");

export type PalsLesson = { lesson: string; topic: string | null; created_at: string };

/** Trained-in notes the operators have taught Pals over time. */
export async function loadPalsLessons(): Promise<PalsLesson[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pals_lessons")
      .select("lesson, topic, created_at")
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw error;
    return (data ?? []) as PalsLesson[];
  } catch (err) {
    console.error("[pals] lessons load failed", err);
    return [];
  }
}

export async function savePalsLesson(lesson: string, topic?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pals_lessons")
      .insert({ lesson: lesson.slice(0, 1200), topic: topic?.slice(0, 80) ?? null });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function lessonsBlock(lessons: PalsLesson[]): string {
  if (!lessons.length) {
    return [
      "",
      "--- TRAINED NOTES ---",
      "(nothing yet — when Jevoy or Shannen corrects you, teaches you a rule, or approves a style, call rememberLesson so it sticks.)",
      "--- END TRAINED NOTES ---",
    ].join("\n");
  }
  return [
    "",
    `--- TRAINED NOTES (${lessons.length}) — these override generic instincts, newest first ---`,
    ...lessons.map((l) => `  • ${l.topic ? `[${l.topic}] ` : ""}${l.lesson}`),
    "--- END TRAINED NOTES ---",
  ].join("\n");
}
