import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const PLATFORM_ENUM = z.enum(["Instagram Reels", "YouTube Shorts", "TikTok"]);
type RepurposePlatform = z.infer<typeof PLATFORM_ENUM>;
const DEFAULT_PLATFORMS: RepurposePlatform[] = ["Instagram Reels", "YouTube Shorts", "TikTok"];

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

const LooseAiShortSchema = z.object({
  platform: z.string().optional(),
  hook: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  durationSec: z.union([z.number(), z.string()]).optional(),
}).passthrough();

const LooseAiOutputSchema = z.object({
  shorts: z.array(LooseAiShortSchema).optional(),
}).passthrough();

type ShortResult = z.infer<typeof ShortSchema>;

function expandToThree(platforms: RepurposePlatform[]): RepurposePlatform[] {
  const safe = platforms.length > 0 ? platforms : DEFAULT_PLATFORMS;
  return [safe[0], safe[1 % safe.length], safe[2 % safe.length]];
}

function extractJsonValue(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI returned text instead of JSON");
  }
}

function normalizePlatform(value: unknown, fallback: RepurposePlatform): RepurposePlatform {
  if (typeof value !== "string") return fallback;
  const lower = value.toLowerCase();
  if (lower.includes("youtube") || lower.includes("short")) return "YouTube Shorts";
  if (lower.includes("tiktok") || lower.includes("tik tok")) return "TikTok";
  if (lower.includes("instagram") || lower.includes("reel")) return "Instagram Reels";
  return fallback;
}

function clampDuration(value: unknown, index: number): number {
  const fallback = [30, 45, 60][index % 3];
  const raw = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number.parseInt(value.match(/\d+/)?.[0] ?? "", 10)
      : Number.NaN;
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(90, Math.max(15, Math.round(raw)));
}

function cleanText(value: unknown, fallback: string, max: number, min: number): string {
  const cleaned = typeof value === "string" ? value.trim() : "";
  const next = cleaned.length >= min ? cleaned : fallback;
  return next.slice(0, max).trim();
}

function fallbackShort(data: z.infer<typeof InputSchema>, platform: RepurposePlatform, index: number): ShortResult {
  const excerpt = data.scriptBody.replace(/\s+/g, " ").trim().slice(0, 180);
  const hooks = [
    `The overlooked idea inside “${data.scriptTitle}”`,
    "This is the moment the full story starts to click",
    "One detail changes how this whole idea lands",
  ];

  return {
    platform,
    hook: hooks[index % hooks.length].slice(0, 300),
    body: `Pull this thread from the long-form: ${excerpt || data.scriptTitle}. Keep it focused on one concrete idea, then point viewers to the full breakdown for the context they cannot get in a short clip.`,
    cta: "Full breakdown on YouTube — link in bio.",
    durationSec: [30, 45, 60][index % 3],
  };
}

function normalizeShorts(raw: unknown, targetPlatforms: RepurposePlatform[], data: z.infer<typeof InputSchema>): ShortResult[] {
  const parsed = LooseAiOutputSchema.safeParse(raw);
  const rawShorts = Array.isArray(raw)
    ? raw
    : parsed.success
      ? parsed.data.shorts ?? []
      : [];

  const shorts = targetPlatforms.map((platform, index) => {
    const rawShort = LooseAiShortSchema.safeParse(rawShorts[index]).success
      ? LooseAiShortSchema.parse(rawShorts[index])
      : {};
    const fallback = fallbackShort(data, platform, index);

    return ShortSchema.parse({
      platform: normalizePlatform(rawShort.platform, platform),
      hook: cleanText(rawShort.hook, fallback.hook, 300, 5),
      body: cleanText(rawShort.body, fallback.body, 1200, 20),
      cta: cleanText(rawShort.cta, fallback.cta, 300, 5),
      durationSec: clampDuration(rawShort.durationSec, index),
    });
  });

  return OutputSchema.parse({ shorts }).shorts;
}

export const generateShorts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const platforms = data.platforms ?? DEFAULT_PLATFORMS;
    const targetPlatforms = expandToThree(platforms);
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
      "Return raw JSON only. No markdown, no commentary.",
    ].join("\n");

    const prompt = [
      `Long-form script #${data.scriptNum}: ${data.scriptTitle}`,
      "",
      "--- FULL SCRIPT ---",
      data.scriptBody,
      "--- END SCRIPT ---",
      "",
      `Produce exactly 3 shorts in this platform order: ${targetPlatforms.join(", ")}.`,
      "Each must tease a DIFFERENT specific idea from the long-form (do not repeat the same hook three ways).",
      "Each CTA must reference the long-form: 'Full breakdown on YouTube — link in bio' or similar.",
      "Return this exact JSON object shape:",
      '{"shorts":[{"platform":"Instagram Reels","hook":"...","body":"...","cta":"...","durationSec":45}]}',
    ].join("\n");

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
    });

    return { shorts: normalizeShorts(extractJsonValue(text), targetPlatforms, data) };
  });