import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, inputCls } from "@/components/ui-bits/Modal";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Trash2,
  RotateCcw,
  BatteryCharging,
  Camera,
  Sun,
  Moon,
  Backpack,
  ClipboardCheck,
  Check,
  X,
  Cloud,
  CloudOff,
} from "lucide-react";

export const Route = createFileRoute("/checklists")({
  component: ChecklistsPage,
  head: () => ({ meta: [{ title: "Production Checklists · Palmer House" }] }),
});

type TabKey = "overview" | "pre" | "gear" | "during" | "post" | "closeout";
type ChecklistKey = Exclude<TabKey, "overview">;

type Item = {
  id: string;
  tab: ChecklistKey;
  text: string;
  done: boolean;
  section: string | null;
  sort_order: number;
};

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; blurb: string }[] = [
  { key: "overview", label: "Today's Overview", icon: ClipboardCheck, blurb: "Log what actually got done today. Tap chips, add notes." },
  { key: "pre", label: "Pre-Shoot", icon: Sun, blurb: "Lock the plan before you leave the studio." },
  { key: "gear", label: "Mobile Gear", icon: Backpack, blurb: "Grab-and-go gear checklist for any location shoot." },
  { key: "during", label: "During Shoot", icon: Camera, blurb: "Run through this on set so nothing gets missed." },
  { key: "post", label: "Post-Shoot", icon: Moon, blurb: "Wrap the day cleanly before you head out." },
  { key: "closeout", label: "End of Day Closeout", icon: BatteryCharging, blurb: "Reset gear and the studio for tomorrow." },
];

const GEAR_GROUPS: { section: string; items: string[] }[] = [
  { section: "Essentials", items: [
    "Camera body + primary lens (charged, lens cap off at call time)",
    "Extra batteries (2+) + charger",
    "Memory cards (formatted, labeled)",
    "Phone with portable hotspot (charged)",
    "Camera cables: USB-C, HDMI, proprietary",
    "SD/CF card reader or adapter",
    "Camera strap or rig/handle for handheld",
  ]},
  { section: "Audio", items: [
    "Primary microphone (shotgun or lav) + mounts",
    "Spare lav mic and batteries",
    "XLR cables / adapters if using external recorder",
    "Portable audio recorder (Zoom etc.) + batteries/charger",
    "Windscreen / deadcat for outdoor audio",
  ]},
  { section: "Lighting", items: [
    "Portable LED light(s) + stands or clamps",
    "Overhead light mount + mounting hardware",
    "Modifiers: softbox, diffusion, reflectors",
    "Spare bulbs and power cables",
  ]},
  { section: "Stabilization & Mounting", items: [
    "Tripod + quick-release plate",
    "Mini tripod / gorillapod",
    "Gimbal (charged) + mounting plate",
    "Clamps, sandbags, mounting hardware",
  ]},
  { section: "Power & Charging", items: [
    "Power bank(s) with sufficient capacity",
    "Multi-outlet power strip + extension cord",
    "Wall chargers + cable organizer",
    "Heavy-duty USB-C charger",
  ]},
  { section: "Production Support", items: [
    "Shot list / call sheet (print + phone copy)",
    "Script(s) or bullets (digital + printed)",
    "Talent release forms and pen",
    "Tape (gaffer + clear), markers, scissors, multi-tool",
    "Notepad and pen",
  ]},
  { section: "Media Management", items: [
    "Backup drive (SSD/HDD) + cables",
    "Laptop or tablet for quick offload/checks",
    "Checksum app or transfer workflow notes",
  ]},
  { section: "Misc & Comfort", items: [
    "Small fan (talent comfort + camera cooling)",
    "Snacks, water, sunscreen if outdoors",
    "First-aid kit and hand sanitizer",
    "Trash bag and wet wipes",
  ]},
  { section: "Before You Roll", items: [
    "Format media and label cards",
    "Set camera clock / timecode and match devices",
    "Run quick audio test + sync slate/tap",
    "White balance and color check (gray card)",
    "Check framing, focus, exposure on monitor",
    "Confirm backups after each take if possible",
  ]},
  { section: "Optional (nice-to-have)", items: [
    "Extra lenses (wide, telephoto)",
    "ND filters and polarizers",
    "Teleprompter app on tablet",
    "Props and wardrobe kit",
  ]},
];

type DefaultEntry = string | { text: string; section: string };

