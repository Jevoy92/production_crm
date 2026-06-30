import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, SegmentedControl } from "@/components/app/AppShell";
import { Modal, Field } from "@/components/ui-bits/Modal";
import { Reveal, Stagger, StaggerItem, AnimatedNumber } from "@/components/motion/Motion";
import {
  useCCStore,
  CC_STATUSES,
  PAL_LANES,
  platformColor,
  type CCStatus,
  type PalLane,
} from "@/lib/ccStore";
import {
  Plus, Trash2, Search, Lightbulb, Zap, Film, CircleCheck, Loader, Rocket,
  LayoutGrid, List as ListIcon, Clapperboard, Globe, Layers, Camera, Image as ImageIcon,
  FileText, GraduationCap, Settings, Megaphone, X, ArrowUpRight, ExternalLink, Sparkles, Mic,
} from "lucide-react";
import type { ContentItem, ContentType, Platform } from "@/lib/ccStore";
import { MonthGenerator } from "@/components/content/MonthGenerator";
import { getAllVentures, getVentureProfile, VENTURE_IDS, type VentureId } from "@/lib/ventures/profiles";
import { generateFullScript } from "@/lib/contentEngine.functions";
import { createScript, updateScript } from "@/lib/studio.functions";

// Generated content type → generic deliverable type for the full-script generator.
const TYPE_TO_GENERIC: Record<string, string> = {
  Short: "short", Carousel: "carousel", Article: "article", "Blog/Newsletter": "article",
  Podcast: "podcast", Video: "video", Website: "video", "Core 12": "video",
};
// Venture → existing Studio brand enum (original|jevoy|palmer-house|mindyourbizniz).
const VENTURE_TO_STUDIO_BRAND: Record<VentureId, "original" | "jevoy" | "palmer-house" | "mindyourbizniz"> = {
  "palmer-house": "palmer-house",
  "jevoy-palmer": "jevoy",
  "yourboy-jevoy": "jevoy",
  "mind-your-bizniz": "mindyourbizniz",
  besettld: "original",
};

const TYPE_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "Core 12": Clapperboard, Website: Globe, Short: Zap, Carousel: Layers, BTS: Camera,
  "Photo-to-Video": ImageIcon, "Sales Support": Megaphone, Onboarding: GraduationCap,
  System: Settings, "Blog/Newsletter": FileText,
  Video: Film, Article: FileText, Podcast: Mic, Photo: ImageIcon,
};

const VENTURE_LABELS: Record<string, string> = Object.fromEntries(
  getAllVentures().map((v) => [v.id, v.shortName]),
);
const typeIconFor = (t: string) => TYPE_ICON[t] ?? FileText;

export const Route = createFileRoute("/content")({
  component: ContentPage,
  head: () => ({ meta: [{ title: "Content Library · Production OS" }] }),
});

const LANE_COLOR: Record<PalLane, string> = {
  Reel: "var(--accent-orange)",
  Spotlight: "var(--accent-violet)",
  Evergreen: "var(--accent-emerald)",
  System: "var(--accent-cyan)",
};
const LANE_ICON: Record<PalLane, React.ComponentType<{ size?: number; className?: string }>> = {
  Reel: Zap, Spotlight: Clapperboard, Evergreen: Film, System: LayoutGrid,
};

function statusBucket(s: CCStatus): { label: string; tone: string } {
  if (["Idea", "Outline Ready", "Script Ready"].includes(s)) return { label: s, tone: "violet" };
  if (["Ready to Film", "Filmed", "Logged", "Sent to Editor", "Editing"].includes(s)) return { label: s, tone: "amber" };
  if (s === "Needs Jevoy Review") return { label: "Review", tone: "cyan" };
  if (["Ready to Publish", "Scheduled"].includes(s)) return { label: s, tone: "emerald" };
  if (["Published", "Repurposed"].includes(s)) return { label: s, tone: "brand" };
  return { label: s, tone: "neutral" };
}
const TONE_BADGE: Record<string, string> = {
  violet: "text-violet bg-violet/15 border border-violet/25",
  amber: "text-amber bg-amber/15 border border-amber/25",
  cyan: "text-cyan bg-cyan/15 border border-cyan/25",
  emerald: "text-emerald bg-emerald/15 border border-emerald/25",
  brand: "text-brand-300 bg-brand-600/20 border border-brand-500/30",
  neutral: "text-mid bg-sunken border border-line",
};

function progressFor(status: CCStatus) {
  const i = CC_STATUSES.indexOf(status);
  return Math.round(((i + 1) / CC_STATUSES.length) * 100);
}

