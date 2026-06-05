import { useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/Markdown";

function todayYMD() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

async function fetchTodaysDigest() {
  const { data } = await supabase
    .from("morning_digests")
    .select("date, body_md, updated_at, source")
    .eq("date", todayYMD())
    .maybeSingle();
  return data;
}

async function regenerate() {
  const res = await fetch("/api/public/hooks/morning-digest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export function MorningBriefCard() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["morning-digest", todayYMD()],
    queryFn: fetchTodaysDigest,
    refetchOnWindowFocus: false,
  });
  const [busy, setBusy] = useState(false);

  const handleRegen = async () => {
    setBusy(true);
    try {
      await regenerate();
      await refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet/5 rounded-full -translate-y-16 translate-x-16" />
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-brand-700 flex items-center justify-center flex-shrink-0 shadow-[var(--elev-sm)]">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-lo mb-0.5">
            Morning brief · auto-generated 7am
          </div>
          <p className="text-hi text-sm font-medium leading-snug">
            Today's plan, drafted from yesterday's pendant transcripts, important inbox, completed tasks, overview log, and today's calendar.
          </p>
        </div>
        <button
          onClick={handleRegen}
          disabled={busy}
          className="text-xs text-lo hover:text-hi flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line hover:border-brand-500/40 disabled:opacity-50"
        >
          <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
          {data ? "Refresh" : "Generate now"}
        </button>
      </div>
      <div className="bg-sunken border border-line rounded-xl p-4">
        {isLoading ? (
          <p className="text-lo text-sm">Loading today's brief…</p>
        ) : data?.body_md ? (
          <div className="prose prose-sm prose-invert max-w-none">
            <Markdown source={data.body_md} />
          </div>
        ) : (
          <p className="text-lo text-sm">
            No brief yet for {todayYMD()}. The 7am job hasn't run, or you can generate one now.
          </p>
        )}
      </div>
    </div>
  );
}