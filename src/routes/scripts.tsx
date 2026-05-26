import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import {
  BookOpen,
  ExternalLink,
  FlaskConical,
  Search,
  Sparkles,
} from "lucide-react";
import { SCRIPTS, STRATEGY_DOCS, RESEARCH_DOCS, YOURBOY_DOCS } from "@/lib/scriptsIndex";

export const Route = createFileRoute("/scripts")({
  component: ScriptsLayout,
  head: () => ({
    meta: [
      { title: "Scripts · Palmer House OS" },
      { name: "description", content: "Cross-venture scripts hub — 12 themes across Jevoy Palmer, Palmer House, and MindYourBizniz." },
    ],
  }),
});

function ScriptsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/scripts" && pathname.startsWith("/scripts");
  return isChild ? <Outlet /> : <ScriptsHub />;
}

type BrandFilter = "all" | "original" | "jevoy" | "palmer-house" | "mindyourbizniz";

const BRANDS: { value: BrandFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "original", label: "Original" },
  { value: "jevoy", label: "Jevoy" },
  { value: "palmer-house", label: "Palmer House" },
  { value: "mindyourbizniz", label: "MindYourBizniz" },
];

const PILLARS = ["Reel", "Spotlight", "Evergreen", "System"] as const;
function pillarFor(num: string) {
  const n = parseInt(num, 10);
  return PILLARS[(n - 1) % 4];
}

function ScriptsHub() {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<BrandFilter>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SCRIPTS.filter((s) => {
      if (needle && !`${s.num} ${s.title}`.toLowerCase().includes(needle)) return false;
      if (brand !== "all" && !s.versions[brand]) return false;
      return true;
    });
  }, [q, brand]);

  return (
    <Shell
      title="Scripts"
      subtitle={`${SCRIPTS.length} themes · 3 brand voices · MindYourBizniz podcast`}
      actions={
        <a href="/hubs/scripts/index.html" target="_blank" rel="noopener noreferrer">
          <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
            <ExternalLink className="size-3.5" /> Open original hub
          </Btn>
        </a>
      }
    >
      <div className="max-w-7xl mx-auto space-y-12 py-2">
        {/* Pinned navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PinnedCard
            to="/scripts/strategy"
            icon={<BookOpen className="size-3.5" />}
            eyebrow="Strategy"
            title="Master brief & investigative universe"
            desc={`${STRATEGY_DOCS.length} docs — voice rules, themes, lanes`}
          />
          <PinnedCard
            to="/scripts/manual"
            icon={<Sparkles className="size-3.5" />}
            eyebrow="Operating Manual"
            title="Jevoy Palmer voice profile"
            desc="Voice, ventures, content rules"
          />
          <PinnedCard
            to="/scripts/research"
            icon={<FlaskConical className="size-3.5" />}
            eyebrow="Research"
            title="The recorded animal & ecosystem"
            desc={`${RESEARCH_DOCS.length} maps — projection, context`}
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-border pb-6">
          <div className="relative w-full md:max-w-md">
            <Search className="size-4 absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scripts…"
              className="w-full pl-7 pr-3 py-2 bg-transparent text-lg font-light border-none focus:outline-none placeholder:text-muted-foreground/40"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
          </div>
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((b) => {
              const active = brand === b.value;
              return (
                <button
                  key={b.value}
                  onClick={() => setBrand(b.value)}
                  className={`px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase font-semibold border transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Masonry editorial grid */}
        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground text-[13px] py-16">
            No scripts match your filters.
          </div>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6 [&>*]:mb-6">
            {filtered.map((s) => (
              <ScriptCard
                key={s.num}
                script={s}
                preferredBrand={brand === "all" ? undefined : brand}
              />
            ))}
          </div>
        )}

        {/* Doc lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-border">
          <DocList title="Strategy" docs={STRATEGY_DOCS} to="/scripts/strategy" />
          <DocList title="Research" docs={RESEARCH_DOCS} to="/scripts/research" />
          <DocList title="YourBoyJevoy" docs={YOURBOY_DOCS} to="/scripts/yourboy" />
        </div>
      </div>
    </Shell>
  );
}

function PinnedCard({
  to,
  icon,
  eyebrow,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group block bg-card border border-border p-7 transition-all duration-300 hover:border-foreground hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex justify-between items-start mb-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] font-bold uppercase text-muted-foreground">
          {icon} {eyebrow}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground group-hover:scale-150 transition-transform" />
      </div>
      <h2
        className="text-[22px] leading-tight font-medium mb-2 tracking-tight"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {title}
      </h2>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{desc}</p>
    </Link>
  );
}

function ScriptCard({
  script,
  preferredBrand,
}: {
  script: (typeof SCRIPTS)[number];
  preferredBrand?: BrandFilter;
}) {
  const chips: { key: "original" | "jevoy" | "palmer-house" | "mindyourbizniz"; label: string }[] = [
    { key: "original", label: "Master" },
    { key: "jevoy", label: "Jevoy" },
    { key: "palmer-house", label: "Palmer House" },
    { key: "mindyourbizniz", label: "MYB" },
  ];
  const target = preferredBrand && preferredBrand !== "all" ? preferredBrand : "original";
  const pillar = pillarFor(script.num);
  // Every Spotlight script renders as the inverted dark feature card for rhythm.
  const dark = pillar === "Spotlight";
  return (
    <Link
      to="/scripts/$num"
      params={{ num: script.num }}
      search={{ v: target }}
      className={`break-inside-avoid group block p-8 border transition-all duration-500 hover:-translate-y-0.5 hover:shadow-2xl ${
        dark
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:border-foreground/40"
      }`}
    >
      <div className="flex justify-between items-baseline mb-10">
        <span
          className={`text-[56px] leading-none font-bold italic transition-colors duration-500 ${
            dark
              ? "text-background/10 group-hover:text-background/30"
              : "text-muted-foreground/15 group-hover:text-foreground"
          }`}
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {script.num}
        </span>
        <span
          className={`text-[9px] tracking-[0.28em] font-bold uppercase ${
            dark ? "text-background/50" : "text-muted-foreground"
          }`}
        >
          Pillar · {pillar}
        </span>
      </div>
      <h3
        className="text-[26px] leading-tight mb-8 font-medium tracking-tight"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {script.title}
      </h3>
      <div
        className={`flex flex-wrap gap-1.5 pt-6 border-t ${dark ? "border-background/10" : "border-border/60"}`}
      >
        {chips.map((c) => {
          const has = Boolean(script.versions[c.key]);
          const highlight =
            preferredBrand && preferredBrand !== "all" && preferredBrand === c.key;
          return (
            <span
              key={c.key}
              className={`text-[9px] px-2 py-0.5 uppercase tracking-tight border ${
                has
                  ? dark
                    ? highlight
                      ? "bg-background/15 border-background/40 text-background"
                      : "border-background/20 text-background/70"
                    : highlight
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground"
                  : dark
                    ? "border-background/10 text-background/30 line-through"
                    : "border-border/40 text-muted-foreground/40 line-through"
              }`}
            >
              {c.label}
            </span>
          );
        })}
      </div>
    </Link>
  );
}

function DocList({
  title,
  docs,
  to,
}: {
  title: string;
  docs: { slug: string; title: string }[];
  to: string;
}) {
  if (docs.length === 0) return null;
  return (
    <div className="bg-card border border-border p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4">
        {title}
      </div>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.slug}>
            <Link
              to={to}
              search={{ doc: d.slug }}
              className="text-[13px] text-foreground/85 hover:text-foreground hover:underline underline-offset-4 transition-colors block leading-snug"
            >
              {d.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}