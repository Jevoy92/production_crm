import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Link2, Check, RefreshCw, X, ExternalLink, Loader2 } from "lucide-react";
import { fetchCalendar, type CalEvent } from "@/lib/calendar.functions";
import { useCalendarStore } from "@/lib/calendarStore";

/** Read-only Google Calendar via secret iCal URL. Two-way sync needs OAuth. */
export function useCalendarEvents() {
  const icsUrl = useCalendarStore((s) => s.icsUrl);
  const fn = useServerFn(fetchCalendar);
  return useQuery({
    queryKey: ["calendar", icsUrl],
    queryFn: () => fn({ data: { url: icsUrl } }),
    enabled: Boolean(icsUrl),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

function ConnectCard() {
  const setIcsUrl = useCalendarStore((s) => s.setIcsUrl);
  const [val, setVal] = useState("");
  return (
    <div className="bg-panel border border-line rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0"><CalendarDays size={16} className="text-brand-400" /></div>
        <div>
          <h3 className="font-display font-bold text-hi text-sm">Connect Google Calendar</h3>
          <p className="text-mid text-xs mt-0.5 leading-relaxed">
            Paste your calendar's <span className="text-hi font-medium">secret iCal address</span> to see your real events here (read-only).
            In Google Calendar → Settings → your calendar → <span className="text-hi font-medium">"Secret address in iCal format"</span>.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo" />
          <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" className="ph-input" style={{ paddingLeft: 32, fontSize: 12 }} />
        </div>
        <button onClick={() => val.trim() && setIcsUrl(val.trim())} className="ph-btn ph-btn-primary ph-btn-sm flex items-center gap-1.5"><Check size={13} /> Connect</button>
      </div>
    </div>
  );
}

export function GoogleCalendarPanel() {
  const icsUrl = useCalendarStore((s) => s.icsUrl);
  const setIcsUrl = useCalendarStore((s) => s.setIcsUrl);
  const { data: events, isLoading, error, refetch, isFetching } = useCalendarEvents();

  if (!icsUrl) return <ConnectCard />;

  const byDay = new Map<string, CalEvent[]>();
  (events ?? []).forEach((e) => {
    const key = new Date(e.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  });

  return (
    <div className="bg-panel border border-line rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center"><CalendarDays size={14} className="text-brand-400" /></div>
          <div>
            <h3 className="font-display font-bold text-hi text-base flex items-center gap-2">Google Calendar <span className="text-[10px] font-semibold text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">Connected</span></h3>
            <p className="text-lo text-xs">Read-only · next 45 days</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-sunken border border-line flex items-center justify-center text-mid hover:text-hi transition-colors" aria-label="Refresh">
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { if (confirm("Disconnect this calendar?")) setIcsUrl(""); }} className="w-8 h-8 rounded-lg bg-sunken border border-line flex items-center justify-center text-mid hover:text-rose transition-colors" aria-label="Disconnect"><X size={13} /></button>
        </div>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-mid text-sm py-8"><Loader2 size={14} className="animate-spin" /> Loading your calendar…</div>
        ) : error ? (
          <div className="text-center py-6 text-sm">
            <p className="text-rose mb-1">Couldn't load that calendar.</p>
            <p className="text-lo text-xs mb-3">Double-check the secret iCal URL is correct and public-to-you.</p>
            <button onClick={() => setIcsUrl("")} className="ph-btn ph-btn-soft ph-btn-sm">Re-enter URL</button>
          </div>
        ) : (events ?? []).length === 0 ? (
          <div className="text-center py-8 text-mid text-sm">No events in the next 45 days.</div>
        ) : (
          <div className="space-y-4">
            {[...byDay.entries()].map(([day, evs]) => (
              <div key={day}>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-lo mb-2">{day}</div>
                <div className="space-y-1.5">
                  {evs.map((e) => (
                    <div key={e.uid} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sunken border border-line">
                      <div className="w-1 h-8 rounded-full bg-brand-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-hi text-sm font-medium truncate">{e.title}</div>
                        <div className="text-lo text-xs">
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
      <div className="px-5 py-3 border-t border-line flex items-center gap-2 text-lo text-xs">
        <ExternalLink size={11} /> Creating events on your calendar (two-way sync) requires Google OAuth — ask to enable it.
      </div>
    </div>
  );
}
