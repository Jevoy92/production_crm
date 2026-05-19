// Eagerly bundles ALL script/strategy/research/manual markdown into a single
// chunk. This module is intentionally heavy (~1MB) — it's loaded only by the
// detail routes via a dynamic import in useLazySource, NOT by the Scripts hub
// page. Once loaded, every script body / version switch is instant (no extra
// network round-trip per file).

type BodyMap = Record<string, string>;

const originals = import.meta.glob("/src/content/scripts/Originals/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as BodyMap;
const versions = import.meta.glob("/src/content/scripts/Versions/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as BodyMap;
const strategy = import.meta.glob("/src/content/scripts/Strategy/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as BodyMap;
const research = import.meta.glob("/src/content/scripts/Research/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as BodyMap;
const yourboy = import.meta.glob("/src/content/scripts/YourBoyJevoy/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as BodyMap;
const manual = import.meta.glob(
  "/src/content/scripts/Skills/jevoy-palmer-operating-manual/**/*.md",
  { query: "?raw", import: "default", eager: true },
) as BodyMap;

export const BODIES: BodyMap = {
  ...originals,
  ...versions,
  ...strategy,
  ...research,
  ...yourboy,
  ...manual,
};