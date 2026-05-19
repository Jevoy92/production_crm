import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore, palColor } from "@/lib/store";
import { ChevronLeft, ChevronRight, Plus, MapPin } from "lucide-react";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
  head: () => ({ meta: [{ title: "Schedule · Palmer House" }] }),
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulePage() {
  const shoots = useStore((s) => s.shoots);
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);
  const addShoot = useStore((s) => s.addShoot);
  const removeShoot = useStore((s) => s.removeShoot);

  const [cursor, setCursor] = useState(new Date());
  const [openNew, setOpenNew] = useState(false);

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

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthLabel = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <Shell
      title="Schedule"
      subtitle={`${shoots.length} shoots tracked`}
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
      <div className="flex items-center gap-2 mb-4">
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
      </div>

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
            return (
              <div
                key={k}
                className={`min-h-[110px] p-2 border-r border-b border-border last:border-r-0 ${inMonth ? "bg-card" : "bg-surface-2/40"}`}
              >
                <div
                  className={`text-[11px] num ${k === todayKey ? "inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}
                >
                  {d.getDate()}
                </div>
                <div className="mt-1.5 space-y-1">
                  {dayShoots.map((s) => {
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
                </div>
              </div>
            );
          })}
        </div>
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
    </Shell>
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
