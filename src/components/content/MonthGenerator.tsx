import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Modal, Btn } from "@/components/ui-bits/Modal";
import { Sparkles, Loader2, CalendarPlus, CheckCircle2 } from "lucide-react";
import { useCCStore } from "@/lib/ccStore";
import { getAllVentures, getVentureProfile, type VentureId } from "@/lib/ventures/profiles";
import { generateMonthPlan, type PostIdea } from "@/lib/contentEngine.functions";
import { postIdeaToContentItem, toCRMPlatform } from "@/lib/ventures/mapToContent";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthGenerator({
  open,
  onClose,
  defaultVenture = "palmer-house",
}: {
  open: boolean;
  onClose: () => void;
  defaultVenture?: VentureId;
}) {
  const generate = useServerFn(generateMonthPlan);
  const addContentItem = useCCStore((s) => s.addContentItem);

  const today = new Date();
  const [ventureId, setVentureId] = useState<VentureId>(defaultVenture);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [postCount, setPostCount] = useState(12);
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostIdea[] | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const venture = getVentureProfile(ventureId);

  const reset = () => {
    setPosts(null);
    setError(null);
    setSavedCount(0);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    setSavedCount(0);
    try {
      const res = await generate({
        data: {
          ventureId,
          year,
          month,
          postCount,
          focusAreas: focus
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          notes: notes.trim() || undefined,
        },
      });
      setPosts(res.posts);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Generation failed. Check LOVABLE_API_KEY and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const addAll = () => {
    if (!posts) return;
    posts.forEach((p) => addContentItem(postIdeaToContentItem(ventureId, year, month, p)));
    setSavedCount(posts.length);
  };

  const pillarName = (id: string) => venture.contentPillars.find((p) => p.id === id)?.name ?? id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate a month of content"
      wide
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Close
          </Btn>
          {posts && savedCount === 0 && (
            <Btn variant="primary" onClick={addAll}>
              <CalendarPlus size={14} /> Add {posts.length} to Library + Calendar
            </Btn>
          )}
          {savedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-emerald text-sm font-medium px-2">
              <CheckCircle2 size={15} /> Added {savedCount} drafts
            </span>
          )}
          {!posts && (
            <Btn variant="primary" onClick={run} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {busy ? "Generating…" : "Generate"}
            </Btn>
          )}
        </>
      }
    >
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-lo mb-1 block">Venture</span>
          <select
            className="ph-select w-full"
            value={ventureId}
            onChange={(e) => {
              setVentureId(e.target.value as VentureId);
              reset();
            }}
          >
            {getAllVentures().map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-lo mb-1 block"># of posts</span>
          <input
            type="number"
            min={1}
            max={40}
            className="ph-input w-full"
            value={postCount}
            onChange={(e) => setPostCount(Math.min(40, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-lo mb-1 block">Month</span>
          <select
            className="ph-select w-full"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-lo mb-1 block">Year</span>
          <input
            type="number"
            min={2024}
            max={2100}
            className="ph-input w-full"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || today.getFullYear())}
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <label className="block">
          <span className="text-xs text-lo mb-1 block">
            Focus areas this month <span className="text-lo/70">(optional, comma-separated)</span>
          </span>
          <input
            className="ph-input w-full"
            placeholder="e.g. the founder's freeze, launch story, $450 shoot"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-lo mb-1 block">
            Extra context <span className="text-lo/70">(optional)</span>
          </span>
          <textarea
            rows={2}
            className="ph-input w-full"
            placeholder="Anything specific happening this month the AI should weave in…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      {/* Venture voice hint */}
      <div className="mt-3 text-[11.5px] text-lo rounded-lg bg-sunken border border-line px-3 py-2">
        <span className="font-medium" style={{ color: venture.accent }}>
          {venture.shortName}
        </span>{" "}
        · {venture.tone}
      </div>

      {error && (
        <div className="mt-3 text-sm text-rose bg-rose/10 border border-rose/25 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Preview */}
      {posts && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-lo mb-2">
            {posts.length} ideas for {MONTHS[month - 1]} {year}
          </div>
          <div className="space-y-1.5 max-h-[44vh] overflow-y-auto pr-1">
            {[...posts]
              .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
              .map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-sunken border border-line px-3 py-2.5"
                >
                  <div className="text-center w-9 flex-shrink-0">
                    <div className="text-[9px] uppercase tracking-wider text-lo">
                      {MONTHS[month - 1].slice(0, 3)}
                    </div>
                    <div className="num text-base font-bold leading-none text-hi">
                      {p.dayOfMonth}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-hi leading-snug">{p.title}</div>
                    {p.hook && (
                      <div className="text-[12px] text-mid italic mt-0.5 line-clamp-1">
                        “{p.hook}”
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Chip>{toCRMPlatform(p.platform)}</Chip>
                      <Chip>{p.contentType}</Chip>
                      <Chip accent={venture.accent}>{pillarName(p.pillarId)}</Chip>
                      <span className="text-[11px] text-lo">{p.postTime}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <span
      className="inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded-md border"
      style={
        accent
          ? {
              color: accent,
              background: `color-mix(in oklab, ${accent} 14%, transparent)`,
              borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}
