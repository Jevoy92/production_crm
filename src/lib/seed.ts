import type {
  TeamMember,
  ChecklistStage,
  ChecklistItem,
  ChecklistTemplates,
  PalType,
} from "./types";
import { PLAYBOOK } from "./playbooksSeed";

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// Real team — keep.
const TEAM: TeamMember[] = [
  { id: "u_jevoy",    name: "Jevoy Palmer",    role: "owner", initials: "JP", color: "oklch(0.70 0.16 55)",  capacity: 40, rate: 150 },
  { id: "u_adrienne", name: "Adrienne Palmer", role: "cfo",   initials: "AP", color: "oklch(0.62 0.15 158)", capacity: 30, rate: 120 },
  { id: "u_shannen",  name: "Shannen Murray",  role: "pa",    initials: "SM", color: "oklch(0.58 0.17 235)", capacity: 40, rate: 45  },
];

// ----- Checklist templates (real workflow scaffolding, not fake data) -----
const universalPre = [
  "project goal confirmed","audience confirmed","platform / use case confirmed","deliverables confirmed",
  "script or outline confirmed","interview questions drafted","location confirmed","shoot date confirmed",
  "client prep sent","wardrobe guidance sent","props / visual needs listed","gear pull list created",
  "call sheet / shoot brief created","Google Drive folder created",
];
const universalShoot = [
  "arrive on time","confirm client goals","confirm schedule","15-minute setup complete",
  "camera settings checked","audio test complete","lighting checked","background checked",
  "client comfort / warmup","A-roll captured","B-roll captured","thumbnail / photo captured if needed",
  "backup card / file check","wrap checklist complete","next steps explained to client",
];
const universalPost = [
  "footage backed up","footage organized","selects pulled","rough cut started","internal review complete",
  "sound cleaned","color adjusted","graphics / motion added","captions added","review export created",
  "client review link sent","revisions logged","final export created",
];
const universalDelivery = [
  "final files exported","filenames checked","final files uploaded","client notified","usage notes sent",
  "social clips delivered","archive folder updated","testimonial requested","follow-up offer suggested",
  "project marked delivered","project moved to archive",
];

const palPre: Record<PalType, string[]> = {
  Visibility: ["hook angles drafted (3+)", "vertical framing confirmed", "captions plan confirmed"],
  Systems:    ["SOP outline reviewed", "screen recordings list built", "voiceover script confirmed"],
  YouTube:    ["thumbnail concepts drafted", "title A/B drafted", "chapter map drafted"],
  Commercial: ["mood board approved", "shot list locked", "brand assets received", "talent confirmed"],
};
const palShoot: Record<PalType, string[]> = {
  Visibility: ["short-form vertical batch shot", "trending sound options noted"],
  Systems:    ["screen capture pass complete", "narrator pickup lines recorded"],
  YouTube:    ["intro takes recorded", "cutaway B-roll captured", "thumbnail still captured"],
  Commercial: ["hero shot locked", "client sign-off on monitor", "alternate framings captured"],
};
const palPost: Record<PalType, string[]> = {
  Visibility: ["3 vertical cuts exported", "hook tested on mute"],
  Systems:    ["chapter markers added", "voiceover mixed under -6dB"],
  YouTube:    ["thumbnail finalized", "end-screen added", "SEO description written"],
  Commercial: ["color grade approved", "brand QC pass complete", "music license confirmed"],
};
const palDelivery: Record<PalType, string[]> = {
  Visibility: ["captions burned in", "delivered in 9:16 + 1:1"],
  Systems:    ["SOP doc linked alongside video", "loom alternative uploaded"],
  YouTube:    ["video scheduled", "community post drafted"],
  Commercial: ["broadcast-spec master delivered", "press kit assembled"],
};

export const DEFAULT_TEMPLATES: ChecklistTemplates = {
  Visibility: {
    "Pre-Production":  [...universalPre,      ...palPre.Visibility],
    "Shoot Day":        [...universalShoot,    ...palShoot.Visibility],
    "Post-Production": [...universalPost,     ...palPost.Visibility],
    Delivery:          [...universalDelivery, ...palDelivery.Visibility],
  },
  Systems: {
    "Pre-Production":  [...universalPre,      ...palPre.Systems],
    "Shoot Day":        [...universalShoot,    ...palShoot.Systems],
    "Post-Production": [...universalPost,     ...palPost.Systems],
    Delivery:          [...universalDelivery, ...palDelivery.Systems],
  },
  YouTube: {
    "Pre-Production":  [...universalPre,      ...palPre.YouTube],
    "Shoot Day":        [...universalShoot,    ...palShoot.YouTube],
    "Post-Production": [...universalPost,     ...palPost.YouTube],
    Delivery:          [...universalDelivery, ...palDelivery.YouTube],
  },
  Commercial: {
    "Pre-Production":  [...universalPre,      ...palPre.Commercial],
    "Shoot Day":        [...universalShoot,    ...palShoot.Commercial],
    "Post-Production": [...universalPost,     ...palPost.Commercial],
    Delivery:          [...universalDelivery, ...palDelivery.Commercial],
  },
};

export function buildChecklistsFromTemplate(
  templates: ChecklistTemplates,
  palType: PalType,
  done: Partial<Record<ChecklistStage, number>> = {},
): Record<ChecklistStage, ChecklistItem[]> {
  const t = templates[palType] ?? DEFAULT_TEMPLATES[palType];
  const mk = (arr: string[], n = 0): ChecklistItem[] =>
    arr.map((text, i) => ({ id: uid("ci"), text, done: i < n }));
  return {
    "Pre-Production":  mk(t["Pre-Production"],  done["Pre-Production"]),
    "Shoot Day":       mk(t["Shoot Day"],        done["Shoot Day"]),
    "Post-Production": mk(t["Post-Production"], done["Post-Production"]),
    Delivery:          mk(t["Delivery"],         done["Delivery"]),
  };
}

// Legacy helper still imported by older call sites — defaults to Commercial template.
export function buildChecklists(
  donePre = 0,
  doneShoot = 0,
  donePost = 0,
  doneDel = 0,
): Record<ChecklistStage, ChecklistItem[]> {
  return buildChecklistsFromTemplate(DEFAULT_TEMPLATES, "Commercial", {
    "Pre-Production":  donePre,
    "Shoot Day":       doneShoot,
    "Post-Production": donePost,
    Delivery:          doneDel,
  });
}

// SEED carries only the real, non-fake content: the team, the playbook, and
// the checklist templates. Every other list (clients/projects/shoots/gear/
// assets/tasks/content/KPIs) starts empty and is populated by the user.
export const SEED = {
  team: TEAM,
  clients: [] as never[],
  projects: [] as never[],
  shoots: [] as never[],
  playbook: PLAYBOOK,
  gearItems: [] as never[],
  gearKits: [] as never[],
  assets: [] as never[],
  tasks: [] as never[],
  templates: DEFAULT_TEMPLATES,
  contentPieces: [] as never[],
  trackedKpis: [] as never[],
};
