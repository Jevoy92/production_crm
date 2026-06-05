/**
 * Map AI-generated post ideas → CRM ContentItems so monthly plans land in the
 * Content Library + Schedule calendar and sync across the shared login.
 *
 * Pure functions — safe on client and server.
 */

import type { ContentItem, ContentType, PalLane, Platform } from "@/lib/ccStore";
import { getVentureProfile, type VentureId } from "@/lib/ventures/profiles";
import type { PostIdea } from "@/lib/contentEngine.functions";

/** Generated platform string → CRM Platform. */
export function toCRMPlatform(raw: string): Platform {
  const p = raw.toLowerCase();
  if (p.includes("short")) return "YouTube Shorts";
  if (p.includes("youtube")) return "YouTube";
  if (p.includes("instagram") && p.includes("reel")) return "Instagram Reels";
  if (p.includes("instagram")) return "Instagram";
  if (p.includes("tiktok")) return "TikTok";
  if (p.includes("linkedin")) return "LinkedIn";
  if (p.includes("website")) return "Website";
  if (p.includes("newsletter") || p.includes("email")) return "Newsletter";
  if (p.includes("podcast") || p.includes("spotify") || p.includes("apple")) return "Podcast";
  if (p.includes("yourboy")) return "YourBoyJevoy";
  return "YouTube";
}

/** Generated contentType → CRM ContentType. */
export function toCRMContentType(raw: string): ContentType {
  switch (raw.toLowerCase()) {
    case "short": return "Short";
    case "carousel": return "Carousel";
    case "article": return "Article";
    case "podcast": return "Podcast";
    case "photo": return "Photo";
    case "video": return "Video";
    default: return "Video";
  }
}

/**
 * Resolve a PAL lane for the item. Palmer House pillars carry an explicit palLane;
 * other ventures map by pillar/content shape, defaulting to Spotlight.
 */
export function resolvePalLane(ventureId: VentureId, pillarId: string, contentType: string): PalLane {
  const v = getVentureProfile(ventureId);
  const pillar = v.contentPillars.find((p) => p.id === pillarId);
  if (pillar?.palLane) return pillar.palLane;
  const ct = contentType.toLowerCase();
  if (ct === "short" || /reel|shorts/.test(pillarId)) return "Reel";
  if (/system|sop|train/.test(pillarId)) return "System";
  if (/evergreen|investigation|long/.test(pillarId)) return "Evergreen";
  return "Spotlight";
}

/** Build a YYYY-MM-DD publish date from year/month/day-of-month. */
export function toPublishDate(year: number, month: number, dayOfMonth: number): string {
  const d = Math.min(28, Math.max(1, dayOfMonth));
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Convert one generated idea into a draft ContentItem (sans id). */
export function postIdeaToContentItem(
  ventureId: VentureId,
  year: number,
  month: number,
  idea: PostIdea,
): Omit<ContentItem, "id"> {
  const v = getVentureProfile(ventureId);
  return {
    title: idea.title,
    type: toCRMContentType(idea.contentType),
    platform: toCRMPlatform(idea.platform),
    status: "Idea",
    palLane: resolvePalLane(ventureId, idea.pillarId, idea.contentType),
    businessPurpose: "",
    cta: idea.ctaLabel || v.defaultCTA.label,
    fileLocation: "",
    editorNotes: "",
    caption: idea.caption,
    thumbnailIdea: "",
    repurposingStatus: "",
    performanceNotes: "",
    publishDate: toPublishDate(year, month, idea.dayOfMonth),
    publishStatus: "Draft",
    venture: ventureId,
    aiGenerated: true,
    hook: idea.hook,
  };
}
