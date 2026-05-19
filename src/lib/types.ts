// Domain types for Palmer House Production OS
export type PalType = "Visibility" | "Systems" | "YouTube" | "Commercial";
export type Stage =
  | "Lead"
  | "Strategy Call"
  | "Proposal Sent"
  | "Booked"
  | "Pre-Production"
  | "Shoot Day"
  | "In Post"
  | "Delivered"
  | "Archived";
export const STAGES: Stage[] = [
  "Lead",
  "Strategy Call",
  "Proposal Sent",
  "Booked",
  "Pre-Production",
  "Shoot Day",
  "In Post",
  "Delivered",
  "Archived",
];
export const PAL_TYPES: PalType[] = ["Visibility", "Systems", "YouTube", "Commercial"];

export type Role = "owner" | "cfo" | "pa" | "editor" | "camera" | "freelancer";

export type TeamMember = {
  id: string;
  name: string;
  role: Role;
  email?: string;
  initials: string;
  color: string;
  rate?: number;
  capacity?: number;
};

export type Client = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  honeybookLink?: string;
  notes?: string;
};

export type ChecklistItem = { id: string; text: string; done: boolean };
export type ChecklistStage = "Pre-Production" | "Shoot Day" | "Post-Production" | "Delivery";
export const CHECKLIST_STAGES: ChecklistStage[] = [
  "Pre-Production",
  "Shoot Day",
  "Post-Production",
  "Delivery",
];

export type Project = {
  id: string;
  title: string;
  clientId: string;
  internal: boolean;
  palType: PalType;
  stage: Stage;
  ownerId: string;
  shootDate?: string; // ISO
  deliveryDate?: string;
  quoted?: number;
  cost?: number;
  driveLink?: string;
  honeybookLink?: string;
  reviewLink?: string;
  notes?: string;
  priority: "Low" | "Med" | "High";
  blocker?: string;
  clientRating?: number; // 1-5, set on/after delivery
  checklists: Record<ChecklistStage, ChecklistItem[]>;
  log: {
    id: string;
    ts: string;
    who: string;
    type: "general" | "client" | "production" | "finance" | "issue" | "decision";
    text: string;
  }[];
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  projectId?: string;
  assigneeId: string;
  dueDate?: string;
  status: "todo" | "doing" | "done";
  priority: "Low" | "Med" | "High";
  stage?: ChecklistStage;
  createdAt: string;
};

export type ChecklistTemplates = Record<PalType, Record<ChecklistStage, string[]>>;

export type Shoot = {
  id: string;
  projectId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  arrival?: string;
  goals?: string;
  crewIds: string[];
  gearKitId?: string;
  status: "Scheduled" | "Complete" | "Cancelled";
  notes?: string;
};

export const PLAYBOOK_LOOPS = [
  "Prep Loop",
  "Gear Loop",
  "Shoot Day Loop",
  "Edit Handoff Loop",
  "Delivery Loop",
  "Sales Loop",
  "Finance Loop",
  "Content Loop",
  "Internal Training Loop",
] as const;
export type PlaybookLoop = typeof PLAYBOOK_LOOPS[number];

export type PlaybookChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type PlaybookPage = {
  slug: string;
  title: string;
  loops: PlaybookLoop[];
  purpose: string;
  ownerRole: "owner" | "cfo" | "pa" | "company";
  whenToUse: string;
  trigger: string;
  inputsNeeded: string;
  content: string; // The step-by-step process text
  checklist: PlaybookChecklistItem[];
  definitionOfDone: string;
  commonMistakes: string;
  relatedKpiId?: string;
  relatedStage?: Stage;
  relatedPalType?: PalType;
  loomUrl?: string;
  imageUrl?: string; // Pal character portrait, served from /public
  updatedAt: string;
};

export type GearItem = {
  id: string;
  name: string;
  category: string;
  status: "Available" | "On Shoot" | "Repair";
  kitIds: string[];
  notes?: string;
  imageUrl?: string;
};
export type GearKit = { id: string; name: string; itemIds: string[]; useCase: string };

