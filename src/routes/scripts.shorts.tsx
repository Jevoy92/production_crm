import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { ShortIdeaCard } from "@/components/shorts/ShortIdeaCard";
import { SCRIPTS, VERSION_LABEL, type ScriptVersion } from "@/lib/scriptsIndex";
import { generateShortIdeas } from "@/lib/shortIdeas.functions";
import {
  deleteGeneration,
  ideasToText,
  key as genKey,
  listCurrent,
  listGenerations,
  restoreGeneration,
  saveGeneration,
  toggleStar,
  type ShortsGeneration,
} from "@/lib/shortsLibrary";
import { copyToClipboard } from "@/lib/clipboard";
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Copy,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scripts/shorts")({
  component: ShortsLab,
  head: () => ({
    meta: [
      { title: "Shorts Lab · Palmer House OS" },
      {
        name: "description",
        content:
          "Batch-generate prop-led shorts for every long-form script, regenerate any set, and keep a permanent history of every idea.",
      },
      { property: "og:title", content: "Shorts Lab · Palmer House OS" },
      {
        property: "og:description",
        content: "Batch shorts generation with regeneration and a permanent idea history.",
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

function useTargets(): Target[] {
  return useMemo(
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
}

async function loadSource(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load script (${res.status})`);
  return await res.text();
}

function ShortsLab() {
  const targets = useTargets();
  const runIdeas = useServerFn(generateShortIdeas);
  const [tab, setTab] = useState<"batch" | "history">("batch");
  const [current, setCurrent] = useState<Record<string, ShortsGeneration>>({});
  const [history, setHistory] = useState<ShortsGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ventureFilter, setVentureFilter] = useState<"all" | ScriptVersion>("all");
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
        const res = await runIdeas({
          data: {
            scriptNum: t.scriptNum,
            scriptTitle: t.scriptTitle,
            scriptBody: source.slice(0, 40_000),
            venture: t.venture,
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
        return false;
      } finally {
        setActiveId(null);
      }
    },
    [runIdeas],
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
        stopRef.current ? `Stopped after ${done} script${done === 1 ? "" : "s"}` : `Generated shorts for ${done} script${done === 1 ? "" : "s"}`,
      );
    },
    [generateOne, running],
  );

  const visible = targets.filter((t) => ventureFilter === "all" || t.venture === ventureFilter);
  const missing = visible.filter((t) => !current[t.id]);
  const doneCount = visible.length - missing.length;
  const pct = visible.length ? Math.round((doneCount / visible.length) * 100) : 0;

  return (
    <Shell
      title="Shorts Lab"
      subtitle="Batch-generate prop-led shorts for every script — regenerate anything, never lose an idea"
      actions={
        <div className="flex items-center gap-2">
          <Link to="/scripts">
            <Btn variant="subtle" className="h-8 text-[11px] flex items-center gap-1.5">
              <ArrowLeft className="size-3" /> Scripts
            </Btn>
          </Link>
          {running ? (
            <Btn
              variant="subtle"
              onClick={() => {
                stopRef.current = true;
              }}
              className="h-8 text-[11px] flex items-center gap-1.5"
            >
              <X className="size-3" /> Stop
            </Btn>
          ) : (
            <>
              <Btn
                variant="subtle"
                onClick={() => void runBatch(missing)}
                disabled={missing.length === 0}
                className="h-8 text-[11px] flex items-center gap-1.5"
              >
                <Wand2 className="size-3" /> Generate missing ({missing.length})
              </Btn>
              <Btn
                onClick={() => void runBatch(visible)}
                className="h-8 text-[11px] flex items-center gap-1.5"
              >
                <Sparkles className="size-3" /> Generate all ({visible.length})
              </Btn>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tabs + filters */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="inline-flex gap-1 p-1 bg-muted/40 border border-border rounded-lg">
            {(["batch", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`h-7 px-3 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "batch" ? <Clapperboard className="size-3" /> : <History className="size-3" />}
                {t === "batch" ? "Batch" : `History (${history.length})`}
              </button>
            ))}
          </div>
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

        {/* Progress strip */}
        <div className="border border-border bg-card p-3">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="uppercase tracking-[0.18em] font-bold text-muted-foreground">
              {doneCount} of {visible.length} scripts have shorts
            </span>
            <span className="tabular-nums text-muted-foreground">
              {running ? `${queue.length} queued` : `${pct}%`}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {loading ? (
          <div className="text-[13px] text-muted-foreground italic">Loading your shorts library…</div>
        ) : tab === "batch" ? (
          <div className="border border-border divide-y divide-border">
            {visible.map((t) => {
              const gen = current[t.id];
              const isActive = activeId === t.id;
              const isQueued = queue.includes(t.id) && !isActive;
              const isOpen = expanded === t.id;
              return (
                <div key={t.id} className={isOpen ? "bg-muted/20" : ""}>
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
            {visible.length === 0 && (
              <div className="border border-dashed border-border p-8 text-center text-[12px] text-muted-foreground">
                No scripts for this brand.
              </div>
            )}
          </div>
        ) : (
          <HistoryList history={history} onChanged={refresh} />
        )}
      </div>
    </Shell>
  );
}

function GenerationBody({ gen, onChanged }: { gen: ShortsGeneration; onChanged: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Btn
          variant="subtle"
          onClick={async () => {
            const ok = await copyToClipboard(ideasToText(gen));
            toast[ok ? "success" : "error"](ok ? "All 3 shorts copied" : "Copy failed");
          }}
          className="h-7 text-[10px] flex items-center gap-1.5"
        >
          <Copy className="size-3" /> Copy set
        </Btn>
        <Btn
          variant="subtle"
          onClick={async () => {
            await toggleStar(gen.id, !gen.starred);
            onChanged();
          }}
          className="h-7 text-[10px] flex items-center gap-1.5"
        >
          <Star className={`size-3 ${gen.starred ? "fill-current text-amber-500" : ""}`} />
          {gen.starred ? "Starred" : "Star"}
        </Btn>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {gen.ideas.map((idea, i) => (
          <ShortIdeaCard key={i} idea={idea} index={i} />
        ))}
      </div>
    </div>
  );
}

function HistoryList({
  history,
  onChanged,
}: {
  history: ShortsGeneration[];
  onChanged: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);
  const [q, setQ] = useState("");
  const rows = history.filter(
    (g) =>
      (!starredOnly || g.starred) &&
      (q.trim() === "" || g.script_title.toLowerCase().includes(q.trim().toLowerCase())),
  );

  if (history.length === 0) {
    return (
      <div className="border border-dashed border-border p-10 text-center">
        <History className="size-5 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-[12px] text-muted-foreground">
          No saved generations yet. Run a batch and every set lands here permanently.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search history…"
          className="h-8 flex-1 min-w-[180px] bg-card border border-border px-2.5 text-[12px] rounded-md outline-none focus:border-foreground"
        />
        <button
          onClick={() => setStarredOnly((s) => !s)}
          className={`h-8 px-2.5 rounded-md border text-[10px] uppercase tracking-[0.14em] font-semibold flex items-center gap-1.5 ${
            starredOnly ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
          }`}
        >
          <Star className="size-3" /> Starred
        </button>
      </div>
      <div className="border border-border divide-y divide-border">
        {rows.map((g) => {
          const isOpen = openId === g.id;
          return (
            <div key={g.id} className={isOpen ? "bg-muted/20" : ""}>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button onClick={() => setOpenId(isOpen ? null : g.id)} className="flex-1 min-w-0 text-left">
                  <div className="text-[13px] font-medium truncate">
                    {g.script_num} · {g.script_title}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
                    {VERSION_LABEL[g.venture]} · {new Date(g.created_at).toLocaleString()}
                    {g.is_current ? " · Current" : ""}
                  </div>
                </button>
                {g.starred && <Star className="size-3.5 fill-current text-amber-500 shrink-0" />}
                {!g.is_current && (
                  <Btn
                    variant="subtle"
                    onClick={async () => {
                      await restoreGeneration(g);
                      onChanged();
                      toast.success("Restored as current");
                    }}
                    className="h-7 text-[10px] flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="size-3" />
                    <span className="hidden sm:inline">Restore</span>
                  </Btn>
                )}
                <button
                  onClick={async () => {
                    await deleteGeneration(g.id);
                    onChanged();
                  }}
                  className="text-muted-foreground/60 hover:text-destructive shrink-0"
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {isOpen && (
                <div className="px-3 pb-4">
                  <GenerationBody gen={g} onChanged={onChanged} />
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="p-8 text-center text-[12px] text-muted-foreground">No matches.</div>
        )}
      </div>
    </div>
  );
}
