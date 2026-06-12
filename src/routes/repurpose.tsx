import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Card, EmptyState, Pill, SegmentedControl } from "@/components/app/AppShell";
import { SCRIPTS } from "@/lib/scriptsIndex";
import { useCCStore, type Platform, type PalLane } from "@/lib/ccStore";
import { generateShorts } from "@/lib/repurpose.functions";
import { Sparkles, Loader2, Check, ArrowRight, Plus, Search, Wand2, Library } from "lucide-react";
import { shortsForCore12, colorForShortType, type CoreShort } from "@/lib/coreShortsLibrary";

export const Route = createFileRoute("/repurpose")({
  component: RepurposePage,
  head: () => ({
    meta: [
      { title: "Repurpose · Palmer House OS" },
      { name: "description", content: "Turn one long-form script into 3 short-form scripts that funnel viewers back to the long-form video." },
    ],
  }),
});

type Short = {
  platform: "Instagram Reels" | "YouTube Shorts" | "TikTok";
  hook: string;
  body: string;
  cta: string;
  durationSec: number;
};

const ALL_PLATFORMS: Short["platform"][] = ["Instagram Reels", "YouTube Shorts", "TikTok"];

const PAL_FOR_NUM: PalLane[] = ["Spotlight","Spotlight","Evergreen","Spotlight","Evergreen","Spotlight","Reel","Spotlight","Spotlight","Spotlight","System","System"];

function pickScriptBody(num: string): string {
  const s = SCRIPTS.find((x) => x.num === num);
  if (!s) return "";
  return s.versions.original?.body ?? Object.values(s.versions)[0]?.body ?? "";
}

function platformToLibrary(p: Short["platform"]): Platform {
  if (p === "YouTube Shorts") return "YouTube Shorts";
  if (p === "TikTok") return "TikTok";
  return "Instagram Reels";
}

