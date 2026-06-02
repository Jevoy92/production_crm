import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav } from "@/components/cc/CCNav";
import { Btn, Field, inputCls } from "@/components/ui-bits/Modal";
import { useCCStore, PHOTO_STAGES, type PhotoStage } from "@/lib/ccStore";
import { Plus, Trash2, ImageIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cc/photo-to-video")({
  component: PhotoToVideoPage,
  head: () => ({ meta: [{ title: "Photo → Video · Palmer House" }] }),
});

const STAGE_COLOR: Record<PhotoStage, string> = {
  Selected: "var(--muted-foreground)",
  Scripted: "var(--info)",
  Recorded: "var(--warning)",
  Handoff: "var(--lane-evergreen)",
  Published: "var(--success)",
};

function PhotoToVideoPage() {
  const photoAssets = useCCStore((s) => s.photoAssets);
  const addPhotoAsset = useCCStore((s) => s.addPhotoAsset);
  const updatePhotoAsset = useCCStore((s) => s.updatePhotoAsset);
  const removePhotoAsset = useCCStore((s) => s.removePhotoAsset);
  const promote = useCCStore((s) => s.promotePhotoToLibrary);

  const [activeId, setActiveId] = useState<string | null>(photoAssets[0]?.id ?? null);
  useEffect(() => {
    if (!activeId && photoAssets[0]) setActiveId(photoAssets[0].id);
  }, [photoAssets, activeId]);
  const active = photoAssets.find((p) => p.id === activeId);

  const counts = useMemo(() => {
    const c: Record<PhotoStage, number> = { Selected: 0, Scripted: 0, Recorded: 0, Handoff: 0, Published: 0 };
    photoAssets.forEach((p) => { c[p.stage]++; });
    return c;
  }, [photoAssets]);

  return (
    <Shell title="Photo → Video Workflow" subtitle="Turn stills into narrated short-form video">
      <CCNav />

      {/* Pipeline strip */}
      <div className="card-elevated rounded-xl p-3 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PHOTO_STAGES.map((s) => (
            <div key={s} className="rounded-lg p-2.5"
              style={{ background: `color-mix(in oklab, ${STAGE_COLOR[s]} 10%, transparent)` }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: STAGE_COLOR[s] }}>{s}</div>
              <div className="num text-xl font-semibold mt-0.5" style={{ color: STAGE_COLOR[s] }}>{counts[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Asset list */}
        <div className="card-elevated rounded-xl p-3 h-fit">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Photo assets · {photoAssets.length}</div>
            <Btn variant="primary" onClick={() => {
              const id = addPhotoAsset({});
              setActiveId(id);
            }} className="flex items-center gap-1">
              <Plus className="size-3.5" /> Add
            </Btn>
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {photoAssets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={`block w-full text-left rounded-lg p-2.5 transition-colors ${
                  activeId === p.id ? "bg-surface-2 ring-2 ring-primary/40" : "ring-inset-soft hover:bg-surface-2"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.source}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background: `color-mix(in oklab, ${STAGE_COLOR[p.stage]} 15%, transparent)`, color: STAGE_COLOR[p.stage] }}>
                    {p.stage}
                  </span>
                </div>
                <div className="text-[12.5px] font-medium leading-tight line-clamp-2">{p.title}</div>
                {p.linkedContentId && (
                  <div className="text-[10px] text-success mt-1">✓ In library</div>
                )}
              </button>
            ))}
            {photoAssets.length === 0 && (
              <div className="text-[12px] text-muted-foreground py-6 text-center">No photo assets yet. Add your first.</div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="card-elevated rounded-xl p-5">
          {!active && (
            <div className="text-[13px] text-muted-foreground py-12 text-center">
              <ImageIcon className="size-8 mx-auto mb-3 opacity-40" />
              Select or add a photo asset to get started.
            </div>
          )}
          {active && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <input
                  className={inputCls + " !text-[16px] !font-semibold"}
                  value={active.title}
                  onChange={(e) => updatePhotoAsset(active.id, { title: e.target.value })}
                  placeholder="Asset title"
                />
                <button
                  onClick={() => {
                    if (confirm("Delete this asset?")) {
                      removePhotoAsset(active.id);
                      setActiveId(null);
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive p-2"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Source">
                  <select
                    className={inputCls}
                    value={active.source}
                    onChange={(e) => updatePhotoAsset(active.id, { source: e.target.value as "Palmer House" | "YourBoyJevoy" })}
                  >
                    <option value="Palmer House">Palmer House</option>
                    <option value="YourBoyJevoy">YourBoyJevoy</option>
                  </select>
                </Field>
                <Field label="Photo URL (optional)">
                  <input
                    className={inputCls}
                    value={active.photoUrl ?? ""}
                    onChange={(e) => updatePhotoAsset(active.id, { photoUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </Field>
              </div>

              {active.photoUrl ? (
                <img src={active.photoUrl} alt="" className="w-full max-h-64 object-cover rounded-lg ring-inset-soft" />
              ) : (
                <div className="w-full aspect-[16/9] max-h-48 rounded-lg ring-inset-soft bg-surface-2 grid place-items-center text-muted-foreground">
                  <div className="text-center text-[12px]">
                    <ImageIcon className="size-6 mx-auto mb-1 opacity-50" />
                    Add a photo URL to preview
                  </div>
                </div>
              )}

              <Field label="Story beats — why this photo">
                <textarea
                  rows={3} className={inputCls}
                  value={active.story}
                  onChange={(e) => updatePhotoAsset(active.id, { story: e.target.value })}
                  placeholder="What's the human story behind this image?"
                />
              </Field>

              <Field label="Technical breakdown (Palmer House lens)">
                <textarea
                  rows={3} className={inputCls}
                  value={active.technicalBreakdown}
                  onChange={(e) => updatePhotoAsset(active.id, { technicalBreakdown: e.target.value })}
                  placeholder="Camera, lens, settings, lighting, framing…"
                />
              </Field>

              <Field label="Jevoy's voiceover script">
                <textarea
                  rows={5} className={inputCls}
                  value={active.voiceoverScript}
                  onChange={(e) => updatePhotoAsset(active.id, { voiceoverScript: e.target.value })}
                  placeholder="What gets said on camera over this photo?"
                />
              </Field>

              <Field label="Production notes">
                <textarea
                  rows={2} className={inputCls}
                  value={active.notes}
                  onChange={(e) => updatePhotoAsset(active.id, { notes: e.target.value })}
                />
              </Field>

              {/* Stage pipeline */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Stage</div>
                <div className="flex flex-wrap gap-1.5">
                  {PHOTO_STAGES.map((s) => {
                    const isActive = active.stage === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updatePhotoAsset(active.id, { stage: s })}
                        className={`px-3 py-1.5 rounded-full text-[12px] transition-colors`}
                        style={{
                          background: isActive ? STAGE_COLOR[s] : `color-mix(in oklab, ${STAGE_COLOR[s]} 12%, transparent)`,
                          color: isActive ? "var(--primary-foreground)" : STAGE_COLOR[s],
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {active.linkedContentId ? (
                  <div className="text-[12px] text-success flex items-center gap-1">
                    ✓ Linked to library item
                  </div>
                ) : (
                  <Btn
                    variant="primary"
                    onClick={() => promote(active.id)}
                    className="flex items-center gap-1.5"
                    disabled={active.stage !== "Handoff" && active.stage !== "Published"}
                  >
                    Promote to Library <ArrowRight className="size-3.5" />
                  </Btn>
                )}
                {!active.linkedContentId && active.stage !== "Handoff" && active.stage !== "Published" && (
                  <span className="text-[11px] text-muted-foreground">Move to Handoff or Published to promote.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}