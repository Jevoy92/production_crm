import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore, palColor } from "@/lib/store";
import { useCCStore, platformColor, PLATFORMS, type Platform } from "@/lib/ccStore";
import { ChevronLeft, ChevronRight, Plus, MapPin, X } from "lucide-react";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

const ViewSchema = z.object({
  view: fallback(z.enum(["shoots", "publishing", "all"]), "all").default("all"),
});

export const Route = createFileRoute("/schedule")({
  validateSearch: zodValidator(ViewSchema),
  component: SchedulePage,
  head: () => ({ meta: [{ title: "Schedule · Palmer House" }] }),
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulePage() {
  const shoots = useStore((s) => s.shoots);
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);
  const removeShoot = useStore((s) => s.removeShoot);

  const library = useCCStore((s) => s.library);
  const setPublishDate = useCCStore((s) => s.setPublishDate);

  const { view } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setView = (v: "shoots" | "publishing" | "all") =>
    navigate({ search: { view: v }, replace: true });

  const [cursor, setCursor] = useState(new Date());
  const [openNew, setOpenNew] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItem = library.find((l) => l.id === activeItemId);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const cells = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [gridStart.getTime()]);

  const byDay = useMemo(() => {
    const m = new Map<string, typeof shoots>();
    shoots.forEach((s) => {
      const k = s.date.slice(0, 10);
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    });
    return m;
  }, [shoots]);

  const publishByDay = useMemo(() => {
    const m = new Map<string, typeof library>();
    library.forEach((it) => {
      if (!it.publishDate) return;
      const arr = m.get(it.publishDate) ?? [];
      arr.push(it);
      m.set(it.publishDate, arr);
    });
    return m;
  }, [library]);

  const unscheduled = useMemo(
    () => library.filter((l) => !l.publishDate && l.status !== "Archived"),
    [library],
  );

  const showShoots = view === "shoots" || view === "all";
  const showPublishing = view === "publishing" || view === "all";

  const onDropDay = (e: React.DragEvent, dayKey: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/cc-item");
    if (id) setPublishDate(id, dayKey);
  };

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <Shell
      title="Schedule"
      subtitle={`${shoots.length} shoots · ${library.filter((l) => l.publishDate).length} scheduled posts`}
      actions={
        <Btn
          variant="primary"
          onClick={() => setOpenNew(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-3.5" /> Schedule shoot
        </Btn>
      }
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Btn
          variant="subtle"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <ChevronLeft className="size-4" />
        </Btn>
        <div className="text-[15px] font-semibold tracking-tight w-44">{monthLabel}</div>
        <Btn
          variant="subtle"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <ChevronRight className="size-4" />
        </Btn>
        <Btn variant="ghost" onClick={() => setCursor(new Date())}>
          Today
        </Btn>

        <div className="ml-auto flex items-center gap-1 rounded-full bg-surface-2 p-0.5 ring-inset-soft">
          {(["shoots", "publishing", "all"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1 text-[12px] rounded-full capitalize transition-colors ${
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "all" ? "All" : v}
            </button>
          ))}
        </div>
      </div>

      {showPublishing && (
        <PlatformLegend />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      <div className="card-elevated rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-surface-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const k = d.toISOString().slice(0, 10);
            const inMonth = d.getMonth() === cursor.getMonth();
            const dayShoots = byDay.get(k) ?? [];
            const dayPubs = publishByDay.get(k) ?? [];
            return (
              <div
                key={k}
                className={`min-h-[120px] p-2 border-r border-b border-border last:border-r-0 transition-colors ${inMonth ? "bg-card" : "bg-surface-2/40"}`}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("text/cc-item")) {
                    e.preventDefault();
                    e.currentTarget.classList.add("ring-2", "ring-primary/40");
                  }
                }}
                onDragLeave={(e) => e.currentTarget.classList.remove("ring-2", "ring-primary/40")}
                onDrop={(e) => {
                  e.currentTarget.classList.remove("ring-2", "ring-primary/40");
                  onDropDay(e, k);
                }}
              >
                <div
                  className={`text-[11px] num ${k === todayKey ? "inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}
                >
                  {d.getDate()}
                </div>
                <div className="mt-1.5 space-y-1">
                  {showShoots && dayShoots.map((s) => {
                    const proj = projects.find((p) => p.id === s.projectId);
                    if (!proj) return null;
                    return (
                      <Link
                        key={s.id}
                        to="/projects/$id"
                        params={{ id: proj.id }}
                        className="block rounded-md px-1.5 py-1 text-[10.5px] truncate hover:opacity-90"
                        style={{
                          background: palColor(proj.palType) + "22",
                          color: palColor(proj.palType),
                          borderLeft: `2px solid ${palColor(proj.palType)}`,
                        }}
                        title={proj.title}
                      >
                        {s.arrival && <span className="num mr-1">{s.arrival}</span>}
                        {proj.title}
                      </Link>
                    );
                  })}
                  {showPublishing && dayPubs.map((it) => {
                    const color = platformColor(it.platform);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/cc-item", it.id)}
                        onClick={() => setActiveItemId(it.id)}
                        className="block w-full text-left rounded-md px-1.5 py-1 text-[10.5px] truncate hover:opacity-90 cursor-grab active:cursor-grabbing"
                        style={{
                          background: `color-mix(in oklab, ${color} 15%, transparent)`,
                          color,
                          borderLeft: `2px solid ${color}`,
                        }}
                        title={`${it.platform} · ${it.title}`}
                      >
                        ▸ {it.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showPublishing && (
        <UnscheduledQueue
          items={unscheduled}
          onClearDrop={(id) => setPublishDate(id, undefined)}
          onPick={(id) => setActiveItemId(id)}
        />
      )}
      </div>

      <h2 className="mt-6 mb-2 text-[15px] font-semibold tracking-tight">Upcoming shoots</h2>
      <div className="space-y-2">
        {shoots
          .filter((s) => new Date(s.date) >= new Date(new Date().toDateString()))
          .sort((a, b) => +new Date(a.date) - +new Date(b.date))
          .map((s) => {
            const proj = projects.find((p) => p.id === s.projectId);
            return (
              <div key={s.id} className="card-elevated rounded-xl p-3 flex items-center gap-4">
                <Link
                  to="/shoots/$id"
                  params={{ id: s.id }}
                  className="text-center w-14 hover:opacity-80"
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(s.date).toLocaleString(undefined, { weekday: "short" })}
                  </div>
                  <div className="num text-[20px] font-semibold leading-none">
                    {new Date(s.date).getDate()}
                  </div>
                </Link>
                <Link
                  to="/shoots/$id"
                  params={{ id: s.id }}
                  className="flex-1 min-w-0 hover:opacity-90"
                >
                  <div className="text-[13px] font-medium truncate">{proj?.title ?? "—"}</div>
                  <div className="text-[11.5px] text-muted-foreground flex flex-wrap gap-x-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {s.location}
                    </span>
                    {s.arrival && <span className="num">Call {s.arrival}</span>}
                  </div>
                </Link>
                <div className="flex -space-x-1.5">
                  {s.crewIds.map((cid) => {
                    const m = team.find((x) => x.id === cid);
                    if (!m) return null;
                    return (
                      <div
                        key={cid}
                        className="size-6 rounded-full grid place-items-center text-[9.5px] font-semibold text-primary-foreground ring-2 ring-card"
                        style={{ background: m.color }}
                      >
                        {m.initials}
                      </div>
                    );
                  })}
                </div>
                {proj && (
                  <Link to="/projects/$id" params={{ id: proj.id }}>
                    <Btn variant="subtle">Project</Btn>
                  </Link>
                )}
                <Link to="/shoots/$id" params={{ id: s.id }}>
                  <Btn variant="subtle">Open</Btn>
                </Link>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Remove shoot?")) removeShoot(s.id);
                  }}
                >
                  Remove
                </Btn>
              </div>
            );
          })}
      </div>

      <NewShootModal open={openNew} onClose={() => setOpenNew(false)} />
      {activeItem && (
        <PublishDrawer
          itemId={activeItem.id}
          onClose={() => setActiveItemId(null)}
        />
      )}
    </Shell>
  );
}

const LEGEND: { label: string; platform: Platform }[] = [
  { label: "YouTube", platform: "YouTube" },
  { label: "Instagram", platform: "Instagram Reels" },
  { label: "TikTok", platform: "TikTok" },
  { label: "LinkedIn", platform: "LinkedIn" },
  { label: "Website", platform: "Website" },
  { label: "Newsletter", platform: "Newsletter" },
  { label: "YourBoyJevoy", platform: "YourBoyJevoy" },
];

function PlatformLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-muted-foreground">
      <span className="uppercase tracking-wider">Platforms</span>
      {LEGEND.map((p) => (
        <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-inset-soft"
          style={{
            background: `color-mix(in oklab, ${platformColor(p.platform)} 12%, transparent)`,
            color: platformColor(p.platform),
          }}
        >
          <span className="size-1.5 rounded-full" style={{ background: platformColor(p.platform) }} />
          {p.label}
        </span>
      ))}
    </div>
  );
}

function UnscheduledQueue({
  items, onClearDrop, onPick,
}: {
  items: ReturnType<typeof useCCStore.getState>["library"];
  onClearDrop: (id: string) => void;
  onPick: (id: string) => void;
}) {
  return (
    <aside
      className="card-elevated rounded-2xl p-3 self-stretch min-h-0 overflow-y-auto"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("text/cc-item")) e.preventDefault(); }}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/cc-item");
        if (id) onClearDrop(id);
      }}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        Unscheduled · {items.length}
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Drag onto a day to schedule. Drag back here to unschedule.
      </p>
      <div className="space-y-1.5">
        {items.length === 0 && (
          <div className="text-[12px] text-muted-foreground py-4 text-center">Inbox zero.</div>
        )}
        {items.map((it) => {
          const color = platformColor(it.platform);
          return (
            <button
              key={it.id}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/cc-item", it.id)}
              onClick={() => onPick(it.id)}
              className="block w-full text-left rounded-lg p-2 ring-inset-soft hover:bg-surface-2 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color }}>{it.platform}</span>
                <span className="text-[10px] text-muted-foreground">{it.type}</span>
              </div>
              <div className="text-[12px] font-medium leading-tight line-clamp-2">{it.title}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function PublishDrawer({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const item = useCCStore((s) => s.library.find((l) => l.id === itemId));
  const update = useCCStore((s) => s.updateContentItem);
  const setPublishDate = useCCStore((s) => s.setPublishDate);
  const setPlatform = useCCStore((s) => s.setPublishPlatform);
  if (!item) return null;
  const color = platformColor(item.platform);
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-foreground/20" />
      <div
        className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color }}>{item.platform}</span>
            <h2 className="text-[16px] font-semibold leading-tight mt-1">{item.title}</h2>
            <div className="text-[11px] text-muted-foreground mt-1">{item.type} · {item.palLane} · {item.status}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        <Field label="Publish date">
          <input
            type="date" className={inputCls}
            value={item.publishDate ?? ""}
            onChange={(e) => setPublishDate(item.id, e.target.value || undefined)}
          />
        </Field>
        <Field label="Platform">
          <select className={inputCls} value={item.platform} onChange={(e) => setPlatform(item.id, e.target.value as Platform)}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Publish status">
          <select
            className={inputCls}
            value={item.publishStatus ?? "Draft"}
            onChange={(e) => update(item.id, { publishStatus: e.target.value as "Draft" | "Scheduled" | "Published" })}
          >
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Published">Published</option>
          </select>
        </Field>
        <Field label="Caption">
          <textarea rows={4} className={inputCls} value={item.caption} onChange={(e) => update(item.id, { caption: e.target.value })} />
        </Field>

        <div className="flex gap-2 mt-4">
          <Btn variant="subtle" onClick={() => setPublishDate(item.id, undefined)}>Unschedule</Btn>
          {item.relatedCore12 && (
            <Link to="/cc/core12/$num" params={{ num: String(item.relatedCore12) }}>
              <Btn variant="primary">Open Core 12</Btn>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function NewShootModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);
  const addShoot = useStore((s) => s.addShoot);
  const [projectId, setP] = useState(projects[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [arrival, setArr] = useState("");
  const [location, setL] = useState("");
  const [goals, setG] = useState("");
  const [crew, setCrew] = useState<string[]>([]);

  const submit = () => {
    if (!projectId || !date || !location) return;
    addShoot({
      projectId,
      date: new Date(date).toISOString(),
      arrival,
      location,
      goals,
      crewIds: crew,
      status: "Scheduled",
    });
    setDate("");
    setArr("");
    setL("");
    setG("");
    setCrew([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a shoot"
      wide
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit}>
            Schedule
          </Btn>
        </>
      }
    >
      <Field label="Project">
        <select className={inputCls} value={projectId} onChange={(e) => setP(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Call time">
          <input
            type="time"
            className={inputCls}
            value={arrival}
            onChange={(e) => setArr(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Location">
        <input
          className={inputCls}
          value={location}
          onChange={(e) => setL(e.target.value)}
          placeholder="Studio A · 123 Main St"
        />
      </Field>
      <Field label="Goals">
        <textarea
          rows={2}
          className={inputCls}
          value={goals}
          onChange={(e) => setG(e.target.value)}
          placeholder="What needs to happen…"
        />
      </Field>
      <Field label="Crew">
        <div className="flex flex-wrap gap-1.5">
          {team.map((m) => {
            const on = crew.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setCrew(on ? crew.filter((x) => x !== m.id) : [...crew, m.id])}
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] ring-inset-soft ${on ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"}`}
              >
                <span
                  className="size-4 rounded-full grid place-items-center text-[9px] font-semibold text-primary-foreground"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
                {m.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </Field>
    </Modal>
  );
}
