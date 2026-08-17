import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Mic, RefreshCw } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { getTodayDigest, regeneratePalmerInsights } from "@/lib/morningDigest.functions";

export function PalmerInsightsCard() {
  const fetchDigest = useServerFn(getTodayDigest);
  const regenerate = useServerFn(regeneratePalmerInsights);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["morning-digest", "today"],
    queryFn: () => fetchDigest(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const regen = useMutation({
    mutationFn: () => regenerate(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["morning-digest", "today"] }),
  });

  const hasBody = Boolean(data?.generated && data?.palmerInsights);

  return (
    <section className={`bg-panel border border-line rounded-3xl relative overflow-hidden ${hasBody ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}>
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0 sm:flex-1">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Sparkles size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-hi text-base leading-tight">
              Palmer House — Daily Insights
            </h3>
            <p className="text-[11px] text-lo mt-0.5 leading-snug">From yesterday's Limitless pendant · auto-summarised at 7 AM</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start">
          <button
            onClick={() => regen.mutate()}
            disabled={regen.isPending}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-lo hover:text-hi bg-sunken border border-line px-2 py-1 rounded-md disabled:opacity-50"
            title="Re-pull yesterday's Limitless transcripts and regenerate"
          >
            <RefreshCw size={10} className={regen.isPending ? "animate-spin" : ""} />
            {regen.isPending ? "Regenerating…" : "Regenerate"}
          </button>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-lo bg-sunken border border-line px-2 py-1 rounded-md">
            <Mic size={10} /> Pendant
          </span>
        </div>
      </div>

      <div className="relative z-10">
        {isLoading ? (
          <div className="space-y-2 animate-pulse" aria-label="Loading today's insights">
            <span className="block h-3 w-4/5 rounded bg-sunken" />
            <span className="block h-3 w-3/5 rounded bg-sunken" />
          </div>
        ) : error ? (
          <EmptyLine text="Couldn't load today's digest. Try again shortly." />
        ) : !data?.generated ? (
          <EmptyLine text="Today's digest hasn't been generated yet — it lands after 7 AM." />
        ) : !data.palmerInsights ? (
          <EmptyLine text="No Palmer House insights captured yesterday. Hit Regenerate to re-pull the pendant." />
        ) : (
          <div className="text-mid">
            <Markdown source={data.palmerInsights} />
          </div>
        )}
        {regen.error ? (
          <p className="text-xs text-red-400 mt-2">Regenerate failed: {String((regen.error as Error).message ?? regen.error)}</p>
        ) : null}
      </div>
    </section>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line-strong/60 bg-sunken/40 px-3 py-2.5">
      <Sparkles size={12} className="text-lo shrink-0" />
      <p className="text-[12.5px] text-lo leading-snug">{text}</p>
    </div>
  );
}