import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, inputCls } from "@/components/ui-bits/Modal";
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
} from "lucide-react";

export const Route = createFileRoute("/checklists")({
  component: ChecklistsPage,
  head: () => ({ meta: [{ title: "Production Checklists · Palmer House" }] }),
});

type TabKey = "overview" | "pre" | "gear" | "during" | "post" | "closeout";

type Item = { id: string; text: string; done: boolean; section?: string };

type ChecklistKey = Exclude<TabKey, "overview">;

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; blurb: string }[] = [
  { key: "overview", label: "Today's Overview", icon: ClipboardCheck, blurb: "Log what actually got done today. Tap chips, add notes." },
  { key: "pre", label: "Pre-Shoot", icon: Sun, blurb: "Lock the plan before you leave the studio." },
  { key: "gear", label: "Mobile Gear", icon: Backpack, blurb: "Grab-and-go gear checklist for any location shoot." },
  { key: "during", label: "During Shoot", icon: Camera, blurb: "Run through this on set so nothing gets missed." },
  { key: "post", label: "Post-Shoot", icon: Moon, blurb: "Wrap the day cleanly before you head out." },
  { key: "closeout", label: "End of Day Closeout", icon: BatteryCharging, blurb: "Reset gear and the studio for tomorrow." },
];

const GEAR_GROUPS: { section: string; items: string[] }[] = [
  {
    section: "Essentials",
    items: [
      "Camera body + primary lens (charged, lens cap off at call time)",
      "Extra batteries (2+) + charger",
      "Memory cards (formatted, labeled)",
      "Phone with portable hotspot (charged)",
      "Camera cables: USB-C, HDMI, proprietary",
      "SD/CF card reader or adapter",
      "Camera strap or rig/handle for handheld",
    ],
  },
  {
    section: "Audio",
    items: [
      "Primary microphone (shotgun or lav) + mounts",
      "Spare lav mic and batteries",
      "XLR cables / adapters if using external recorder",
      "Portable audio recorder (Zoom etc.) + batteries/charger",
      "Windscreen / deadcat for outdoor audio",
    ],
  },
  {
    section: "Lighting",
    items: [
      "Portable LED light(s) + stands or clamps",
      "Overhead light mount + mounting hardware",
      "Modifiers: softbox, diffusion, reflectors",
      "Spare bulbs and power cables",
    ],
  },
  {
    section: "Stabilization & Mounting",
    items: [
      "Tripod + quick-release plate",
      "Mini tripod / gorillapod",
      "Gimbal (charged) + mounting plate",
      "Clamps, sandbags, mounting hardware",
    ],
  },
  {
    section: "Power & Charging",
    items: [
      "Power bank(s) with sufficient capacity",
      "Multi-outlet power strip + extension cord",
      "Wall chargers + cable organizer",
      "Heavy-duty USB-C charger",
    ],
  },
  {
    section: "Production Support",
    items: [
      "Shot list / call sheet (print + phone copy)",
      "Script(s) or bullets (digital + printed)",
      "Talent release forms and pen",
      "Tape (gaffer + clear), markers, scissors, multi-tool",
      "Notepad and pen",
    ],
  },
  {
    section: "Media Management",
    items: [
      "Backup drive (SSD/HDD) + cables",
      "Laptop or tablet for quick offload/checks",
      "Checksum app or transfer workflow notes",
    ],
  },
  {
    section: "Misc & Comfort",
    items: [
      "Small fan (talent comfort + camera cooling)",
      "Snacks, water, sunscreen if outdoors",
      "First-aid kit and hand sanitizer",
      "Trash bag and wet wipes",
    ],
  },
  {
    section: "Before You Roll",
    items: [
      "Format media and label cards",
      "Set camera clock / timecode and match devices",
      "Run quick audio test + sync slate/tap",
      "White balance and color check (gray card)",
      "Check framing, focus, exposure on monitor",
      "Confirm backups after each take if possible",
    ],
  },
  {
    section: "Optional (nice-to-have)",
    items: [
      "Extra lenses (wide, telephoto)",
      "ND filters and polarizers",
      "Teleprompter app on tablet",
      "Props and wardrobe kit",
    ],
  },
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

const STORAGE_KEY = "phpos:checklists:v2";
const LEGACY_KEY = "phpos:checklists:v1";

type Store = Record<ChecklistKey, Item[]>;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toItems(entries: DefaultEntry[]): Item[] {
  return entries.map((e) =>
    typeof e === "string"
      ? { id: uid(), text: e, done: false }
      : { id: uid(), text: e.text, done: false, section: e.section },
  );
}

function seed(): Store {
  return {
    pre: toItems(DEFAULTS.pre),
    gear: toItems(DEFAULTS.gear),
    during: toItems(DEFAULTS.during),
    post: toItems(DEFAULTS.post),
    closeout: toItems(DEFAULTS.closeout),
  };
}

function load(): Store {
  if (typeof window === "undefined") return seed();
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<Store>;
    const base = seed();
    return {
      pre: parsed.pre ?? base.pre,
      gear: parsed.gear ?? base.gear,
      during: parsed.during ?? base.during,
      post: parsed.post ?? base.post,
      closeout: parsed.closeout ?? base.closeout,
    };
  } catch {
    return seed();
  }
}

