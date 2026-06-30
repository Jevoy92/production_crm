import { celebrate } from "@/lib/confetti";
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
  Mic,
  Pencil,
} from "lucide-react";

export const Route = createFileRoute("/checklists")({
  component: ChecklistsPage,
  head: () => ({ meta: [{ title: "Production Checklists · Palmer House" }] }),
});

type TabKey = "overview" | "pre" | "gear" | "internal" | "during" | "post" | "closeout";
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
  { key: "internal", label: "Internal / Podcast", icon: Mic, blurb: "In-studio internal shoot + podcast workflow. Fully editable." },
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
  internal: [
    { section: "Studio Prep", text: "Clear and reset studio space (sweep, dust, tidy backdrop)" },
    { section: "Studio Prep", text: "Confirm topic / outline / talking points are in the doc" },
    { section: "Studio Prep", text: "Confirm guest(s) arrival time + parking + green-room comfort" },
    { section: "Studio Prep", text: "Pull wardrobe — avoid tight stripes / busy patterns" },
    { section: "Studio Prep", text: "Water + glasses + napkins ready at the table" },
    { section: "Studio Prep", text: "Print run-of-show / questions (host + producer copy)" },
    { section: "Camera & Lighting", text: "Power on all cameras + confirm batteries / AC power" },
    { section: "Camera & Lighting", text: "Format + label all SD cards (Cam A, Cam B, Cam C)" },
    { section: "Camera & Lighting", text: "Set matching frame rate + resolution on every camera" },
    { section: "Camera & Lighting", text: "Match white balance + ISO across cameras" },
    { section: "Camera & Lighting", text: "Lock focus on each seat (mark spots with tape)" },
    { section: "Camera & Lighting", text: "Key + fill + backlight set, no hot spots on faces" },
    { section: "Camera & Lighting", text: "Check for reflections in glasses + on table" },
    { section: "Audio", text: "Lav mic each speaker + run quick level test" },
    { section: "Audio", text: "Headphones on producer monitoring live levels" },
    { section: "Audio", text: "Backup recorder rolling (Zoom / Rode) with fresh batteries" },
    { section: "Audio", text: "Capture 30 sec of room tone before first take" },
    { section: "Audio", text: "Phones on airplane mode or silenced + away from lavs" },
    { section: "Recording", text: "Slate / clap at the top of each segment for sync" },
    { section: "Recording", text: "Roll all cameras + recorder BEFORE first word" },
    { section: "Recording", text: "Producer logs episode title, guest, segment timestamps" },
    { section: "Recording", text: "Capture B-roll: room wide, host nods, hand gestures, gear" },
    { section: "Recording", text: "Grab photo stills for thumbnails + socials" },
    { section: "Recording", text: "Re-record any flubbed lines as pickups before guest leaves" },
    { section: "Wrap & Offload", text: "Confirm card / drive count matches camera count" },
    { section: "Wrap & Offload", text: "Offload every card to primary drive + mirror to backup" },
    { section: "Wrap & Offload", text: "Verify file counts + playable footage before wiping cards" },
    { section: "Wrap & Offload", text: "Log episode in production tracker + tag for editor" },
    { section: "Wrap & Offload", text: "Thank guest + confirm publish date + asset delivery" },
    { section: "Wrap & Offload", text: "Reset studio: lights off, mics down, gear back in kit" },
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
  const rows = (["pre","gear","internal","during","post","closeout"] as ChecklistKey[]).flatMap(defaultRowsFor);
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
    if (!it.done) celebrate(null, 36);
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5">
        {TABS.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          const tabRows = t.key === "overview" ? null : items.filter((i) => i.tab === (t.key as ChecklistKey));
          const done = tabRows ? tabRows.filter((i) => i.done).length : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-brand-600 text-white shadow-[var(--elev-sm)]"
                  : "bg-sunken text-mid hover:bg-raised hover:text-hi border border-line"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
              {tabRows && (
                <span className={`num text-[11px] rounded-md px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-panel text-lo"}`}>
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
        <div className="max-w-5xl mx-auto bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-lg font-bold text-hi">{activeTab.label}</div>
              <div className="text-sm text-mid mt-0.5">{activeTab.blurb}</div>
            </div>
            <div className="text-sm text-mid num">{stats.done}/{stats.total} · <span className="text-brand-400 font-semibold">{stats.pct}%</span></div>
          </div>

          <div className="h-1.5 rounded-full bg-sunken mb-5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all" style={{ width: `${stats.pct}%` }} />
          </div>

          <ChecklistList items={tabItems} toggle={toggle} remove={remove} />

          <div className="mt-5 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder={`Add an item to ${activeTab.label}…`}
              className={inputCls}
            />
            <Btn variant="primary" onClick={add}><Plus className="size-3.5" /> Add</Btn>
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
    return <div className="text-sm text-mid px-2.5 py-3">No items yet. Add one below.</div>;
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
            <div className="px-2.5 pt-1 pb-1 text-[10.5px] uppercase tracking-[0.14em] text-lo font-bold">{g.section}</div>
          )}
          <ul className="flex flex-col gap-1">
            {g.items.map((i) => (
              <li key={i.id} className="group flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-hover">
                <input
                  type="checkbox"
                  checked={i.done}
                  onChange={() => toggle(i.id)}
                  className="size-4 accent-brand-600 cursor-pointer"
                />
                <span
                  onClick={() => toggle(i.id)}
                  className={`flex-1 text-sm cursor-pointer select-none ${i.done ? "line-through text-lo" : "text-hi"}`}
                >{i.text}</span>
                <button
                  onClick={() => remove(i.id)}
                  className="opacity-0 group-hover:opacity-100 text-lo hover:text-rose transition-opacity"
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
  { section: "Daily Basics", items: [
    { id: "day-standup", text: "Team check-in / standup" },
    { id: "day-priorities", text: "Set today's top priorities" },
    { id: "day-calendar", text: "Reviewed calendar + deadlines" },
    { id: "day-email", text: "Cleared inbox / replied to clients" },
    { id: "day-tasks", text: "Updated task board" },
  ]},
  { section: "Production", items: [
    { id: "prod-shoot", text: "Worked on a shoot" },
    { id: "prod-prep", text: "Prepped gear / location for upcoming shoot" },
    { id: "prod-edit", text: "Edited / reviewed footage" },
    { id: "prod-deliver", text: "Delivered work to a client" },
    { id: "prod-review", text: "Internal review / QC pass" },
  ]},
  { section: "Clients & Sales", items: [
    { id: "cli-call", text: "Client call or meeting" },
    { id: "cli-proposal", text: "Sent a proposal or quote" },
    { id: "cli-followup", text: "Followed up on outstanding leads" },
    { id: "cli-onboard", text: "Onboarded a new client" },
    { id: "cli-recap", text: "Sent recap / thank-you" },
  ]},
  { section: "Finance & Admin", items: [
    { id: "fin-invoice", text: "Sent an invoice" },
    { id: "fin-paid", text: "Logged a payment received" },
    { id: "fin-expense", text: "Tracked expenses / receipts" },
    { id: "adm-files", text: "Filed / organized documents" },
    { id: "adm-tasks", text: "Logged follow-up tasks" },
  ]},
  { section: "Marketing & Content", items: [
    { id: "mkt-post", text: "Posted on social media" },
    { id: "mkt-content", text: "Created marketing content" },
    { id: "mkt-engage", text: "Engaged with audience / DMs" },
    { id: "mkt-website", text: "Updated website / portfolio" },
  ]},
  { section: "Studio & Gear", items: [
    { id: "gear-charge", text: "Charged batteries" },
    { id: "gear-offload", text: "Offloaded + backed up footage" },
    { id: "gear-reset", text: "Reset studio / packed gear" },
    { id: "gear-maint", text: "Cleaned or maintained equipment" },
    { id: "gear-buy", text: "Added something to the buy list" },
  ]},
  { section: "Team & Operations", items: [
    { id: "team-hire", text: "Recruiting / hiring activity" },
    { id: "team-train", text: "Trained team or yourself" },
    { id: "team-sop", text: "Updated a process or SOP" },
    { id: "team-issue", text: "Resolved an issue / blocker" },
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
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Date header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)]">
        <div>
          <h2 className="font-display text-xl font-bold text-hi">{label} · {prettyDate}</h2>
          <p className="text-mid text-sm mt-1">{blurb}</p>
          <p className="text-brand-400 text-sm font-medium mt-2">
            {totalPicked === 0 ? "Nothing logged yet — tap chips below." : `${totalPicked} item${totalPicked === 1 ? "" : "s"} logged.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || todayStr())} className="bg-sunken border border-line text-hi text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer" />
          <button onClick={() => setDate(todayStr())} className="ph-btn ph-btn-soft ph-btn-sm">Today</button>
          <button onClick={clearDay} className="ph-btn ph-btn-soft ph-btn-sm"><RotateCcw className="size-3.5" /> Clear day</button>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 gap-6">
        {OVERVIEW_GROUPS.map((g) => (
          <div key={g.section} className="bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)]">
            <h3 className="text-[10.5px] font-bold text-lo uppercase tracking-[0.14em] mb-4">{g.section}</h3>
            <div className="flex flex-wrap gap-2">
              {g.items.map((it) => {
                const on = picked.has(it.id);
                return (
                  <button
                    key={it.id}
                    onClick={() => toggle(it.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all select-none ${
                      on
                        ? "bg-brand-600 text-white border border-brand-600 shadow-[var(--elev-sm)]"
                        : "bg-sunken border border-line text-mid hover:bg-raised hover:text-hi"
                    }`}
                  >
                    {on ? <Check className="size-3.5" /> : <Plus className="size-3.5 text-lo" />}
                    {it.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Also Today */}
      <div className="bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)]">
        <h3 className="text-[10.5px] font-bold text-lo uppercase tracking-[0.14em] mb-4">Also Today</h3>
        {log.customs.length > 0 && (
          <div className="space-y-2 mb-4">
            {log.customs.map((c, i) => (
              <div key={i} className="group flex items-center gap-3 bg-sunken border border-line px-4 py-3 rounded-lg">
                <Check className="size-4 text-brand-400 flex-shrink-0" />
                <span className="flex-1 text-hi text-sm font-medium">{c}</span>
                <button onClick={() => removeCustom(i)} className="opacity-0 group-hover:opacity-100 text-lo hover:text-rose transition-opacity" aria-label="Remove"><X className="size-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }} placeholder="Add something else you did today…" className="flex-1 bg-sunken border border-line text-hi placeholder-lo text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-brand-500" />
          <button onClick={addCustom} className="ph-btn ph-btn-primary flex items-center gap-2"><Plus className="size-3.5" /> Add</button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)]">
        <h3 className="text-[10.5px] font-bold text-lo uppercase tracking-[0.14em] mb-4">Notes</h3>
        <textarea value={log.notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering — issues, ideas, follow-ups…" rows={4} className="w-full bg-sunken border border-line text-hi placeholder-lo text-sm rounded-lg p-4 focus:outline-none focus:border-brand-500 resize-none" />
      </div>

      {/* Recent days */}
      {recent.length > 0 && (
        <div className="bg-panel border border-line rounded-2xl overflow-hidden shadow-[var(--elev-card)]">
          <div className="px-6 py-4 border-b border-line"><h3 className="text-sm font-bold text-hi">Recent days</h3></div>
          <div className="divide-y divide-line">
            {recent.map((l) => {
              const count = l.picks.length + l.customs.length;
              const pretty = new Date(l.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
              return (
                <button key={l.date} onClick={() => setDate(l.date)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-hover transition-colors text-left">
                  <span className="text-sm font-medium text-mid">{pretty}</span>
                  <span className="num text-xs text-lo">{count} item{count === 1 ? "" : "s"}{(l.notes ?? "").trim() ? " · notes" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}