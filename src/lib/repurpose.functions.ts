import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const PLATFORM_ENUM = z.enum(["Instagram Reels", "YouTube Shorts", "TikTok"]);

const InputSchema = z.object({
  scriptNum: z.string().min(1).max(3),
  scriptTitle: z.string().min(1).max(300),
  scriptBody: z.string().min(1).max(40_000),
  platforms: z.array(PLATFORM_ENUM).min(1).max(3).optional(),
});

const ShortSchema = z.object({
  platform: PLATFORM_ENUM,
  hook: z.string().min(5).max(300),
  body: z.string().min(20).max(1200),
  cta: z.string().min(5).max(300),
  durationSec: z.number().int().min(15).max(90),
});

const OutputSchema = z.object({
  shorts: z.array(ShortSchema).length(3),
});

export const generateShorts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const platforms = data.platforms ?? ["Instagram Reels", "YouTube Shorts", "TikTok"];
    const gateway = createLovableAiGatewayProvider(key);

    const system = [
      "You are the Repurposing Engine for Palmer House Productions.",
      "Job: take ONE long-form video script and return EXACTLY 3 supporting short-form scripts.",
      "Each short is a teaser — it isolates ONE specific idea from the long-form and funnels viewers to watch the full long-form.",
      "Hard rules:",
      "  • Hook is read in 7 seconds or less, no preamble.",
      "  • Body is one tight idea, spoken plainly. No filler. No 'in this video'.",
      "  • CTA explicitly drives viewers to the long-form (link in bio, full breakdown on YouTube, etc.).",
      "  • Voice: confident, plain-spoken, no hype.",
      "  • Tailor cadence to the platform: Reels punchy, Shorts curiosity-led, TikTok conversational.",
      "Return strictly the JSON shape requested.",
    ].join("\n");

    const prompt = [
      `Long-form script #${data.scriptNum}: ${data.scriptTitle}`,
      "",
      "--- FULL SCRIPT ---",
      data.scriptBody,
      "--- END SCRIPT ---",
      "",
      `Produce one short for each of these platforms, in order: ${platforms.join(", ")}.`,
      "Each must tease a DIFFERENT specific idea from the long-form (do not repeat the same hook three ways).",
      "Each CTA must reference the long-form: 'Full breakdown on YouTube — link in bio' or similar.",
    ].join("\n");

    const { object: result } = await generateObject({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
      schema: OutputSchema,
    });

    // Ensure platform order matches request (model sometimes shuffles)
    const byPlatform = new Map(result.shorts.map((s) => [s.platform, s]));
    const ordered = platforms.map((p) => byPlatform.get(p)).filter(Boolean) as typeof result.shorts;
    return { shorts: ordered.length === 3 ? ordered : result.shorts };
  });