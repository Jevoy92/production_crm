import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CalEvent = { uid: string; title: string; location: string; start: string; end?: string; allDay: boolean };

/** Parse an iCalendar (.ics) datetime value into an ISO string. */
function parseDt(key: string, val: string): { iso: string; allDay: boolean } | null {
  const v = val.trim();
  // All-day: VALUE=DATE or 8-digit date
  if (/VALUE=DATE/.test(key) || /^\d{8}$/.test(v)) {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return null;
    return { iso: `${m[1]}-${m[2]}-${m[3]}T00:00:00`, allDay: true };
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  return { iso: `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? "Z" : ""}`, allDay: false };
}

/** Minimal robust VEVENT parser (handles RFC5545 line folding). */
function parseICS(text: string): CalEvent[] {
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: CalEvent[] = [];
  let cur: Partial<CalEvent> & { _start?: { iso: string; allDay: boolean }; _end?: { iso: string; allDay: boolean } } | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = { title: "", location: "" };
    else if (line === "END:VEVENT") {
      if (cur && cur._start) {
        events.push({
          uid: cur.uid || Math.random().toString(36).slice(2),
          title: cur.title || "(untitled)",
          location: cur.location || "",
          start: cur._start.iso,
          end: cur._end?.iso,
          allDay: cur._start.allDay,
        });
      }
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const key = line.slice(0, idx);
      const val = line.slice(idx + 1);
      const name = key.split(";")[0].toUpperCase();
      if (name === "SUMMARY") cur.title = val.replace(/\\,/g, ",").replace(/\\n/gi, " ");
      else if (name === "LOCATION") cur.location = val.replace(/\\,/g, ",");
      else if (name === "UID") cur.uid = val;
      else if (name === "DTSTART") cur._start = parseDt(key, val) ?? undefined;
      else if (name === "DTEND") cur._end = parseDt(key, val) ?? undefined;
    }
  }
  return events;
}

/**
 * Fetch a Google Calendar "secret iCal address" (or any .ics URL) server-side
 * (avoids CORS) and return upcoming events. Read-only — no OAuth required.
 */
export const fetchCalendar = createServerFn({ method: "GET" })
  .inputValidator((d: { url?: string }) => z.object({ url: z.string().url().optional() }).parse(d ?? {}))
  .handler(async ({ data }): Promise<CalEvent[]> => {
    // Public iCal address for the Palmer House calendar. Returns full event
    // details once the calendar's external sharing is set to "Share all
    // information" (admin.google.com → Calendar → Sharing). Override with a
    // server-only CALENDAR_ICS_URL (e.g. a secret address) if ever needed.
    const PUBLIC_ICS =
      "https://calendar.google.com/calendar/ical/info%40palmerhouseproductions.com/public/basic.ics";
    const url = process.env.CALENDAR_ICS_URL || data.url || PUBLIC_ICS;
    const res = await fetch(url, { headers: { Accept: "text/calendar" } });
    if (!res.ok) throw new Error(`Calendar fetch failed (${res.status})`);
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("That URL didn't return a calendar feed.");
    const now = Date.now();
    const horizon = now + 1000 * 60 * 60 * 24 * 45; // next 45 days
    return parseICS(text)
      .filter((e) => {
        const t = new Date(e.start).getTime();
        return !Number.isNaN(t) && t >= now - 1000 * 60 * 60 * 24 && t <= horizon;
      })
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 60);
  });