export type KpiEntry = {
  id: string;
  role: "owner" | "cfo" | "pa";
  metric: string;
  value: number;
  date: string;
};

export type Asset = {
  id: string;
  projectId: string;
  name: string;
  type: "Footage" | "Audio" | "Graphics" | "Music" | "Stills" | "Final" | "Review";
  link?: string;
  sizeGb?: number;
  status: "Draft" | "Review" | "Approved" | "Delivered";
  updatedAt: string;
  fileDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

// ─── Content Pipeline (internal Palmer House content) ─────────────────────────

export type ContentPipelineStage =
  | "Concept"
  | "Scripted"
  | "Scheduled"
  | "Shot"
  | "In Edit"
  | "Live";

export const CONTENT_PIPELINE_STAGES: ContentPipelineStage[] = [
  "Concept",
  "Scripted",
  "Scheduled",
  "Shot",
  "In Edit",
  "Live",
];

export type ContentPalLane = "Reel" | "System" | "Evergreen" | "Spotlight";
export const CONTENT_PAL_LANES: ContentPalLane[] = [
  "Reel",
  "System",
  "Evergreen",
  "Spotlight",
];

export type ContentPlatform =
  | "YouTube"
  | "Instagram"
  | "LinkedIn"
  | "Facebook"
  | "Website";

export const CONTENT_PLATFORMS: ContentPlatform[] = [
  "YouTube",
  "Instagram",
  "LinkedIn",
  "Facebook",
  "Website",
];

export type RepurposableClip = {
  id: string;
  label: string; // e.g. "The side-by-side comparison (30 sec)"
  platform: ContentPlatform;
  done: boolean;
};

export type PlatformUpload = {
  platform: ContentPlatform;
  status: "pending" | "uploaded" | "live";
  url?: string;
  publishedAt?: string;
};

export type ContentPiece = {
  id: string;
  title: string;
  hypothesis: string;
  palLane: ContentPalLane;
  format: string; // e.g. "Investigation + Personal Experiment"
  stage: ContentPipelineStage;
  primaryPlatform: ContentPlatform;
  targetPlatforms: ContentPlatform[];
  platforms: PlatformUpload[];
  repurposableClips: RepurposableClip[];
  thumbnailConcept?: string;
  scriptLink?: string; // Google Docs / Drive link
  driveFolder?: string;
  shootDate?: string;
  publishDate?: string;
  faithThread?: string;
  notes?: string;
  createdAt: string;
};

// ─── KPI Scorecard (target vs. actual tracking) ───────────────────────────────

export type KpiOwnerRole = "owner" | "cfo" | "pa" | "company";

export const KPI_CATEGORIES = [
  "Sales",
  "Content",
  "Production",
  "Finance",
  "Operations",
  "Client Experience",
  "Systems",
] as const;
export type KpiCategory = typeof KPI_CATEGORIES[number];

export const KPI_FREQUENCIES = ["Daily", "Weekly", "Monthly", "Per Project", "Quarterly"] as const;
export type KpiFrequency = typeof KPI_FREQUENCIES[number];

export type TrackedKpi = {
  id: string;
  name: string;
  owner: KpiOwnerRole;
  category: KpiCategory;
  // Simple numeric mode
  target: number;
  actual: number;
  unit: string; // "calls", "$", "%", "videos", "posts", ""
  isLowerBetter: boolean; // for things like "outstanding invoices" — lower = better
  // Ratio mode (X sent vs. Y returned)
  isRatio: boolean;
  ratioNumerator: number; // e.g. 2 proposals accepted
  ratioDenominator: number; // e.g. 5 proposals sent
  ratioNumeratorLabel: string; // e.g. "accepted"
  ratioDenominatorLabel: string; // e.g. "sent"
  // Meta
  frequency: KpiFrequency;
  whyItMatters: string;
  notes: string;
  active: boolean;
  createdAt: string;
};
