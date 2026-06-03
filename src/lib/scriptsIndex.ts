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

// Reference docs remain lazy — they're large and not on the critical path.
const strategyRaw = import.meta.glob("/src/content/scripts/Strategy/*.md", {
  query: "?raw",
  import: "default",
}) as LazyMap;
const researchRaw = import.meta.glob("/src/content/scripts/Research/*.md", {
  query: "?raw",
  import: "default",
}) as LazyMap;
const yourboyRaw = import.meta.glob("/src/content/scripts/YourBoyJevoy/*.md", {
  query: "?raw",
  import: "default",
}) as LazyMap;
const manualRaw = import.meta.glob(
  "/src/content/scripts/Skills/jevoy-palmer-operating-manual/**/*.md",
  { query: "?raw", import: "default" },
) as LazyMap;

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
  const entry: ScriptEntry =
    byNum.get(parsed.num) ?? {
      num: parsed.num,
      number: parseInt(parsed.num, 10),
      title: `Script ${parsed.num}`,
      versions: {},
    };
  entry.versions[parsed.brand] = {
    body,
    originalPath: `/hubs/scripts/Versions/${encodeURIComponent(`${name}.md`)}`,
    filename: `${name}.md`,
  };
  byNum.set(parsed.num, entry);
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

function toDocList(raw: LazyMap, folder: string): DocEntry[] {
  return Object.entries(raw)
    .map(([path, load]) => {
      const name = basename(path);
      return {
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        title: name,
        load,
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
  .map(([path, load]) => {
    const name = basename(path);
    const isRoot = /SKILL$/i.test(name);
    return {
      slug: isRoot ? "overview" : name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: isRoot ? "Operating Manual" : name,
      load,
      isRoot,
    };
  })
  .sort((a, b) => (a.isRoot === b.isRoot ? a.title.localeCompare(b.title) : a.isRoot ? -1 : 1));

export function findScript(num: string): ScriptEntry | undefined {
  const padded = num.padStart(2, "0");
  return SCRIPTS.find((s) => s.num === padded);
}