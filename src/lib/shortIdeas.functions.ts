import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { GOLD_STANDARD_SHORTS, GOLD_STANDARD_LESSONS } from "@/content/shorts/goldStandard";

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

// The anatomy every approved short shares, reverse-engineered from the gold standard.
const ANATOMY = `
Every approved short is built from the SAME five-part machine. Use it every time.

1. THE WORLD (0-3s): We open INSIDE an absurd-but-instantly-legible situation, not on a
   talking head. A lost-and-found counter for customer memory. A police lineup of brands.
   A set that vanishes word by word. The viewer must understand where they are with no
   explanation. First-frame text states the premise flatly ("My customers lost my business.").

2. THE VISUAL RULE (3-20s): ONE rule governs the world, and it escalates EXACTLY three
   times. One drawer opens -> a bigger drawer opens -> every drawer opens at once. One
   phrase deletes the logo -> the next deletes the desk -> the next deletes the room.
   The rule is the argument. Never stack unrelated gags.

3. THE STALL (20-30s): The escalation traps Jevoy. He is asked the one question he cannot
   answer, or he sees the size of the problem. He reacts as a human, briefly and dryly
   ("Okay, that somehow made it worse." / "That is the problem, isn't it?").

4. THE TURN, DISCOVERED (30-45s): He steps out and names the mechanism in plain language —
   about 45-60 words, short sentences, no jargon, no scolding. The proof arrives as a
   physical DISCOVERY, not a claim: a receipt prints, a light turns green, the set
   reappears. Somewhere in here sits the KEEPER LINE the whole short was built to earn
   ("That is worse than lost. Lost means it was there.").

5. THE FLAT CLOSE (45-60s): One specific, concrete counter-example that shows what right
   looks like (water on the basement floor at 2 a.m.; a chipped tooth on a playground),
   then one short instruction. Then an END CARD naming the long-form. No hype, no
   "link in bio" energy, no sign-off.
`.trim();

// Failure modes seen in rejected AI drafts. These are the reasons suggestions feel generic.
const BANNED = `
AUTO-FAIL — if a draft does ANY of these, throw it out and rebuild it:
- Opens with Jevoy talking to camera explaining an idea. The world comes first, always.
- The prop is a metaphor he holds up and describes ("this hourglass represents attention").
  In an approved short the prop OPERATES ON HIM; he reacts to it.
- The visual rule escalates fewer or more than three times, or there are two rules.
- The point is a content-marketing platitude (post more, be consistent, attention is
  currency, algorithms changed, volume vs quality). Approved shorts land a point about
  what a customer can remember and act on.
- Anything the viewer must be told to feel. No "imagine if", "here's the thing",
  "let me explain", "in this video", "the truth is", rhetorical-question openers.
- Vague nouns: "content", "brand", "value", "engagement", "audience" used as the payoff.
  The payoff must be a sentence a real business could actually say out loud.
- A second human character. Only: a kiosk/screen, an offscreen voice Jevoy plays, or clones.
- More than one location, or anything unshootable solo with locked-off cuts.
- Three ideas that are variations of one another. They must differ in WORLD and in
  mechanism, not just in prop.
`.trim();

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
      "GOLD STANDARD (approved, shot-ready work — match this bar):",
      GOLD_STANDARD_SHORTS,
      "",
      "ANATOMY OF AN APPROVED SHORT (follow this structure every time):",
      ANATOMY,
      "",
      BANNED,
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
