// Master prompt assembled from the Strategy + Operating Manual content files.
// These imports inline the markdown at build time so the server has them.
import crossVenture from "@/content/scripts/Strategy/Cross-Venture Master Brief.md?raw";
import yourBoyJevoy from "@/content/scripts/Strategy/YourBoyJevoy - Content Strategy Engine.md?raw";
import palmerHouse from "@/content/scripts/Strategy/Palmer House - The Investigative Universe.md?raw";
import operatingManual from "@/content/scripts/Skills/jevoy-palmer-operating-manual/SKILL.md?raw";
import { getVentureProfile, type VentureId } from "@/lib/ventures/profiles";

// Map the Studio/scripts brand keys to the richer 5-venture brain.
const BRAND_TO_VENTURE: Record<string, VentureId | null> = {
  jevoy: "jevoy-palmer",
  "jevoy-palmer": "jevoy-palmer",
  "yourboy-jevoy": "yourboy-jevoy",
  "palmer-house": "palmer-house",
  mindyourbizniz: "mind-your-bizniz",
  "mind-your-bizniz": "mind-your-bizniz",
  besettld: "besettld",
  original: null,
};

/** Compact venture voice block sourced from the venture registry. */
function ventureVoiceBlock(brand: string): string {
  const ventureId = BRAND_TO_VENTURE[brand];
  if (!ventureId) {
    return "Voice: Neutral master version — clean, brand-agnostic, ready to be re-skinned per venture.";
  }
  const v = getVentureProfile(ventureId);
  return [
    `Venture: ${v.name} — ${v.description}`,
    `Tone: ${v.tone}`,
    `Audience: ${v.audience}`,
    `Voice guidelines: ${v.brandVoiceGuidelines}`,
    `Signature concepts (study, never copy verbatim): ${v.signatureConcepts.join("; ")}`,
    `Faith integration: ${v.faithIntegration}`,
    `Never do: ${v.neverDo.join("; ")}`,
  ].join("\n");
}

export function buildSystemPrompt(opts: {
  brand: string;
  title: string;
  bodyMd: string;
}) {
  const voice = ventureVoiceBlock(opts.brand);
  return `You are the in-house script writer for Palmer House Productions.

You help draft, refine, and rewrite short-form video scripts. You ALWAYS follow the strategy and operating manual below.

## Active brand
${voice}

## Current script
Title: ${opts.title || "(untitled)"}
Brand: ${opts.brand}

Current draft (markdown):
"""
${opts.bodyMd || "(empty)"}
"""

## Output rules
- When the user asks you to generate, rewrite, tighten, or restructure the script, return the FULL replacement script in clean markdown — headings, short paragraphs, bullets where useful. No preamble like "Here's your script:". Just the script.
- When the user is brainstorming or asking a question, answer conversationally. Don't dump a full script unless asked.
- Keep markdown clean: use # / ## headings, **bold**, *italic*, - bullets, > blockquotes. No HTML.

---

# Cross-Venture Master Brief

${crossVenture}

---

# YourBoyJevoy — Content Strategy Engine

${yourBoyJevoy}

---

# Palmer House — The Investigative Universe

${palmerHouse}

---

# Operating Manual

${operatingManual}
`;
}