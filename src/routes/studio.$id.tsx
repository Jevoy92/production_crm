import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Clapperboard, ChevronDown, FileDown, Share2, Bell, Save, FileText, Lightbulb,
  ListOrdered, History, Bold, Italic, Heading, MessageSquare, Film, Search as SearchIcon,
  Plus, Bot, Crosshair, SlidersHorizontal, Paperclip, Mic, Send, Trash2, X,
  CircleDot, ArrowUpRight, Copy, RotateCw, Building2, ArrowLeft, Home,
} from "lucide-react";
import {
  useStudioStore, STUDIO_BRANDS, wordCount, runtimeEstimate,
  type Scene, type SceneBlock, type StudioScript,
} from "@/lib/studioStore";

export const Route = createFileRoute("/studio/$id")({
  component: StudioEditor,
  head: () => ({ meta: [{ title: "Editor · Studio" }] }),
});

type Tab = "script" | "ideas" | "outline" | "revisions";

const EXPORT_OPTIONS = [
  { k: "txt", label: "Plain Text (.txt)", sub: "Download the script now", iconClass: "bg-emerald/15 border-emerald/20 text-emerald", live: true },
  { k: "pdf", label: "PDF — Final Script", sub: "Formatted screenplay layout", iconClass: "bg-rose/15 border-rose/20 text-rose" },
  { k: "fdx", label: "Final Draft (.fdx)", sub: "Industry standard format", iconClass: "bg-brand-600/15 border-brand-500/20 text-brand-400" },
  { k: "docx", label: "Word Document (.docx)", sub: "For client sharing", iconClass: "bg-cyan/15 border-cyan/20 text-cyan" },
];

function StudioEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const script = useStudioStore((s) => s.scripts.find((x) => x.id === id));
  const patchScript = useStudioStore((s) => s.patchScript);
  const addScene = useStudioStore((s) => s.addScene);
  const removeScene = useStudioStore((s) => s.removeScene);
  const updateScene = useStudioStore((s) => s.updateScene);
  const updateBlock = useStudioStore((s) => s.updateBlock);
  const addBlock = useStudioStore((s) => s.addBlock);
  const removeBlock = useStudioStore((s) => s.removeBlock);
  const addMessage = useStudioStore((s) => s.addMessage);
  const clearMessages = useStudioStore((s) => s.clearMessages);
  const del = useStudioStore((s) => s.deleteScript);

  const [tab, setTab] = useState<Tab>("script");
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const sceneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (script && !activeScene && script.scenes[0]) setActiveScene(script.scenes[0].id);
  }, [script, activeScene]);

  if (!script) {
    return (
      <div className="h-screen grid place-items-center bg-app text-hi">
        <div className="text-center">
          <div className="text-mid mb-3">Script not found.</div>
          <Link to="/studio" className="ph-btn ph-btn-primary ph-btn-sm">Back to Studio</Link>
        </div>
      </div>
    );
  }

  const scrollToScene = (sceneId: string) => {
    setActiveScene(sceneId);
    sceneRefs.current[sceneId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportTxt = () => {
    const text = scriptToText(script);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title.replace(/[^\w\- ]+/g, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const words = wordCount(script);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-app text-hi">
      {/* Header */}
      <header className="bg-panel border-b border-line px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            title="Back to dashboard"
            className="w-9 h-9 rounded-xl bg-sunken border border-line hover:border-brand-500/40 hover:bg-brand-600/10 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Home size={15} className="text-mid" />
          </Link>
          <Link
            to="/studio"
            title="All scripts"
            className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Studio
          </Link>
          <div className="min-w-0 hidden sm:block">
            <h1 className="font-display font-bold text-lg text-hi tracking-tight leading-none">Editor</h1>
            <p className="text-lo text-xs mt-0.5">Script &amp; idea drafting workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-sunken border border-line rounded-xl px-3 py-2 max-w-[260px]">
            <FileText size={12} className="text-brand-400 flex-shrink-0" />
            <input
              value={script.title}
              onChange={(e) => patchScript(id, { title: e.target.value })}
              className="bg-transparent text-hi text-xs font-medium outline-none truncate flex-1"
            />
            <ChevronDown size={12} className="text-lo flex-shrink-0" />
          </div>
          <select
            value={script.brand}
            onChange={(e) => patchScript(id, { brand: e.target.value })}
            className="hidden lg:block bg-sunken border border-line text-hi text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-brand-500"
          >
            {STUDIO_BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <button onClick={() => setExportOpen(true)} className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5"><FileDown size={13} /> Export</button>
          <button className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5"><Share2 size={13} /> Share</button>
          <button className="relative w-9 h-9 rounded-xl bg-sunken border border-line flex items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors">
            <Bell size={14} /><span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose" />
          </button>
          <button className="ph-btn ph-btn-primary ph-btn-sm flex items-center gap-1.5"><Save size={13} /> Save Draft</button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-line bg-panel/60 flex items-center gap-2 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-0.5 mr-3">
          {([["script", "Script", FileText], ["ideas", "Ideas Board", Lightbulb], ["outline", "Outline", ListOrdered], ["revisions", "Revisions", History]] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all border-b-2 ${tab === k ? "text-brand-400 border-brand-500 bg-brand-600/8" : "text-mid border-transparent hover:text-hi"}`}
            >
              <Icon size={12} /> {label}
              {k === "revisions" && <span className="bg-sunken text-mid text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{script.messages.length}</span>}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-line mx-1" />
        <div className="flex items-center gap-0.5 text-mid">
          {[Bold, Italic, Heading, MessageSquare, Film].map((Icon, i) => (
            <button key={i} className="p-1.5 rounded-lg hover:bg-sunken hover:text-hi transition-all"><Icon size={13} /></button>
          ))}
        </div>
        <div className="w-px h-5 bg-line mx-1" />
        <div className="flex items-center gap-1.5 text-lo text-xs">
          <CircleDot size={11} className="text-emerald" /> Autosaved
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-lo text-xs font-medium bg-sunken px-2 py-0.5 rounded-full">{script.version}</span>
          <div className="hidden sm:flex items-center gap-1.5 bg-sunken border border-line rounded-lg px-2.5 py-1.5">
            <SearchIcon size={11} className="text-lo" />
            <input placeholder="Find in script…" className="bg-transparent text-xs text-hi placeholder-lo outline-none w-28" />
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scenes panel */}
        <aside className="w-48 flex-shrink-0 bg-panel border-r border-line flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-line flex items-center justify-between bg-sunken/40">
            <span className="text-lo text-xs font-semibold uppercase tracking-wider">Scenes</span>
            <button onClick={() => { const sid = addScene(id); setTimeout(() => scrollToScene(sid), 50); }} className="w-5 h-5 rounded bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/20 flex items-center justify-center"><Plus size={11} className="text-brand-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {script.scenes.map((sc) => {
              const active = activeScene === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => scrollToScene(sc.id)}
                  className={`w-full text-left px-2 py-2.5 rounded-lg transition-all border-l-[3px] ${active ? "border-brand-500 bg-brand-600/8" : "border-transparent hover:border-brand-500 hover:bg-brand-600/5"}`}
                >
                  <div className={`text-xs font-semibold mb-0.5 ${active ? "text-brand-400" : "text-lo"}`}>{sc.code}</div>
                  <div className={`text-xs font-medium leading-tight ${active ? "text-hi" : "text-mid"}`}>{sceneTitle(sc)}</div>
                  <div className="text-lo text-[11px] mt-1 truncate">{sc.heading}</div>
                </button>
              );
            })}
            <button onClick={() => { const sid = addScene(id); setTimeout(() => scrollToScene(sid), 50); }} className="w-full px-2 py-2.5 rounded-lg border border-dashed border-line hover:border-brand-500/50 transition-colors flex items-center gap-1.5 mt-1 text-lo hover:text-mid">
              <Plus size={11} /> <span className="text-xs">Add Scene</span>
            </button>
          </div>
        </aside>

        {/* Center: editor / tab content */}
        <div ref={bodyRef} className="flex-1 flex flex-col overflow-hidden bg-app">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl mx-auto">
              {tab === "script" && (
                <>
                  <div className="text-center mb-10">
                    <div className="text-lo text-xs uppercase tracking-widest mb-2">Written by Palmer House</div>
                    <input
                      value={script.title}
                      onChange={(e) => patchScript(id, { title: e.target.value })}
                      className="w-full text-center bg-transparent text-hi font-display font-bold text-2xl tracking-tight mb-1 outline-none focus:bg-sunken/40 rounded-lg px-2"
                    />
                    <div className="text-mid text-sm">Script {script.version} · {script.status}</div>
                    <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-emerald bg-emerald/10 px-2.5 py-1 rounded-lg border border-emerald/20 font-medium">{script.status}</span>
                      <span className="text-xs text-mid bg-panel px-2.5 py-1 rounded-lg border border-line">{runtimeEstimate(script)} runtime</span>
                      <span className="text-xs text-brand-400 bg-brand-600/10 px-2.5 py-1 rounded-lg border border-brand-500/20">{words.toLocaleString()} words</span>
                    </div>
                  </div>

                  {script.scenes.map((sc, i) => (
                    <SceneCard
                      key={sc.id}
                      ref={(el) => { sceneRefs.current[sc.id] = el; }}
                      scene={sc}
                      active={activeScene === sc.id}
                      onFocus={() => setActiveScene(sc.id)}
                      onHeading={(v) => updateScene(id, sc.id, { heading: v })}
                      onTimecode={(v) => updateScene(id, sc.id, { timecode: v })}
                      onBlock={(blockId, v) => updateBlock(id, sc.id, blockId, v)}
                      onAddBlock={(type) => addBlock(id, sc.id, type)}
                      onRemoveBlock={(blockId) => removeBlock(id, sc.id, blockId)}
                      onRemoveScene={script.scenes.length > 1 ? () => removeScene(id, sc.id) : undefined}
                      first={i === 0}
                    />
                  ))}

                  <button
                    onClick={() => { const sid = addScene(id); setTimeout(() => scrollToScene(sid), 50); }}
                    className="w-full border border-dashed border-line rounded-2xl p-5 text-center hover:border-brand-500/50 hover:bg-brand-600/5 transition-all group"
                  >
                    <Plus size={20} className="text-lo group-hover:text-brand-400 mx-auto mb-1 transition-colors" />
                    <div className="text-lo group-hover:text-brand-400 text-xs font-medium transition-colors">Add new scene block</div>
                  </button>
                </>
              )}

              {tab === "outline" && (
                <div className="space-y-2">
                  <h2 className="font-display font-bold text-hi text-lg mb-4">Outline</h2>
                  {script.scenes.map((sc, i) => (
                    <button key={sc.id} onClick={() => { setTab("script"); setTimeout(() => scrollToScene(sc.id), 50); }} className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-panel border border-line hover:border-brand-500/40 transition-colors">
                      <span className="text-brand-400 text-xs font-bold font-mono w-10">{sc.code}</span>
                      <div className="min-w-0">
                        <div className="text-hi text-sm font-medium truncate">{sceneTitle(sc)}</div>
                        <div className="text-lo text-xs truncate">{sc.heading} {sc.timecode ? `· ${sc.timecode}` : ""}</div>
                      </div>
                      <span className="ml-auto text-lo text-xs">{sc.blocks.length} blocks</span>
                      {i === 0 && null}
                    </button>
                  ))}
                </div>
              )}

              {tab === "ideas" && (
                <div className="text-center py-20 text-mid">
                  <Lightbulb size={28} className="mx-auto mb-3 text-lo" />
                  <div className="text-hi font-semibold mb-1">Ideas Board</div>
                  <div className="text-sm max-w-sm mx-auto">Capture loose concepts and hooks here, then promote them into scenes. (Coming soon)</div>
                </div>
              )}

              {tab === "revisions" && (
                <div className="space-y-2">
                  <h2 className="font-display font-bold text-hi text-lg mb-4">Revision history</h2>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-panel border border-line">
                    <span className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">{script.version}</span>
                    <div className="text-hi text-sm">Current draft</div>
                    <span className="ml-auto text-lo text-xs">{new Date(script.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-mid text-sm text-center py-6">Full version history activates once an AI model is connected.</div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="px-6 py-2.5 border-t border-line bg-panel flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 text-lo text-xs">
              <span className="font-medium">{script.scenes.length} scenes</span>
              <span className="text-line">·</span>
              <span>{words.toLocaleString()} words</span>
              <span className="text-line">·</span>
              <span>~{runtimeEstimate(script)} runtime</span>
            </div>
            <button onClick={() => { if (confirm(`Delete "${script.title}"?`)) { del(id); navigate({ to: "/studio" }); } }} className="ml-auto text-lo hover:text-rose transition-colors flex items-center gap-1.5 text-xs"><Trash2 size={12} /> Delete</button>
          </div>
        </div>

        {/* AI panel */}
        <AiPanel script={script} onSend={(text) => {
          addMessage(id, { role: "user", content: text });
          setTimeout(() => addMessage(id, { role: "assistant", content: "I'm in preview mode — an AI model isn't connected yet. Once it is, I'll draft, rewrite, and punch up any scene right here. Your prompt was captured: “" + text + "”" }), 500);
        }} onClear={() => clearMessages(id)} />
      </div>

      {/* Export modal */}
      <AnimatePresence>
        {exportOpen && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(10,13,26,0.5)", backdropFilter: "blur(6px)" }} onClick={() => setExportOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-96 bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-pop)]" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-hi text-base">Export Script</h3>
                <button onClick={() => setExportOpen(false)} className="w-7 h-7 rounded-lg bg-sunken hover:bg-raised flex items-center justify-center text-mid"><X size={13} /></button>
              </div>
              <div className="space-y-3 mb-4">
                {EXPORT_OPTIONS.map((o) => (
                  <button key={o.k} onClick={o.live ? exportTxt : () => { alert("That format needs an export service — .txt works now."); }} className="w-full flex items-center gap-3 p-3.5 bg-sunken border border-line rounded-xl hover:border-brand-500/40 transition-all text-left">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${o.iconClass}`}>
                      <FileText size={15} />
                    </div>
                    <div className="flex-1">
                      <div className="text-hi text-sm font-semibold">{o.label}{o.live && <span className="ml-2 text-[10px] text-emerald">ready</span>}</div>
                      <div className="text-lo text-xs">{o.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setExportOpen(false)} className="w-full text-mid hover:text-hi text-sm py-2 transition-colors font-medium">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function sceneTitle(sc: Scene): string {
  const firstAction = sc.blocks.find((b) => b.type === "action");
  if (firstAction && firstAction.text.trim()) return firstAction.text.trim().split(/[.!?]/)[0].slice(0, 48);
  return sc.heading.split("—")[0].trim() || "Untitled scene";
}

function scriptToText(s: StudioScript): string {
  let out = `${s.title}\n${s.version} · ${s.status}\n\n`;
  for (const sc of s.scenes) {
    out += `${sc.code} — ${sc.heading}${sc.timecode ? `  (${sc.timecode})` : ""}\n`;
    for (const bl of sc.blocks) {
      if (bl.type === "vo") out += `\n  ${bl.speaker}\n  "${bl.text}"\n`;
      else out += `\n${bl.text}\n`;
    }
    out += "\n\n";
  }
  return out;
}

const AutoTextarea = ({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={`w-full bg-transparent resize-none outline-none placeholder-lo ${className ?? ""}`}
    />
  );
};

const SceneCard = ({
  ref, scene, active, first, onFocus, onHeading, onTimecode, onBlock, onAddBlock, onRemoveBlock, onRemoveScene,
}: {
  ref: (el: HTMLDivElement | null) => void;
  scene: Scene; active: boolean; first: boolean;
  onFocus: () => void;
  onHeading: (v: string) => void; onTimecode: (v: string) => void;
  onBlock: (blockId: string, v: string) => void;
  onAddBlock: (type: SceneBlock["type"]) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveScene?: () => void;
}) => {
  return (
    <div
      ref={ref}
      onFocus={onFocus}
      onClick={onFocus}
      className={`group/scene mb-6 rounded-2xl border-2 bg-panel p-5 shadow-[var(--elev-sm)] transition-colors ${active ? "border-brand-500/50" : "border-line hover:border-brand-500/25"}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg border ${active ? "text-brand-400 bg-brand-600/10 border-brand-500/20" : "text-mid bg-sunken border-line"}`}>{scene.code}</span>
        <input value={scene.heading} onChange={(e) => onHeading(e.target.value)} className="flex-1 min-w-0 bg-transparent text-hi text-xs font-semibold uppercase tracking-wider outline-none focus:bg-sunken/50 rounded px-1" />
        <input value={scene.timecode ?? ""} onChange={(e) => onTimecode(e.target.value)} placeholder="0:00 – 0:00" className="w-24 text-right bg-sunken text-lo text-xs font-medium px-2 py-0.5 rounded-full outline-none focus:text-hi" />
        {onRemoveScene && (
          <button onClick={onRemoveScene} className="opacity-0 group-hover/scene:opacity-100 text-lo hover:text-rose transition-all" aria-label="Remove scene"><Trash2 size={12} /></button>
        )}
      </div>

      <div className="space-y-3">
        {scene.blocks.map((bl) => (
          <div key={bl.id} className="group/block relative">
            {bl.type === "vo" ? (
              <div className="bg-brand-600/8 rounded-xl p-4 border border-brand-500/20">
                <div className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mic size={11} /> <span>{bl.speaker}</span>
                </div>
                <AutoTextarea value={bl.text} onChange={(v) => onBlock(bl.id, v)} placeholder="Voiceover / dialogue…" className="text-hi/90 text-sm leading-relaxed italic" />
              </div>
            ) : (
              <AutoTextarea value={bl.text} onChange={(v) => onBlock(bl.id, v)} placeholder="Action / description…" className="text-mid text-sm leading-relaxed" />
            )}
            <button onClick={() => onRemoveBlock(bl.id)} className="absolute -right-1 top-0 opacity-0 group-hover/block:opacity-100 text-lo hover:text-rose transition-all" aria-label="Remove block"><X size={12} /></button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line">
        <button onClick={() => onAddBlock("action")} className="text-lo hover:text-brand-400 text-xs font-medium flex items-center gap-1 transition-colors"><Plus size={11} /> Action</button>
        <button onClick={() => onAddBlock("vo")} className="text-lo hover:text-brand-400 text-xs font-medium flex items-center gap-1 transition-colors"><Mic size={11} /> Voiceover</button>
        {first && <span className="ml-auto text-[10px] text-lo">Opening scene</span>}
      </div>
    </div>
  );
};

function AiPanel({ script, onSend, onClear }: { script: StudioScript; onSend: (t: string) => void; onClear: () => void }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [script.messages.length]);

  const send = () => { if (!input.trim()) return; onSend(input.trim()); setInput(""); };
  const quick = ["Punch up SC 02", "Shorten by 20%", "Generate outline", "Add VO to SC 04"];

  return (
    <div className="w-80 flex-shrink-0 bg-panel border-l border-line flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-line flex items-center justify-between bg-sunken/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600/30 to-brand-600/30 border border-violet-500/30 flex items-center justify-center"><Bot size={14} className="text-violet-400" /></div>
          <div>
            <div className="text-hi text-xs font-semibold leading-none">Pals AI</div>
            <div className="text-emerald text-xs flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" /> Script Mode</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="w-6 h-6 rounded-lg bg-sunken hover:bg-raised flex items-center justify-center text-mid" title="Context: current scene"><Crosshair size={12} /></button>
          <button onClick={onClear} className="w-6 h-6 rounded-lg bg-sunken hover:bg-raised flex items-center justify-center text-mid" title="Clear chat"><Trash2 size={12} /></button>
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-line">
        <div className="text-lo text-xs mb-1.5 font-medium">Context</div>
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs bg-brand-600/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-medium"><FileText size={10} /> Full Script</span>
          <span className="flex items-center gap-1 text-xs bg-sunken border border-line text-mid px-2 py-0.5 rounded-full"><Film size={10} /> {script.scenes.length} scenes</span>
          <span className="flex items-center gap-1 text-xs bg-sunken border border-line text-mid px-2 py-0.5 rounded-full capitalize"><Building2 size={10} /> {script.brand.replace("-", " ")}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-app/40">
        {script.messages.length === 0 && (
          <div className="text-mid text-xs leading-relaxed px-1 py-2">Ask Pals to draft, rewrite, or punch up any scene. Use a quick prompt below to start.</div>
        )}
        {script.messages.map((m) => (
          m.role === "user" ? (
            <div key={m.id} className="flex gap-2.5 flex-row-reverse">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">You</div>
              <div className="flex-1">
                <div className="bg-brand-600 rounded-xl rounded-tr-sm p-3"><p className="text-white text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p></div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600/30 to-brand-600/30 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5"><Bot size={12} className="text-violet-400" /></div>
              <div className="flex-1">
                <div className="bg-panel rounded-xl rounded-tl-sm p-3 border border-line"><p className="text-mid text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p></div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button className="flex items-center gap-1 text-[10px] bg-sunken border border-line text-mid px-2 py-1 rounded-lg hover:text-hi transition-colors"><Copy size={10} /> Copy</button>
                  <button className="flex items-center gap-1 text-[10px] bg-sunken border border-line text-mid px-2 py-1 rounded-lg hover:text-hi transition-colors"><RotateCw size={10} /> Retry</button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      <div className="px-4 py-3 border-t border-line bg-sunken/40">
        <div className="text-lo text-xs mb-2 font-medium">Quick prompts</div>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button key={q} onClick={() => setInput(q)} className="text-xs bg-panel border border-line text-mid px-2.5 py-1 rounded-full hover:border-brand-500/40 hover:text-brand-400 transition-all">{q}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="bg-sunken border border-line rounded-xl p-3 focus-within:border-brand-500 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Pals AI to rewrite, expand, or improve any part of your script…"
            rows={3}
            className="w-full bg-transparent text-xs text-hi placeholder-lo outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-line">
            <div className="flex items-center gap-1.5">
              {[Paperclip, Mic, SlidersHorizontal].map((Icon, i) => (
                <button key={i} className="w-6 h-6 rounded-lg bg-panel border border-line hover:bg-raised flex items-center justify-center text-mid transition-colors"><Icon size={11} /></button>
              ))}
            </div>
            <button onClick={send} disabled={!input.trim()} className="ph-btn ph-btn-primary ph-btn-sm flex items-center gap-1.5 disabled:opacity-50"><Send size={12} /> Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
