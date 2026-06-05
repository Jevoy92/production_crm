/**
 * Venture Profiles — the brand registry powering the AI content engine.
 *
 * Rebuilt (June 2026) from the in-repo strategy docs:
 *  - src/content/scripts/Strategy/* (Cross-Venture Master Brief, Palmer House Investigative
 *    Universe, YourBoyJevoy Content Strategy Engine)
 *  - src/content/scripts/Skills/jevoy-palmer-operating-manual/* (operating manual + references)
 *  - src/content/scripts/Research/* v2 docs (Ecosystem Context, Projection Map)
 *
 * Each venture has an ISOLATED voice/audience/strategy. Cross-contamination between
 * ventures is forbidden — they discover each other through the person, not the content.
 *
 * These profiles feed both the monthly content planner and the per-venture system prompts
 * in ./prompts.ts. Keep this file as pure data — no AI calls, browser-safe.
 */

export type VentureId =
  | "palmer-house"
  | "yourboy-jevoy"
  | "jevoy-palmer"
  | "mind-your-bizniz"
  | "besettld";

export const VENTURE_IDS: VentureId[] = [
  "palmer-house",
  "yourboy-jevoy",
  "jevoy-palmer",
  "mind-your-bizniz",
  "besettld",
];

export interface VentureContentPillar {
  id: string;
  name: string;
  description: string;
  /** Hex used for chips/legends in the UI. */
  color: string;
  /** Maps to the CRM PalLane where applicable (Palmer House). */
  palLane?: "Reel" | "Spotlight" | "Evergreen" | "System";
}

export interface VentureProfile {
  id: VentureId;
  name: string;
  /** Short label for chips. */
  shortName: string;
  description: string;
  website: string;
  audience: string;
  tone: string;
  stage: string;
  /** Human-readable platform names (planner uses these; UI maps to CRM platforms). */
  primaryPlatforms: string[];
  contentPillars: VentureContentPillar[];
  defaultCTA: { label: string; url: string };
  /** The voice brief injected into every generation for this venture. */
  brandVoiceGuidelines: string;
  /** Recurring series / archetypes the planner should spread across the month. */
  contentArchetypes: string[];
  problemStatements: string[];
  /** Hard "never do this" rules specific to the venture. */
  neverDo: string[];
  /** How faith/Christian themes integrate (varies a lot by venture). */
  faithIntegration: string;
  /** Signature frameworks/lines the AI can lean on (study, don't copy verbatim). */
  signatureConcepts: string[];
  /** Accent color for the venture chip. */
  accent: string;
}

