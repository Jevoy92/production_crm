import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { GoogleCalendarPanel } from "@/components/calendar/GoogleCalendar";
import { useStore, palColor } from "@/lib/store";
import { useCCStore, platformColor, PLATFORMS, type Platform } from "@/lib/ccStore";
import { getAllVentures, VENTURE_IDS } from "@/lib/ventures/profiles";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  X,
  BarChart3,
  Film,
  Sparkles,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { MonthGenerator } from "@/components/content/MonthGenerator";
import type { VentureId } from "@/lib/ventures/profiles";
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
  const [venture, setVenture] = useState<string>("all");
  const [genOpen, setGenOpen] = useState(false);
  const activeItem = library.find((l) => l.id === activeItemId);

  const venLibrary = useMemo(
    () =>
      venture === "all"
        ? library
        : library.filter((l) => (l.venture ?? "palmer-house") === venture),
    [library, venture],
  );

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
    venLibrary.forEach((it) => {
      if (!it.publishDate) return;
      const arr = m.get(it.publishDate) ?? [];
      arr.push(it);
      m.set(it.publishDate, arr);
    });
    return m;
  }, [venLibrary]);

  const unscheduled = useMemo(
    () => venLibrary.filter((l) => !l.publishDate && l.status !== "Archived"),
    [venLibrary],
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
        <>
          <Btn
            variant="subtle"
            onClick={() => setGenOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" /> Generate month
          </Btn>
          <Btn
            variant="primary"
            onClick={() => setOpenNew(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Schedule shoot
          </Btn>
        </>
      }
    >
      <div className="mb-6">
        <GoogleCalendarPanel />
      </div>
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
                view === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "all" ? "All" : v}
            </button>
          ))}
        </div>
      </div>

      {showPublishing && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
            Venture
          </span>
          {["all", ...VENTURE_IDS].map((vid) => {
            const v = getAllVentures().find((x) => x.id === vid);
            const active = venture === vid;
            return (
              <button
                key={vid}
                type="button"
                onClick={() => setVenture(vid)}
                className={`px-2.5 py-1 text-[11.5px] rounded-full transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                style={
                  active
                    ? v
                      ? {
                          background: `color-mix(in oklab, ${v.accent} 18%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${v.accent}`,
                        }
                      : {
                          background: "var(--surface-2)",
                          boxShadow: "inset 0 0 0 1px var(--border)",
                        }
                    : undefined
                }
              >
                {vid === "all" ? "All" : (v?.shortName ?? vid)}
              </button>
            );
          })}
        </div>
      )}

      {showPublishing && <PlatformLegend />}

      <ProductionTimeline cursor={cursor} projects={projects} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
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
                  className={`min-h-[76px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-border last:border-r-0 transition-colors ${inMonth ? "bg-card" : "bg-surface-2/40"}`}
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
                    {showShoots &&
                      dayShoots.map((s) => {
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
                            }}
                            title={proj.title}
                          >
                            {s.arrival && <span className="num mr-1">{s.arrival}</span>}
                            {proj.title}
                          </Link>
                        );
                      })}
                    {showPublishing &&
                      dayPubs.map((it) => {
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6 items-start">
        <div>
          <h2 className="mb-2 text-[15px] font-semibold tracking-tight">Upcoming shoots</h2>
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
        </div>
        <UpcomingDeliverables projects={projects} />
      </div>

      <NewShootModal open={openNew} onClose={() => setOpenNew(false)} />
      <MonthGenerator
        key={`${cursor.getFullYear()}-${cursor.getMonth()}-${venture}`}
        open={genOpen}
        onClose={() => setGenOpen(false)}
        defaultVenture={venture === "all" ? "palmer-house" : (venture as VentureId)}
        defaultMonth={cursor.getMonth() + 1}
        defaultYear={cursor.getFullYear()}
      />
      {activeItem && <PublishDrawer itemId={activeItem.id} onClose={() => setActiveItemId(null)} />}
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
        <span
          key={p.label}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-inset-soft"
          style={{
            background: `color-mix(in oklab, ${platformColor(p.platform)} 12%, transparent)`,
            color: platformColor(p.platform),
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: platformColor(p.platform) }}
          />
          {p.label}
        </span>
      ))}
    </div>
  );
}

function UnscheduledQueue({
  items,
  onClearDrop,
  onPick,
}: {
  items: ReturnType<typeof useCCStore.getState>["library"];
  onClearDrop: (id: string) => void;
  onPick: (id: string) => void;
}) {
  return (
    <aside
      className="card-elevated rounded-2xl p-3 max-h-[640px] overflow-y-auto"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/cc-item")) e.preventDefault();
      }}
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
                <span className="text-[10px] uppercase tracking-wider" style={{ color }}>
                  {it.platform}
                </span>
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
            <span className="text-[10px] uppercase tracking-wider" style={{ color }}>
              {item.platform}
            </span>
            <h2 className="text-[16px] font-semibold leading-tight mt-1">{item.title}</h2>
            <div className="text-[11px] text-muted-foreground mt-1">
              {item.type} · {item.palLane} · {item.status}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <Field label="Publish date">
          <input
            type="date"
            className={inputCls}
            value={item.publishDate ?? ""}
            onChange={(e) => setPublishDate(item.id, e.target.value || undefined)}
          />
        </Field>
        <Field label="Platform">
          <select
            className={inputCls}
            value={item.platform}
            onChange={(e) => setPlatform(item.id, e.target.value as Platform)}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Publish status">
          <select
            className={inputCls}
            value={item.publishStatus ?? "Draft"}
            onChange={(e) =>
              update(item.id, {
                publishStatus: e.target.value as "Draft" | "Scheduled" | "Published",
              })
            }
          >
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Published">Published</option>
          </select>
        </Field>
        <Field label="Caption">
          <textarea
            rows={4}
            className={inputCls}
            value={item.caption}
            onChange={(e) => update(item.id, { caption: e.target.value })}
          />
        </Field>

        <div className="flex gap-2 mt-4">
          <Btn variant="subtle" onClick={() => setPublishDate(item.id, undefined)}>
            Unschedule
          </Btn>
          {item.relatedCore12 && (
            <Link to="/scripts/$num" params={{ num: String(item.relatedCore12).padStart(2, "0") }}>
              <Btn variant="primary">Open script</Btn>
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

// ─── Production Timeline (Gantt) ──────────────────────────────────────────────
const PHASE_STYLES = {
  prepro: { label: "Pre-Pro", color: "#f59e0b" },
  shoot: { label: "Shoot", color: "#6366f1" },
  post: { label: "Post-Production", color: "#8b5cf6" },
  delivery: { label: "Deliver", color: "#10b981" },
} as const;
type PhaseType = keyof typeof PHASE_STYLES;
const DAY_MS = 86_400_000;

function projectPhases(p: Project): { type: PhaseType; start: Date; end: Date }[] {
  const out: { type: PhaseType; start: Date; end: Date }[] = [];
  const shoot = p.shootDate ? new Date(p.shootDate) : null;
  const delivery = p.deliveryDate ? new Date(p.deliveryDate) : null;
  if (shoot) {
    const pre = new Date(shoot.getTime() - 4 * DAY_MS);
    out.push({ type: "prepro", start: pre, end: new Date(shoot.getTime() - DAY_MS) });
    out.push({ type: "shoot", start: shoot, end: shoot });
  }
  if (shoot && delivery && delivery.getTime() > shoot.getTime() + DAY_MS) {
    out.push({
      type: "post",
      start: new Date(shoot.getTime() + DAY_MS),
      end: new Date(delivery.getTime() - DAY_MS),
    });
  }
  if (delivery) out.push({ type: "delivery", start: delivery, end: delivery });
  return out;
}

function clampPhase(
  ph: { type: PhaseType; start: Date; end: Date },
  monthStart: Date,
  monthEnd: Date,
  daysInMonth: number,
) {
  if (ph.end < monthStart || ph.start > monthEnd) return null;
  const startDay = ph.start < monthStart ? 1 : ph.start.getDate();
  const endDay = ph.end > monthEnd ? daysInMonth : ph.end.getDate();
  return { type: ph.type, colStart: startDay, span: Math.max(1, endDay - startDay + 1) };
}

function ProductionTimeline({ cursor, projects }: { cursor: Date; projects: Project[] }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);
  const monthLabel = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });

  const rows = useMemo(
    () =>
      projects
        .filter((p) => p.stage !== "Archived")
        .map((p) => ({
          p,
          bars: projectPhases(p)
            .map((ph) => clampPhase(ph, monthStart, monthEnd, daysInMonth))
            .filter((b): b is NonNullable<typeof b> => b !== null),
        }))
        .filter((r) => r.bars.length > 0),
    [projects, year, month, daysInMonth],
  );

  const now = new Date();
  const todayCol = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;
  const ticks = Array.from({ length: Math.ceil(daysInMonth / 2) }, (_, i) => i * 2 + 1).filter(
    (d) => d <= daysInMonth,
  );

  return (
    <div className="card-elevated rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/12 grid place-items-center">
            <BarChart3 className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">Production Timeline</h2>
            <p className="text-[11.5px] text-muted-foreground">Gantt view · {monthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(Object.keys(PHASE_STYLES) as PhaseType[]).map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2.5 rounded-sm" style={{ background: PHASE_STYLES[t].color }} />
              {PHASE_STYLES[t].label.replace("-Production", "")}
            </span>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-[12.5px] text-muted-foreground">
          No productions with scheduled shoot or delivery dates in {monthLabel}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 960 }}>
            <div className="flex border-b border-border bg-surface-2">
              <div className="w-56 flex-shrink-0 px-4 py-2 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                Project
              </div>
              <div
                className="flex-1 py-2 px-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${daysInMonth}, minmax(0,1fr))`,
                }}
              >
                {ticks.map((d) => (
                  <div
                    key={d}
                    className="text-[10px] text-muted-foreground num"
                    style={{ gridColumn: `${d} / span 2` }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {rows.map(({ p, bars }) => (
              <div
                key={p.id}
                className="flex items-center border-b border-border last:border-b-0 hover:bg-surface-2/50 transition-colors"
              >
                <Link
                  to="/projects/$id"
                  params={{ id: p.id }}
                  className="w-56 flex-shrink-0 px-4 py-3 min-w-0 hover:opacity-80"
                >
                  <div className="text-[12px] font-semibold truncate flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full flex-shrink-0"
                      style={{ background: palColor(p.palType) }}
                    />
                    {p.title}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground truncate">
                    {p.palType} · {p.stage}
                  </div>
                </Link>
                <div
                  className="flex-1 px-2 py-2 relative"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${daysInMonth}, minmax(0,1fr))`,
                    gridAutoRows: "22px",
                    rowGap: 4,
                  }}
                >
                  {todayCol && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none"
                      style={{ left: `${((todayCol - 0.5) / daysInMonth) * 100}%` }}
                    />
                  )}
                  {bars.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-md flex items-center px-1.5 overflow-hidden"
                      style={{
                        gridColumn: `${b.colStart} / span ${b.span}`,
                        gridRow: i + 1,
                        background: PHASE_STYLES[b.type].color,
                      }}
                      title={`${PHASE_STYLES[b.type].label} · ${p.title}`}
                    >
                      {b.span >= 3 && (
                        <span className="text-white text-[10.5px] font-medium truncate">
                          {PHASE_STYLES[b.type].label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upcoming Deliverables ────────────────────────────────────────────────────
function UpcomingDeliverables({ projects }: { projects: Project[] }) {
  const today = new Date(new Date().toDateString());
  const items = useMemo(
    () =>
      projects
        .filter((p) => p.deliveryDate && p.stage !== "Archived")
        .map((p) => ({ p, due: new Date(p.deliveryDate as string) }))
        .filter((x) => (x.due.getTime() - today.getTime()) / DAY_MS >= -3)
        .sort((a, b) => +a.due - +b.due)
        .slice(0, 8),
    [projects],
  );

  return (
    <aside className="card-elevated rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight">Upcoming deliverables</h2>
        <span className="text-[11px] text-muted-foreground">{items.length}</span>
      </div>
      <div className="p-3 space-y-1.5">
        {items.length === 0 && (
          <div className="text-[12px] text-muted-foreground py-6 text-center">
            No deliveries on the calendar.
          </div>
        )}
        {items.map(({ p, due }) => {
          const days = Math.ceil((due.getTime() - today.getTime()) / DAY_MS);
          const overdue = days < 0;
          const soon = days >= 0 && days <= 5;
          const color = palColor(p.palType);
          const pill = overdue
            ? "text-rose-500 bg-rose-500/10"
            : soon
              ? "text-amber-500 bg-amber-500/10"
              : "text-emerald-500 bg-emerald-500/10";
          return (
            <Link
              key={p.id}
              to="/projects/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition-colors"
            >
              <div
                className="size-8 rounded-lg grid place-items-center flex-shrink-0"
                style={{ background: `color-mix(in oklab, ${color} 16%, transparent)` }}
              >
                <Film className="size-3.5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Due {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                  {p.palType}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${pill}`}
              >
                {overdue ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