const DEFAULTS: Record<ChecklistKey, DefaultEntry[]> = {
  pre: [
    "Confirm call time + location with client and crew",
    "Build shot list / run-of-show",
    "Check weather + sunset time",
    "Charge all camera batteries",
    "Charge audio + monitor batteries",
    "Format and label all memory cards",
    "Pack gear kit against checklist",
    "Confirm parking / load-in details",
    "Print or share call sheet",
    "Prep wardrobe / talent notes",
  ],
  gear: GEAR_GROUPS.flatMap((g) => g.items.map((text) => ({ text, section: g.section }))),
  during: [
    "Slate / log each scene or setup",
    "Monitor audio levels every take",
    "Capture room tone (30 sec)",
    "Shoot B-roll + cutaways",
    "Get wide / medium / close coverage",
    "Grab still photos for marketing",
    "Hydrate + feed crew",
    "Confirm talent releases signed",
    "Back up cards midday if long shoot",
  ],
  post: [
    "Do a final sweep of the location",
    "Pack gear in original cases",
    "Confirm card / drive count matches load-out",
    "Thank client + confirm next step",
    "Send same-day thank-you / recap message",
    "Log any issues or damages",
  ],
  closeout: [
    "Offload all footage to primary drive",
    "Mirror to backup drive",
    "Verify file counts match before wiping cards",
    "Put ALL batteries on chargers",
    "Wipe + reformat memory cards",
    "Clean lenses + sensor if needed",
    "Restock consumables (gaff tape, batteries, gels)",
    "Return gear to its home in the kit",
    "Update project log with shoot notes",
    "Send invoice or balance reminder if due",
  ],
};

function defaultRowsFor(tab: ChecklistKey) {
  return DEFAULTS[tab].map((e, i) =>
    typeof e === "string"
      ? { tab, text: e, section: null as string | null, sort_order: i, done: false }
      : { tab, text: e.text, section: e.section, sort_order: i, done: false },
  );
}

async function seedIfEmpty() {
  const { count, error } = await supabase
    .from("checklist_items")
    .select("*", { count: "exact", head: true });
  if (error) return;
  if ((count ?? 0) > 0) return;
  const rows = (["pre","gear","during","post","closeout"] as ChecklistKey[]).flatMap(defaultRowsFor);
  await supabase.from("checklist_items").insert(rows);
}

function ChecklistsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");
  const [draft, setDraft] = useState("");
  const [synced, setSynced] = useState(true);

  // Load + realtime
  useEffect(() => {
    let mounted = true;
    (async () => {
      await seedIfEmpty();
      const { data, error } = await supabase
        .from("checklist_items")
        .select("*")
        .order("tab")
        .order("sort_order");
      if (!mounted) return;
      if (error) setSynced(false);
      else setItems((data ?? []) as Item[]);
    })();

    const ch = supabase
      .channel("checklist_items_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_items" }, (payload) => {
        setItems((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Item;
            if (prev.some((p) => p.id === row.id)) return prev;
            return [...prev, row];
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as Item;
            return prev.map((p) => (p.id === row.id ? row : p));
          }
          if (payload.eventType === "DELETE") {
            const row = payload.old as Item;
            return prev.filter((p) => p.id !== row.id);
          }
          return prev;
        });
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const isChecklist = tab !== "overview";
  const checklistKey = tab as ChecklistKey;
  const tabItems = useMemo(
    () => items.filter((i) => i.tab === checklistKey).sort((a, b) => a.sort_order - b.sort_order),
    [items, checklistKey],
  );
  const stats = useMemo(() => {
    const done = tabItems.filter((i) => i.done).length;
    return { done, total: tabItems.length, pct: tabItems.length ? Math.round((done / tabItems.length) * 100) : 0 };
  }, [tabItems]);

  const toggle = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)));
    const { error } = await supabase.from("checklist_items").update({ done: !it.done }).eq("id", id);
    setSynced(!error);
  };
  const remove = async (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    setSynced(!error);
  };
  const add = async () => {
    const text = draft.trim();
    if (!text || !isChecklist) return;
    setDraft("");
    const sort_order = (tabItems[tabItems.length - 1]?.sort_order ?? 0) + 1;
    const { error } = await supabase
      .from("checklist_items")
      .insert({ tab: checklistKey, text, sort_order, done: false });
    setSynced(!error);
  };
  const resetChecks = async () => {
    setItems((prev) => prev.map((p) => (p.tab === checklistKey ? { ...p, done: false } : p)));
    const { error } = await supabase
      .from("checklist_items")
      .update({ done: false })
      .eq("tab", checklistKey);
    setSynced(!error);
  };
  const resetDefaults = async () => {
    if (!confirm("Reset this checklist to the defaults? Custom items on this tab will be removed for everyone.")) return;
    const { error: delErr } = await supabase.from("checklist_items").delete().eq("tab", checklistKey);
    if (delErr) { setSynced(false); return; }
    const { error } = await supabase.from("checklist_items").insert(defaultRowsFor(checklistKey));
    setSynced(!error);
  };

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <Shell
      title="Production Checklists"
      subtitle="Shared across all devices. Sign in once — everything syncs in real time."
      actions={
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] ${synced ? "text-emerald-500" : "text-amber-500"}`}>
            {synced ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5" />} {synced ? "Synced" : "Retry"}
          </span>
          {isChecklist && (
            <>
              <Btn variant="ghost" onClick={resetChecks}><RotateCcw className="size-3.5" /> Uncheck all</Btn>
              <Btn variant="ghost" onClick={resetDefaults}>Restore defaults</Btn>
            </>
          )}
          <Btn variant="ghost" onClick={() => supabase.auth.signOut()}>Sign out</Btn>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          const tabRows = t.key === "overview" ? null : items.filter((i) => i.tab === (t.key as ChecklistKey));
          const done = tabRows ? tabRows.filter((i) => i.done).length : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface-2 border-border text-foreground/80 hover:bg-surface-3"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
              {tabRows && (
                <span className={`num text-[10.5px] rounded-md px-1.5 py-0.5 ${active ? "bg-primary-foreground/20" : "bg-surface-3 text-muted-foreground"}`}>
                  {done}/{tabRows.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <OverviewPanel blurb={activeTab.blurb} label={activeTab.label} onSyncChange={setSynced} />
      ) : (
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14px] font-semibold">{activeTab.label}</div>
              <div className="text-[12px] text-muted-foreground">{activeTab.blurb}</div>
            </div>
            <div className="text-[12px] text-muted-foreground num">{stats.done}/{stats.total} · {stats.pct}%</div>
          </div>

          <div className="h-1.5 rounded-full bg-surface-3 mb-4 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${stats.pct}%` }} />
          </div>

          <ChecklistList items={tabItems} toggle={toggle} remove={remove} />

          <div className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder={`Add an item to ${activeTab.label}…`}
              className={inputCls}
            />
            <Btn onClick={add}><Plus className="size-3.5" /> Add</Btn>
          </div>
        </div>
      )}
    </Shell>
  );
}