function RepurposePage() {
  const generate = useServerFn(generateShorts);
  const addContentItem = useCCStore((s) => s.addContentItem);
  const library = useCCStore((s) => s.library);
  const [activeNum, setActiveNum] = useState<string>(SCRIPTS[0]?.num ?? "01");
  const [platforms, setPlatforms] = useState<Short["platform"][]>([...ALL_PLATFORMS]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shorts, setShorts] = useState<Short[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [libSaved, setLibSaved] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"ai" | "library">("ai");

  const active = useMemo(() => SCRIPTS.find((s) => s.num === activeNum), [activeNum]);
  const body = useMemo(() => (active ? pickScriptBody(active.num) : ""), [active]);
  const prewritten = useMemo<CoreShort[]>(
    () => (active ? shortsForCore12(active.number) : []),
    [active],
  );
  const filteredScripts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SCRIPTS;
    return SCRIPTS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.num.includes(q),
    );
  }, [query]);

  // Detect shorts already saved (by exact caption match to avoid dupes within session)
  const savedTitleSet = useMemo(
    () => new Set(library.map((c) => c.title)),
    [library],
  );

  const saveOneFromLibrary = (s: CoreShort) => {
    if (!active) return;
    const lane: PalLane = s.lane;
    addContentItem({
      venture: "palmer-house",
      title: `${s.num} ${s.hook}`.slice(0, 140),
      type: "Short",
      platform: "Instagram Reels",
      status: "Ready to Film",
      palLane: lane,
      relatedCore12: active.number,
      parentScriptNum: active.number,
      businessPurpose: `${s.type} — funnels back to long-form #${active.num}: ${active.title}`,
      cta: s.cta,
      fileLocation: "",
      editorNotes: `Type: ${s.type} · Target ${s.durationSec}s`,
      caption: `${s.hook}\n\n${s.body}\n\n${s.cta}`,
      thumbnailIdea: "",
      repurposingStatus: `Pre-written short ${s.num}`,
      performanceNotes: "",
    });
    setLibSaved((prev) => new Set(prev).add(s.num));
  };

  const saveAllFromLibrary = () => {
    prewritten.forEach((s) => {
      const title = `${s.num} ${s.hook}`.slice(0, 140);
      if (savedTitleSet.has(title)) return;
      saveOneFromLibrary(s);
    });
  };

  const togglePlatform = (p: Short["platform"]) => {
    setPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p],
    );
  };

  const selectScript = (num: string) => {
    setActiveNum(num);
    setShorts(null);
    setError(null);
    setSavedIds(new Set());
  };

  const run = async () => {
    if (!active || !body) return;
    setBusy(true);
    setError(null);
    setShorts(null);
    setSavedIds(new Set());
    try {
      const res = await generate({
        data: {
          scriptNum: active.num,
          scriptTitle: active.title,
          scriptBody: body.slice(0, 35_000),
          platforms,
        },
      });
      const list = res.shorts as Short[];
      setShorts(list);
      // Auto-save all 3 to library immediately
      const newSaved = new Set<number>();
      const lane = PAL_FOR_NUM[active.number - 1] ?? "Spotlight";
      list.forEach((s, idx) => {
        addContentItem({
          venture: "palmer-house",
          title: s.hook.split("\n")[0].slice(0, 140),
          type: "Short",
          platform: platformToLibrary(s.platform),
          status: "Ready to Film",
          palLane: lane,
          relatedCore12: active.number,
          parentScriptNum: active.number,
          businessPurpose: `Teases long-form script #${active.num}: ${active.title}`,
          cta: s.cta,
          fileLocation: "",
          editorNotes: `Duration target: ${s.durationSec}s`,
          caption: `${s.hook}\n\n${s.body}\n\n${s.cta}`,
          thumbnailIdea: "",
          repurposingStatus: `Generated from #${active.num}`,
          performanceNotes: "",
        });
        newSaved.add(idx);
      });
      setSavedIds(newSaved);
    } catch (e) {
      console.error("[repurpose] generate failed", e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      eyebrow="Engine"
      title="Repurpose"
      subtitle="One long-form → three shorts that funnel viewers back."
      actions={
        <Link
          to="/content"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sunken border border-line text-mid hover:text-hi hover:bg-raised text-xs font-semibold transition-colors"
        >
          Open Content <ArrowRight size={13} />
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        {/* Script picker */}
        <aside className="lg:sticky lg:top-4 lg:self-start space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scripts…"
              className="w-full bg-panel border border-line rounded-xl pl-9 pr-3 py-2.5 text-sm text-hi placeholder-lo focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="bg-panel border border-line rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-lo">Long-form</h3>
              <span className="text-[10.5px] font-bold text-lo">{filteredScripts.length}</span>
            </div>
            <div className="max-h-[68vh] overflow-y-auto p-1.5">
              {filteredScripts.map((s) => {
                const isActive = s.num === activeNum;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => selectScript(s.num)}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? "bg-brand-600/10 text-hi"
                        : "text-mid hover:text-hi hover:bg-sunken"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold tabular-nums w-7 flex-shrink-0 mt-0.5 ${
                        isActive ? "text-brand-400" : "text-lo"
                      }`}
                    >
                      {s.num}
                    </span>
                    <span className="text-[13px] leading-snug">{s.title}</span>
                  </button>
                );
              })}
              {filteredScripts.length === 0 && (
                <div className="text-center text-lo text-sm py-8">No matches.</div>
              )}
            </div>
          </div>
        </aside>

        {/* Editor + results */}
        <div className="min-w-0 space-y-6">
          {/* Hero composer */}
          <section className="bg-panel border border-line rounded-2xl overflow-hidden shadow-[var(--elev-card)]">
            <div className="px-6 pt-6 pb-5 border-b border-line">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="text-lo text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1.5">
                    Source · #{active?.num}
                  </div>
                  <h2 className="font-display font-bold text-hi text-xl tracking-tight leading-snug truncate">
                    {active?.title ?? "Select a script"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={run}
                  disabled={busy || !active || !body}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-[var(--elev-card)] flex-shrink-0"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                  {busy ? "Generating…" : "Generate 3 shorts"}
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-lo mr-1">Platforms</span>
                {ALL_PLATFORMS.map((p) => {
                  const on = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        on
                          ? "bg-brand-600/15 border-brand-500/40 text-brand-400"
                          : "bg-sunken border-line text-mid hover:text-hi"
                      }`}
                    >
                      {on && <Check size={11} />}
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            {body ? (
              <div className="px-6 py-4 max-h-48 overflow-y-auto text-[13px] leading-relaxed text-mid whitespace-pre-wrap bg-sunken/40">
                {body.slice(0, 1400)}
                {body.length > 1400 ? "…" : ""}
              </div>
            ) : (
              <div className="px-6 py-6 text-sm text-mid">
                This script has no body yet — write it under Scripts first.
              </div>
            )}
            {error && (
              <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-rose/10 border border-rose/30 text-rose text-xs font-medium">
                {error}
              </div>
            )}
          </section>

          {/* Source toggle */}
          <div className="flex items-center justify-between gap-4">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: "ai", label: <span className="inline-flex items-center gap-1.5"><Sparkles size={12} /> AI generated{shorts ? ` (${shorts.length})` : ""}</span> },
                { value: "library", label: <span className="inline-flex items-center gap-1.5"><Library size={12} /> Pre-written ({prewritten.length})</span> },
              ]}
            />
            {tab === "library" && prewritten.length > 0 && (
              <button
                type="button"
                onClick={saveAllFromLibrary}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sunken border border-line text-mid hover:text-hi hover:bg-raised text-xs font-semibold transition-colors"
              >
                <Plus size={13} /> Save all
              </button>
            )}
          </div>

          {/* AI tab */}
          {tab === "ai" && (
            shorts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {shorts.map((s, i) => (
                  <article
                    key={i}
                    className="bg-panel border border-line rounded-2xl p-5 flex flex-col gap-3 hover:border-brand-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Pill tone="brand">{s.platform}</Pill>
                      <span className="text-xs font-bold text-lo tabular-nums">{s.durationSec}s</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-lo mb-1">Hook</div>
                      <div className="text-[15px] font-semibold text-hi leading-snug">{s.hook}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-lo mb-1">Body</div>
                      <div className="text-[13px] text-mid leading-relaxed whitespace-pre-wrap">{s.body}</div>
                    </div>
                    <div className="mt-auto pt-2 border-t border-line">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-lo mb-1">CTA → long-form</div>
                      <div className="text-[13px] text-brand-400 font-semibold">{s.cta}</div>
                    </div>
                    {savedIds.has(i) && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald">
                        <Check size={12} /> Saved to Library
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  icon={<Sparkles size={20} />}
                  title={busy ? "Cooking 3 shorts…" : "No shorts generated yet"}
                  description={
                    busy
                      ? "The model is teasing one idea per platform from the long-form."
                      : "Pick your platforms above, then hit Generate 3 shorts."
                  }
                />
              </Card>
            )
          )}

          {/* Library tab */}
          {tab === "library" && (
            prewritten.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {prewritten.map((s) => {
                  const saved =
                    libSaved.has(s.num) ||
                    savedTitleSet.has(`${s.num} ${s.hook}`.slice(0, 140));
                  const color = colorForShortType(s.type);
                  return (
                    <article
                      key={s.num}
                      className="bg-panel border border-line rounded-2xl p-5 flex flex-col gap-3 hover:border-brand-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold tabular-nums text-lo">{s.num}</span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: `${color}22`, color }}
                          >
                            {s.type}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-lo tabular-nums">{s.durationSec}s</span>
                      </div>
                      <div className="text-[15px] font-semibold text-hi leading-snug">{s.hook}</div>
                      <div
                        className="text-[12.5px] text-mid leading-relaxed whitespace-pre-wrap overflow-hidden"
                        style={{
                          maxHeight: 120,
                          maskImage: "linear-gradient(to bottom, black 55%, transparent)",
                          WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent)",
                        }}
                      >
                        {s.body}
                      </div>
                      <div className="text-[12.5px] text-brand-400 font-semibold">→ {s.cta}</div>
                      <div className="mt-auto pt-2 flex justify-end">
                        {saved ? (
                          <Pill tone="emerald"><Check size={11} /> In Library</Pill>
                        ) : (
                          <button
                            type="button"
                            onClick={() => saveOneFromLibrary(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
                          >
                            <Plus size={12} /> Save
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Card>
                <EmptyState
                  icon={<Library size={20} />}
                  title="No pre-written shorts for this script"
                  description="Use the AI tab to generate three custom shorts instead."
                />
              </Card>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}