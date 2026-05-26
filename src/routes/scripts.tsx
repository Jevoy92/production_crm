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
  ChevronDown,
  Copy,
  Download,
} from "lucide-react";
import { SCRIPTS, STRATEGY_DOCS, RESEARCH_DOCS, YOURBOY_DOCS } from "@/lib/scriptsIndex";
import { Markdown } from "@/components/Markdown";
import { useLazySource } from "@/lib/useLazySource";

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
  const [openNum, setOpenNum] = useState<string | null>(null);

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
      <div className="max-w-5xl mx-auto space-y-10 py-2">
        {/* Search & Filter — top */}
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

        {/* Sleek collapsible script list */}
        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground text-[13px] py-16">
            No scripts match your filters.
          </div>
        ) : (
          <div className="border-t border-border">
            {filtered.map((s) => (
              <ScriptRow
                key={s.num}
                script={s}
                open={openNum === s.num}
                onToggle={() => setOpenNum(openNum === s.num ? null : s.num)}
                preferredBrand={brand === "all" ? undefined : brand}
              />
            ))}
          </div>
        )}

        {/* Pinned reference — bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10 border-t border-border">
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

        {/* Doc lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

function ScriptRow({
  script,
  open,
  onToggle,
  preferredBrand,
}: {
  script: (typeof SCRIPTS)[number];
  open: boolean;
  onToggle: () => void;
  preferredBrand?: BrandFilter;
}) {
  const versions: { key: "original" | "jevoy" | "palmer-house" | "mindyourbizniz"; label: string }[] = [
    { key: "original", label: "Master" },
    { key: "jevoy", label: "Jevoy Palmer" },
    { key: "palmer-house", label: "Palmer House" },
    { key: "mindyourbizniz", label: "MindYourBizniz" },
  ];
  const pillar = pillarFor(script.num);
  const initial = (preferredBrand && preferredBrand !== "all" && script.versions[preferredBrand])
    ? preferredBrand
    : (versions.find((v) => script.versions[v.key])?.key ?? "original");
  const [activeVersion, setActiveVersion] = useState<typeof versions[number]["key"]>(initial);
  const entry = script.versions[activeVersion];
  const { source, loading } = useLazySource(open ? entry?.load : undefined);

  const copyText = async () => {
    if (!source) return;
    await navigator.clipboard.writeText(source);
  };
  const downloadMd = () => {
    if (!entry || !source) return;
    const blob = new Blob([source], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full group flex items-baseline gap-5 py-4 px-1 text-left transition-colors hover:bg-muted/30"
      >
        <span
          className="text-[15px] tabular-nums text-muted-foreground/70 font-medium w-8 shrink-0"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {script.num}
        </span>
        <span
          className="flex-1 text-[17px] leading-snug font-medium tracking-tight truncate"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {script.title}
        </span>
        <span className="hidden md:inline text-[9px] tracking-[0.24em] font-bold uppercase text-muted-foreground/70 shrink-0">
          {pillar}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-6 pl-14 pr-2 -mt-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 min-w-0">
              {versions.map((v) => {
                const has = Boolean(script.versions[v.key]);
                const active = activeVersion === v.key;
                if (!has) {
                  return (
                    <span
                      key={v.key}
                      className="text-[10px] uppercase tracking-[0.18em] px-3 py-2 border border-dashed border-border/60 text-muted-foreground/40 text-center"
                    >
                      {v.label}
                    </span>
                  );
                }
                return (
                  <button
                    key={v.key}
                    onClick={() => setActiveVersion(v.key)}
                    className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-2 border text-center transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground hover:bg-muted/50"
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
          {entry ? (
            <div className="bg-card border border-border p-5 md:p-7">
              <div className="flex items-center justify-end gap-2 mb-4 pb-3 border-b border-border">
                <Btn variant="subtle" onClick={copyText} className="flex items-center gap-1.5 h-7 text-[11px]">
                  <Copy className="size-3" /> Copy
                </Btn>
                <Btn variant="subtle" onClick={downloadMd} className="flex items-center gap-1.5 h-7 text-[11px]">
                  <Download className="size-3" /> .md
                </Btn>
                <a href={entry.originalPath} target="_blank" rel="noopener noreferrer">
                  <Btn variant="subtle" className="flex items-center gap-1.5 h-7 text-[11px]">
                    <ExternalLink className="size-3" /> Original
                  </Btn>
                </a>
              </div>
              {loading ? (
                <div className="text-muted-foreground text-[13px] italic">Loading…</div>
              ) : source ? (
                <Markdown source={source} />
              ) : (
                <div className="text-muted-foreground text-[13px] italic">
                  Couldn't load this script.
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-[13px] italic px-1">
              This version hasn't been written yet.
            </div>
          )}
        </div>
      )}
    </div>
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