function ChecklistList({
  items, toggle, remove,
}: { items: Item[]; toggle: (id: string) => void; remove: (id: string) => void }) {
  if (items.length === 0) {
    return <div className="text-[12.5px] text-muted-foreground px-2.5 py-3">No items yet. Add one below.</div>;
  }
  const groups: { section: string | null; items: Item[] }[] = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === it.section) last.items.push(it);
    else groups.push({ section: it.section, items: [it] });
  }
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g, gi) => (
        <div key={`${g.section ?? "none"}-${gi}`} className="flex flex-col">
          {g.section && (
            <div className="px-2.5 pt-1 pb-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80">{g.section}</div>
          )}
          <ul className="flex flex-col gap-1">
            {g.items.map((i) => (
              <li key={i.id} className="group flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={i.done}
                  onChange={() => toggle(i.id)}
                  className="size-4 accent-primary cursor-pointer"
                />
                <span
                  onClick={() => toggle(i.id)}
                  className={`flex-1 text-[13px] cursor-pointer select-none ${i.done ? "line-through text-muted-foreground" : ""}`}
                >{i.text}</span>
                <button
                  onClick={() => remove(i.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                  aria-label="Remove item"
                ><Trash2 className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * Today's Overview (Supabase-backed)
 * ============================================================ */

type OverviewLog = {
  date: string;
  picks: string[];
  customs: string[];
  notes: string;
  updated_at: string;
};

const OVERVIEW_GROUPS: { section: string; items: { id: string; text: string }[] }[] = [
  { section: "Location & Planning", items: [
    { id: "loc-scout", text: "Scouted locations" },
    { id: "loc-permits", text: "Confirmed permits / access" },
    { id: "loc-parking", text: "Mapped parking + load-in" },
    { id: "loc-weather", text: "Checked weather + sunset" },
    { id: "loc-callsheet", text: "Built / sent call sheet" },
  ]},
  { section: "Camera & Test Shoots", items: [
    { id: "cam-test", text: "Ran a test shoot" },
    { id: "cam-framing", text: "Locked framing + composition" },
    { id: "cam-focus", text: "Calibrated focus / monitor" },
    { id: "cam-wb", text: "White balance + color check" },
    { id: "cam-broll", text: "Captured B-roll / cutaways" },
  ]},
  { section: "Audio", items: [
    { id: "aud-issues", text: "Identified audio issues" },
    { id: "aud-levels", text: "Set + monitored levels" },
    { id: "aud-roomtone", text: "Captured room tone" },
    { id: "aud-lav", text: "Tested lav placement" },
    { id: "aud-wind", text: "Addressed wind / outdoor noise" },
  ]},
  { section: "Lighting", items: [
    { id: "lit-outside", text: "Logged lighting needs for outside" },
    { id: "lit-office", text: "Logged lighting needs for the office" },
    { id: "lit-keyfill", text: "Set key + fill + back" },
    { id: "lit-modifiers", text: "Tested diffusion / modifiers" },
    { id: "lit-fixes", text: "Flagged fixtures to add or fix" },
  ]},
  { section: "Power & Batteries", items: [
    { id: "bat-protocol", text: "Reviewed battery charging protocols" },
    { id: "bat-charged", text: "Put all batteries on chargers" },
    { id: "bat-labeled", text: "Labeled charged vs. dead" },
    { id: "pow-strips", text: "Sorted power strips + extensions" },
    { id: "pow-banks", text: "Topped off power banks" },
  ]},
  { section: "Crew & Talent", items: [
    { id: "crew-brief", text: "Briefed crew on next shoot" },
    { id: "talent-confirm", text: "Confirmed talent / wardrobe" },
    { id: "talent-release", text: "Collected releases" },
    { id: "crew-feed", text: "Fed + hydrated the team" },
  ]},
  { section: "Files & Post", items: [
    { id: "post-offload", text: "Offloaded footage to primary drive" },
    { id: "post-backup", text: "Mirrored to backup drive" },
    { id: "post-verify", text: "Verified file counts before wiping cards" },
    { id: "post-format", text: "Formatted + labeled cards" },
    { id: "post-log", text: "Updated project log" },
  ]},
  { section: "Client & Admin", items: [
    { id: "cl-recap", text: "Sent client recap / thank-you" },
    { id: "cl-next", text: "Confirmed next step with client" },
    { id: "cl-invoice", text: "Sent invoice / balance reminder" },
    { id: "adm-tasks", text: "Logged follow-up tasks" },
  ]},
  { section: "Issues & Fixes", items: [
    { id: "iss-damage", text: "Logged damage / missing gear" },
    { id: "iss-buy", text: "Added items to buy list" },
    { id: "iss-protocol", text: "Updated a protocol / SOP" },
  ]},
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyLog(date: string): OverviewLog {
  return { date, picks: [], customs: [], notes: "", updated_at: new Date().toISOString() };
}

function OverviewPanel({
  label, blurb, onSyncChange,
}: { label: string; blurb: string; onSyncChange: (ok: boolean) => void }) {
  const [logs, setLogs] = useState<Record<string, OverviewLog>>({});
  const [date, setDate] = useState<string>(() => todayStr());
  const [draft, setDraft] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from("overview_logs").select("*").order("date", { ascending: false });
      if (!mounted) return;
      if (error) { onSyncChange(false); return; }
      const map: Record<string, OverviewLog> = {};
      for (const r of (data ?? []) as any[]) {
        map[r.date] = {
          date: r.date,
          picks: Array.isArray(r.picks) ? r.picks : [],
          customs: Array.isArray(r.customs) ? r.customs : [],
          notes: r.notes ?? "",
          updated_at: r.updated_at,
        };
      }
      setLogs(map);
    })();

    const ch = supabase
      .channel("overview_logs_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "overview_logs" }, (payload) => {
        setLogs((prev) => {
          const next = { ...prev };
          if (payload.eventType === "DELETE") {
            const old = payload.old as any;
            if (old?.date) delete next[old.date];
          } else {
            const r = payload.new as any;
            next[r.date] = {
              date: r.date,
              picks: Array.isArray(r.picks) ? r.picks : [],
              customs: Array.isArray(r.customs) ? r.customs : [],
              notes: r.notes ?? "",
              updated_at: r.updated_at,
            };
          }
          return next;
        });
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [onSyncChange]);

  const log = logs[date] ?? emptyLog(date);
  const picked = new Set(log.picks);

  const upsert = async (next: OverviewLog) => {
    setLogs((s) => ({ ...s, [date]: next }));
    const { error } = await supabase.from("overview_logs").upsert({
      date: next.date,
      picks: next.picks,
      customs: next.customs,
      notes: next.notes,
    });
    onSyncChange(!error);
  };

  const toggle = (id: string) => {
    const has = picked.has(id);
    upsert({ ...log, picks: has ? log.picks.filter((p) => p !== id) : [...log.picks, id] });
  };
  const addCustom = () => {
    const text = draft.trim();
    if (!text) return;
    upsert({ ...log, customs: [...log.customs, text] });
    setDraft("");
  };
  const removeCustom = (idx: number) =>
    upsert({ ...log, customs: log.customs.filter((_, i) => i !== idx) });

  const setNotes = (notes: string) => {
    setLogs((s) => ({ ...s, [date]: { ...log, notes } }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      upsert({ ...log, notes });
    }, 500);
  };

  const clearDay = async () => {
    if (!confirm(`Clear the overview for ${date}?`)) return;
    setLogs((s) => { const copy = { ...s }; delete copy[date]; return copy; });
    const { error } = await supabase.from("overview_logs").delete().eq("date", date);
    onSyncChange(!error);
  };

  const totalPicked = log.picks.length + log.customs.length;
  const recent = Object.values(logs)
    .filter((l) => l.date !== date && (l.picks.length || l.customs.length || (l.notes ?? "").trim()))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);

  const prettyDate = (() => {
    try {
      return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    } catch { return date; }
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[14px] font-semibold">{label} · {prettyDate}</div>
            <div className="text-[12px] text-muted-foreground">{blurb}</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayStr())}
              className={inputCls + " w-auto"}
            />
            <Btn variant="ghost" onClick={() => setDate(todayStr())}>Today</Btn>
            <Btn variant="ghost" onClick={clearDay}><RotateCcw className="size-3.5" /> Clear day</Btn>
          </div>
        </div>

        <div className="text-[11.5px] text-muted-foreground mb-4">
          {totalPicked === 0
            ? "Nothing logged yet. Tap chips below for things you got done."
            : `${totalPicked} item${totalPicked === 1 ? "" : "s"} logged today.`}
        </div>

        <div className="flex flex-col gap-4">
          {OVERVIEW_GROUPS.map((g) => (
            <div key={g.section}>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">{g.section}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((it) => {
                  const on = picked.has(it.id);
                  return (
                    <button
                      key={it.id}
                      onClick={() => toggle(it.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface-2 border-border text-foreground/80 hover:bg-surface-3"
                      }`}
                    >
                      {on ? <Check className="size-3" /> : <Plus className="size-3 opacity-60" />}
                      {it.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {log.customs.length > 0 && (
          <div className="mt-4">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">Also today</div>
            <ul className="flex flex-col gap-1">
              {log.customs.map((c, i) => (
                <li key={i} className="group flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[13px]">
                  <Check className="size-3.5 text-primary" />
                  <span className="flex-1">{c}</span>
                  <button
                    onClick={() => removeCustom(i)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                    aria-label="Remove"
                  ><X className="size-3.5" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
            placeholder="Add something else you did today…"
            className={inputCls}
          />
          <Btn onClick={addCustom}><Plus className="size-3.5" /> Add</Btn>
        </div>

        <div className="mt-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">Notes</div>
          <textarea
            value={log.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering — issues, ideas, follow-ups…"
            rows={4}
            className={inputCls + " resize-y"}
          />
        </div>
      </div>

      {recent.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="text-[12.5px] font-semibold mb-2">Recent days</div>
          <div className="flex flex-col gap-1.5">
            {recent.map((l) => {
              const count = l.picks.length + l.customs.length;
              const pretty = new Date(l.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
              return (
                <button
                  key={l.date}
                  onClick={() => setDate(l.date)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-surface-2 text-left"
                >
                  <span>{pretty}</span>
                  <span className="num text-[11px] text-muted-foreground">
                    {count} item{count === 1 ? "" : "s"}{(l.notes ?? "").trim() ? " · notes" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}