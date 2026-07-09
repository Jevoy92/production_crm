import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Mic } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { getTodayDigest } from "@/lib/morningDigest.functions";

export function PalmerInsightsCard() {
  const fetchDigest = useServerFn(getTodayDigest);
  const { data, isLoading, error } = useQuery({
    queryKey: ["morning-digest", "today"],
    queryFn: () => fetchDigest(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <section className="bg-panel border border-line rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Sparkles size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-hi text-base truncate">
              Palmer House — Daily Insights
            </h3>
            <p className="text-[11px] text-lo mt-0.5">From yesterday's Limitless pendant · auto-summarised at 7 AM</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-lo bg-sunken border border-line px-2 py-1 rounded-md shrink-0">
          <Mic size={10} /> Pendant
        </span>
      </div>

      <div className="relative z-10 min-h-[60px]">
        {isLoading ? (
          <p className="text-sm text-lo">Loading today's insights…</p>
        ) : error ? (
          <p className="text-sm text-lo">Couldn't load today's digest. Try again shortly.</p>
        ) : !data?.generated ? (
          <p className="text-sm text-lo">Today's digest hasn't been generated yet — check back after 7 AM.</p>
        ) : !data.palmerInsights ? (
          <p className="text-sm text-lo italic">No Palmer House activity captured yesterday.</p>
        ) : (
          <div className="text-mid">
            <Markdown source={data.palmerInsights} />
          </div>
        )}
      </div>
    </section>
  );
}