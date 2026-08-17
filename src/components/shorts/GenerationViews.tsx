import { useState } from "react";
import { Btn } from "@/components/ui-bits/Modal";
import { ShortIdeaCard } from "@/components/shorts/ShortIdeaCard";
import { VERSION_LABEL } from "@/lib/scriptsIndex";
import {
  deleteGeneration,
  ideasToText,
  restoreGeneration,
  toggleStar,
  type ShortsGeneration,
} from "@/lib/shortsLibrary";
import { copyToClipboard } from "@/lib/clipboard";
import { Check, Copy, History, RotateCcw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function GenerationBody({
  gen,
  onChanged,
}: {
  gen: ShortsGeneration;
  onChanged: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {gen.note && (
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-[0.14em]">
            <Check className="size-3" /> {gen.note}
          </span>
        )}
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

export function HistoryList({
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
      <div className="border border-dashed border-line p-10 text-center rounded-xl">
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
      <div className="border border-border divide-y divide-border rounded-xl overflow-hidden">
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
