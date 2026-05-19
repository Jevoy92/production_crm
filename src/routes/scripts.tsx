import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import {
  BookOpen,
  ExternalLink,
  FileText,
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
      {/* Pinned navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PinnedCard
          to="/scripts/strategy"
          icon={<BookOpen className="size-4 text-primary" />}
          eyebrow="Strategy"
          title="Master brief & investigative universe"
          desc={`${STRATEGY_DOCS.length} docs — voice rules, themes, lanes`}
          color="#B8530A"
        />
        <PinnedCard
          to="/scripts/manual"
          icon={<Sparkles className="size-4 text-primary" />}
          eyebrow="Operating Manual"
          title="Jevoy Palmer voice profile"
          desc="Voice, ventures, faith integration, content rules"
          color="#3D1A66"
        />
        <PinnedCard
          to="/scripts/research"
          icon={<FlaskConical className="size-4 text-primary" />}
          eyebrow="Research"
          title="The recorded animal & ecosystem"
          desc={`${RESEARCH_DOCS.length} maps — projection, context`}
          color="#0A9B8F"
        />
      </div>

      {/* Filters */}
      <div className="card-elevated rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scripts…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-2 border border-border text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BRANDS.map((b) => (
            <button
              key={b.value}
              onClick={() => setBrand(b.value)}
              className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                brand === b.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Script grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <ScriptCard key={s.num} script={s} preferredBrand={brand === "all" ? undefined : brand} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground text-[13px] py-12">
            No scripts match your filters.
          </div>
        )}
      </div>

      {/* Strategy + Research + YourBoyJevoy lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <DocList title="Strategy" docs={STRATEGY_DOCS} to="/scripts/strategy" />
        <DocList title="Research" docs={RESEARCH_DOCS} to="/scripts/research" />
        <DocList title="YourBoyJevoy" docs={YOURBOY_DOCS} to="/scripts/yourboy" />
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
  color,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="card-elevated rounded-2xl overflow-hidden group hover:border-primary/40 transition-colors block"
    >
      <div
        className="relative h-32 overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
            backgroundSize: "14px 14px",
          }}
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-white/95 bg-black/30 backdrop-blur px-2 py-1 rounded-md">
          {icon} {eyebrow}
        </div>
      </div>
      <div className="p-5">
        <div className="text-[15px] font-semibold tracking-tight leading-snug mb-1.5 group-hover:text-primary transition-colors">
          {title}
        </div>
        <div className="text-[12.5px] text-muted-foreground leading-relaxed">{desc}</div>
      </div>
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
  const palette = SCRIPT_PALETTES[(parseInt(script.num, 10) - 1) % SCRIPT_PALETTES.length];
  return (
    <Link
      to="/scripts/$num"
      params={{ num: script.num }}
      search={{ v: target }}
      className="card-elevated rounded-2xl overflow-hidden group hover:border-primary/40 transition-colors block"
    >
      <div
        className="relative h-28 overflow-hidden flex items-center justify-between px-5"
        style={{ backgroundColor: palette.color }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0 1px, transparent 1px 12px)",
          }}
        />
        <div className="relative z-10">
          <div className="text-[9px] font-mono tracking-[0.22em] uppercase text-white/80 mb-0.5">
            Script
          </div>
          <div
            className="font-serif font-semibold leading-none text-white"
            style={{ fontSize: 56, fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {script.num}
          </div>
        </div>
        <FileText className="relative z-10 size-5 text-white/70 group-hover:text-white transition-colors" />
      </div>
      <div className="p-5">
        <div className="text-[15px] font-semibold tracking-tight leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-3">
          {script.title}
        </div>
        <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => {
          const has = Boolean(script.versions[c.key]);
          const highlight = preferredBrand && preferredBrand !== "all" && preferredBrand === c.key;
          return (
            <span
              key={c.key}
              className={`text-[10px] px-2 py-0.5 rounded-md border ${
                has
                  ? highlight
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-surface-2 text-muted-foreground border-border"
                  : "bg-transparent text-muted-foreground/40 border-border/50 line-through"
              }`}
            >
              {c.label}
            </span>
          );
        })}
        </div>
      </div>
    </Link>
  );
}

// Pillar-tinted solid colors rotated across the 12 scripts so each card has its
// own visual identity without needing real imagery.
const SCRIPT_PALETTES: { color: string }[] = [
  { color: "#E8720C" }, // Reel
  { color: "#3D1A66" }, // Spotlight
  { color: "#5B8A2D" }, // Evergreen
  { color: "#0A9B8F" }, // System
  { color: "#B8530A" },
  { color: "#6A2BAE" },
  { color: "#2F5C18" },
  { color: "#066B62" },
  { color: "#1F2A44" },
  { color: "#C4654A" },
  { color: "#7D3C98" },
  { color: "#D4842A" },
];

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
    <div className="card-elevated rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">
        {title}
      </div>
      <ul className="space-y-1.5">
        {docs.map((d) => (
          <li key={d.slug}>
            <Link
              to={to}
              search={{ doc: d.slug }}
              className="text-[13px] text-foreground/85 hover:text-primary transition-colors block leading-snug"
            >
              {d.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}