/**
 * Jevoy's daily operating structure — Creative Founder / Business Architect.
 * Sourced from the Unified Palmer House Master Playbook.
 */

import type { Block, WeekDay } from "./shannenPlaybook";

export const JEVOY_BLOCKS: Block[] = [
  {
    id: "deep",
    label: "Deep Work & Creative Direction",
    time: "8:00 – 10:30 AM",
    altTime: "9:00 – 11:30 AM",
    duration: "150m",
    objective: "Highest-leverage creative output before meetings fragment the day.",
    items: [
      "Draft / refine scripts for Core 12 and YourBoyJevoy",
      "Storyboard or shot-list the next production",
      "Review yesterday's footage; lock creative direction",
      "Personal brand writing — long-form posts, captions",
    ],
  },
  {
    id: "lead",
    label: "Leadership, Sales & Strategy",
    time: "10:30 AM – 12:30 PM",
    altTime: "11:30 AM – 1:30 PM",
    duration: "120m",
    objective: "Own the revenue pipeline and high-stakes client conversations.",
    items: [
      "Discovery / proposal calls with prospects",
      "Negotiate pricing, close contracts",
      "Sync with Shannen — review daily update, unblock",
      "Partnership and venture conversations",
    ],
  },
  {
    id: "produce",
    label: "Production / On-Camera",
    time: "1:30 – 4:30 PM",
    altTime: "2:30 – 5:30 PM",
    duration: "180m",
    objective: "Execute filming, photo, and on-camera deliverables.",
    items: [
      "Client shoots — direct, light, capture",
      "Self-record Core 12 long-form and shorts",
      "Photo days — guided portrait or BTS",
      "Hand all assets to Shannen for ingest",
    ],
  },
  {
    id: "review",
    label: "Review, Learn & Reset",
    time: "4:30 – 5:30 PM",
    altTime: "5:30 – 6:30 PM",
    duration: "60m",
    objective: "Close loops, sharpen the craft, and set tomorrow's priorities.",
    items: [
      "Review Shannen's daily update; respond with priorities",
      "Study reference work — film, photography, founders",
      "Journal: what worked, what's stuck, what's next",
      "Lock top-3 priorities for tomorrow",
    ],
  },
];

export const JEVOY_WEEK: Record<number, WeekDay> = {
  1: {
    phase: "Strategy",
    title: "Weekly Planning & Script Lock",
    accent: "indigo",
    bullets: [
      "Lock the week's creative slate with Shannen",
      "Write / finalize all scripts for the week",
      "Set revenue + content goals for the week",
    ],
    sync: "11:30 AM sync with Shannen",
  },
  2: {
    phase: "Production",
    title: "Core 12 Filming Day",
    accent: "rose",
    bullets: [
      "On-camera all morning — long-form Core 12",
      "Shorts variants in afternoon",
      "Stay in flow — Shannen blocks comms",
    ],
  },
  3: {
    phase: "Client Work",
    title: "Client Shoots & Brand Days",
    accent: "violet",
    bullets: [
      "Direct on-set for client productions",
      "Photo-to-video setups with talent",
      "Sales-conversation follow-ups between shoots",
    ],
  },
  4: {
    phase: "Creative",
    title: "Edit Review & Personal Brand",
    accent: "amber",
    bullets: [
      "Review first cuts; give editor structured notes",
      "Write long-form personal brand content",
      "Record voiceovers and pickup B-roll",
    ],
  },
  5: {
    phase: "Growth",
    title: "Sales, Partnerships & Reflection",
    accent: "emerald",
    bullets: [
      "Pitch calls, partnership intros, proposals",
      "Review week's metrics with Shannen",
      "Journal weekly wins + roadblocks",
    ],
  },
  0: { phase: "Rest", title: "Sabbath — recharge, no client work", accent: "cyan", bullets: ["Family, rest, reference study only."] },
  6: { phase: "Flex", title: "Optional creative — only if inspired", accent: "cyan", bullets: ["Reserve for overflow editing or passion projects."] },
};

export const JEVOY_OWNS = [
  "Final creative direction & brand vision",
  "All on-camera + directorial output",
  "Pricing, negotiation, and closing contracts",
  "Partnership and venture-level relationships",
];

export const JEVOY_NEVER = [
  "Routine inbox triage or scheduling",
  "Invoice drafting or admin filings",
  "Social post scheduling logistics",
  "Asset ingest / file organization",
];