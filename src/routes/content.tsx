import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { useStore } from "@/lib/store";
import {
  CONTENT_PIPELINE_STAGES,
  CONTENT_PAL_LANES,
  CONTENT_PLATFORMS,
  type ContentPiece,
  type ContentPipelineStage,
  type ContentPalLane,
  type ContentPlatform,
} from "@/lib/types";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import {
  Youtube,
  Instagram,
  Linkedin,
  Facebook,
  Globe,
  Plus,
  ChevronRight,
  Check,
  Clapperboard,
  Link as LinkIcon,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/content")({
  component: ContentPipeline,
  head: () => ({ meta: [{ title: "Content Pipeline · Palmer House" }] }),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<ContentPipelineStage, string> = {
  Concept:   "bg-gray-100 text-gray-600 border-gray-200",
  Scripted:  "bg-violet-100 text-violet-700 border-violet-200",
  Scheduled: "bg-amber-100 text-amber-700 border-amber-200",
  Shot:      "bg-sky-100 text-sky-700 border-sky-200",
  "In Edit": "bg-orange-100 text-orange-700 border-orange-200",
  Live:      "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STAGE_HEADER: Record<ContentPipelineStage, string> = {
  Concept:   "bg-gray-50 border-gray-200",
  Scripted:  "bg-violet-50 border-violet-200",
  Scheduled: "bg-amber-50 border-amber-200",
  Shot:      "bg-sky-50 border-sky-200",
  "In Edit": "bg-orange-50 border-orange-200",
  Live:      "bg-emerald-50 border-emerald-200",
};

const PAL_COLORS: Record<ContentPalLane, { bg: string; text: string; dot: string }> = {
  Reel:      { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  System:    { bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-500" },
  Evergreen: { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500" },
  Spotlight: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
};

const PLATFORM_ICONS: Record<ContentPlatform, React.ReactNode> = {
  YouTube:   <Youtube className="w-3.5 h-3.5 text-red-500" />,
  Instagram: <Instagram className="w-3.5 h-3.5 text-pink-500" />,
  LinkedIn:  <Linkedin className="w-3.5 h-3.5 text-sky-600" />,
  Facebook:  <Facebook className="w-3.5 h-3.5 text-blue-600" />,
  Website:   <Globe className="w-3.5 h-3.5 text-gray-500" />,
};

const UPLOAD_STATUS_COLORS = {
  pending:  "bg-gray-200 text-gray-500",
  uploaded: "bg-amber-100 text-amber-700",
  live:     "bg-emerald-100 text-emerald-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PalBadge({ lane }: { lane: ContentPalLane }) {
  const c = PAL_COLORS[lane];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {lane}
    </span>
  );
}

function StageBadge({ stage }: { stage: ContentPipelineStage }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STAGE_COLORS[stage]}`}>
      {stage}
    </span>
  );
}

function PlatformPips({ platforms }: { platforms: ContentPiece["platforms"] }) {
  return (
    <div className="flex items-center gap-1">
      {platforms.map((p) => (
        <span
          key={p.platform}
          title={`${p.platform}: ${p.status}`}
          className={`flex items-center justify-center w-5 h-5 rounded-full ${UPLOAD_STATUS_COLORS[p.status]}`}
        >
          {PLATFORM_ICONS[p.platform]}
        </span>
      ))}
    </div>
  );
}

// ─── Piece Card ───────────────────────────────────────────────────────────────

function PieceCard({
  piece,
  onClick,
}: {
  piece: ContentPiece;
  onClick: () => void;
}) {
  const totalClips = piece.repurposableClips.length;
  const doneClips = piece.repurposableClips.filter((c) => c.done).length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {piece.title}
        </p>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
      </div>

      <p className="text-[11px] text-gray-500 line-clamp-2 mb-2.5 leading-relaxed">
        {piece.hypothesis}
      </p>

      <div className="flex items-center justify-between">
        <PalBadge lane={piece.palLane} />
        {totalClips > 0 && (
          <span className={`text-[10px] font-medium ${doneClips === totalClips ? "text-emerald-600" : "text-gray-400"}`}>
            {doneClips}/{totalClips} clips
          </span>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
        <PlatformPips platforms={piece.platforms} />
        <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]" title={piece.format}>
          {piece.format.split("(")[0].trim()}
        </span>
      </div>
    </button>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  piece,
  onClose,
}: {
  piece: ContentPiece;
  onClose: () => void;
}) {
  const { setContentStage, toggleRepurposableClip, updateContentPiece, removeContentPiece } =
    useStore();
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    removeContentPiece(piece.id);
    onClose();
  }

  function savePlatformUrl(platform: ContentPlatform) {
    const updated = piece.platforms.map((p) =>
      p.platform === platform ? { ...p, url: urlValue, status: "live" as const } : p
    );
    updateContentPiece(piece.id, { platforms: updated });
    setEditingUrl(null);
    setUrlValue("");
  }

  function cycleUploadStatus(platform: ContentPlatform) {
    const order = ["pending", "uploaded", "live"] as const;
    const updated = piece.platforms.map((p) => {
      if (p.platform !== platform) return p;
      const idx = order.indexOf(p.status);
      return { ...p, status: order[(idx + 1) % order.length] };
    });
    updateContentPiece(piece.id, { platforms: updated });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clapperboard className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content Pipeline</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 leading-snug">{piece.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <PalBadge lane={piece.palLane} />
                <StageBadge stage={piece.stage} />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Hypothesis */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Hypothesis</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{piece.hypothesis}</p>
          </div>

          {/* Format */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Format</h3>
            <p className="text-sm text-gray-600">{piece.format}</p>
          </div>

          {/* Thumbnail concept */}
          {piece.thumbnailConcept && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Thumbnail Concept</h3>
              <p className="text-sm text-gray-600 italic leading-relaxed">{piece.thumbnailConcept}</p>
            </div>
          )}

          {/* Faith thread */}
          {piece.faithThread && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Faith Thread</h3>
              <p className="text-sm text-amber-900 italic leading-relaxed">"{piece.faithThread}"</p>
            </div>
          )}

          {/* Stage mover */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pipeline Stage</h3>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_PIPELINE_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => setContentStage(piece.id, s)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    piece.stage === s
                      ? STAGE_COLORS[s] + " shadow-sm"
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Repurposable clips */}
          {piece.repurposableClips.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Repurposable Clips ({piece.repurposableClips.filter((c) => c.done).length}/{piece.repurposableClips.length} done)
              </h3>
              <div className="space-y-1.5">
                {piece.repurposableClips.map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => toggleRepurposableClip(piece.id, clip.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                      clip.done
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${clip.done ? "bg-emerald-500" : "border-2 border-gray-300"}`}>
                      {clip.done && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`text-[12px] leading-snug ${clip.done ? "text-emerald-700 line-through" : "text-gray-700"}`}>
                        {clip.label}
                      </span>
                    </span>
                    <span className="shrink-0">{PLATFORM_ICONS[clip.platform]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Platform upload status */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platform Upload Status</h3>
            <div className="space-y-2">
              {piece.platforms.map((p) => (
                <div key={p.platform} className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 w-28 shrink-0">
                    {PLATFORM_ICONS[p.platform]}
                    <span className="text-sm text-gray-600">{p.platform}</span>
                  </span>
                  <button
                    onClick={() => cycleUploadStatus(p.platform)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${UPLOAD_STATUS_COLORS[p.status]}`}
                  >
                    {p.status}
                  </button>
                  {p.status !== "pending" && (
                    editingUrl === p.platform ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          className="flex-1 text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Paste URL..."
                          value={urlValue}
                          onChange={(e) => setUrlValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") savePlatformUrl(p.platform); }}
                          autoFocus
                        />
                        <button onClick={() => savePlatformUrl(p.platform)} className="text-emerald-600 hover:text-emerald-700 text-xs font-medium">Save</button>
                        <button onClick={() => setEditingUrl(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[150px]">
                        <LinkIcon className="w-3 h-3" /> View
                      </a>
                    ) : (
                      <button onClick={() => { setEditingUrl(p.platform); setUrlValue(""); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary">
                        <Plus className="w-3 h-3" /> Add URL
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {(piece.scriptLink || piece.driveFolder) && (
            <div className="flex gap-2">
              {piece.scriptLink && (
                <a href={piece.scriptLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Pencil className="w-3.5 h-3.5" /> Script
                </a>
              )}
              {piece.driveFolder && (
                <a href={piece.driveFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" /> Drive Folder
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {piece.notes && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{piece.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 text-sm transition-colors ${confirm ? "text-red-600 font-medium" : "text-gray-400 hover:text-red-500"}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirm ? "Confirm delete?" : "Delete"}
          </button>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── New Piece Modal ──────────────────────────────────────────────────────────

function NewPieceModal({ onClose }: { onClose: () => void }) {
  const { addContentPiece } = useStore();
  const [title, setTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [palLane, setPalLane] = useState<ContentPalLane>("Evergreen");
  const [format, setFormat] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState<ContentPlatform>("YouTube");

  function handleSave() {
    if (!title.trim()) return;
    addContentPiece({
      title,
      hypothesis,
      palLane,
      format,
      stage: "Concept",
      primaryPlatform,
      targetPlatforms: [primaryPlatform],
      platforms: [{ platform: primaryPlatform, status: "pending" }],
      repurposableClips: [],
    });
    onClose();
  }

  return (
    <Modal open title="New Content Piece" onClose={onClose}>
      <Field label="Title (working or final)">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Why Your Competitor's Terrible Video Is Beating Yours" />
      </Field>
      <Field label="Hypothesis / One-line premise">
        <textarea className={inputCls + " min-h-[72px] resize-none"} value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="The core argument or question the video will prove..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="PAL Lane">
          <select className={inputCls} value={palLane} onChange={(e) => setPalLane(e.target.value as ContentPalLane)}>
            {CONTENT_PAL_LANES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Primary Platform">
          <select className={inputCls} value={primaryPlatform} onChange={(e) => setPrimaryPlatform(e.target.value as ContentPlatform)}>
            {CONTENT_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Format (optional)">
        <input className={inputCls} value={format} onChange={(e) => setFormat(e.target.value)} placeholder="e.g. Investigation + Case Study (Veritasium × Johnny Harris)" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={!title.trim()}>Add to Pipeline</Btn>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ContentPipeline() {
  const contentPieces = useStore((s) => s.contentPieces);
  const [selectedPiece, setSelectedPiece] = useState<ContentPiece | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filterLane, setFilterLane] = useState<ContentPalLane | "all">("all");

  // Refresh selected piece from store when it changes
  const activePiece = selectedPiece
    ? contentPieces.find((p) => p.id === selectedPiece.id) ?? null
    : null;

  const filtered = filterLane === "all"
    ? contentPieces
    : contentPieces.filter((p) => p.palLane === filterLane);

  const byStage = (stage: ContentPipelineStage) =>
    filtered.filter((p) => p.stage === stage);

  const totalLive = contentPieces.filter((p) => p.stage === "Live").length;
  const totalClips = contentPieces.flatMap((p) => p.repurposableClips);
  const doneClips = totalClips.filter((c) => c.done).length;

  return (
    <>
      <Shell
        title="Content Pipeline"
        subtitle="Internal Palmer House productions — YouTube, Reels, and social"
        actions={
          <Btn onClick={() => setNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Piece
          </Btn>
        }
      >
        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total pieces", value: contentPieces.length },
            { label: "Live", value: totalLive, accent: "text-emerald-600" },
            { label: "In active stages", value: contentPieces.filter((p) => !["Concept", "Live"].includes(p.stage)).length, accent: "text-amber-600" },
            { label: "Clips delivered", value: `${doneClips}/${totalClips.length}` },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.accent ?? "text-gray-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lane filter */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setFilterLane("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterLane === "all" ? "bg-gray-800 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            All Lanes
          </button>
          {CONTENT_PAL_LANES.map((lane) => {
            const c = PAL_COLORS[lane];
            return (
              <button
                key={lane}
                onClick={() => setFilterLane(lane)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filterLane === lane ? `${c.bg} ${c.text} border-current shadow-sm` : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"
                }`}
              >
                {lane}
              </button>
            );
          })}
        </div>

        {/* Pipeline board */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[400px]">
          {CONTENT_PIPELINE_STAGES.map((stage) => {
            const pieces = byStage(stage);
            return (
              <div key={stage} className="flex flex-col gap-2">
                {/* Column header */}
                <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${STAGE_HEADER[stage]}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${STAGE_COLORS[stage].split(" ")[1]}`}>
                    {stage}
                  </span>
                  <span className={`text-[10px] font-bold ${pieces.length > 0 ? "text-gray-700" : "text-gray-300"}`}>
                    {pieces.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {pieces.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center min-h-[80px]">
                      <p className="text-[11px] text-gray-300 text-center">Empty</p>
                    </div>
                  ) : (
                    pieces.map((piece) => (
                      <PieceCard
                        key={piece.id}
                        piece={piece}
                        onClick={() => setSelectedPiece(piece)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Shell>

      {/* Detail drawer */}
      {activePiece && (
        <DetailDrawer piece={activePiece} onClose={() => setSelectedPiece(null)} />
      )}

      {/* New piece modal */}
      {newOpen && <NewPieceModal onClose={() => setNewOpen(false)} />}
    </>
  );
}
