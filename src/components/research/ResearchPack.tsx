import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  FileText,
  Film,
  ImageIcon,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getResearchPack,
  type ResearchPack as ResearchPackType,
  type StudyCard,
  type VisualBeat,
} from "@/lib/researchPacks";
import {
  addLinkAsset,
  deleteAsset,
  listAssets,
  listChecklist,
  toggleChecklistItem,
  uploadAssetFile,
  type ResearchAsset,
} from "@/lib/researchAssets";
import { fetchOgMeta } from "@/lib/researchOg.functions";
import { useServerFn } from "@tanstack/react-start";
import { Btn } from "@/components/ui-bits/Modal";

type Props = { themeNo: string };

export function ResearchPack({ themeNo }: Props) {
  const pack = getResearchPack(themeNo);
  const [assets, setAssets] = useState<ResearchAsset[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([listAssets(themeNo), listChecklist(themeNo)])
      .then(([a, c]) => {
        if (!alive) return;
        setAssets(a);
        const map: Record<string, boolean> = {};
        for (const row of c) map[row.item_key] = row.checked;
        setChecked(map);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to load research pack");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [themeNo]);

  const assetsByCard = useMemo(() => {
    const m: Record<string, ResearchAsset[]> = {};
    for (const a of assets) (m[a.card_id] ??= []).push(a);
    return m;
  }, [assets]);

  const refresh = async () => {
    const next = await listAssets(themeNo);
    setAssets(next);
  };

  if (!pack) {
    return (
      <EmptyState themeNo={themeNo} />
    );
  }

  return (
    <div className="space-y-6">
      <PackHeader pack={pack} assetCount={assets.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {pack.studies.map((study) => (
            <StudyCardView
              key={study.id}
              themeNo={themeNo}
              study={study}
              assets={assetsByCard[study.id] ?? []}
              onChanged={refresh}
            />
          ))}

          <h2 className="text-[15px] font-semibold mt-8 mb-2">
            Non-study visuals (emotional beats)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pack.beats.map((beat) => (
              <BeatCard
                key={beat.id}
                themeNo={themeNo}
                beat={beat}
                assets={assetsByCard[beat.id] ?? []}
                onChanged={refresh}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <ChecklistCard
            pack={pack}
            themeNo={themeNo}
            checked={checked}
            onToggle={async (id, next) => {
              setChecked((prev) => ({ ...prev, [id]: next }));
              try {
                await toggleChecklistItem(themeNo, id, next);
              } catch (e) {
                console.error(e);
                toast.error("Failed to save");
                setChecked((prev) => ({ ...prev, [id]: !next }));
              }
            }}
          />
          {loading && (
            <div className="text-[12px] text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" /> Loading assets…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ themeNo }: { themeNo: string }) {
  return (
    <div className="card-elevated rounded-2xl p-8 text-center">
      <div className="text-[13px] text-muted-foreground">
        No research pack has been authored for script {themeNo} yet.
      </div>
      <div className="text-[12px] text-muted-foreground/70 mt-2">
        Add one at <code>src/content/research/&lt;slug&gt;.ts</code> with{" "}
        <code>theme_no: "{themeNo}"</code>.
      </div>
    </div>
  );
}

function PackHeader({
  pack,
  assetCount,
}: {
  pack: ResearchPackType;
  assetCount: number;
}) {
  return (
    <div className="card-elevated rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Research & B-roll
          </div>
          <h2 className="text-lg md:text-xl font-semibold mt-1">{pack.title}</h2>
          {pack.subtitle && (
            <div className="text-[13px] text-muted-foreground mt-0.5">
              {pack.subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground px-2 py-1 rounded-md bg-surface-2">
            {assetCount} asset{assetCount === 1 ? "" : "s"}
          </div>
          {pack.driveFolderUrl && (
            <a
              href={pack.driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
                <ExternalLink className="size-3.5" /> Drive folder
              </Btn>
            </a>
          )}
        </div>
      </div>
      {(pack.howToUse || pack.deliveryRule) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {pack.howToUse && (
            <Callout label="How to use" text={pack.howToUse} tone="info" />
          )}
          {pack.deliveryRule && (
            <Callout label="Delivery rule" text={pack.deliveryRule} tone="warn" />
          )}
        </div>
      )}
    </div>
  );
}

function Callout({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "info" | "warn";
}) {
  const colors =
    tone === "warn"
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-sky-500/30 bg-sky-500/5";
  return (
    <div className={`rounded-xl border ${colors} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-[12.5px] leading-relaxed">{text}</div>
    </div>
  );
}

function StudyCardView({
  themeNo,
  study,
  assets,
  onChanged,
}: {
  themeNo: string;
  study: StudyCard;
  assets: ResearchAsset[];
  onChanged: () => void;
}) {
  const links =
    study.links ?? (study.link ? [{ label: "Source", url: study.link }] : []);
  return (
    <article className="card-elevated rounded-2xl p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">
            Study {study.number}
          </div>
          <h3 className="text-base md:text-lg font-semibold mt-0.5">
            {study.title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2 rounded-md bg-surface-2 hover:bg-surface-3 text-[11px] flex items-center gap-1"
              title={l.url}
            >
              <ExternalLink className="size-3" /> {l.label}
            </a>
          ))}
        </div>
      </div>

      <blockquote className="border-l-2 border-primary/60 pl-3 italic text-[14px] leading-relaxed text-foreground/90 mb-3">
        “{study.say}”
      </blockquote>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-surface-2 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            On-screen card
          </div>
          <div className="text-[12.5px] leading-relaxed">{study.card}</div>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Visual to grab
          </div>
          <div className="text-[12.5px] leading-relaxed">{study.visual}</div>
        </div>
      </div>

      <AssetGallery
        themeNo={themeNo}
        cardId={study.id}
        assets={assets}
        onChanged={onChanged}
      />
    </article>
  );
}

function BeatCard({
  themeNo,
  beat,
  assets,
  onChanged,
}: {
  themeNo: string;
  beat: VisualBeat;
  assets: ResearchAsset[];
  onChanged: () => void;
}) {
  return (
    <article className="card-elevated rounded-2xl p-4">
      <h4 className="text-[14px] font-semibold">{beat.title}</h4>
      <p className="text-[12.5px] text-muted-foreground mt-1 mb-3 leading-relaxed">
        {beat.description}
      </p>
      <AssetGallery
        themeNo={themeNo}
        cardId={beat.id}
        assets={assets}
        onChanged={onChanged}
        compact
      />
    </article>
  );
}

function ChecklistCard({
  pack,
  themeNo: _themeNo,
  checked,
  onToggle,
}: {
  pack: ResearchPackType;
  themeNo: string;
  checked: Record<string, boolean>;
  onToggle: (id: string, next: boolean) => void;
}) {
  const done = pack.shotList.filter((i) => checked[i.id]).length;
  const pct = Math.round((done / pack.shotList.length) * 100) || 0;
  return (
    <div className="card-elevated rounded-2xl p-4 sticky top-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-semibold">Shot-list checklist</h3>
        <span className="text-[11px] text-muted-foreground">
          {done}/{pack.shotList.length}
        </span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {pack.shotList.map((item) => {
          const isOn = !!checked[item.id];
          return (
            <li key={item.id}>
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span
                  className={`text-[12.5px] leading-snug ${isOn ? "line-through text-muted-foreground" : ""}`}
                >
                  {item.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AssetGallery({
  themeNo,
  cardId,
  assets,
  onChanged,
  compact,
}: {
  themeNo: string;
  cardId: string;
  assets: ResearchAsset[];
  onChanged: () => void;
  compact?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const callFetchOg = useServerFn(fetchOgMeta);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await uploadAssetFile({ themeNo, cardId, file });
      }
      toast.success(`Added ${files.length} file${files.length === 1 ? "" : "s"}`);
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onAddLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    setBusy(true);
    try {
      let og: { title?: string; image?: string } | undefined;
      try {
        const meta = await callFetchOg({ data: { url } });
        og = {
          title: meta.title ?? undefined,
          image: meta.image ?? undefined,
        };
      } catch {
        /* OG fetch is best-effort */
      }
      await addLinkAsset({ themeNo, cardId, url, caption, og });
      setLinkUrl("");
      setCaption("");
      setAdding(false);
      toast.success("Link added");
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add link");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (asset: ResearchAsset) => {
    if (!confirm("Remove this asset?")) return;
    try {
      await deleteAsset(asset);
      toast.success("Removed");
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border border-dashed p-3 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-surface-1/40"
        }`}
      >
        {assets.length === 0 && (
          <div className="text-[11.5px] text-muted-foreground text-center py-2">
            Drop screenshots, video clips, or PDFs here — or use the buttons
            below.
          </div>
        )}

        {assets.length > 0 && (
          <div
            className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}
          >
            {assets.map((a) => (
              <AssetThumb key={a.id} asset={a} onDelete={onDelete} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Btn
            variant="subtle"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 h-7 text-[11.5px]"
          >
            <Upload className="size-3" /> Upload
          </Btn>
          <Btn
            variant="subtle"
            onClick={() => setAdding((v) => !v)}
            disabled={busy}
            className="flex items-center gap-1.5 h-7 text-[11.5px]"
          >
            <LinkIcon className="size-3" /> Paste link
          </Btn>
          {busy && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> Working…
            </span>
          )}
        </div>

        {adding && (
          <div className="mt-2 flex flex-col gap-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://… (YouTube, article, screenshot URL)"
              className="h-8 px-2 rounded-md bg-surface-2 text-[12px] border border-border focus:outline-none focus:border-primary"
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="h-8 px-2 rounded-md bg-surface-2 text-[12px] border border-border focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <Btn
                onClick={onAddLink}
                disabled={busy || !linkUrl.trim()}
                className="h-7 text-[11.5px] flex items-center gap-1"
              >
                <Plus className="size-3" /> Add
              </Btn>
              <Btn
                variant="subtle"
                onClick={() => setAdding(false)}
                className="h-7 text-[11.5px]"
              >
                Cancel
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssetThumb({
  asset,
  onDelete,
}: {
  asset: ResearchAsset;
  onDelete: (a: ResearchAsset) => void;
}) {
  const url = asset.display_url;
  const isYouTube =
    asset.kind === "link" &&
    !!asset.source_url &&
    /(?:youtube\.com|youtu\.be)/.test(asset.source_url);

  return (
    <div className="group relative rounded-md overflow-hidden bg-surface-2 border border-border aspect-video">
      {asset.kind === "image" && url ? (
        <img
          src={url}
          alt={asset.caption ?? ""}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : asset.kind === "video" && url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={url} controls className="w-full h-full object-cover" />
      ) : asset.kind === "link" ? (
        <a
          href={asset.source_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          {asset.og_image ? (
            <img
              src={asset.og_image}
              alt={asset.og_title ?? asset.source_url ?? ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              {isYouTube ? (
                <Film className="size-6" />
              ) : (
                <LinkIcon className="size-6" />
              )}
            </div>
          )}
        </a>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
          {asset.kind === "image" ? (
            <ImageIcon className="size-6" />
          ) : asset.kind === "video" ? (
            <Film className="size-6" />
          ) : (
            <FileText className="size-6" />
          )}
        </div>
      )}

      {/* hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100">
        <div className="text-[10px] text-white/90 truncate max-w-[70%]">
          {asset.caption ?? asset.og_title ?? ""}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(asset);
          }}
          className="text-white/90 hover:text-red-400"
          title="Remove"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {asset.kind === "link" && (
        <div className="absolute top-1 right-1 bg-black/60 text-white rounded px-1 py-0.5 text-[9px] uppercase tracking-wider">
          link
        </div>
      )}
    </div>
  );
}

// Re-export the CheckCircle for any future use (currently unused but kept to
// keep the icon import tree stable when designs iterate).
export const _CheckCircle = CheckCircle2;