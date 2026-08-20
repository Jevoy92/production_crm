import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { GOLD_STANDARD_SHORTS, GOLD_STANDARD_LESSONS, FIVE_MOVES } from "@/content/shorts/goldStandard";

const VENTURE_ENUM = z.enum(["jevoy", "palmer-house", "mindyourbizniz"]);
type Venture = z.infer<typeof VENTURE_ENUM>;

const InputSchema = z.object({
  scriptNum: z.string().min(1).max(4),
  scriptTitle: z.string().min(1).max(300),
  scriptBody: z.string().min(1).max(40_000),
  venture: VENTURE_ENUM,
  /** Props/titles already used by the current saved set — a regenerate must avoid them. */
  avoid: z.array(z.string().max(300)).max(12).optional(),
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
Every approved short runs the SAME five moves. Use them every time.

1. THE FIRST LINE (0-3s): One flat sentence that makes sense with the sound off and with
   no backstory. It is also the on-screen first-frame text. It is also the LAST line of the
   short. ("Somewhere in your business is a folder full of proof that marketing happened.")

2. THE PROP IN HIS HANDS (3-15s): One small object he is already holding — a folder, a
   lavalier mic, an index card, three name tags, a cardboard slot. He OPERATES it: opens
   it, reads it, feeds it, takes it off. The prop can do the joke without him. No set
   builds, no rentals, no clones, no second human, no kiosk screens.

3. THE COMPRESSION BEAT (15-25s): One line in the form "Then X. Now Y." — the long real
   thing, then the small flat thing that replaced it. ("Then the whole shoot. Now this
   folder." / "Then ten or twenty years of judgment. Now one clean paragraph.")

4. ONE THOUGHT, CARRIED (25-45s): He follows a single idea start to finish in plain,
   short sentences, played straight and dry. It ends in a structural reframe, never a
   scolding: "That is not a production failure. Nobody picked the wrong shots. Somebody
   skipped a decision, and the camera cannot make it for you."

5. THE FLAT CLOSE (45-60s): "Click the link. Come explore this with me." plus one line
   naming what the long-form is about. Then the first line returns verbatim as the final
   line. No hype, no sign-off, no "link in bio".
`.trim();

// Failure modes seen in rejected AI drafts. These are the reasons suggestions feel generic.
const BANNED = `
AUTO-FAIL — if a draft does ANY of these, throw it out and rebuild it:
- The prop needs a set build, a rental, a location, clones, a second human, a kiosk, or an
  offscreen voice. It must be a small object in his hands, shot handheld in one room.
- The prop is a metaphor he holds up and describes ("this hourglass represents attention").
  The prop must DO the joke; he only operates it.
- No "Then X. Now Y." compression beat, or more than one of them.
- The first line does not survive the sound being off, or it does not return as the last line.
- More than one idea in the short.
- Punchline delivery, mugging, winking, exclamation energy. Everything is played straight.
- Moralizing at the founder or the crew. The reframe is structural: a decision was skipped.
- Content-marketing platitudes (post more, be consistent, attention is currency, algorithms).
- Vague nouns as the payoff: "content", "brand", "value", "engagement", "audience".
- Any close other than "Click the link. Come explore this with me." + one line + first line back.
- Three ideas that are variations of one another. They must differ in PROP and in the
  moment they are about, not just in wording.
`.trim();

const CRAFT_RULES = [
  "Match the GOLD STANDARD in craft, not in topic. It is the bar.",
  "Jevoy is the ONLY actor, handheld, one room, one small prop already in his hands.",
  "Write the first line so it works as silent on-screen text; repeat it verbatim as the last line.",
  "Exactly one 'Then X. Now Y.' compression beat per short.",
  "Play every stunt straight — dry, unbothered, no punchline delivery.",
  "One thought, start to finish. The reframe is structural, never moral.",
  "Use concrete specifics ('Funny thing about that job, actually…'), never categories.",
  "Each of the 3 ideas MUST use a DIFFERENT prop and a DIFFERENT moment in the process.",
  "Write the actual spoken script (110-180 words) in Jevoy's voice: short sentences, plain words, one idea per line, [STAGE DIRECTIONS] in caps where the prop moves.",
  "Any statistic or phenomenon must be real and specific; if unsure, use a concrete observed scenario instead of a fake number.",
  "Close with 'Click the link. Come explore this with me.' plus one line naming the long-form's subject, then the first line again.",
  "",
  FIVE_MOVES,
  "",
  "HARD LESSONS (from rejected drafts — do not repeat these mistakes):",
  GOLD_STANDARD_LESSONS,
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
    "Props should be small studio/office objects he can hold: a folder, a lavalier mic, an index card, name tags.",
    "CTA: Click the link. Come explore this with me. + one line naming what the long-form is about.",
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
      prop: str(item.prop, "A single small object in his hands", 140),
      firstFrameText: str(item.firstFrameText, "", 90),
      premise: str(item.premise, "One idea from the long-form, shown instead of explained.", 600),
      hook: str(item.hook, "Watch what happens when I do this.", 300),
      beats: beats.length > 0 ? beats : ["Open on the prop.", "Do the thing.", "Land the point.", "Point to the long-form."],
      script: str(item.script, "", 4000),
      tieBack: str(item.tieBack, `Ties back to “${title}”.`, 400),
      cta: str(item.cta, "Click the link. Come explore this with me.", 200),
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
      "Job: from ONE long-form script, invent EXACTLY 3 DIFFERENT short-form concepts that promote it.",
      "Every concept is Jevoy alone, handheld, in one room, holding ONE small everyday prop that does the joke for him.",
      "No set builds, no rentals, no clones, no second human, no kiosk screens, no locations.",
      "Each must carry ONE thought from the long-form, start to finish, and funnel viewers to it.",
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
      "The three concepts must use three different hand-props and cover three different moments in the process.",
      ...(data.avoid?.length
        ? [
            "",
            "THIS IS A REGENERATION. The following props/angles were already used and are now BANNED —",
            "do not reuse them, and do not use a near-synonym of them. Find genuinely new props and new moments:",
            ...data.avoid.slice(0, 12).map((a) => `  - ${a}`),
          ]
        : []),
      "Write each script the way the gold standard is written: the first line alone, [STAGE DIRECTIONS] in caps",
      "where the prop moves, plain short spoken sentences, exactly one 'Then X. Now Y.' compression beat,",
      "the structural reframe, then the close — 'Click the link. Come explore this with me.' plus one line",
      "naming what the long-form is about — and finally the first line again, word for word.",
      "",
      "Return this exact JSON shape (3 items, all fields required):",
      '{"ideas":[{"title":"short punchy concept name","hookFamily":"the moment it is about, e.g. After the interview","prop":"the small hand-prop","firstFrameText":"the first line, same words as the hook","premise":"what happens on camera, 1-2 sentences","hook":"first spoken line — works with the sound off","beats":["beat 1","beat 2","beat 3","beat 4"],"script":"the full spoken script with [STAGE DIRECTIONS], 110-180 words, ending with the first line repeated","tieBack":"the Then X. Now Y. compression beat","cta":"Click the link. Come explore this with me. <one line naming the long-form subject>","durationSec":50}]}',
      "",
      `Session: ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)} — treat this as a fresh take, not a repeat of any earlier set.`,
    ].join("\n");

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
      temperature: data.avoid?.length ? 1 : 0.85,
    });

    // Second pass: score the draft against the gold standard and rebuild anything weak.
    let finalText = text;
    try {
      const critique = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: [
          "You are Jevoy Palmer reviewing shorts concepts before a shoot day. You are hard to please.",
          "",
          "GOLD STANDARD (the only acceptable bar):",
          GOLD_STANDARD_SHORTS,
          "",
          "ANATOMY:",
          ANATOMY,
          "",
          BANNED,
          "",
          "Return raw JSON only. No markdown, no commentary.",
        ].join("\n"),
        prompt: [
          `Long-form: #${data.scriptNum} ${data.scriptTitle}`,
          "",
          "DRAFT CONCEPTS:",
          text.slice(0, 20_000),
          "",
          "For EACH of the 3 concepts, silently score: (a) is the prop a small object he can hold,",
          "shootable handheld in one room with no build, rental, clone or second person, (b) does the",
          "first line work with the sound off and no backstory, (c) does that exact line return as the",
          "last line, (d) is there exactly one 'Then X. Now Y.' compression beat, (e) is it one thought",
          "start to finish, played straight, (f) is the reframe structural rather than moralizing,",
          "(g) does it close with 'Click the link. Come explore this with me.' plus one line naming the",
          "long-form, (h) is it different in prop AND moment from the other two, (i) does it break any",
          "AUTO-FAIL rule.",
          "Rewrite every concept that fails anything — rebuild it from the five moves, do not patch it.",
          "Keep what already clears the bar. Do not soften the writing.",
          "",
          "Return the improved final set in this exact JSON shape (3 items, all fields required):",
          '{"ideas":[{"title":"","hookFamily":"","prop":"","firstFrameText":"","premise":"","hook":"","beats":["","","",""],"script":"full spoken script with [STAGE DIRECTIONS], 110-180 words, ending with the first line repeated","tieBack":"","cta":"","durationSec":50}]}',
        ].join("\n"),
      });
      // Only accept the revision if it parses into usable ideas.
      const parsed = extractJson(critique.text);
      const list = (parsed as { ideas?: unknown[] })?.ideas;
      if (Array.isArray(list) && list.length >= 3) finalText = critique.text;
    } catch (error) {
      console.error("[shortIdeas] critique pass skipped", error);
    }

    try {
      return { ideas: normalize(extractJson(finalText), data.scriptTitle) };
    } catch (error) {
      console.error("[shortIdeas] parse failed", error);
      return { ideas: normalize(null, data.scriptTitle) };
    }
  });