function ChecklistsPage() {
  const [data, setData] = useState<Store>(() => seed());
  const [tab, setTab] = useState<TabKey>("overview");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setData(load());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const isChecklist = tab !== "overview";
  const checklistKey = tab as ChecklistKey;
  const items = isChecklist ? data[checklistKey] : [];
  const stats = useMemo(() => {
    const done = items.filter((i) => i.done).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }, [items]);

  const toggle = (id: string) =>
    setData((d) => ({ ...d, [checklistKey]: d[checklistKey].map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  const remove = (id: string) =>
    setData((d) => ({ ...d, [checklistKey]: d[checklistKey].filter((i) => i.id !== id) }));
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setData((d) => ({ ...d, [checklistKey]: [...d[checklistKey], { id: uid(), text, done: false }] }));
    setDraft("");
  };
  const resetChecks = () =>
    setData((d) => ({ ...d, [checklistKey]: d[checklistKey].map((i) => ({ ...i, done: false })) }));
  const resetDefaults = () => {
    if (!confirm("Reset this checklist to the defaults? Your custom items on this tab will be removed.")) return;
    setData((d) => ({ ...d, [checklistKey]: toItems(DEFAULTS[checklistKey]) }));
  };

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <Shell
      title="Production Checklists"
      subtitle="Pre-shoot, on set, wrap, and end-of-day closeouts. Tap to check off."
      actions={
        isChecklist ? (
        <>
          <Btn variant="ghost" onClick={resetChecks}>
            <RotateCcw className="size-3.5" /> Uncheck all
          </Btn>
          <Btn variant="ghost" onClick={resetDefaults}>
            Restore defaults
          </Btn>
        </>
        ) : null
      }
    >
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          const tabStats = t.key === "overview" ? null : data[t.key as ChecklistKey];
          const done = tabStats ? tabStats.filter((i) => i.done).length : 0;
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
              {tabStats && (
                <span className={`num text-[10.5px] rounded-md px-1.5 py-0.5 ${active ? "bg-primary-foreground/20" : "bg-surface-3 text-muted-foreground"}`}>
                  {done}/{tabStats.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <OverviewPanel blurb={activeTab.blurb} label={activeTab.label} />
      ) : (
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[14px] font-semibold">{activeTab.label}</div>
            <div className="text-[12px] text-muted-foreground">{activeTab.blurb}</div>
          </div>
          <div className="text-[12px] text-muted-foreground num">
            {stats.done}/{stats.total} · {stats.pct}%
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-surface-3 mb-4 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${stats.pct}%` }}
          />
        </div>

        <ChecklistList items={items} toggle={toggle} remove={remove} />

        <div className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={`Add an item to ${activeTab.label}…`}
            className={inputCls}
          />
          <Btn onClick={add}>
            <Plus className="size-3.5" /> Add
          </Btn>
        </div>
      </div>
      )}
    </Shell>
  );
}

function ChecklistList({
  items,
  toggle,
  remove,
}: {
  items: Item[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-[12.5px] text-muted-foreground px-2.5 py-3">
        No items yet. Add one below.
      </div>
    );
  }

  // Preserve order while grouping by section
  const groups: { section: string | null; items: Item[] }[] = [];
  for (const it of items) {
    const key = it.section ?? null;
    const last = groups[groups.length - 1];
    if (last && last.section === key) last.items.push(it);
    else groups.push({ section: key, items: [it] });
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g, gi) => (
        <div key={`${g.section ?? "none"}-${gi}`} className="flex flex-col">
          {g.section && (
            <div className="px-2.5 pt-1 pb-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80">
              {g.section}
            </div>
          )}
          <ul className="flex flex-col gap-1">
            {g.items.map((i) => (
              <li
                key={i.id}
                className="group flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={i.done}
                  onChange={() => toggle(i.id)}
                  className="size-4 accent-primary cursor-pointer"
                />
                <span
                  onClick={() => toggle(i.id)}
                  className={`flex-1 text-[13px] cursor-pointer select-none ${
                    i.done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {i.text}
                </span>
                <button
                  onClick={() => remove(i.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * Today's Overview
 * ============================================================ */

type OverviewLog = {
  date: string; // YYYY-MM-DD
  picks: string[]; // selected chip ids
  customs: string[]; // free-form bullet items
  notes: string;
  updatedAt: number;
};

const OVERVIEW_GROUPS: { section: string; items: { id: string; text: string }[] }[] = [
  {
    section: "Location & Planning",
    items: [
      { id: "loc-scout", text: "Scouted locations" },
      { id: "loc-permits", text: "Confirmed permits / access" },
      { id: "loc-parking", text: "Mapped parking + load-in" },
      { id: "loc-weather", text: "Checked weather + sunset" },
      { id: "loc-callsheet", text: "Built / sent call sheet" },
    ],
  },
  {
    section: "Camera & Test Shoots",
    items: [
      { id: "cam-test", text: "Ran a test shoot" },
      { id: "cam-framing", text: "Locked framing + composition" },
      { id: "cam-focus", text: "Calibrated focus / monitor" },
      { id: "cam-wb", text: "White balance + color check" },
      { id: "cam-broll", text: "Captured B-roll / cutaways" },
    ],
  },
  {
    section: "Audio",
    items: [
      { id: "aud-issues", text: "Identified audio issues" },
      { id: "aud-levels", text: "Set + monitored levels" },
      { id: "aud-roomtone", text: "Captured room tone" },
      { id: "aud-lav", text: "Tested lav placement" },
      { id: "aud-wind", text: "Addressed wind / outdoor noise" },
    ],
  },
  {
    section: "Lighting",
    items: [
      { id: "lit-outside", text: "Logged lighting needs for outside" },
      { id: "lit-office", text: "Logged lighting needs for the office" },
      { id: "lit-keyfill", text: "Set key + fill + back" },
      { id: "lit-modifiers", text: "Tested diffusion / modifiers" },
      { id: "lit-fixes", text: "Flagged fixtures to add or fix" },
    ],
  },
  {
    section: "Power & Batteries",
    items: [
      { id: "bat-protocol", text: "Reviewed battery charging protocols" },
      { id: "bat-charged", text: "Put all batteries on chargers" },
      { id: "bat-labeled", text: "Labeled charged vs. dead" },
      { id: "pow-strips", text: "Sorted power strips + extensions" },
      { id: "pow-banks", text: "Topped off power banks" },
    ],
  },
  {
    section: "Crew & Talent",
    items: [
      { id: "crew-brief", text: "Briefed crew on next shoot" },
      { id: "talent-confirm", text: "Confirmed talent / wardrobe" },
      { id: "talent-release", text: "Collected releases" },
      { id: "crew-feed", text: "Fed + hydrated the team" },
    ],
  },
  {
    section: "Files & Post",
    items: [
      { id: "post-offload", text: "Offloaded footage to primary drive" },
      { id: "post-backup", text: "Mirrored to backup drive" },
      { id: "post-verify", text: "Verified file counts before wiping cards" },
      { id: "post-format", text: "Formatted + labeled cards" },
      { id: "post-log", text: "Updated project log" },
    ],
  },
  {
    section: "Client & Admin",
    items: [
      { id: "cl-recap", text: "Sent client recap / thank-you" },
      { id: "cl-next", text: "Confirmed next step with client" },
      { id: "cl-invoice", text: "Sent invoice / balance reminder" },
      { id: "adm-tasks", text: "Logged follow-up tasks" },
    ],
  },
  {
    section: "Issues & Fixes",
    items: [
      { id: "iss-damage", text: "Logged damage / missing gear" },
      { id: "iss-buy", text: "Added items to buy list" },
      { id: "iss-protocol", text: "Updated a protocol / SOP" },
    ],
  },
];

const OVERVIEW_KEY = "phpos:overview:v1";

type OverviewStore = Record<string, OverviewLog>;

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadOverview(): OverviewStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERVIEW_KEY);
    return raw ? (JSON.parse(raw) as OverviewStore) : {};
  } catch {
    return {};
  }
}

function emptyLog(date: string): OverviewLog {
  return { date, picks: [], customs: [], notes: "", updatedAt: Date.now() };
}

function OverviewPanel({ label, blurb }: { label: string; blurb: string }) {
  const [store, setStore] = useState<OverviewStore>({});
  const [date, setDate] = useState<string>(() => todayStr());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setStore(loadOverview());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(OVERVIEW_KEY, JSON.stringify(store));
  }, [store]);

  const log = store[date] ?? emptyLog(date);
  const picked = new Set(log.picks);

  const update = (next: OverviewLog) =>
    setStore((s) => ({ ...s, [date]: { ...next, updatedAt: Date.now() } }));

  const toggle = (id: string) => {
    const has = picked.has(id);
    update({
      ...log,
      picks: has ? log.picks.filter((p) => p !== id) : [...log.picks, id],
    });
  };

  const addCustom = () => {
    const text = draft.trim();
    if (!text) return;
    update({ ...log, customs: [...log.customs, text] });
    setDraft("");
  };

  const removeCustom = (idx: number) =>
    update({ ...log, customs: log.customs.filter((_, i) => i !== idx) });

  const setNotes = (notes: string) => update({ ...log, notes });

  const clearDay = () => {
    if (!confirm(`Clear the overview for ${date}?`)) return;
    setStore((s) => {
      const copy = { ...s };
      delete copy[date];
      return copy;
    });
  };

  const totalPicked = log.picks.length + log.customs.length;

  // Recent days (excluding current), most recent first
  const recent = Object.values(store)
    .filter((l) => l.date !== date && (l.picks.length || l.customs.length || l.notes.trim()))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);

  const prettyDate = (() => {
    try {
      return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
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
            <Btn variant="ghost" onClick={() => setDate(todayStr())}>
              Today
            </Btn>
            <Btn variant="ghost" onClick={clearDay}>
              <RotateCcw className="size-3.5" /> Clear day
            </Btn>
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
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">
                {g.section}
              </div>
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
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">
              Also today
            </div>
            <ul className="flex flex-col gap-1">
              {log.customs.map((c, i) => (
                <li
                  key={i}
                  className="group flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[13px]"
                >
                  <Check className="size-3.5 text-primary" />
                  <span className="flex-1">{c}</span>
                  <button
                    onClick={() => removeCustom(i)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustom();
            }}
            placeholder="Add something else you did today…"
            className={inputCls}
          />
          <Btn onClick={addCustom}>
            <Plus className="size-3.5" /> Add
          </Btn>
        </div>

        <div className="mt-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mb-1.5">
            Notes
          </div>
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
              const pretty = new Date(l.date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <button
                  key={l.date}
                  onClick={() => setDate(l.date)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-surface-2 text-left"
                >
                  <span>{pretty}</span>
                  <span className="num text-[11px] text-muted-foreground">
                    {count} item{count === 1 ? "" : "s"}
                    {l.notes.trim() ? " · notes" : ""}
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