// Research packs: structured B-roll/research data per script theme.

export type ResearchLink = { label: string; url: string };

export type StudyCard = {
  id: string;
  number: number;
  title: string;
  say: string;
  card: string;
  /** Primary link (deprecated in favor of `links`, kept for compat) */
  link?: string;
  links?: ResearchLink[];
  visual: string;
};

export type VisualBeat = {
  id: string;
  title: string;
  description: string;
};

export type ShotListItem = {
  id: string;
  label: string;
};

export type ResearchPack = {
  theme_no: string;
  title: string;
  subtitle?: string;
  driveFolderUrl?: string;
  howToUse?: string;
  deliveryRule?: string;
  studies: StudyCard[];
  beats: VisualBeat[];
  shotList: ShotListItem[];
};

// Bundle every pack file in src/content/research at build time.
const packModules = import.meta.glob<{ pack?: ResearchPack; default?: ResearchPack }>(
  "/src/content/research/*.ts",
  { eager: true },
);

const PACKS: Record<string, ResearchPack> = {};
for (const mod of Object.values(packModules)) {
  const p = mod.pack ?? mod.default;
  if (p?.theme_no) PACKS[p.theme_no] = p;
}

export function getResearchPack(themeNo: string): ResearchPack | undefined {
  return PACKS[themeNo.padStart(2, "0")];
}

export function hasResearchPack(themeNo: string): boolean {
  return Boolean(PACKS[themeNo.padStart(2, "0")]);
}

/** All sources for a pack flattened into [card_id, label] pairs. */
export function packCardOptions(pack: ResearchPack) {
  return [
    ...pack.studies.map((s) => ({ id: s.id, label: `${s.number}. ${s.title}` })),
    ...pack.beats.map((b) => ({ id: b.id, label: `Beat: ${b.title}` })),
  ];
}