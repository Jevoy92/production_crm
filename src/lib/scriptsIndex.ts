// Build-time INDEX of all bundled script + strategy + research markdown.
// The hub only uses path metadata; document bodies stay lazy so opening one
// script fetches that one markdown module instead of the full content library.

type LazyMap = Record<string, () => Promise<string>>;
type EagerMap = Record<string, string>;

// Eager-load script bodies — these must be bulletproof and always render
// without a runtime fetch / dynamic chunk.
const originalsEager = import.meta.glob("/src/content/scripts/Originals/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as EagerMap;
const versionsEager = import.meta.glob("/src/content/scripts/Versions/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as EagerMap;

// Eager-load reference docs too — lazy chunks with spaces in filenames
// were failing to resolve at runtime, leaving the reader blank.
const strategyRaw = import.meta.glob("/src/content/scripts/Strategy/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as EagerMap;
const researchRaw = import.meta.glob("/src/content/scripts/Research/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as EagerMap;
const yourboyRaw = import.meta.glob("/src/content/scripts/YourBoyJevoy/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as EagerMap;
const manualRaw = import.meta.glob(
  "/src/content/scripts/Skills/jevoy-palmer-operating-manual/**/*.md",
  { query: "?raw", import: "default", eager: true },
) as EagerMap;

function basename(path: string): string {
  const segs = path.split("/");
  return segs[segs.length - 1].replace(/\.md$/, "");
}

export type ScriptVersion = "original" | "jevoy" | "palmer-house" | "mindyourbizniz";

export const VERSION_LABEL: Record<ScriptVersion, string> = {
  original: "Original",
  jevoy: "Jevoy Palmer",
  "palmer-house": "Palmer House",
  mindyourbizniz: "MindYourBizniz",
};

export type ScriptEntry = {
  num: string; // "01" … "12"
  number: number;
  title: string;
  originalPath?: string; // path under /hubs/scripts/ for backup link
  versions: Partial<
    Record<
      ScriptVersion,
      { body: string; originalPath: string; filename: string }
    >
  >;
};

function parseOriginal(filename: string): { num: string; title: string } | null {
  // e.g. "Script 02 - Why Some Business Owners Avoid Being Visible"
  const m = filename.match(/^Script\s+(\d+)\s*-\s*(.+)$/);
  if (!m) return null;
  return { num: m[1].padStart(2, "0"), title: m[2].trim() };
}

function parseVersion(filename: string): { num: string; brand: ScriptVersion } | null {
  const m = filename.match(/^Script\s+(\d+)\s*-\s*(Jevoy Palmer|Palmer House Productions|MindYourBizniz)$/);
  if (!m) return null;
  const brand =
    m[2] === "Jevoy Palmer"
      ? "jevoy"
      : m[2] === "Palmer House Productions"
        ? "palmer-house"
        : "mindyourbizniz";
  return { num: m[1].padStart(2, "0"), brand };
}

// Concept grouping: many source files are sibling brand-versions of one theme.
// Map each source script number to a concept (shared num + title) so the hub
// renders ONE row per theme with the version tabs switching between brands.
// Source nums not listed here pass through as their own concept.
type Concept = { num: string; title: string };
const CONCEPT_MAP: Record<string, Concept> = {
  // Trilogy — What Dies When They Leave (no JP version)
  "18": { num: "13", title: "What Dies When They Leave" },
  "19": { num: "13", title: "What Dies When They Leave" },
  // Trilogy — The Mask / Recognized / Known by Thousands
  "22": { num: "14", title: "The Mask Is a Costume, Not a Prison" },
  "23": { num: "14", title: "The Mask Is a Costume, Not a Prison" },
  "24": { num: "14", title: "The Mask Is a Costume, Not a Prison" },
  // Trilogy — Your Own Voice
  "36": { num: "16", title: "Your Own Voice" },
  "37": { num: "16", title: "Your Own Voice" },
  "38": { num: "16", title: "Your Own Voice" },
  // Trilogy — Judged Before You Speak
  "40": { num: "17", title: "Judged Before You Speak" },
  "41": { num: "17", title: "Judged Before You Speak" },
  "42": { num: "17", title: "Judged Before You Speak" },
  // Trilogy — The Height Tax
  "45": { num: "18", title: "The Height Tax" },
  "46": { num: "18", title: "The Height Tax" },
  "47": { num: "18", title: "The Height Tax" },
  // Trilogy — The Miniature Lie
  "48": { num: "19", title: "The Miniature Lie" },
  "49": { num: "19", title: "The Miniature Lie" },
  "50": { num: "19", title: "The Miniature Lie" },
  // MYB EP standalone podcast episodes (26-34) — each its own concept,
  // renumbered into a contiguous block after the trilogies.
  "26": { num: "20", title: "MYB EP — The Mirror With Memory" },
  "27": { num: "21", title: "MYB EP — Why We Hide" },
  "28": { num: "22", title: "MYB EP — Context Doesn't Travel" },
  "29": { num: "23", title: "MYB EP — The Wet Cement" },
  "30": { num: "24", title: "MYB EP — The Compass, Not the Megaphone" },
  "31": { num: "25", title: "MYB EP — A Well-Lit Room With Doors" },
  "32": { num: "26", title: "MYB EP — The Clean Lens" },
  "33": { num: "27", title: "MYB EP — The Empty Chair" },
  "34": { num: "28", title: "MYB EP — The Sharp Photograph" },
};

const byNum = new Map<string, ScriptEntry>();

for (const [path, body] of Object.entries(originalsEager)) {
  const name = basename(path);
  const parsed = parseOriginal(name);
  if (!parsed) continue;
  const entry: ScriptEntry =
    byNum.get(parsed.num) ?? {
      num: parsed.num,
      number: parseInt(parsed.num, 10),
      title: parsed.title,
      versions: {},
    };
  entry.title = parsed.title;
  entry.originalPath = `/hubs/scripts/Originals/${encodeURIComponent(`${name}.md`)}`;
  entry.versions.original = {
    body,
    originalPath: `/hubs/scripts/Originals/${encodeURIComponent(`${name}.md`)}`,
    filename: `${name}.md`,
  };
  byNum.set(parsed.num, entry);
}

for (const [path, body] of Object.entries(versionsEager)) {
  const name = basename(path);
  const parsed = parseVersion(name);
  if (!parsed) continue;
  // Apply concept override so sibling brand-files collapse into one row.
  const concept = CONCEPT_MAP[parsed.num];
  const conceptNum = concept?.num ?? parsed.num;
  const conceptTitle = concept?.title;
  const entry: ScriptEntry =
    byNum.get(conceptNum) ?? {
      num: conceptNum,
      number: parseInt(conceptNum, 10),
      title: conceptTitle ?? `Script ${conceptNum}`,
      versions: {},
    };
  if (conceptTitle) entry.title = conceptTitle;
  // If no original/concept has set a real title yet, derive one from this version's H1.
  if (!conceptTitle && entry.title === `Script ${conceptNum}`) {
    const h1 = body.match(/^#\s+(.+)$/m)?.[1] ?? "";
    // Strip leading brand label like "JEVOY PALMER — " and surrounding quotes.
    const cleaned = h1
      .replace(/^[^—:"']*[—:]\s*/, "")
      .replace(/^["“'']|["”'']$/g, "")
      .replace(/^["“'']|["”'']$/g, "")
      .trim();
    if (cleaned) entry.title = cleaned;
  }
  entry.versions[parsed.brand] = {
    body,
    originalPath: `/hubs/scripts/Versions/${encodeURIComponent(`${name}.md`)}`,
    filename: `${name}.md`,
  };
  byNum.set(conceptNum, entry);
}

export const SCRIPTS: ScriptEntry[] = Array.from(byNum.values()).sort(
  (a, b) => a.number - b.number,
);

export type DocEntry = {
  slug: string;
  title: string;
  load: () => Promise<string>;
  originalPath: string;
  filename: string;
};

function toDocList(raw: EagerMap, folder: string): DocEntry[] {
  return Object.entries(raw)
    .map(([path, body]) => {
      const name = basename(path);
      return {
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        title: name,
        load: () => Promise.resolve(body),
        originalPath: `/hubs/scripts/${folder}/${encodeURIComponent(`${name}.md`)}`,
        filename: `${name}.md`,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const STRATEGY_DOCS: DocEntry[] = toDocList(strategyRaw, "Strategy");
export const RESEARCH_DOCS: DocEntry[] = toDocList(researchRaw, "Research");
export const YOURBOY_DOCS: DocEntry[] = toDocList(yourboyRaw, "YourBoyJevoy");

// Master brief & manual lookups
export const MASTER_BRIEF: DocEntry | undefined = STRATEGY_DOCS.find((d) =>
  /master\s*brief/i.test(d.title),
);

export type ManualEntry = {
  slug: string;
  title: string;
  load: () => Promise<string>;
  isRoot: boolean;
};

export const MANUAL: ManualEntry[] = Object.entries(manualRaw)
  .map(([path, body]) => {
    const name = basename(path);
    const isRoot = /SKILL$/i.test(name);
    return {
      slug: isRoot ? "overview" : name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: isRoot ? "Operating Manual" : name,
      load: () => Promise.resolve(body),
      isRoot,
    };
  })
  .sort((a, b) => (a.isRoot === b.isRoot ? a.title.localeCompare(b.title) : a.isRoot ? -1 : 1));

export function findScript(num: string): ScriptEntry | undefined {
  const padded = num.padStart(2, "0");
  return SCRIPTS.find((s) => s.num === padded);
}