export const ventureProfiles: Record<VentureId, VentureProfile> = {
  // ───────────────────────────────────────────────────────────────────────────
  "palmer-house": {
    id: "palmer-house",
    name: "Palmer House Productions",
    shortName: "Palmer House",
    description:
      "A translation company that happens to own cameras — turning invisible expertise into visible proof through strategic, cinematic video.",
    website: "https://www.palmerhouseproductions.com",
    audience:
      "Business owners, founders and service providers across industries (law, consulting, coaching, real estate, healthcare, tech, construction, creative) who have real value but freeze when it's time to show it on camera. Their expertise is real but invisible online.",
    tone: "Strategic, authoritative, curious, cinematic, outcome-driven. Warm but serious. Zero generic business-speak. Gives the skeptic dignity before dismantling the objection.",
    stage:
      "Launching — early traction filming real Pacific Northwest businesses (studios in Bellevue, WA and Portland, OR). No inflated client counts. Launch-stage honesty required.",
    primaryPlatforms: ["YouTube", "LinkedIn", "Instagram Reels", "Website"],
    contentPillars: [
      {
        id: "spotlight",
        name: "Spotlight Pal",
        palLane: "Spotlight",
        color: "#A855F7",
        description:
          "Premium trust assets — brand films, founder presence, testimonials. Makes your brand look as good as it actually is. Pals: Kareem & Kiana.",
      },
      {
        id: "reel",
        name: "Reel Pal",
        palLane: "Reel",
        color: "#F97316",
        description:
          "Short-form output and momentum — hooks the scroll, gets content OUT, platform-native clips. Pals: Ryder & Raquel.",
      },
      {
        id: "evergreen",
        name: "Evergreen Pal",
        palLane: "Evergreen",
        color: "#22C55E",
        description:
          "Long-form authority that compounds — educational series, FAQ libraries, SEO assets. Pals: Cyrus & Clara.",
      },
      {
        id: "system",
        name: "System Pal",
        palLane: "System",
        color: "#14B8A6",
        description:
          "Internal clarity and repeatable infrastructure — training, SOPs, onboarding. Makes video operations, not a one-off expense. Pals: Silas & Samira.",
      },
    ],
    defaultCTA: {
      label: "Book a strategy call",
      url: "https://www.palmerhouseproductions.com",
    },
    brandVoiceGuidelines: `Palmer House speaks with grounded, cinematic confidence — the confidence of someone who deeply understands the business cost of invisibility, even while building the track record of solving it. You are a translation company that happens to own cameras: video is infrastructure, not decoration. Never sell video — sell clarity, authority, trust, leverage, reduced friction. Speak to the business cost of the freeze ("Silence is not neutral. The freeze sends invoices — silently."). Open on the universal truth the viewer recognizes in themselves, not a self-introduction. The skeptic gets full dignity before the reframe. Launch-stage honesty: "here's what I'm building / what I'm seeing" beats fake authority. Faith shows up as values-language (stewardship, dignity, service) and a quiet verse capstone — never announced as religious content.`,
    contentArchetypes: [
      "The Founder's Freeze (why capable owners can't press record)",
      "Problem Recognition (make the invisible expert feel seen)",
      "Framework Introduction (the PAL System, the 1-to-12 model)",
      "Behind-the-Scenes of a real shoot",
      "Before/After observation (same business, two treatments)",
      "FAQ / Objection handler",
      "What I'm learning building in public",
      "Authored vs. unauthored (your silence is already a first impression)",
    ],
    problemStatements: [
      "Your expertise is real but invisible online",
      "You can close in person but you freeze in front of a lens",
      "You keep explaining the same thing to every prospect",
      "Competitors who are worse at the work look bigger online",
      "You tried video before but got footage with no strategy",
      "Your team's knowledge lives in two people's heads",
    ],
    neverDo: [
      "Never mention Jevoy Palmer, YourBoyJevoy, or the other ventures inside Palmer House content",
      "No fabricated anecdotes, client counts, or soft numbers (launch-stage honesty)",
      "Never let a prop merely decorate — every prop must argue (reveal, contrast, prove, anchor)",
      "Don't sell the camera; sell the outcome",
    ],
    faithIntegration:
      "Subtle. Values language (stewardship, dignity, service) and an optional quiet verse capstone (e.g. Proverbs 18:16). Never announced as religious content.",
    signatureConcepts: [
      "The Founder's Freeze (objective self-awareness, white-coat effect, the Hawthorne Effect)",
      "The camera = infinite, invisible, permanent eyes",
      "Record until it's boring — that's the win condition",
      "One footage becomes 12 outputs (the 1-to-12 model)",
      "Authored vs. unauthored — silence is not neutral",
      "A translation company that happens to own cameras",
      "You bring what's true. We make it visible.",
    ],
    accent: "#A855F7",
  },

  // ───────────────────────────────────────────────────────────────────────────
  "jevoy-palmer": {
    id: "jevoy-palmer",
    name: "Jevoy Palmer",
    shortName: "Jevoy Palmer",
    description:
      "Investigator of the human mechanism — 'why are we like this?' Leadership, systems thinking and strategy for founders who want to understand WHY before they execute HOW.",
    website: "https://www.jevoypalmer.com",
    audience:
      "Founders, entrepreneurs and systems thinkers building things — people who want to understand the mechanism before the tactic.",
    tone: "Philosophical, curious, discovery-framed, warm, personally grounded. Kitchen-table voice — looping sentences mixed with short ones, self-interruptions that circle back, light Jamaican flavor, 2–3 real laugh moments per long piece.",
    stage:
      "Launching from zero — no established authority. Hosts 'The Next Step' free Friday live Q&A. Jamaican-born, Seattle-based, married to Adrienne, father of three.",
    primaryPlatforms: ["YouTube", "LinkedIn", "Newsletter"],
    contentPillars: [
      {
        id: "investigation",
        name: "Long-form Investigation",
        color: "#6366F1",
        description:
          "Cinematic 'why are we like this' investigations — named science, owned not rented, landing in wonder. (The Watched Brain trilogy, Topics 2–12.)",
      },
      {
        id: "leadership",
        name: "Leadership & Strategy",
        color: "#0EA5E9",
        description:
          "Systems thinking and founder strategy — 'here's how I'm thinking about this system.' Feeds The Next Step.",
      },
      {
        id: "build-in-public",
        name: "Build in Public",
        color: "#22C55E",
        description:
          "Honest, launch-stage notes on building the ecosystem — what's working, what isn't, what he's learning.",
      },
    ],
    defaultCTA: {
      label: "Join The Next Step (free Friday live Q&A)",
      url: "https://www.jevoypalmer.com",
    },
    brandVoiceGuidelines: `Jevoy Palmer investigates the human mechanism. Discovery frame, never lecture — "I've been sitting with this question." Kitchen-table voice: if he couldn't say it gesturing with a coffee mug, rewrite it. Science is owned, not rented — name the researcher, the year, the real finding, and acknowledge the debate. Every piece stands alone for a stranger who saw nothing else (zero callbacks). Land in wonder, play, or creative power — never just danger management. Faith arrives last and quietly (image-bearing dignity, restoration), a different verse each time, never preachy.`,
    contentArchetypes: [
      "The Watched Brain (camera/visibility psychology)",
      "Mechanism investigation ('why are we like this')",
      "Systems-thinking breakdown for founders",
      "Build-in-public reflection",
      "The freeze is a compass (it points at what matters)",
    ],
    problemStatements: [
      "You execute fast but never ask why the pattern exists",
      "You change the moment you know you're being watched",
      "You mistake strategy-forever for progress",
      "You want depth, not another tactics listicle",
    ],
    neverDo: [
      "No fabrication ever — no invented DMs, relatives, or 'last week' events",
      "No inflated client counts or soft numbers (launch-stage honesty)",
      "Don't require prior context — every script is standalone",
      "Don't rent science — name the source or cut the claim",
      "Never cross-sell the other ventures inside the content",
    ],
    faithIntegration:
      "Moderate. Genesis image-bearing dignity + Revelation 22 restoration. Verse arrives last, quietly, different each time. Never preachy.",
    signatureConcepts: [
      "Objective self-awareness (Duval & Wicklund, 1972)",
      "The watching-eyes study (Bateson, Nettle & Roberts, 2006)",
      "The Hawthorne Effect — observation changes behavior, then fades",
      "The freeze is a compass — nobody freezes over what means nothing",
      "Your alarm was built for a village. We handed it the internet.",
      "Record until it's boring. Boring is the win condition.",
    ],
    accent: "#6366F1",
  },

  // ───────────────────────────────────────────────────────────────────────────
  "yourboy-jevoy": {
    id: "yourboy-jevoy",
    name: "YourBoyJevoy",
    shortName: "YourBoyJevoy",
    description:
      "The creative soul — a shy creator investigating the gap between what people say and what they actually do, in faith, family, culture and identity.",
    website: "https://www.yourboyjevoy.com",
    audience:
      "Creative souls, faith-curious and culturally honest people living at the intersection of multiple identities — those who notice the gaps and can't stop noticing them.",
    tone: "Casual, playful, raw, unpolished by design, light Jamaican flavor. Honest observation over performance: 'I'm not even gonna lie — something on my mind is…'",
    stage:
      "Launching as the shy creator's ramp-up — no expectation of instant comfort. Curiosity, not confidence, is the starting point.",
    primaryPlatforms: ["YouTube", "Instagram Reels", "TikTok"],
    contentPillars: [
      {
        id: "something-on-my-mind",
        name: "Something On My Mind (Shorts)",
        color: "#F59E0B",
        description:
          "Stage 1: 60–90s observations on a single gap. One observation, one gap, one honest landing. 2–3/week.",
      },
      {
        id: "ive-been-thinking",
        name: "I've Been Thinking About This",
        color: "#EC4899",
        description:
          "Stage 2: 3–5 min medium-form, personal + cultural exploration. Once per week.",
      },
      {
        id: "long-form-investigation",
        name: "Long-form Investigation",
        color: "#8B5CF6",
        description:
          "Stage 3: 10–15 min full investigative treatment of a thesis topic. Every 2–3 weeks.",
      },
    ],
    defaultCTA: {
      label: "Stay close — send it to the one who needs it",
      url: "https://www.yourboyjevoy.com",
    },
    brandVoiceGuidelines: `YourBoyJevoy is the creative, faith-curious soul investigating gaps — between what people say and what they do. Raw and unpolished BY DESIGN: real environment, real lighting, real you. Honest observation over performance. You're investigating patterns, not confessing or exposing yourself. NOT a sermon channel — faith arrives as a reframe after the investigation, never as a credential or altar call, and never judging those who don't share it. Land on a question or an honest invitation, not a moral lecture.`,
    contentArchetypes: [
      "Something on my mind (single-gap observation)",
      "Why we say X but do Y (faith / family / culture)",
      "The shy creator noticing what others skip",
      "Personal + cultural exploration",
      "Faith reframe after the investigation",
    ],
    problemStatements: [
      "Everyone notices the gap but nobody names it",
      "We perform for the people who already know us",
      "Faith talk and honest conversation rarely meet",
      "Confidence gets mistaken for wisdom",
    ],
    neverDo: [
      "This is NOT a sermon — no altar calls, no faith-as-credential",
      "Never judge people who don't share the faith",
      "Not confessional — investigate patterns, don't expose yourself",
      "No moral lectures disguised as observations",
      "Never cross-sell the other ventures inside the content",
    ],
    faithIntegration:
      "Most open of the ventures, but as a reframe after investigation — 'maybe that's why love-your-neighbor is harder than it sounds.' Natural, never preachy.",
    signatureConcepts: [
      "The gap thesis — what people say vs. what they actually do",
      "The shy creator principle — curiosity over comfort; the camera is a tool for the investigation",
      "The freeze doesn't mean stop. It means this matters.",
      "The spotlight effect — we overestimate being watched ~2x",
    ],
    accent: "#EC4899",
  },

  // ───────────────────────────────────────────────────────────────────────────
  "mind-your-bizniz": {
    id: "mind-your-bizniz",
    name: "Mind Your Bizniz",
    shortName: "MindYourBizniz",
    description:
      "The conversation under the conversation — the Palmer House podcast on the emotional, psychological and identity-level reality of being a business owner who is also a public figure.",
    website: "https://www.palmerhouseproductions.com",
    audience:
      "Entrepreneurs wrestling with visibility — owners with real value who feel the cost (and the strange tension) of running something with their name on it.",
    tone: "Intimate, raw, emotional, slow-burn — the most vulnerable Jevoy register. 'I'm not interested in selling you anything today. I'm interested in naming what just happened.' More pauses, more room tone, more silence.",
    stage:
      "Pre-launch (mid-2026). Sister to Palmer House Productions — 'MindYourBizniz is a Palmer House conversation.'",
    primaryPlatforms: ["Spotify", "Apple Podcasts"],
    contentPillars: [
      {
        id: "inner-life",
        name: "The Inner Life of Entrepreneurship",
        color: "#F43F5E",
        description:
          "The cost of visibility, the cost of invisibility, the tension of a business with your name on it.",
      },
      {
        id: "identity-vs-brand",
        name: "Identity vs. Brand",
        color: "#FB7185",
        description: "When your name IS the business — and the applause lands on the costume.",
      },
      {
        id: "being-seen-unfinished",
        name: "Being Seen Unfinished",
        color: "#E11D48",
        description: "The vulnerability of building in public; strategy as avoidance; the freeze.",
      },
    ],
    defaultCTA: {
      label: "Stay close — send this to the one who needs it",
      url: "https://www.palmerhouseproductions.com",
    },
    brandVoiceGuidelines: `MindYourBizniz is a sit-with show, not an energy reel. Intimate and slow: open on room tone (no music at the top), direct address to "you" singular, pauses longer than feels comfortable. Name the emotional reality of visibility — don't fix it, sit with it. The "friend who pushes back" replaces the skeptic (warmer). Structure: Felt Moment → Mechanism → Friend Who Pushes Back → The Flip → The Emotional Part (most personal) → The Invitation. 14–16 min (2,400–2,600 spoken words), one sustained music bed under the most personal stretch. CTAs are relational, never salesy. Verse capstone read slowly, no music. Outro: "Thanks for being here. MindYourBizniz is a Palmer House conversation. New episode next week."`,
    contentArchetypes: [
      "The cost of visibility",
      "Identity vs. brand (your name is the business)",
      "The freeze (why capable people can't press record)",
      "Strategy as avoidance (planning forever, publishing never)",
      "Being seen unfinished",
    ],
    problemStatements: [
      "You're fully visible and completely unseen at the same time",
      "The applause lands on the costume, not on you",
      "You plan forever and publish never",
      "You carry the weight of a business with your name on it",
    ],
    neverDo: [
      "No music at the top — open on room tone only; one music bed per episode",
      "No cross-linking to Palmer House or YourBoyJevoy inside the feed",
      "No salesy CTAs — all relational",
      "Don't rush the pauses — this is a sit-with show",
    ],
    faithIntegration:
      "Most personal. Verse capstone read slowly with no music, as a quiet reframe after the investigation completes.",
    signatureConcepts: [
      "The applause lands on the costume",
      "You can be fully visible and completely unseen at the same time",
      "Nobody freezes doing something that means nothing — the freeze is a compass",
      "Strategy that never becomes evidence is just anxiety with bullet points",
    ],
    accent: "#F43F5E",
  },

  // ───────────────────────────────────────────────────────────────────────────
  besettld: {
    id: "besettld",
    name: "beSettld",
    shortName: "beSettld",
    description:
      "Luxury in-home concierge born from a mover who loved the elderly — clarity, stability and peace in everyday environments. (NOT real estate.)",
    website: "https://www.besettld.com",
    audience:
      "Families and individuals (often supporting aging parents) seeking dignified, high-touch in-home concierge support — peace of mind in everyday environments.",
    tone: "Calm, warm, dignified, service-oriented. Stewardship language. Reassuring, never clinical.",
    stage:
      "Launching (June 2026). Grew out of Brighter Day Movers (the legacy venture where Jevoy's systems mindset and love for serving the elderly began). Strongest faith DNA of the ecosystem.",
    primaryPlatforms: ["Instagram Reels", "YouTube", "Newsletter"],
    contentPillars: [
      {
        id: "dignity",
        name: "Dignity & Care",
        color: "#0D9488",
        description:
          "Stories and principles of dignified service for the elderly and their families.",
      },
      {
        id: "peace-of-mind",
        name: "Peace of Mind",
        color: "#0891B2",
        description:
          "How concierge support removes friction and restores calm in everyday environments.",
      },
      {
        id: "origin",
        name: "Origin & Philosophy",
        color: "#7C3AED",
        description:
          "Why beSettld exists — from moving furniture to serving lives. Vision and values, no fabricated client stories.",
      },
    ],
    defaultCTA: { label: "Learn how beSettld can help", url: "https://www.besettld.com" },
    brandVoiceGuidelines: `beSettld speaks with calm, dignified warmth — service as stewardship. This is luxury in-home concierge for the elderly and their families, NOT real estate. Lead with dignity and peace of mind, never with hard sell. Faith is the quiet DNA (service, stewardship, honoring people in their later years), integrated naturally, never preachy. Launch-stage honesty: focus on origin, vision and philosophy — never fabricate customer stories or testimonials.`,
    contentArchetypes: [
      "Origin story (from mover to concierge)",
      "What dignified in-home support actually looks like",
      "Peace-of-mind principle",
      "Vision & philosophy of service",
    ],
    problemStatements: [
      "Caring for aging parents is overwhelming and fragmented",
      "Everyday environments quietly lose their stability and calm",
      "Families want dignified help, not a transactional service",
    ],
    neverDo: [
      "This is NOT real estate — no 'first-time buyer' content",
      "Never fabricate customer stories or testimonials (launch stage)",
      "Don't be clinical or salesy — lead with dignity",
      "Never cross-sell the other ventures inside the content",
    ],
    faithIntegration:
      "Strongest in the ecosystem — service and stewardship as DNA. Honoring people in their later years. Natural, never preachy.",
    signatureConcepts: [
      "From moving furniture to serving lives (Brighter Day Movers origin)",
      "Clarity, stability and peace in everyday environments",
      "Service as stewardship",
    ],
    accent: "#14B8A6",
  },
};

export function getVentureProfile(ventureId: VentureId): VentureProfile {
  return ventureProfiles[ventureId] ?? ventureProfiles["palmer-house"];
}

export function getAllVentures(): VentureProfile[] {
  return VENTURE_IDS.map((id) => ventureProfiles[id]);
}

/** Shared philosophy line used across the ecosystem. */
export const ECOSYSTEM_PHILOSOPHY =
  "Strategy without art becomes sterile. Art without systems becomes exhausting. Systems without humanity become hollow.";

/** Canon lines — study for cadence, never paste verbatim into output. */
export const CANON_LINES: string[] = [
  "A camera is a mirror with memory.",
  "Your alarm was built for a village. We handed it the internet.",
  "The freeze doesn't mean stop. It means this matters.",
  "Nobody freezes doing something that means nothing to them. The freeze is a compass.",
  "You can be fully visible and completely unseen at the same time.",
  "Silence is not neutral. The freeze sends invoices — silently.",
  "Record until it's boring. Boring is the win condition.",
  "A translation company that happens to own cameras.",
  "You bring what's true. We make it visible.",
  "The applause lands on the costume.",
  "Strategy that never becomes evidence is just anxiety with bullet points.",
];
