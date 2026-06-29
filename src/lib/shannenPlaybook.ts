/**
 * Shannen's daily operating structure — sourced from the Unified Palmer House
 * Master Playbook. Used by the Today dashboard.
 */

export type Block = {
  id: string;
  label: string;
  time: string;
  altTime: string;
  duration: string;
  objective: string;
  items: string[];
};

export const SHANNEN_BLOCKS: Block[] = [
  {
    id: "warmup",
    label: "Warm-up & Priority Alignment",
    time: "9:00 – 9:30 AM",
    altTime: "10:00 – 10:30 AM",
    duration: "30m",
    objective: "Establish situational awareness and align on the day's high-priority tasks.",
    items: [
      "Check info@palmerhouseproductions.com inbox; flag items needing Jevoy",
      "Check jevoy@jevoypalmer.com inbox; flag items needing Jevoy",
      "Review Jevoy's calendar for today + next 48h for conflicts",
      "5–10 min alignment check-in with Jevoy",
    ],
  },
  {
    id: "client",
    label: "Client Comms & Customer Experience",
    time: "9:30 – 11:00 AM",
    altTime: "10:30 AM – 12:00 PM",
    duration: "90m",
    objective: "Own the client-facing pipeline and execute CX protocols.",
    items: [
      "Reply to routine inquiries; send booking links",
      "Send intake questionnaires + e-sign contracts to new clients",
      "Deliver final asset folders (Pixieset / Drive) to completed projects",
      "Run Customer Gratitude SOP / Dissatisfied Customer SOP as needed",
    ],
  },
  {
    id: "ops",
    label: "Operations, Admin & Social Scheduling",
    time: "11:00 AM – 12:30 PM",
    altTime: "12:00 – 1:30 PM",
    duration: "90m",
    objective: "Maintain backend infrastructure and execute content distribution.",
    items: [
      "Book studio, confirm shoot dates, prep equipment checklists",
      "Draft invoices, log receipts, follow up on outstanding balances",
      "Post daily Palmer House content (IG + LinkedIn feed post)",
      "Schedule pre-edited clips on IG / LinkedIn / YouTube",
      "Update website portfolio / blog / newsletter with new assets",
    ],
  },
  {
    id: "wrap",
    label: "Wrap-up & Frictionless Handover",
    time: "12:30 – 1:00 PM",
    altTime: "1:30 – 2:00 PM",
    duration: "30m",
    objective: "Document progress, prep tomorrow, and update Jevoy.",
    items: [
      "Final inbox sweep — no urgent emails left open",
      "Update Notion Production Tracker with project statuses",
      "Send structured Daily Update to Jevoy",
    ],
  },
];

export type WeekDay = {
  phase: string;
  title: string;
  bullets: string[];
  sync?: string;
  accent: "indigo" | "rose" | "emerald" | "amber" | "violet" | "cyan";
};

export const SHANNEN_WEEK: Record<number, WeekDay> = {
  1: {
    phase: "Planning",
    title: "Planning & Script Lock",
    accent: "indigo",
    bullets: [
      "Build weekly shoot checklist; log photo assets",
      "Prep script templates, teleprompter, folder structure",
      "Lock the week's filming order with Jevoy",
    ],
    sync: "11:30 AM sync with Jevoy",
  },
  2: {
    phase: "Production",
    title: "Main Production Day — Core 12 & Website",
    accent: "rose",
    bullets: [
      "Set up studio lighting, framing, audio levels",
      "Run teleprompter; mark best takes",
      "Capture BTS phone footage of Jevoy",
    ],
  },
  3: {
    phase: "Production",
    title: "Photo-to-Video & Shorts",
    accent: "violet",
    bullets: [
      "Pull Jevoy's photos onto studio monitor / iPad",
      "Log photos used; record voiceovers / on-camera stories",
      "Track which shorts support which long-form videos",
    ],
  },
  4: {
    phase: "Post-Production",
    title: "Organization & Editor Handoff",
    accent: "amber",
    bullets: [
      "Ingest footage, label files, sort into folders",
      "Create detailed edit notes; mark best takes",
      "Draft social captions; prep thumbnail assets",
    ],
  },
  5: {
    phase: "Distribution",
    title: "Review & Distribution Prep",
    accent: "emerald",
    bullets: [
      "Schedule finished assets across active platforms",
      "Prep next week's planning documents",
      "Send structured Daily Update to Jevoy",
    ],
  },
  0: { phase: "Rest", title: "Off — no scheduled blocks", accent: "cyan", bullets: ["No part-time hours today."] },
  6: { phase: "Rest", title: "Off — no scheduled blocks", accent: "cyan", bullets: ["No part-time hours today."] },
};

export const ACCENT_CLASS: Record<WeekDay["accent"], string> = {
  indigo: "bg-brand-600/15 text-brand-400 border-brand-500/30",
  rose: "bg-rose/15 text-rose border-rose/30",
  emerald: "bg-emerald/15 text-emerald border-emerald/30",
  amber: "bg-amber/15 text-amber border-amber/30",
  violet: "bg-violet/15 text-violet border-violet/30",
  cyan: "bg-cyan/15 text-cyan border-cyan/30",
};

export const SHANNEN_OWNS = [
  "General inbox + client scheduling",
  "Client onboarding & offboarding workflows",
  "Invoice drafting & basic expense tracking",
  "Scheduling prepared social posts (no editing)",
];

export const SHANNEN_NEVER = [
  "Video editing or post-production",
  "Final creative direction decisions",
  "Negotiating pricing or closing contracts",
];
