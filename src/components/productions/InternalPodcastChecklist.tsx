import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Btn, inputCls } from "@/components/ui-bits/Modal";
import { celebrate } from "@/lib/confetti";
import { Mic, Plus, Pencil, Trash2, Check, X, RotateCcw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type Item = {
  id: string;
  tab: string;
  text: string;
  done: boolean;
  section: string | null;
  sort_order: number;
};

const DEFAULTS: { section: string; text: string }[] = [
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
];

export function InternalPodcastChecklist() {
  const [items, setItems] = useState<Item[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [draftBySection, setDraftBySection] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const seededRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("tab", "internal")
        .order("sort_order");
      if (!mounted) return;
      const rows = (data ?? []) as Item[];
      if (rows.length === 0 && !seededRef.current) {
        seededRef.current = true;
        const seed = DEFAULTS.map((d, i) => ({
          tab: "internal",
          text: d.text,
          section: d.section,
          sort_order: i,
          done: false,
        }));
        const { data: inserted } = await supabase
          .from("checklist_items")
          .insert(seed)
          .select();
        setItems(((inserted ?? []) as Item[]).sort((a, b) => a.sort_order - b.sort_order));
      } else {
        setItems(rows);
      }
    })();
    const ch = supabase
      .channel("internal_checklist_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_items", filter: "tab=eq.internal" },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Item;
              if (prev.some((p) => p.id === row.id)) return prev;
              return [...prev, row].sort((a, b) => a.sort_order - b.sort_order);
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
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of items) {
      const k = it.section ?? "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries()).map(([section, list]) => ({
      section,
      items: list.sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [items]);

  const stats = useMemo(() => {
    const done = items.filter((i) => i.done).length;
    return {
      done,
      total: items.length,
      pct: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  }, [items]);

  const toggle = async (i: Item) => {
    setItems((prev) => prev.map((p) => (p.id === i.id ? { ...p, done: !p.done } : p)));
    if (!i.done) celebrate(null, 18);
    await supabase.from("checklist_items").update({ done: !i.done }).eq("id", i.id);
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("checklist_items").delete().eq("id", id);
  };

  const addToSection = async (section: string) => {
    const text = (draftBySection[section] ?? "").trim();
    if (!text) return;
    setDraftBySection((d) => ({ ...d, [section]: "" }));
    const maxSort = Math.max(0, ...items.map((i) => i.sort_order));
    await supabase
      .from("checklist_items")
      .insert({ tab: "internal", text, section, sort_order: maxSort + 1, done: false });
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const t = editDraft.trim();
    if (t) {
      setItems((prev) => prev.map((p) => (p.id === editingId ? { ...p, text: t } : p)));
      await supabase.from("checklist_items").update({ text: t }).eq("id", editingId);
    }
    setEditingId(null);
  };

  const resetChecks = async () => {
    setItems((prev) => prev.map((p) => ({ ...p, done: false })));
    await supabase.from("checklist_items").update({ done: false }).eq("tab", "internal");
  };

  return (
    <div className="card-elevated rounded-2xl p-5 mb-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl grid place-items-center bg-brand-500/15 border border-brand-500/25 text-brand-300 shrink-0">
            <Mic className="size-4" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-hi">Internal / Podcast Shoot Checklist</div>
            <div className="text-xs text-mid mt-0.5">
              Step-by-step for every in-studio shoot. Synced live across devices.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-mid num">
            {stats.done}/{stats.total} ·{" "}
            <span className="text-brand-400 font-semibold">{stats.pct}%</span>
          </div>
          <Btn variant="ghost" onClick={resetChecks} title="Uncheck all">
            <RotateCcw className="size-3.5" />
          </Btn>
          <Link
            to="/checklists"
            className="inline-flex items-center gap-1 text-[11px] text-mid hover:text-hi"
          >
            Full checklists <ExternalLink className="size-3" />
          </Link>
          <Btn variant="ghost" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </Btn>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-sunken mt-3 mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
          style={{ width: `${stats.pct}%` }}
        />
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => {
            const done = g.items.filter((i) => i.done).length;
            return (
              <div key={g.section} className="bg-sunken/40 border border-line rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-lo font-bold">
                    {g.section}
                  </div>
                  <div className="num text-[10.5px] text-lo">
                    {done}/{g.items.length}
                  </div>
                </div>
                <ul className="flex flex-col gap-1">
                  {g.items.map((i) => (
                    <li
                      key={i.id}
                      className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover"
                    >
                      <input
                        type="checkbox"
                        checked={i.done}
                        onChange={() => toggle(i)}
                        className="accent-brand-500 size-4 shrink-0"
                      />
                      {editingId === i.id ? (
                        <>
                          <input
                            autoFocus
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className={inputCls + " flex-1 text-[12.5px] py-0.5"}
                          />
                          <button
                            onClick={commitEdit}
                            className="text-emerald-500"
                            aria-label="Save"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-mid"
                            aria-label="Cancel"
                          >
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            onDoubleClick={() => {
                              setEditingId(i.id);
                              setEditDraft(i.text);
                            }}
                            className={`flex-1 text-[12.5px] cursor-text ${
                              i.done ? "line-through text-lo" : "text-hi"
                            }`}
                          >
                            {i.text}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(i.id);
                              setEditDraft(i.text);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-mid hover:text-hi transition-opacity"
                            aria-label="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => remove(i.id)}
                            className="opacity-0 group-hover:opacity-100 text-mid hover:text-rose-500 transition-opacity"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addToSection(g.section);
                  }}
                  className="mt-2 flex gap-1.5"
                >
                  <input
                    value={draftBySection[g.section] ?? ""}
                    onChange={(e) =>
                      setDraftBySection((d) => ({ ...d, [g.section]: e.target.value }))
                    }
                    placeholder="Add item…"
                    className={inputCls + " text-[12px] py-1"}
                  />
                  <Btn variant="subtle" type="submit">
                    <Plus className="size-3" />
                  </Btn>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}