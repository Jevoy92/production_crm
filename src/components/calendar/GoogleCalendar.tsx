import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { fetchCalendar, type CalEvent } from "@/lib/calendar.functions";

// Palmer House Google Calendar (read-only). The iCal feed URL lives server-side
// in CALENDAR_ICS_URL (.env) — use the "Secret address in iCal format" so full
// event details come through even when the org blocks public detail sharing.
export const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=info%40palmerhouseproductions.com&ctz=America%2FLos_Angeles&mode=AGENDA&showTitle=0&showPrint=0&showCalendars=0";

/** Parsed events from the server-side iCal feed — powers the Today digest. */
export function useCalendarEvents() {
  const fn = useServerFn(fetchCalendar);
  return useQuery({
    queryKey: ["calendar"],
    queryFn: () => fn({ data: {} }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

/** "See the calendar as-is" — the live Google Calendar embed, plus a parsed agenda. */
export function GoogleCalendarPanel() {
  const { data: events, isLoading, error, refetch, isFetching } = useCalendarEvents();

  const byDay = new Map<string, CalEvent[]>();
  (events ?? []).forEach((e) => {
    const key = new Date(e.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4">
      {/* Live embed — the calendar exactly as Google renders it */}
      <div className="bg-panel border border-line rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center"><CalendarDays size={14} className="text-brand-400" /></div>
            <div>
              <h3 className="font-display font-bold text-hi text-base flex items-center gap-2">Google Calendar <span className="text-[10px] font-semibold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">Live</span></h3>
              <p className="text-lo text-xs">info@palmerhouseproductions.com · read-only</p>
            </div>
          </div>
          <a href={CALENDAR_EMBED_URL} target="_blank" rel="noreferrer" className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5"><ExternalLink size={12} /> Open</a>
        </div>
        <iframe
          title="Google Calendar"
          src={CALENDAR_EMBED_URL}
          className="w-full bg-white"
          style={{ height: 560, border: 0 }}
        />
      </div>

      {/* Parsed agenda (drives the digest) */}
      <div className="bg-panel border border-line rounded-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-3.5 border-b border-line flex items-center justify-between">
          <h3 className="font-display font-bold text-hi text-sm">Upcoming</h3>
          <button onClick={() => refetch()} className="w-7 h-7 rounded-lg bg-sunken border border-line flex items-center justify-center text-mid hover:text-hi transition-colors" aria-label="Refresh"><RefreshCw size={12} className={isFetching ? "animate-spin" : ""} /></button>
        </div>
        <div className="p-3 max-h-[560px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-mid text-sm py-8"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : error ? (
            <div className="text-center py-6 text-xs text-mid px-2">
              <p className="text-rose mb-1 font-medium">Calendar feed unavailable.</p>
              <p className="text-lo">Set <span className="text-hi">CALENDAR_ICS_URL</span> to the calendar's <span className="text-hi">Secret address in iCal format</span> (Settings → Integrate calendar) for full event details. The embed above still works.</p>
            </div>
          ) : (events ?? []).length === 0 ? (
            <div className="text-center py-8 text-mid text-sm">No events in the next 45 days.</div>
          ) : (
            <div className="space-y-4">
              {[...byDay.entries()].map(([day, evs]) => (
                <div key={day}>
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-lo mb-1.5 px-1">{day}</div>
                  <div className="space-y-1.5">
                    {evs.map((e) => (
                      <div key={e.uid} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-sunken border border-line">
                        <div className="w-1 h-8 rounded-full bg-brand-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-hi text-xs font-medium truncate">{e.title}</div>
                          <div className="text-lo text-[11px] truncate">
                            {e.allDay ? "All day" : new Date(e.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            {e.location ? ` · ${e.location}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