function ContentPage() {
  const library = useCCStore((s) => s.library);
  const addContentItem = useCCStore((s) => s.addContentItem);
  const updateContentItem = useCCStore((s) => s.updateContentItem);
  const removeContentItem = useCCStore((s) => s.removeContentItem);

  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("");
  const [lane, setLane] = useState<string>("all");
  const [venture, setVenture] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const detail = library.find((c) => c.id === detailId) ?? null;

  const filtered = useMemo(
    () =>
      library.filter(
        (c) =>
          (!q || c.title.toLowerCase().includes(q.toLowerCase())) &&
          (type === "all" || c.type === type) &&
          (!status || c.status === status) &&
          (lane === "all" || c.palLane === lane) &&
          (venture === "all" || (c.venture ?? "palmer-house") === venture),
      ),
    [library, q, type, status, lane, venture],
  );

  const stats = useMemo(() => {
    const by = (pred: (s: CCStatus) => boolean) => library.filter((l) => pred(l.status)).length;
    return [
      { label: "Ideas", value: by((s) => ["Idea", "Outline Ready"].includes(s)), icon: Lightbulb, tone: "violet" },
      { label: "Scripts", value: library.filter((l) => l.status === "Script Ready").length, icon: Film, tone: "cyan" },
      { label: "In Production", value: by((s) => ["Ready to Film", "Filmed", "Logged", "Sent to Editor", "Editing"].includes(s)), icon: Loader, tone: "amber" },
      { label: "Review", value: library.filter((l) => l.status === "Needs Jevoy Review").length, icon: Zap, tone: "rose" },
      { label: "Ready", value: by((s) => ["Ready to Publish", "Scheduled"].includes(s)), icon: Rocket, tone: "brand" },
      { label: "Published", value: by((s) => ["Published", "Repurposed"].includes(s)), icon: CircleCheck, tone: "emerald" },
    ];
  }, [library]);

  const addNew = () =>
    addContentItem({
      title: "New content item", type: "Short", platform: "Instagram Reels", status: "Idea",
      palLane: "Reel", businessPurpose: "", cta: "", fileLocation: "", editorNotes: "",
      caption: "", thumbnailIdea: "", repurposingStatus: "", performanceNotes: "",
    });

  return (
    <AppShell
      title="Content Library"
      subtitle={`${library.length} items · ${library.filter((l) => l.status === "Published").length} published`}
      actions={
        <>
          <Link to="/repurpose" className="ph-btn ph-btn-soft ph-btn-sm">Shorts →</Link>
          <button className="ph-btn ph-btn-soft ph-btn-sm" onClick={() => setGenOpen(true)}><Sparkles size={14} /> Generate month</button>
          <button className="ph-btn ph-btn-primary ph-btn-sm" onClick={addNew}><Plus size={14} /> New Idea</button>
        </>
      }
    >
      {/* Stats bar */}
      <Reveal>
        <div className="flex items-center gap-5 flex-wrap mb-5 pb-5 border-b border-line">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2.5">
                {i > 0 && <span className="w-px h-8 bg-line -ml-3 mr-2 hidden sm:block" />}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE_BADGE[s.tone]}`}>
                  <Icon size={13} />
                </div>
                <div>
                  <div className="text-hi font-bold text-lg leading-none num"><AnimatedNumber value={s.value} /></div>
                  <div className="text-lo text-xs">{s.label}</div>
                </div>
              </div>
            );
          })}
          <div className="ml-auto">
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: <LayoutGrid size={13} /> },
                { value: "list", label: <ListIcon size={13} /> },
              ]}
            />
          </div>
        </div>
      </Reveal>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo" />
          <input className="ph-input" style={{ paddingLeft: 34 }} placeholder="Search content…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <FilterPills
          label="Venture"
          value={venture}
          onChange={setVenture}
          options={["all", ...VENTURE_IDS]}
          labels={{ all: "All", ...VENTURE_LABELS }}
        />
        <FilterPills
          label="Lane"
          value={lane}
          onChange={setLane}
          options={["all", ...PAL_LANES]}
          labels={{ all: "All" }}
        />
        <select className="ph-select" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-mid text-sm">
          No content matches. Add an item or generate shorts from the{" "}
          <Link to="/repurpose" className="text-brand-400 font-semibold">Shorts</Link> engine.
        </div>
      ) : view === "grid" ? (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.04}>
          {filtered.map((c) => {
            const lc = LANE_COLOR[c.palLane];
            const LaneIcon = LANE_ICON[c.palLane];
            const sb = statusBucket(c.status);
            const pct = progressFor(c.status);
            return (
              <StaggerItem key={c.id} variant="scaleIn">
                <div onClick={() => setDetailId(c.id)} className="group bg-panel border border-line rounded-2xl overflow-hidden hover:border-brand-500/40 hover:shadow-[var(--elev-hover)] transition-all flex flex-col h-full cursor-pointer">
                  {/* Thumb — generated graphic relevant to lane + type */}
                  <div className="relative h-36 overflow-hidden flex items-center justify-center" style={{ background: `radial-gradient(120% 120% at 20% 0%, ${lc}40, ${lc}10 60%, transparent), var(--sunken)` }}>
                    <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${lc}14 0 2px, transparent 2px 16px)` }} />
                    <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${lc}26`, border: `1px solid ${lc}55`, color: lc }}>
                      {(() => { const TI = typeIconFor(c.type); return <TI size={26} />; })()}
                    </div>
                    <LaneIcon size={120} className="absolute -right-6 -bottom-8 opacity-[0.07]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-panel/90 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide" style={{ color: lc, background: `${lc}26`, border: `1px solid ${lc}40` }}>
                      {c.palLane}
                    </span>
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-lg ${TONE_BADGE[sb.tone]}`}>{sb.label}</span>
                    <span className="absolute bottom-2.5 left-3 text-[10px] font-semibold text-hi/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: platformColor(c.platform) }} /> {c.type}</span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-hi font-semibold text-sm mb-1.5 leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">{c.title}</h3>
                    <p className="text-lo text-xs leading-relaxed mb-3 flex-1 line-clamp-2">{c.businessPurpose || "No description yet."}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-mid text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: platformColor(c.platform) }} />
                        {c.type}
                      </span>
                      <span className="text-lo text-xs">{c.platform}</span>
                    </div>
                    <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-lo text-xs">{pct}%</span>
                      <div className="flex-1 mx-2 h-1 bg-sunken rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: lc }} />
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this item?")) removeContentItem(c.id); }} className="text-lo hover:text-rose transition-colors" aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : (
        <ListView items={filtered} onOpen={setDetailId} remove={removeContentItem} />
      )}

      <ContentDetailModal item={detail} onClose={() => setDetailId(null)} update={updateContentItem} remove={(id) => { removeContentItem(id); setDetailId(null); }} />
      <MonthGenerator open={genOpen} onClose={() => setGenOpen(false)} />
    </AppShell>
  );
}

