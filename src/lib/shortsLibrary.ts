import { supabase } from "@/integrations/supabase/client";
import type { ShortIdea } from "@/lib/shortIdeas.functions";
import type { ScriptVersion } from "@/lib/scriptsIndex";

export type ShortsGeneration = {
  id: string;
  script_num: string;
  script_title: string;
  venture: ScriptVersion;
  ideas: ShortIdea[];
  is_current: boolean;
  starred: boolean;
  note: string | null;
  created_at: string;
};

const TABLE = "shorts_generations";

function row(r: Record<string, unknown>): ShortsGeneration {
  return {
    ...(r as unknown as ShortsGeneration),
    ideas: Array.isArray(r.ideas) ? (r.ideas as ShortIdea[]) : [],
  };
}

/** Every generation ever made, newest first. */
export async function listGenerations(): Promise<ShortsGeneration[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((d) => row(d as Record<string, unknown>));
}

/** Current (active) generation per script+venture. */
export async function listCurrent(): Promise<ShortsGeneration[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_current", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => row(d as Record<string, unknown>));
}

export function key(scriptNum: string, venture: string) {
  return `${scriptNum}::${venture}`;
}

export async function saveGeneration(input: {
  scriptNum: string;
  scriptTitle: string;
  venture: ScriptVersion;
  ideas: ShortIdea[];
}): Promise<ShortsGeneration | null> {
  // Demote previous current version for this script+venture.
  await supabase
    .from(TABLE)
    .update({ is_current: false })
    .eq("script_num", input.scriptNum)
    .eq("venture", input.venture)
    .eq("is_current", true);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      script_num: input.scriptNum,
      script_title: input.scriptTitle,
      venture: input.venture,
      ideas: input.ideas as unknown as never,
      is_current: true,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[shortsLibrary] save failed", error);
    return null;
  }
  return row(data as Record<string, unknown>);
}

/** Make a historical generation the current one again. */
export async function restoreGeneration(gen: ShortsGeneration): Promise<void> {
  await supabase
    .from(TABLE)
    .update({ is_current: false })
    .eq("script_num", gen.script_num)
    .eq("venture", gen.venture)
    .eq("is_current", true);
  const { error } = await supabase.from(TABLE).update({ is_current: true }).eq("id", gen.id);
  if (error) throw error;
}

export async function toggleStar(id: string, starred: boolean): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ starred }).eq("id", id);
  if (error) throw error;
}

export async function deleteGeneration(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export function ideasToText(gen: ShortsGeneration): string {
  const lines: string[] = [
    `# Shorts — ${gen.script_num} · ${gen.script_title} (${gen.venture})`,
    `Generated ${new Date(gen.created_at).toLocaleString()}`,
    "",
  ];
  gen.ideas.forEach((idea, i) => {
    lines.push(
      `## ${i + 1}. ${idea.title}`,
      `Hook family: ${idea.hookFamily} · ${idea.durationSec}s`,
      `Prop: ${idea.prop}`,
      `First frame: "${idea.firstFrameText}"`,
      `Premise: ${idea.premise}`,
      `Hook: "${idea.hook}"`,
      "",
      "Beats:",
      ...idea.beats.map((b, bi) => `${bi + 1}. ${b}`),
      "",
      "Script:",
      idea.script,
      "",
      `Tie-back: ${idea.tieBack}`,
      `CTA: ${idea.cta}`,
      "",
    );
  });
  return lines.join("\n");
}
