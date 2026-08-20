import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Card, EmptyState, SegmentedControl } from "@/components/app/AppShell";
import { Btn } from "@/components/ui-bits/Modal";
import { GenerationBody, HistoryList } from "@/components/shorts/GenerationViews";
import { SCRIPTS, VERSION_LABEL, type ScriptVersion } from "@/lib/scriptsIndex";
import { generateShortIdeas } from "@/lib/shortIdeas.functions";
import {
  key as genKey,
  listCurrent,
  listGenerations,
  saveGeneration,
  type ShortsGeneration,
} from "@/lib/shortsLibrary";
import {
  ArrowRight,
  Check,
  Clapperboard,
  History,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/repurpose")({
  component: ShortsPage,
  head: () => ({
    meta: [
      { title: "Shorts · Palmer House OS" },
      {
        name: "description",
        content:
          "One hub for shorts: generate prop-led shorts from any long-form script, batch every script, and keep a permanent history.",
      },
      { property: "og:title", content: "Shorts · Palmer House OS" },
      {
        property: "og:description",
        content: "Generate, batch and archive prop-led shorts for every Palmer House script.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Target = {
  id: string;
  scriptNum: string;
  scriptTitle: string;
  venture: ScriptVersion;
  sourceUrl: string;
};

const VENTURES: ScriptVersion[] = ["jevoy", "palmer-house", "mindyourbizniz"];

async function loadSource(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load script (${res.status})`);
  return await res.text();
}

function ShortsPage() {
  const runIdeas = useServerFn(generateShortIdeas);

  const targets = useMemo<Target[]>(
    () =>
      SCRIPTS.flatMap((s) =>
        VENTURES.flatMap((v) => {
          const entry = s.versions[v];
          if (!entry) return [];
          return [
            {
              id: genKey(s.num, v),
              scriptNum: s.num,
              scriptTitle: s.title,
              venture: v,
              sourceUrl: entry.originalPath,
            },
          ];
        }),
      ),
    [],
  );

  const [tab, setTab] = useState<"script" | "batch" | "history">("script");
  const [current, setCurrent] = useState<Record<string, ShortsGeneration>>({});
  const [history, setHistory] = useState<ShortsGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ventureFilter, setVentureFilter] = useState<"all" | ScriptVersion>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>(targets[0]?.id ?? "");
  const stopRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [cur, all] = await Promise.all([listCurrent(), listGenerations()]);
      const map: Record<string, ShortsGeneration> = {};
      for (const g of cur) {
        const k = genKey(g.script_num, g.venture);
        if (!map[k]) map[k] = g;
      }
      setCurrent(map);
      setHistory(all);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load your shorts library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const generateOne = useCallback(
    async (t: Target) => {
      setActiveId(t.id);
      try {
        const source = await loadSource(t.sourceUrl);
        const prev = current[t.id];
        const res = await runIdeas({
          data: {
            scriptNum: t.scriptNum,
            scriptTitle: t.scriptTitle,
            scriptBody: source.slice(0, 40_000),
            venture: t.venture,
            avoid: prev
              ? prev.ideas.flatMap((i) => [i.prop, i.title].filter(Boolean)).slice(0, 12)
              : undefined,
          },
        });
        const saved = await saveGeneration({
          scriptNum: t.scriptNum,
          scriptTitle: t.scriptTitle,
          venture: t.venture,
          ideas: res.ideas,
        });
        if (saved) {
          setCurrent((prev) => ({ ...prev, [t.id]: saved }));
          setHistory((prev) => [saved, ...prev]);
        }
        setFailed((prev) => {
          const next = { ...prev };
          delete next[t.id];
          return next;
        });
        return true;
      } catch (err) {
        console.error(err);
        setFailed((prev) => ({ ...prev, [t.id]: (err as Error)?.message ?? "Failed" }));
        toast.error("Couldn't generate shorts for that script.");
        return false;
      } finally {
        setActiveId(null);
      }
    },
    [runIdeas, current],
  );

  const runBatch = useCallback(
    async (list: Target[]) => {
      if (running || list.length === 0) return;
      stopRef.current = false;
      setRunning(true);
      setQueue(list.map((t) => t.id));
      let done = 0;
      for (const t of list) {
        if (stopRef.current) break;
        await generateOne(t);
        done += 1;
        setQueue(list.slice(done).map((x) => x.id));
      }
      setRunning(false);
      setQueue([]);
      toast[stopRef.current ? "info" : "success"](
        stopRef.current
          ? `Stopped after ${done} script${done === 1 ? "" : "s"}`
          : `Generated shorts for ${done} script${done === 1 ? "" : "s"}`,
      );
    },
    [generateOne, running],
  );

  const visible = targets.filter((t) => ventureFilter === "all" || t.venture === ventureFilter);
  const missing = visible.filter((t) => !current[t.id]);
  const doneCount = visible.length - missing.length;
  const pct = visible.length ? Math.round((doneCount / visible.length) * 100) : 0;

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(
      (t) => t.scriptTitle.toLowerCase().includes(q) || t.scriptNum.includes(q),
    );
  }, [visible, query]);

  const selectedTarget = targets.find((t) => t.id === selected) ?? searched[0] ?? targets[0];
  const selectedGen = selectedTarget ? current[selectedTarget.id] : undefined;
  const selectedBusy = selectedTarget ? activeId === selectedTarget.id : false;

  return (
    <AppShell
      eyebrow="Engine"
      title="Shorts"
      subtitle="One hub — generate, batch and archive shorts for every long-form script."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/scripts"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sunken border border-line text-mid hover:text-hi hover:bg-raised text-xs font-semibold transition-colors"
          >
            Scripts <ArrowRight size={13} />
          </Link>
          {running ? (
            <Btn
              variant="subtle"
              onClick={() => {
                stopRef.current = true;
              }}
              className="h-9 text-[11px] flex items-center gap-1.5"
            >
              <X className="size-3" /> Stop
            </Btn>
          ) : (
            <Btn
              onClick={() => void runBatch(missing)}
              disabled={missing.length === 0}
              className="h-9 text-[11px] flex items-center gap-1.5"
            >
              <Wand2 className="size-3" /> Generate missing ({missing.length})
            </Btn>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "script", label: <span className="inline-flex items-center gap-1.5"><Sparkles size={12} /> By script</span> },
              { value: "batch", label: <span className="inline-flex items-center gap-1.5"><Clapperboard size={12} /> Batch ({doneCount}/{visible.length})</span> },
              { value: "history", label: <span className="inline-flex items-center gap-1.5"><History size={12} /> History ({history.length})</span> },
            ]}
          />
          <div className="inline-flex gap-1 overflow-x-auto no-scrollbar">
            {(["all", ...VENTURES] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVentureFilter(v as "all" | ScriptVersion)}
                className={`h-7 px-2.5 rounded-md border text-[10px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap transition-colors ${
                  ventureFilter === v
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "all" ? "All" : VERSION_LABEL[v as ScriptVersion]}
              </button>
            ))}
          </div>
        </div>

        {/* Progress strip — shared truth across every tab */}
        <div className="border border-line bg-panel rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="uppercase tracking-[0.18em] font-bold text-muted-foreground">
              {doneCount} of {visible.length} scripts have current shorts
            </span>
            <span className="tabular-nums text-muted-foreground">
              {running ? `${queue.length} queued` : `${pct}%`}
            </span>
          </div>
          <div className="h-1.5 bg-sunken rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {loading ? (
          <div className="text-[13px] text-muted-foreground italic">Loading your shorts library…</div>
        ) : tab === "history" ? (
          <HistoryList history={history} onChanged={refresh} />
        ) : tab === "batch" ? (
          <div className="border border-line rounded-xl divide-y divide-line overflow-hidden">
            {searched.map((t) => {
              const gen = current[t.id];
              const isActive = activeId === t.id;
              const isQueued = queue.includes(t.id) && !isActive;
              const isOpen = expanded === t.id;
              return (
                <div key={t.id} className={isOpen ? "bg-sunken/40" : ""}>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="text-[11px] tabular-nums text-muted-foreground/60 w-6 shrink-0">
                      {t.scriptNum}
                    </span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : gen ? t.id : null)}
                      className="flex-1 min-w-0 text-left"
                      disabled={!gen}
                    >
                      <div className="text-[13.5px] leading-snug font-medium truncate">{t.scriptTitle}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
                        {VERSION_LABEL[t.venture]}
                        {gen ? ` · ${new Date(gen.created_at).toLocaleDateString()}` : ""}
                      </div>
                    </button>
                    {failed[t.id] && (
                      <span className="hidden sm:inline text-[10px] uppercase tracking-[0.14em] font-bold text-destructive shrink-0">
                        Failed
                      </span>
                    )}
                    {isActive ? (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                    ) : isQueued ? (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 shrink-0">
                        Queued
                      </span>
                    ) : gen ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-500 shrink-0">
                        <Check className="size-3" /> 3 shorts
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/40 shrink-0">
                        None
                      </span>
                    )}
                    <Btn
                      variant="subtle"
                      onClick={() => void generateOne(t)}
                      disabled={running || isActive}
                      className="h-7 text-[10px] flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="size-3" />
                      <span className="hidden sm:inline">{gen ? "Regenerate" : "Generate"}</span>
                    </Btn>
                  </div>
                  {isOpen && gen && (
                    <div className="px-3 pb-4">
                      <GenerationBody gen={gen} onChanged={refresh} />
                    </div>
                  )}
                </div>
              );
            })}
            {searched.length === 0 && (
              <div className="p-8 text-center text-[12px] text-muted-foreground">No scripts match.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
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
                  <span className="text-[10.5px] font-bold text-lo">{searched.length}</span>
                </div>
                <div className="max-h-[68vh] overflow-y-auto p-1.5">
                  {searched.map((t) => {
                    const isActive = t.id === selectedTarget?.id;
                    const has = Boolean(current[t.id]);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelected(t.id)}
                        className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                          isActive ? "bg-brand-600/10 text-hi" : "text-mid hover:text-hi hover:bg-sunken"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold tabular-nums w-7 flex-shrink-0 mt-0.5 ${
                            isActive ? "text-brand-400" : "text-lo"
                          }`}
                        >
                          {t.scriptNum}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] leading-snug">{t.scriptTitle}</span>
                          <span className="block text-[10px] uppercase tracking-[0.16em] text-lo">
                            {VERSION_LABEL[t.venture]}
                          </span>
                        </span>
                        {has && <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />}
                      </button>
                    );
                  })}
                  {searched.length === 0 && (
                    <div className="text-center text-lo text-sm py-8">No matches.</div>
                  )}
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-4">
              <section className="bg-panel border border-line rounded-2xl px-6 py-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lo text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1.5">
                    Source · #{selectedTarget?.scriptNum} ·{" "}
                    {selectedTarget ? VERSION_LABEL[selectedTarget.venture] : ""}
                  </div>
                  <h2 className="font-display font-bold text-hi text-xl tracking-tight leading-snug truncate">
                    {selectedTarget?.scriptTitle ?? "Select a script"}
                  </h2>
                  <p className="text-xs text-mid mt-1">
                    {selectedGen
                      ? `Current set saved ${new Date(selectedGen.created_at).toLocaleString()} — same set shown in Scripts.`
                      : "No shorts saved for this version yet."}
                  </p>
                </div>
                <Btn
                  onClick={() => selectedTarget && void generateOne(selectedTarget)}
                  disabled={!selectedTarget || selectedBusy || running}
                  className="h-9 text-[11px] flex items-center gap-1.5 shrink-0"
                >
                  {selectedBusy ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />}
                  {selectedGen ? "Regenerate 3 shorts" : "Generate 3 shorts"}
                </Btn>
              </section>

              {selectedGen ? (
                <GenerationBody gen={selectedGen} onChanged={refresh} />
              ) : (
                <Card>
                  <EmptyState
                    icon={<Sparkles size={20} />}
                    title={selectedBusy ? "Cooking 3 shorts…" : "No shorts yet for this script"}
                    description="Generate a set here and it saves to the shared library — visible in Scripts, Batch and History."
                  />
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
