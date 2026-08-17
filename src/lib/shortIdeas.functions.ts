import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const VENTURE_ENUM = z.enum(["jevoy", "palmer-house", "mindyourbizniz"]);
type Venture = z.infer<typeof VENTURE_ENUM>;

const InputSchema = z.object({
  scriptNum: z.string().min(1).max(4),
  scriptTitle: z.string().min(1).max(300),
  scriptBody: z.string().min(1).max(40_000),
  venture: VENTURE_ENUM,
});

export type ShortIdea = {
  title: string;
  hookFamily: string;
  prop: string;
  firstFrameText: string;
  premise: string;
  hook: string;
  beats: string[];
  script: string;
  tieBack: string;
  cta: string;
  durationSec: number;
};

// Reference standard — the Founder's Freeze shorts Jevoy approved.
const EXEMPLARS = `
EXEMPLAR A — "White Coat Hypertension" | Hook family: Medical phenomenon | Prop: blood-pressure cuff | First-frame text: "Being measured changes the measurement."
Real documented phenomenon told plainly → named → then hard-cut analogy: "Now replace the blood-pressure cuff with a camera lens." → the viewer's symptom reframed as physical, not character flaw → one line pointing at the long-form.

EXEMPLAR B — "The Chair" | Hook family: Physical attention demonstration | Prop: two chairs | First-frame text: "This is what hitting record does."
A staged physical action carries the whole argument: sits facing an empty chair, then turns it around. "You're not bad on camera. Your audience just left the room."

EXEMPLAR C — "The Camera with Eyebrows" | Hook family: Absurd visual comedy | Prop: oversized eyebrows on the lens | First-frame text: "I fixed this camera's biggest design flaw."
Deadpan absurd build → the joke IS the thesis → prop removed at the end → real answer stated.

EXEMPLAR D — "The Two Contractors" | Hook family: Lost-opportunity story | Prop: direct-to-lens, minimal
Two identical operators, one visible → a specific human moment (11 PM, water on the floor) → one hard stat → cost line: "The freeze that keeps you off camera? It sends invoices."
`.trim();

const CRAFT_RULES = [
  "Match the reference standard above in craft, not in topic.",
  "Each of the 3 ideas MUST use a DIFFERENT hook family (e.g. documented phenomenon, physical demonstration, absurd visual comedy, lost-opportunity story, live test, object autopsy, before/after build).",
  "Every idea needs a first-frame on-screen text line — short, declarative, under 8 words, no hashtags or emoji.",
  "Write the actual spoken script (110-180 words) in Jevoy's voice: short sentences, plain words, one idea per line, hard-cut turn in the middle, cold ending. Include bracketed [STAGE DIRECTIONS] where the prop moves.",
  "No 'in this video', no 'let me explain', no listicles, no hype adjectives, no 'imagine if'.",
  "Any statistic or phenomenon must be real and specific; if unsure, use a concrete observed scenario instead of a fake number.",
  "The turn should reframe a felt symptom as a mechanism — never scold the viewer.",
  "End with one flat line that points at the long-form. Never 'link in bio' hype.",
].join("\n");

const VENTURE_BRIEF: Record<Venture, string> = {
  jevoy: [
    "Venture: JEVOY PALMER (jevoypalmer.com) — investigative, cinematic, curiosity-first.",
    "Voice: Johnny Harris energy. Wonder, real research, plain language, self-aware humor.",
    "Props should feel like an experiment or exhibit: a physical demo the viewer can't look away from.",
    "CTA: comment / watch the full investigation. Never salesy.",
  ].join(" "),
  "palmer-house": [
    "Venture: PALMER HOUSE PRODUCTIONS — business translation for founders and teams in the Pacific Northwest.",
    "Voice: confident operator. Names the business cost, then the fix. No hype.",
    "Props should be studio/production objects or office props that make a business problem visible.",
    "CTA: book a call / see the full breakdown.",
  ].join(" "),
  mindyourbizniz: [
    "Venture: MINDYOURBIZNIZ (the podcast) — intimate, honest monologue about the emotional side of building.",
    "Voice: kitchen-table, vulnerable, funny, no guru posture.",
    "Props should be everyday personal objects used as metaphor — coffee cup, phone, old notebook.",
    "CTA: full episode / tell me your version in the comments.",
  ].join(" "),
};

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned text instead of JSON");
  }
}

