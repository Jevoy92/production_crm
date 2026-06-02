import { z } from "zod";

/**
 * Shared tool input schemas for Pals.
 *
 * Tools are defined on the server (route /api/pals) with NO `execute` so the
 * AI SDK pauses the stream after a tool call and lets the BROWSER run it.
 * That lets a single tool implementation touch both zustand stores
 * (`useStore` synced via workspace_state, and `useCC` which is browser-only).
 */

export const TaskOwnerSchema = z.enum(["Jevoy", "Shannen", "Editor", "Client", "Other"]);
export const TaskStatusSchema = z.enum(["todo", "doing", "done"]);
export const TaskPrioritySchema = z.enum(["Low", "Med", "High"]);

export const ContentTypeSchema = z.enum([
  "Core 12", "Website", "Short", "Carousel", "BTS",
  "Photo-to-Video", "Sales Support", "Onboarding", "System", "Blog/Newsletter",
]);
export const PlatformSchema = z.enum([
  "YouTube", "YouTube Shorts", "Instagram Reels", "Instagram", "LinkedIn",
  "TikTok", "Website", "Newsletter", "YourBoyJevoy",
]);
export const PalLaneSchema = z.enum(["Reel", "Spotlight", "Evergreen", "System"]);
export const CCStatusSchema = z.enum([
  "Idea", "Outline Ready", "Script Ready", "Ready to Film", "Filmed", "Logged",
  "Sent to Editor", "Editing", "Needs Jevoy Review", "Ready to Publish",
  "Scheduled", "Published", "Repurposed", "Archived",
]);

// ---------- READ TOOLS (no approval) ----------

export const searchWorkspaceInput = z.object({
  query: z.string().min(1).max(200),
  kinds: z
    .array(z.enum(["task", "content", "core12", "shoot", "client", "project"]))
    .optional(),
});

export const listTasksInput = z.object({
  owner: TaskOwnerSchema.optional(),
  status: TaskStatusSchema.optional(),
  dueBefore: z.string().optional().describe("ISO date — return tasks due on or before"),
  limit: z.number().int().min(1).max(50).default(20),
});

export const listContentInput = z.object({
  type: ContentTypeSchema.optional(),
  status: CCStatusSchema.optional(),
  platform: PlatformSchema.optional(),
  relatedCore12: z.number().int().min(1).max(12).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

// ---------- WRITE TOOLS (require approval) ----------

export const createTaskInput = z.object({
  title: z.string().min(1).max(300),
  owner: TaskOwnerSchema.default("Jevoy"),
  dueDate: z.string().optional().describe("ISO date YYYY-MM-DD"),
  priority: TaskPrioritySchema.default("Med"),
  notes: z.string().max(2000).optional(),
  relatedContentId: z.string().optional(),
  relatedShootId: z.string().optional(),
});

export const updateTaskInput = z.object({
  id: z.string().min(1),
  patch: z.object({
    title: z.string().min(1).max(300).optional(),
    owner: TaskOwnerSchema.optional(),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    dueDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
  }),
});

export const completeTaskInput = z.object({ id: z.string().min(1) });

export const createContentItemInput = z.object({
  title: z.string().min(1).max(300),
  type: ContentTypeSchema,
  platform: PlatformSchema,
  palLane: PalLaneSchema.default("Evergreen"),
  status: CCStatusSchema.default("Idea"),
  businessPurpose: z.string().max(1000).default(""),
  cta: z.string().max(500).default(""),
  relatedCore12: z.number().int().min(1).max(12).optional(),
});

export const updateContentItemInput = z.object({
  id: z.string().min(1),
  patch: z.object({
    title: z.string().min(1).max(300).optional(),
    type: ContentTypeSchema.optional(),
    platform: PlatformSchema.optional(),
    palLane: PalLaneSchema.optional(),
    status: CCStatusSchema.optional(),
    businessPurpose: z.string().max(1000).optional(),
    cta: z.string().max(500).optional(),
    caption: z.string().max(2000).optional(),
    thumbnailIdea: z.string().max(500).optional(),
    fileLocation: z.string().max(500).optional(),
    publishDate: z.string().optional(),
    publishStatus: z.enum(["Draft", "Scheduled", "Published"]).optional(),
    shootDate: z.string().optional(),
    editorNotes: z.string().max(2000).optional(),
  }),
});

export const scheduleContentInput = z.object({
  id: z.string().min(1),
  publishDate: z.string().describe("ISO date YYYY-MM-DD"),
  platform: PlatformSchema.optional(),
});

export const createShootInput = z.object({
  date: z.string().describe("ISO date YYYY-MM-DD"),
  location: z.string().max(300).default(""),
  theme: z.string().max(300).default(""),
  videos: z.string().max(2000).default("").describe("Comma- or newline-separated list of videos being filmed"),
});

export const updateShootInput = z.object({
  id: z.string().min(1),
  patch: z.object({
    date: z.string().optional(),
    location: z.string().max(300).optional(),
    theme: z.string().max(300).optional(),
    videos: z.string().max(2000).optional(),
    wardrobe: z.string().max(1000).optional(),
    props: z.string().max(1000).optional(),
    gear: z.string().max(1000).optional(),
    lighting: z.string().max(1000).optional(),
    audio: z.string().max(1000).optional(),
    btsPlan: z.string().max(1000).optional(),
    shotList: z.string().max(2000).optional(),
    status: z.enum(["Planned", "In Progress", "Wrapped", "Cancelled"]).optional(),
  }),
});

export const updateCore12Input = z.object({
  number: z.number().int().min(1).max(12),
  patch: z.object({
    status: CCStatusSchema.optional(),
    hook: z.string().max(500).optional(),
    cta: z.string().max(500).optional(),
    businessPurpose: z.string().max(1000).optional(),
    shootDate: z.string().optional(),
    scriptDone: z.boolean().optional(),
    filmedDone: z.boolean().optional(),
    editorDone: z.boolean().optional(),
    thumbnailDone: z.boolean().optional(),
    captionDone: z.boolean().optional(),
    publishedDone: z.boolean().optional(),
    shannenNotes: z.string().max(2000).optional(),
    jevoyNotes: z.string().max(2000).optional(),
    editorNotes: z.string().max(2000).optional(),
  }),
});

export const generateSupportingShortsInput = z.object({
  scriptNum: z.number().int().min(1).max(12).describe("Core 12 episode number"),
});

/** Set of tool names that require user approval before executing on the client. */
export const WRITE_TOOL_NAMES = new Set([
  "createTask",
  "updateTask",
  "completeTask",
  "createContentItem",
  "updateContentItem",
  "scheduleContent",
  "createShoot",
  "updateShoot",
  "updateCore12",
  "generateSupportingShorts",
]);

export type PalsToolName =
  | "searchWorkspace"
  | "listTasks"
  | "listContent"
  | "createTask"
  | "updateTask"
  | "completeTask"
  | "createContentItem"
  | "updateContentItem"
  | "scheduleContent"
  | "createShoot"
  | "updateShoot"
  | "updateCore12"
  | "generateSupportingShorts";