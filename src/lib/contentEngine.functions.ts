/**
 * Content Engine — server functions for per-venture AI generation.
 *
 * Ported from the Manus content engine onto the CRM's existing Lovable AI gateway
 * (same pattern as src/lib/repurpose.functions.ts: generateText + Output.object).
 *
 *  - generateMonthPlan: a month of dated post ideas for one venture (the headline feature)
 *  - generateFullScript: expand a single post idea into a full, venture-voiced deliverable
 *
 * These RETURN structured data; the client writes the results into the content store
 * (ccStore) so they land in the Library + Schedule and sync across the shared login.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { VENTURE_IDS, getVentureProfile } from "@/lib/ventures/profiles";
import {
  buildMonthPlanPrompt,
  getVentureSystemPrompt,
} from "@/lib/ventures/prompts";

const MODEL = process.env.CONTENT_ENGINE_MODEL || "google/gemini-3-flash-preview";

const VentureEnum = z.enum(VENTURE_IDS as [string, ...string[]]);
const ContentTypeEnum = z.enum(["video", "short", "carousel", "photo", "article", "podcast"]);

// ── Monthly plan ────────────────────────────────────────────────────────────

const PostIdeaSchema = z.object({
  title: z.string().min(3).max(160),
  platform: z.string().min(2).max(40),
  contentType: ContentTypeEnum,
  pillarId: z.string().min(1).max(40),
  dayOfMonth: z.number().int().min(1).max(28),
  postTime: z.string().min(2).max(16).default("9:00 AM"),
  caption: z.string().min(5).max(1200),
  hook: z.string().min(3).max(400).default(""),
  ctaLabel: z.string().min(2).max(120),
});
export type PostIdea = z.infer<typeof PostIdeaSchema>;

const MonthPlanOutput = z.object({
  posts: z.array(PostIdeaSchema).min(1).max(40),
});

const MonthPlanInput = z.object({
  ventureId: VentureEnum,
  year: z.number().int().min(2024).max(2100),
  month: z.number().int().min(1).max(12),
  postCount: z.number().int().min(1).max(40).default(12),
  focusAreas: z.array(z.string().max(120)).max(8).optional(),
  notes: z.string().max(2000).optional(),
});

export const generateMonthPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MonthPlanInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY — set it to enable AI generation.");

    const monthName = new Date(data.year, data.month - 1, 1).toLocaleString("en-US", {
      month: "long",
    });
    const prompt = buildMonthPlanPrompt({
      ventureId: data.ventureId as never,
      monthName,
      year: data.year,
      postCount: data.postCount,
      focusAreas: data.focusAreas,
      notes: data.notes,
    });

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway(MODEL),
      system: `You are a meticulous, brand-native content strategist. Return exactly ${data.postCount} post ideas in the requested JSON shape. Every idea must obey the venture's voice and the load-bearing rules.`,
      prompt,
      output: Output.object({ schema: MonthPlanOutput }),
    });

    const v = getVentureProfile(data.ventureId as never);
    const validPillars = new Set(v.contentPillars.map((p) => p.id));
    // Defensive cleanup: clamp days, default pillar, trim overflow to requested count.
    const posts = output.posts
      .slice(0, data.postCount)
      .map((p) => ({
        ...p,
        dayOfMonth: Math.min(28, Math.max(1, p.dayOfMonth)),
        pillarId: validPillars.has(p.pillarId) ? p.pillarId : v.contentPillars[0]?.id ?? "",
        ctaLabel: p.ctaLabel || v.defaultCTA.label,
      }));

    return { ventureId: data.ventureId, monthName, year: data.year, postCount: posts.length, posts };
  });

// ── Full-script expansion ───────────────────────────────────────────────────

const FullScriptInput = z.object({
  ventureId: VentureEnum,
  title: z.string().min(2).max(200),
  platform: z.string().min(2).max(40).default("YouTube"),
  contentType: z.string().min(2).max(40).default("video"),
  pillarId: z.string().max(40).optional(),
  caption: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const generateFullScript = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FullScriptInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY — set it to enable AI generation.");

    const system = getVentureSystemPrompt(
      data.ventureId as never,
      data.platform,
      data.pillarId,
      data.contentType,
    );

    const prompt = [
      `Write the full deliverable for this ${data.platform} ${data.contentType}.`,
      `Working title: ${data.title}`,
      data.caption ? `Teaser/angle: ${data.caption}` : "",
      data.notes ? `Extra direction: ${data.notes}` : "",
      "",
      "Return clean markdown only — the deliverable itself, no preamble.",
    ]
      .filter(Boolean)
      .join("\n");

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway(MODEL),
      system,
      prompt,
    });

    return { script: text.trim() };
  });