function str(value: unknown, fallback: string, max = 400): string {
  const v = typeof value === "string" ? value.trim() : "";
  return (v || fallback).slice(0, max);
}

function normalize(raw: unknown, title: string): ShortIdea[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { ideas?: unknown })?.ideas)
      ? ((raw as { ideas: unknown[] }).ideas)
      : [];

  return [0, 1, 2].map((i) => {
    const item = (list[i] ?? {}) as Record<string, unknown>;
    const beats = Array.isArray(item.beats)
      ? item.beats.filter((b): b is string => typeof b === "string").map((b) => b.trim().slice(0, 300)).slice(0, 6)
      : [];
    const dur = typeof item.durationSec === "number" ? item.durationSec : 45;
    return {
      title: str(item.title, `Idea ${i + 1} — ${title}`, 140),
      hookFamily: str(item.hookFamily, "Physical demonstration", 80),
      prop: str(item.prop, "A single physical object on the table", 140),
      firstFrameText: str(item.firstFrameText, "Watch this.", 90),
      premise: str(item.premise, "One idea from the long-form, shown instead of explained.", 600),
      hook: str(item.hook, "Watch what happens when I do this.", 300),
      beats: beats.length > 0 ? beats : ["Open on the prop.", "Do the thing.", "Land the point.", "Point to the long-form."],
      script: str(item.script, "", 4000),
      tieBack: str(item.tieBack, `Ties back to “${title}”.`, 400),
      cta: str(item.cta, "Full breakdown — link in bio.", 200),
      durationSec: Math.min(90, Math.max(15, Math.round(dur))),
    };
  });
}

export const generateShortIdeas = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const system = [
      "You are the Shorts Concept Lab inside the Palmer House Productions ecosystem.",
      "Job: from ONE long-form script, invent EXACTLY 3 wildly DIFFERENT short-form concepts that promote it.",
      "Every concept MUST be built around a physical PROP used to tell the story visually — the prop does the explaining.",
      "Each concept must be fun and shootable in one location with one camera.",
      "Each must clearly tie back to the long-form's central idea and funnel viewers to it.",
      "",
      "REFERENCE STANDARD (approved work — study the structure):",
      EXEMPLARS,
      "",
      "CRAFT RULES:",
      CRAFT_RULES,
      "",
      VENTURE_BRIEF[data.venture],
      "Return raw JSON only. No markdown, no commentary.",
    ].join("\n");

    const prompt = [
      `Long-form script #${data.scriptNum}: ${data.scriptTitle}`,
      "",
      "--- FULL SCRIPT ---",
      data.scriptBody.slice(0, 24_000),
      "--- END SCRIPT ---",
      "",
      "Return this exact JSON shape (3 items, all fields required):",
      '{"ideas":[{"title":"short punchy concept name","hookFamily":"e.g. Medical phenomenon","prop":"the physical prop(s)","firstFrameText":"on-screen text in frame one","premise":"what happens on camera, 1-2 sentences","hook":"first spoken line, under 7 seconds","beats":["beat 1","beat 2","beat 3","beat 4"],"script":"the full spoken script with [STAGE DIRECTIONS], 110-180 words","tieBack":"how it connects back to the long-form idea","cta":"closing line pointing at the long-form","durationSec":45}]}',
    ].join("\n");

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
    });

    try {
      return { ideas: normalize(extractJson(text), data.scriptTitle) };
    } catch (error) {
      console.error("[shortIdeas] parse failed", error);
      return { ideas: normalize(null, data.scriptTitle) };
    }
  });