function ContentDetailModal({
  item, onClose, update, remove,
}: {
  item: ContentItem | null;
  onClose: () => void;
  update: (id: string, patch: Partial<ContentItem>) => void;
  remove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const genFull = useServerFn(generateFullScript);
  const create = useServerFn(createScript);
  const upd = useServerFn(updateScript);
  const [expanding, setExpanding] = useState(false);
  if (!item) return null;
  const lc = LANE_COLOR[item.palLane];
  const sb = statusBucket(item.status);
  const TI = typeIconFor(item.type);
  const scriptNum = item.parentScriptNum ?? item.relatedCore12;
  const scriptParam = scriptNum != null ? String(scriptNum).padStart(2, "0") : null;
  // The "script" body for this content: caption is the closest to the written piece.
  const script = item.caption?.trim() || item.businessPurpose?.trim() || "";
  const ventureId = (item.venture ?? "palmer-house") as VentureId;
  const ventureProfile = getVentureProfile(ventureId);

  const expandToStudio = async () => {
    setExpanding(true);
    try {
      const { script: body } = await genFull({
        data: {
          ventureId,
          title: item.title,
          platform: item.platform,
          contentType: TYPE_TO_GENERIC[item.type] ?? "video",
          caption: item.caption || undefined,
        },
      });
      const row = await create({ data: { title: item.title, brand: VENTURE_TO_STUDIO_BRAND[ventureId] } });
      if (row?.id) {
        await upd({ data: { id: row.id, body_md: body } });
        update(item.id, { studioScriptId: row.id, status: "Script Ready" });
        navigate({ to: "/studio/$id", params: { id: row.id } });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not expand to Studio. Check LOVABLE_API_KEY.");
    } finally {
      setExpanding(false);
    }
  };

  return (
    <Modal open={!!item} onClose={onClose} title="" wide>
      <div className="-mt-1">
        {/* Header banner */}
        <div className="relative -mx-6 -mt-2 mb-5 h-28 overflow-hidden flex items-center px-6" style={{ background: `radial-gradient(120% 140% at 15% 0%, ${lc}45, ${lc}12 60%, transparent), var(--sunken)` }}>
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${lc}14 0 2px, transparent 2px 16px)` }} />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${lc}26`, border: `1px solid ${lc}55`, color: lc }}><TI size={22} /></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase" style={{ color: lc, background: `${lc}26`, border: `1px solid ${lc}40` }}>{item.palLane}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${TONE_BADGE[sb.tone]}`}>{sb.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase" style={{ color: ventureProfile.accent, background: `color-mix(in oklab, ${ventureProfile.accent} 16%, transparent)`, border: `1px solid color-mix(in oklab, ${ventureProfile.accent} 35%, transparent)` }}>{ventureProfile.shortName}</span>
                {item.aiGenerated && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-brand-300 bg-brand-600/20 border border-brand-500/30 inline-flex items-center gap-1"><Sparkles size={10} /> AI</span>}
              </div>
              <h2 className="font-display font-bold text-hi text-lg leading-tight">{item.title}</h2>
            </div>
          </div>
        </div>

        {/* Meta editable */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Field label="Status">
            <select className="ph-input" value={item.status} onChange={(e) => update(item.id, { status: e.target.value as CCStatus })}>
              {CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Lane">
            <select className="ph-input" value={item.palLane} onChange={(e) => update(item.id, { palLane: e.target.value as PalLane })}>
              {PAL_LANES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <input className="ph-input" value={item.type} readOnly />
          </Field>
        </div>

        {/* Related long-form script */}
        {scriptParam && (
          <Link to="/scripts/$num" params={{ num: scriptParam }} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-brand-600/10 border border-brand-500/25 hover:border-brand-500/50 transition-colors mb-5">
            <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400"><FileText size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-hi text-sm font-semibold">Open script #{scriptParam}</div>
              <div className="text-lo text-xs">View the full long-form script this content maps to</div>
            </div>
            <ArrowUpRight size={16} className="text-brand-400" />
          </Link>
        )}

        {/* Script / caption body — editable */}
        <Field label={item.caption?.trim() ? "Script / Caption" : "Notes"}>
          <textarea
            className="ph-input"
            rows={8}
            value={script}
            placeholder="Write the script, caption, or notes for this piece…"
            onChange={(e) => update(item.id, { caption: e.target.value })}
          />
        </Field>

        {item.businessPurpose && (
          <p className="text-mid text-xs mt-3 leading-relaxed"><span className="text-lo font-semibold uppercase tracking-wide text-[10px]">Purpose · </span>{item.businessPurpose}</p>
        )}

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
          <button onClick={() => { if (confirm("Delete this item?")) remove(item.id); }} className="ph-btn ph-btn-soft ph-btn-sm hover:text-rose flex items-center gap-1.5"><Trash2 size={13} /> Delete</button>
          <div className="flex items-center gap-2">
            {item.studioScriptId ? (
              <Link to="/studio/$id" params={{ id: item.studioScriptId }} onClick={onClose} className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5"><Clapperboard size={13} /> Open in Studio</Link>
            ) : (
              <button onClick={expandToStudio} disabled={expanding} className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5">
                {expanding ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {expanding ? "Writing…" : "Expand to Studio"}
              </button>
            )}
            <button onClick={onClose} className="ph-btn ph-btn-primary ph-btn-sm">Done</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function FilterPills({
  label, value, onChange, options, labels = {},
}: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; labels?: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lo text-xs font-medium">{label}:</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              value === o ? "bg-brand-600 text-white" : "bg-sunken text-mid hover:text-hi hover:bg-raised"
            }`}
          >
            {labels[o] ?? o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListView({
  items, onOpen, remove,
}: {
  items: any[]; onOpen: (id: string) => void; remove: (id: string) => void;
}) {
  return (
    <div className="bg-panel border border-line rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lo text-[11px] uppercase tracking-wide border-b border-line">
              <th className="text-left font-bold px-4 py-3">Title</th>
              <th className="text-left font-bold px-4 py-3">Type</th>
              <th className="text-left font-bold px-4 py-3">Lane</th>
              <th className="text-left font-bold px-4 py-3">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const sb = statusBucket(c.status);
              return (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="border-b border-line last:border-0 hover:bg-hover transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-hi font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-mid">{c.type}</td>
                  <td className="px-4 py-3"><span className="text-mid">{c.palLane}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${TONE_BADGE[sb.tone]}`}>{sb.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this item?")) remove(c.id); }} className="text-lo hover:text-rose transition-colors" aria-label="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
