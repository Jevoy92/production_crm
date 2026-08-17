// Build-time INDEX of all bundled script + strategy + research markdown.
// Theme-first model (matches FINAL manifest): one row per theme, with up to
// three venture tabs (JP / PH / MYB). MYB-only themes are shown with the
// MYB tab only.

type EagerMap = Record<string, string>;
type LazyMap = Record<string, () => Promise<string>>;

import manifestJson from "@/content/scripts/Final/_manifest.json";

// Final scripts are NOT eager-bundled: ~1MB of markdown crashes the Nitro
// build (V8 JSON parse abort). They load lazily, with a public/ fallback.
const jpRaw = import.meta.glob("/src/content/scripts/Final/JP/*.md", {
  query: "?raw",
  import: "default",
}) as LazyMap;
const phRaw = import.meta.glob("/src/content/scripts/Final/PH/*.md", {
  query: "?raw",
  import: "default",
}) as LazyMap;
const mybRaw = import.meta.glob("/src/content/scripts/Final/MYB/*.md", {
  query: "?raw",
  import: "default",
}) as LazyMap;
// Teleprompter files are served from /public/hubs/scripts/Final/Teleprompter/
// directly — do NOT eager-bundle them, they bloat the SSR chunk to ~2MB and
// crash the Nitro build with a V8 JSON parse abort.

// Eager-load reference docs too — lazy chunks with spaces in filenames
// were failing to resolve at runtime, leaving the reader blank.
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
  return segs[segs.length - 1].replace(/\.(md|txt)$/, "");
}

export type ScriptVersion = "jevoy" | "palmer-house" | "mindyourbizniz";

export const VERSION_LABEL: Record<ScriptVersion, string> = {
  jevoy: "Jevoy Palmer",
  "palmer-house": "Palmer House",
  mindyourbizniz: "MindYourBizniz",
};

export type Pillar = "Reel" | "Spotlight" | "Evergreen" | "System";

export type ScriptVersionEntry = {
  load: () => Promise<string>;
  originalPath: string;
  filename: string;
  teleprompterPath?: string;
  spokenWords?: number;
};

export type ScriptEntry = {
  num: string; // "01" … "18"
  number: number;
  title: string;
  pillar: Pillar;
  originalPath?: string;
  versions: Partial<Record<ScriptVersion, ScriptVersionEntry>>;
};

type ManifestVenture = {
  script: string;
  teleprompter?: string;
  spoken_words?: number;
};
type ManifestTheme = {
  theme_no: string;
  theme: string;
  pillar: Pillar;
  ventures: Partial<Record<"JP" | "PH" | "MYB", ManifestVenture>>;
};
type Manifest = { themes: ManifestTheme[] };

const VENTURE_TO_BRAND: Record<"JP" | "PH" | "MYB", ScriptVersion> = {
  JP: "jevoy",
  PH: "palmer-house",
  MYB: "mindyourbizniz",
};
const VENTURE_FOLDER: Record<"JP" | "PH" | "MYB", string> = {
  JP: "JP",
  PH: "PH",
  MYB: "MYB",
};

function lookupByBasename(map: LazyMap, file: string): (() => Promise<string>) | undefined {
  const name = file.replace(/\.(md|txt)$/, "");
  for (const [path, loader] of Object.entries(map)) {
    if (basename(path) === name) return loader;
  }
  return undefined;
}

const manifest = manifestJson as unknown as Manifest;

export const SCRIPTS: ScriptEntry[] = manifest.themes.map((t) => {
  const versions: ScriptEntry["versions"] = {};
  for (const key of ["JP", "PH", "MYB"] as const) {
    const v = t.ventures[key];
    if (!v) continue;
    const file = v.script.split("/").pop()!;
    const map = key === "JP" ? jpRaw : key === "PH" ? phRaw : mybRaw;
    const loader = lookupByBasename(map, file);
    if (!loader) continue;
    const teleFile = v.teleprompter?.split("/").pop();
    versions[VENTURE_TO_BRAND[key]] = {
      load: loader,
      filename: file,
      originalPath: `/hubs/scripts/Final/${VENTURE_FOLDER[key]}/${encodeURIComponent(file)}`,
      teleprompterPath: teleFile
        ? `/hubs/scripts/Final/Teleprompter/${encodeURIComponent(teleFile)}`
        : undefined,
      spokenWords: v.spoken_words,
    };
  }
  return {
    num: t.theme_no,
    number: parseInt(t.theme_no, 10),
    title: t.theme,
    pillar: t.pillar,
    versions,
  };
});

export type DocEntry = {
  slug: string;
  title: string;
  load: () => Promise<string>;
  originalPath: string;
  filename: string;
};

function toDocList(raw: LazyMap, folder: string): DocEntry[] {
  return Object.entries(raw)
    .map(([path, loader]) => {
      const name = basename(path);
      return {
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        title: name,
        load: loader,
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
  .map(([path, loader]) => {
    const name = basename(path);
    const isRoot = /SKILL$/i.test(name);
    return {
      slug: isRoot ? "overview" : name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: isRoot ? "Operating Manual" : name,
      load: loader,
      isRoot,
    };
  })
  .sort((a, b) => (a.isRoot === b.isRoot ? a.title.localeCompare(b.title) : a.isRoot ? -1 : 1));

export function findScript(num: string): ScriptEntry | undefined {
  const padded = num.padStart(2, "0");
  return SCRIPTS.find((s) => s.num === padded);
}