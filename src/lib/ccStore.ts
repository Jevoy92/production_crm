import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CC_STATUSES = [
  "Idea","Outline Ready","Script Ready","Ready to Film","Filmed","Logged",
  "Sent to Editor","Editing","Needs Jevoy Review","Ready to Publish","Scheduled",
  "Published","Repurposed","Archived",
] as const;
export type CCStatus = (typeof CC_STATUSES)[number];

export const PAL_LANES = ["Reel","Spotlight","Evergreen","System"] as const;
export type PalLane = (typeof PAL_LANES)[number];

export const PLATFORMS = [
  "YouTube","YouTube Shorts","Instagram Reels","Instagram","LinkedIn","TikTok",
  "Website","Newsletter","YourBoyJevoy",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CONTENT_TYPES = [
  "Core 12","Website","Short","Carousel","BTS","Photo-to-Video","Sales Support",
  "Onboarding","System","Blog/Newsletter",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export type CoreTwelve = {
  id: string; number: number; title: string; series: string;
  palLane: PalLane; primaryPlatform: Platform; secondaryPlatforms: Platform[];
  businessPurpose: string; hypothesis: string; hook: string; audience: string;
  cta: string; websitePlacement: string; status: CCStatus; shootDate?: string;
  scriptDone: boolean; filmedDone: boolean; editorDone: boolean;
  thumbnailDone: boolean; captionDone: boolean; publishedDone: boolean;
  editorNotes: string; shannenNotes: string; jevoyNotes: string;
  shortsHooks: string[]; relatedShorts: string[]; relatedWebsite: string[];
  relatedPhoto: string[]; relatedBTS: string[]; updatedAt: string;
};

export type ContentItem = {
  id: string; title: string; type: ContentType; platform: Platform;
  status: CCStatus; palLane: PalLane; relatedCore12?: number;
  businessPurpose: string; cta: string; shootDate?: string; publishedDate?: string;
  fileLocation: string; editorNotes: string; caption: string;
  thumbnailIdea: string; repurposingStatus: string; performanceNotes: string;
};

export type CCShootDay = {
  id: string; date: string; location: string; theme: string; videos: string;
  wardrobe: string; props: string; gear: string; lighting: string; audio: string;
  teleprompter: string; btsPlan: string; shotList: string; timeBlocks: string;
  shannenRoles: string; jevoyRoles: string; pickups: string;
  status: "Planned" | "In Progress" | "Wrapped" | "Cancelled";
  before: { id: string; text: string; done: boolean }[];
  during: { id: string; text: string; done: boolean }[];
  after: { id: string; text: string; done: boolean }[];
};

export const CC_TASK_CATEGORIES = [
  "Shoot prep","Production support","BTS capture","Files","Editor handoff",
  "Captions","Publishing","Tracker updates","Weekly review",
] as const;
export type CCTaskCategory = (typeof CC_TASK_CATEGORIES)[number];

export type CCTask = {
  id: string; title: string; category: CCTaskCategory;
  status: "todo" | "doing" | "done"; priority: "Low" | "Med" | "High";
  dueDate?: string; recurring: boolean;
  weekday?: "Mon" | "Tue" | "Wed" | "Thu" | "Fri"; createdAt: string;
};

export type SprintWeek = {
  number: 1 | 2 | 3 | 4; focus: string; core12Numbers: number[];
  shortsTarget: number; photoTarget: number; websiteVideos: string[];
  shannenTasks: string[]; jevoyTasks: string[]; editorHandoff: string[];
  publishingPriorities: string[]; reviewNotes: string;
};

const C12_RAW: Array<Omit<CoreTwelve, "id" | "updatedAt" | "scriptDone" | "filmedDone" | "editorDone" | "thumbnailDone" | "captionDone" | "publishedDone" | "editorNotes" | "shannenNotes" | "jevoyNotes" | "relatedShorts" | "relatedWebsite" | "relatedPhoto" | "relatedBTS">> = [
  { number: 1, title: "The Invisible Expert Problem", series: "Translation Project", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn","Website"], businessPurpose: "Establish the central thesis: brilliant businesses have a translation problem, not a quality problem.", hypothesis: "You can be excellent and still invisible if people do not understand your value.", hook: "Expertise does not equal visibility.", audience: "Founders and service-business owners who feel under-recognized.", cta: "Subscribe + book a Palmer House clarity call.", websitePlacement: "Homepage hero / About page", status: "Idea", shortsHooks: ["Expertise does not equal visibility.","Being good is not the same as being understood.","Your business may not need more marketing. It may need translation."] },
  { number: 2, title: "I Filmed the Same Business Two Ways", series: "Translation Project", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["Instagram Reels","LinkedIn"], businessPurpose: "Visual proof that strategy beats generic production.", hypothesis: "Same business, two treatments, different perception.", hook: "The camera was the same. The strategy changed everything.", audience: "Buyers comparing video vendors.", cta: "See the Pals framework.", websitePlacement: "Services / Process page", status: "Idea", shortsHooks: ["The camera was the same. The strategy changed everything.","Generic video makes good businesses look average.","Production quality matters less than strategic clarity."] },
  { number: 3, title: "I Watched 100 Business Videos So You Don't Have To", series: "Content Engine", palLane: "Evergreen", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn","Newsletter"], businessPurpose: "Authority + pattern recognition.", hypothesis: "Most business videos fail in the first 5 seconds.", hook: "The biggest mistake I saw in 100 business videos.", audience: "Marketers + founders studying video.", cta: "Download the hook patterns.", websitePlacement: "Blog / Evergreen library", status: "Idea", shortsHooks: ["The biggest mistake I saw in 100 business videos.","Most business videos fail in the first 5 seconds.","What the best business videos all had in common."] },
  { number: 4, title: "The Camera Lie", series: "Content Engine", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["Instagram Reels"], businessPurpose: "Break the belief that camera confidence is personality-based.", hypothesis: "Camera-shy is usually context-shy.", hook: "People freeze because the setup is unnatural.", audience: "Camera-shy business owners.", cta: "Book a Spotlight shoot.", websitePlacement: "Spotlight / Camera-Shy page", status: "Idea", shortsHooks: ["Camera-shy is usually context-shy.","People freeze because the setup is unnatural.","The camera does not create confidence. The environment does."] },
  { number: 5, title: "Every Business Has a $1 Million Video Inside It", series: "Content Engine", palLane: "Evergreen", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn"], businessPurpose: "Introduce the keystone video idea.", hypothesis: "One core explanation can unlock massive value.", hook: "The most valuable video in your business is probably not a Reel.", audience: "Founders evaluating ROI of video.", cta: "Identify your keystone video.", websitePlacement: "Services / Evergreen page", status: "Idea", shortsHooks: ["The most valuable video in your business is probably not a Reel.","One explanation could change your sales process.","Your million-dollar video is hiding inside repeated questions."] },
  { number: 6, title: "What Happens When You Film a Business Owner for 8 Hours", series: "Content Engine", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["Instagram Reels","LinkedIn"], businessPurpose: "BTS proof of the extraction process.", hypothesis: "Hour one is awkward. Hour four is truth.", hook: "Hour one is awkward. Hour four is truth.", audience: "Buyers nervous about long shoots.", cta: "See what a shoot day looks like.", websitePlacement: "Process page", status: "Idea", shortsHooks: ["Hour one is awkward. Hour four is truth.","This is why we do not just hit record.","A shoot day is not about footage. It is about extraction."] },
  { number: 7, title: "The Algorithm Doesn't Care About Your Brand", series: "Content Engine", palLane: "Reel", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn","Instagram Reels"], businessPurpose: "Platform reality check.", hypothesis: "Algorithms reward attention, not brand boards.", hook: "The algorithm is not impressed by your brand guidelines.", audience: "Marketing-conscious founders.", cta: "Subscribe.", websitePlacement: "Blog", status: "Idea", shortsHooks: ["The algorithm is not impressed by your brand guidelines.","Pretty content that nobody watches is still a failure.","Your brand matters, but only after attention begins."] },
  { number: 8, title: "What a $450 Video Shoot Actually Looks Like", series: "Translation Project", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["Website"], businessPurpose: "Demystify price + process.", hypothesis: "Professional video is more accessible than people think.", hook: "Here's what actually happens during a $450 shoot.", audience: "Micro/small business buyers.", cta: "Book the $450 base session.", websitePlacement: "Pricing page", status: "Idea", shortsHooks: ["Here's what actually happens during a $450 shoot.","Professional video is more accessible than people think.","You are not paying for minutes. You are paying for clarity."] },
  { number: 9, title: "Why I Started a Video Company", series: "From Kingston to Content", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn","YourBoyJevoy"], businessPurpose: "Founder connection.", hypothesis: "The camera is the tool; understanding is the work.", hook: "I did not start this because I love cameras.", audience: "People deciding whether to trust Jevoy.", cta: "Meet the team.", websitePlacement: "About page", status: "Idea", shortsHooks: ["I did not start this because I love cameras.","The camera is just the tool.","The real work is helping people be understood."] },
  { number: 10, title: "What Moving Furniture Taught Me About Business", series: "From Kingston to Content", palLane: "Spotlight", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn"], businessPurpose: "Connect past experience to service philosophy.", hypothesis: "Service is physical before it is philosophical.", hook: "Moving taught me more about trust than business school.", audience: "Founders + service operators.", cta: "Read the essay.", websitePlacement: "Blog", status: "Idea", shortsHooks: ["Moving taught me more about trust than business school.","You learn a lot about people when you carry their life through a doorway.","Service is physical before it is philosophical."] },
  { number: 11, title: "Building Four Businesses at Once", series: "From Kingston to Content", palLane: "System", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn"], businessPurpose: "Explain the ecosystem.", hypothesis: "The unifier is helping people communicate value.", hook: "Four businesses sounds insane until you see the pattern.", audience: "Multi-passionate operators.", cta: "Explore the ecosystem.", websitePlacement: "About / Ecosystem", status: "Idea", shortsHooks: ["Four businesses sounds insane until you see the pattern.","The ecosystem is not random.","Everything I build is about helping people communicate value."] },
  { number: 12, title: "The Video That Replaced a $120K Employee", series: "Content Engine", palLane: "System", primaryPlatform: "YouTube", secondaryPlatforms: ["LinkedIn","Website"], businessPurpose: "ROI + system thinking; bridge to System Pal.", hypothesis: "Video can be operations, not just marketing.", hook: "Video is not always marketing. Sometimes it is operations.", audience: "Operations-minded founders.", cta: "Book a System Pal audit.", websitePlacement: "System Pal page", status: "Idea", shortsHooks: ["Video is not always marketing. Sometimes it is operations.","If someone explains it every week, video can replace the repetition.","The best video may never go viral. It may save your team 200 hours."] },
];

const WEBSITE_TITLES = ["What Palmer House Productions Does","Meet Jevoy","Video Is Not Content. It's Infrastructure","How a Palmer House Shoot Works","How We Help Camera-Shy Business Owners","What to Film First","The Four Pal Lanes Explained","Reel Pal: Momentum Problems","Spotlight Pal: Trust Problems","Evergreen Pal: Authority Problems","System Pal: Workflow Problems"];
const SYSTEM_TITLES = ["Welcome & Next Steps","How to Prepare for Your Shoot Day","How to Give Feedback on Edits","What Happens After Filming","How We Turn One Shoot Into Multiple Assets"];

const SPRINT_WEEKS: SprintWeek[] = [
  { number: 1, focus: "Translation Thesis Week — establish the brand thesis and digital storefront.", core12Numbers: [1,2,3], shortsTarget: 15, photoTarget: 0, websiteVideos: ["What Palmer House Productions Does","Meet Jevoy","Video Is Not Content. It's Infrastructure"], shannenTasks: ["Prep locations","Track takes","Capture BTS","Label files","Mark short-form moments","Create folder structure","Prepare editor handoff"], jevoyTasks: ["Lock scripts for #1–3","Record website hero VO"], editorHandoff: ["Core 12 #1 selects","Core 12 #2 selects","Homepage hero rough cut"], publishingPriorities: ["Homepage video","Core 12 #1 teaser short"], reviewNotes: "" },
  { number: 2, focus: "Camera + Process Week — show how Palmer House works.", core12Numbers: [4,5,6], shortsTarget: 15, photoTarget: 5, websiteVideos: ["How a Palmer House Shoot Works","How We Help Camera-Shy Business Owners","What to Film First"], shannenTasks: ["Capture full BTS for 8-hour shoot","Log keystone moments","Pull 5 Palmer House technical photos"], jevoyTasks: ["Choose 5 process photos","Record keystone-video walkthrough","Lock Camera Lie script"], editorHandoff: ["Core 12 #4 selects","Process page rough cut","First 10 shorts"], publishingPriorities: ["Publish Core 12 #1","Process page video"], reviewNotes: "" },
  { number: 3, focus: "Platform Reality + Pricing Trust Week.", core12Numbers: [7,8,9], shortsTarget: 20, photoTarget: 5, websiteVideos: ["The Four Pal Lanes Explained","Reel Pal","Spotlight Pal","Evergreen Pal","System Pal"], shannenTasks: ["Pull 5 YourBoyJevoy story photos","Capture Pal lane B-roll","Draft captions for Algorithm video"], jevoyTasks: ["Record Pals overview","Lock $450 shoot teardown","Record founder origin"], editorHandoff: ["Pals overview rough cut","Core 12 #7 selects","Core 12 #8 selects"], publishingPriorities: ["Publish Core 12 #2","Pals overview"], reviewNotes: "" },
  { number: 4, focus: "Founder Ecosystem + System Week — build onboarding infrastructure.", core12Numbers: [10,11,12], shortsTarget: 20, photoTarget: 5, websiteVideos: [], shannenTasks: ["Record all 5 system videos with Jevoy","Build onboarding folder","Draft welcome-email caption"], jevoyTasks: ["Lock 'moving furniture' essay","Record ecosystem map","Record $120K employee story"], editorHandoff: ["5 system videos","Core 12 #10–12 selects","Weekly retro shorts"], publishingPriorities: ["Publish Core 12 #3","Welcome & Next Steps onboarding"], reviewNotes: "" },
];

const RECURRING_TASKS: Omit<CCTask, "id" | "createdAt">[] = [
  { title: "Prep weekly shoot checklist", category: "Shoot prep", status: "todo", priority: "High", recurring: true, weekday: "Mon" },
  { title: "Pull scripts & prompts", category: "Shoot prep", status: "todo", priority: "High", recurring: true, weekday: "Mon" },
  { title: "Confirm filming locations", category: "Shoot prep", status: "todo", priority: "Med", recurring: true, weekday: "Mon" },
  { title: "Prep teleprompter", category: "Shoot prep", status: "todo", priority: "Med", recurring: true, weekday: "Mon" },
  { title: "Create weekly folder structure", category: "Files", status: "todo", priority: "Med", recurring: true, weekday: "Mon" },
  { title: "11:30 sync — lock filming order with Jevoy", category: "Weekly review", status: "todo", priority: "High", recurring: true, weekday: "Mon" },
  { title: "Set up studio / lighting / audio", category: "Production support", status: "todo", priority: "High", recurring: true, weekday: "Tue" },
  { title: "Run teleprompter", category: "Production support", status: "todo", priority: "High", recurring: true, weekday: "Tue" },
  { title: "Track best takes", category: "Production support", status: "todo", priority: "High", recurring: true, weekday: "Tue" },
  { title: "Capture BTS phone footage", category: "BTS capture", status: "todo", priority: "Med", recurring: true, weekday: "Tue" },
  { title: "Pull selected photos to monitor", category: "Production support", status: "todo", priority: "Med", recurring: true, weekday: "Wed" },
  { title: "Track photo-to-video template usage", category: "Tracker updates", status: "todo", priority: "Med", recurring: true, weekday: "Wed" },
  { title: "Log voiceover notes", category: "Production support", status: "todo", priority: "Med", recurring: true, weekday: "Wed" },
  { title: "Organize short-form clips", category: "Files", status: "todo", priority: "Med", recurring: true, weekday: "Wed" },
  { title: "Ingest footage + rename files", category: "Files", status: "todo", priority: "High", recurring: true, weekday: "Thu" },
  { title: "Sort into correct folders", category: "Files", status: "todo", priority: "High", recurring: true, weekday: "Thu" },
  { title: "Create editor notes", category: "Editor handoff", status: "todo", priority: "High", recurring: true, weekday: "Thu" },
  { title: "Draft captions", category: "Captions", status: "todo", priority: "Med", recurring: true, weekday: "Thu" },
  { title: "Update tracker statuses", category: "Tracker updates", status: "todo", priority: "Med", recurring: true, weekday: "Thu" },
  { title: "Schedule finished content", category: "Publishing", status: "todo", priority: "High", recurring: true, weekday: "Fri" },
  { title: "Update publishing calendar", category: "Publishing", status: "todo", priority: "Med", recurring: true, weekday: "Fri" },
  { title: "Prepare weekly recap for Jevoy", category: "Weekly review", status: "todo", priority: "High", recurring: true, weekday: "Fri" },
  { title: "List bottlenecks", category: "Weekly review", status: "todo", priority: "Med", recurring: true, weekday: "Fri" },
];

const BEFORE = ["Confirm scripts / talking points","Charge batteries","Clear memory cards","Prepare camera","Prepare audio","Prepare lights","Prepare teleprompter","Prep wardrobe","Prep props","Confirm filming location","Create folders","Pull photo assets if needed"];
const DURING = ["Track best takes","Mark strong short-form moments","Capture BTS","Confirm audio levels","Confirm focus / framing","Log any pickups needed"];
const AFTER = ["Ingest footage","Label files","Sort into correct folders","Add editor notes","Update status","Move files to Ready for Editor","Create daily production recap"];

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();
const ckList = (items: string[]) => items.map((text, i) => ({ id: `ck_${i}_${Math.random().toString(36).slice(2, 5)}`, text, done: false }));

function emptyFlags() {
  return { scriptDone: false, filmedDone: false, editorDone: false, thumbnailDone: false, captionDone: false, publishedDone: false, editorNotes: "", shannenNotes: "", jevoyNotes: "", relatedShorts: [] as string[], relatedWebsite: [] as string[], relatedPhoto: [] as string[], relatedBTS: [] as string[] };
}

const SEED_SHOOTS: Omit<CCShootDay, "id">[] = [
  { date: "", location: "Studio", theme: "Day 1 — Setup & Command Center Lock", videos: "(no filming — setup)", wardrobe: "", props: "", gear: "", lighting: "", audio: "", teleprompter: "", btsPlan: "", shotList: "", timeBlocks: "", shannenRoles: "Build tracker, set folders, draft shoot list", jevoyRoles: "Approve Core 12 order, write hooks", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
  { date: "", location: "Studio", theme: "Day 2 — Translation Project #1", videos: "Core 12 #1 + Website: What Palmer House Does", wardrobe: "Black tee, neutral", props: "Notebook", gear: "C70 + 35mm, RØDE", lighting: "Key + soft fill", audio: "Lav + boom backup", teleprompter: "Bullet outline", btsPlan: "3 BTS phone clips", shotList: "Wide/mid/close x 3 blocks", timeBlocks: "9–11 setup, 11–1 record", shannenRoles: "Teleprompter, audio check, BTS", jevoyRoles: "Talent, lock final hooks", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
  { date: "", location: "Studio", theme: "Day 3 — Translation Project #2", videos: "Core 12 #2 + Website: Video Is Infrastructure", wardrobe: "Continuity w/ Day 2", props: "Two-monitor comparison setup", gear: "C70 + 35mm, RØDE", lighting: "Two-look toggle", audio: "Lav", teleprompter: "Outline", btsPlan: "Side-by-side BTS", shotList: "Generic vs strategic side-by-side", timeBlocks: "9–1", shannenRoles: "Run comparison playback", jevoyRoles: "Talent", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
  { date: "", location: "Studio", theme: "Day 4 — Authority / Search Video", videos: "Core 12 #3 — 100 Business Videos", wardrobe: "Editorial", props: "Laptop / reference screens", gear: "C70 + 50mm", lighting: "Key only", audio: "Lav", teleprompter: "Outline + clip refs", btsPlan: "Screen recordings", shotList: "Direct address + B-roll examples", timeBlocks: "9–1", shannenRoles: "Capture 5 direct shorts after main take", jevoyRoles: "Talent", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
  { date: "", location: "Studio", theme: "Day 5 — Website Trust Videos", videos: "Meet Jevoy; How a Shoot Works; Camera-Shy Reassurance", wardrobe: "Soft tone", props: "—", gear: "C70 + 35mm", lighting: "Soft warm key", audio: "Lav", teleprompter: "Bullets", btsPlan: "Optional", shotList: "3 short pieces ~60s each", timeBlocks: "9–1", shannenRoles: "Track takes, log best", jevoyRoles: "Talent", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
  { date: "", location: "Studio", theme: "Day 6 — Photo-to-Video Batch", videos: "3 Palmer House photo breakdowns + 2 YourBoyJevoy story videos + 3 BTS clips", wardrobe: "Casual", props: "iPad / monitor w/ photo set", gear: "C70 + macro phone for BTS", lighting: "Practical", audio: "Lav VO", teleprompter: "Photo cue list", btsPlan: "Workflow rig BTS", shotList: "Photo onscreen → commentary", timeBlocks: "9–1", shannenRoles: "Load photo set, run VO record", jevoyRoles: "Narrate stories + technique", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
  { date: "", location: "Desk", theme: "Day 7 — Review & Package Handoff", videos: "(handoff day)", wardrobe: "", props: "", gear: "", lighting: "", audio: "", teleprompter: "", btsPlan: "", shotList: "", timeBlocks: "9–1", shannenRoles: "Ingest, rename, organize, editor notes, update tracker", jevoyRoles: "Review top takes, choose edit priority, pickup VO", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER) },
];

type CCState = {
  core12: CoreTwelve[]; library: ContentItem[]; shoots: CCShootDay[];
  tasks: CCTask[]; weeks: SprintWeek[];
  updateCore12: (id: string, patch: Partial<CoreTwelve>) => void;
  addContentItem: (i: Omit<ContentItem, "id">) => string;
  updateContentItem: (id: string, patch: Partial<ContentItem>) => void;
  removeContentItem: (id: string) => void;
  addShoot: (s?: Partial<CCShootDay>) => string;
  updateShoot: (id: string, patch: Partial<CCShootDay>) => void;
  removeShoot: (id: string) => void;
  toggleShootItem: (id: string, list: "before" | "during" | "after", itemId: string) => void;
  addTask: (t: Omit<CCTask, "id" | "createdAt">) => string;
  updateTask: (id: string, patch: Partial<CCTask>) => void;
  removeTask: (id: string) => void;
  cycleTaskStatus: (id: string) => void;
  generateWeekTasks: () => void;
  updateWeek: (n: number, patch: Partial<SprintWeek>) => void;
  resetCC: () => void;
};

function buildSeed() {
  const core12: CoreTwelve[] = C12_RAW.map((c) => ({ ...c, ...emptyFlags(), id: `c12_${c.number}`, updatedAt: now() }));
  const baseLib = (titles: string[], type: ContentType, lane: PalLane): ContentItem[] =>
    titles.map((title) => ({ id: uid("ci"), title, type, platform: "Website", status: "Idea", palLane: lane, businessPurpose: "", cta: "", fileLocation: "", editorNotes: "", caption: "", thumbnailIdea: "", repurposingStatus: "", performanceNotes: "" }));
  const library = [...baseLib(WEBSITE_TITLES, "Website", "Spotlight"), ...baseLib(SYSTEM_TITLES, "System", "System")];
  const shoots = SEED_SHOOTS.map((s) => ({ ...s, id: uid("sd") }));
  const tasks = RECURRING_TASKS.map((t) => ({ ...t, id: uid("cct"), createdAt: now() }));
  return { core12, library, shoots, tasks, weeks: SPRINT_WEEKS };
}

export const useCCStore = create<CCState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      updateCore12: (id, patch) => set({ core12: get().core12.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)) }),
      addContentItem: (i) => { const id = uid("ci"); set({ library: [{ id, ...i }, ...get().library] }); return id; },
      updateContentItem: (id, patch) => set({ library: get().library.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
      removeContentItem: (id) => set({ library: get().library.filter((c) => c.id !== id) }),
      addShoot: (s) => {
        const id = uid("sd");
        const base: CCShootDay = { id, date: "", location: "", theme: "", videos: "", wardrobe: "", props: "", gear: "", lighting: "", audio: "", teleprompter: "", btsPlan: "", shotList: "", timeBlocks: "", shannenRoles: "", jevoyRoles: "", pickups: "", status: "Planned", before: ckList(BEFORE), during: ckList(DURING), after: ckList(AFTER), ...s };
        set({ shoots: [...get().shoots, base] }); return id;
      },
      updateShoot: (id, patch) => set({ shoots: get().shoots.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),
      removeShoot: (id) => set({ shoots: get().shoots.filter((s) => s.id !== id) }),
      toggleShootItem: (id, list, itemId) =>
        set({ shoots: get().shoots.map((s) => s.id !== id ? s : { ...s, [list]: s[list].map((it) => it.id === itemId ? { ...it, done: !it.done } : it) }) }),
      addTask: (t) => { const id = uid("cct"); set({ tasks: [{ id, createdAt: now(), ...t }, ...get().tasks] }); return id; },
      updateTask: (id, patch) => set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      removeTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
      cycleTaskStatus: (id) => set({ tasks: get().tasks.map((t) => t.id === id ? { ...t, status: t.status === "todo" ? "doing" : t.status === "doing" ? "done" : "todo" } : t) }),
      generateWeekTasks: () => {
        const ts = now();
        const next = RECURRING_TASKS.map((t) => ({ ...t, id: uid("cct"), createdAt: ts, recurring: false }));
        set({ tasks: [...next, ...get().tasks] });
      },
      updateWeek: (n, patch) => set({ weeks: get().weeks.map((w) => (w.number === n ? { ...w, ...patch } : w)) }),
      resetCC: () => set(buildSeed()),
    }),
    { name: "cc:v1", version: 1 },
  ),
);

export const palLaneColor = (l: PalLane) =>
  l === "Reel" ? "var(--lane-reel)" : l === "Spotlight" ? "var(--lane-spotlight)" : l === "Evergreen" ? "var(--lane-evergreen)" : "var(--lane-system)";
