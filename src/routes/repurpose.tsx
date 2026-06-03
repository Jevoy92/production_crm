import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Card } from "@/components/app/AppShell";
import { SCRIPTS } from "@/lib/scriptsIndex";
import { useCCStore, type Platform, type PalLane } from "@/lib/ccStore";
import { generateShorts } from "@/lib/repurpose.functions";
import { Sparkles, FileText, Loader2, Check, ArrowRight, Library, Plus } from "lucide-react";
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

  const active = useMemo(() => SCRIPTS.find((s) => s.num === activeNum), [activeNum]);
  const body = useMemo(() => (active ? pickScriptBody(active.num) : ""), [active]);
  const prewritten = useMemo<CoreShort[]>(
    () => (active ? shortsForCore12(active.number) : []),
    [active],
  );

  // Detect shorts already saved (by exact caption match to avoid dupes within session)
  const savedTitleSet = useMemo(
    () => new Set(library.map((c) => c.title)),
    [library],
  );

  const saveOneFromLibrary = (s: CoreShort) => {
    if (!active) return;
    const lane: PalLane = s.lane;
    addContentItem({
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
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="Repurpose"
      subtitle="Pick a long-form script. Get 3 supporting shorts that funnel viewers back."
      actions={
        <Link to="/content" className="ph-btn ph-btn-soft ph-btn-sm">
          Open Content <ArrowRight size={14} />
        </Link>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 18 }}>
        {/* Script picker */}
        <Card title="Long-form scripts" soft>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "70vh", overflowY: "auto" }}>
            {SCRIPTS.map((s) => {
              const isActive = s.num === activeNum;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => selectScript(s.num)}
                  className={isActive ? "sidebar-link active" : "sidebar-link"}
                  style={{ textAlign: "left", borderRadius: "var(--ph-radius-md)" }}
                >
                  <span style={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 700,
                    width: 28,
                    color: isActive ? "var(--ph-primary)" : "var(--ph-text-muted)",
                  }}>
                    #{s.num}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, lineHeight: 1.3 }}>{s.title}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Editor + results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <Card
            title={
              active
                ? `#${active.num} · ${active.title}`
                : "Select a script"
            }
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {ALL_PLATFORMS.map((p) => {
                  const on = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={on ? "ph-badge ph-badge-spotlight" : "ph-badge ph-badge-neutral"}
                      style={{ cursor: "pointer", border: 0 }}
                    >
                      {on && <Check size={11} />}
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={run}
                  disabled={busy || !active || !body}
                  className="ph-btn ph-btn-primary"
                  style={{ opacity: busy || !active || !body ? 0.6 : 1 }}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {busy ? "Generating…" : "Generate 3 shorts"}
                </button>
              </div>
            }
          >
            {!active ? (
              <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>
                Pick a script from the list.
              </div>
            ) : !body ? (
              <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>
                This script has no body yet — write it under Scripts first.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 240,
                  overflowY: "auto",
                  background: "var(--ph-surface-soft)",
                  borderRadius: "var(--ph-radius-md)",
                  padding: 14,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: "var(--ph-text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {body.slice(0, 1800)}
                {body.length > 1800 ? "…" : ""}
              </div>
            )}
            {error && (
              <div className="ph-badge ph-badge-danger" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
          </Card>

          {shorts && (
            <Card title="Generated shorts" action={
              <span className="ph-badge ph-badge-success">
                <Check size={11} /> Saved to Library
              </span>
            }>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
                {shorts.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--ph-surface-soft)",
                      borderRadius: "var(--ph-radius-md)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="ph-badge ph-badge-spotlight">{s.platform}</span>
                      <span style={{ fontSize: 11, color: "var(--ph-text-muted)", fontWeight: 700 }}>
                        {s.durationSec}s
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ph-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Hook</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ph-text-primary)", lineHeight: 1.35 }}>{s.hook}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ph-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Body</div>
                      <div style={{ fontSize: 12.5, color: "var(--ph-text-primary)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{s.body}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ph-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>CTA → long-form</div>
                      <div style={{ fontSize: 12.5, color: "var(--ph-primary)", fontWeight: 600 }}>{s.cta}</div>
                    </div>
                    {savedIds.has(i) && (
                      <div style={{ fontSize: 11, color: "var(--ph-success)", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        <Check size={12} /> In Library
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: "var(--ph-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={13} /> Edit captions / status anytime in{" "}
                <Link to="/content" style={{ color: "var(--ph-primary)", fontWeight: 700 }}>Content</Link>.
              </div>
            </Card>
          )}

          {active && prewritten.length > 0 && (
            <Card
              title={`Pre-written shorts (${prewritten.length})`}
              action={
                <button
                  type="button"
                  onClick={saveAllFromLibrary}
                  className="ph-btn ph-btn-soft"
                >
                  <Library size={14} /> Save all to Library
                </button>
              }
            >
              <div style={{ fontSize: 12.5, color: "var(--ph-text-secondary)", marginBottom: 12 }}>
                5 hand-written supporting shorts for <strong>#{active.num} {active.title}</strong>.
                Each is standalone and funnels viewers back to the long-form.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
                {prewritten.map((s) => {
                  const saved = libSaved.has(s.num) || savedTitleSet.has(`${s.num} ${s.hook}`.slice(0, 140));
                  return (
                    <div
                      key={s.num}
                      style={{
                        background: "var(--ph-surface-soft)",
                        borderRadius: "var(--ph-radius-md)",
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        borderLeft: `3px solid ${colorForShortType(s.type)}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 700,
                            fontSize: 11,
                            color: "var(--ph-text-muted)",
                          }}>{s.num}</span>
                          <span
                            className="ph-badge"
                            style={{
                              background: `${colorForShortType(s.type)}1a`,
                              color: colorForShortType(s.type),
                              border: 0,
                            }}
                          >
                            {s.type}
                          </span>
                          <span className="ph-badge ph-badge-neutral">{s.lane}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--ph-text-muted)", fontWeight: 700 }}>
                          {s.durationSec}s
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ph-text-primary)", lineHeight: 1.35 }}>
                        {s.hook}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ph-text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 140, overflow: "hidden", maskImage: "linear-gradient(to bottom, black 60%, transparent)" }}>
                        {s.body}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ph-primary)", fontWeight: 600 }}>
                        → {s.cta}
                      </div>
                      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                        {saved ? (
                          <span className="ph-badge ph-badge-success">
                            <Check size={11} /> In Library
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => saveOneFromLibrary(s)}
                            className="ph-btn ph-btn-primary"
                          >
                            <Plus size={13} /> Save to Library
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}