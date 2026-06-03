import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { useStore, palColor, readinessScore } from "@/lib/store";
import { ArrowLeft, MapPin, Clock, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/shoots/$id")({
  component: ShootDay,
  head: () => ({ meta: [{ title: "Shoot Day · Palmer House" }] }),
});

function ShootDay() {
  const { id } = Route.useParams();
  const shoot = useStore((s) => s.shoots.find((x) => x.id === id));
  const project = useStore((s) => s.projects.find((p) => p.id === shoot?.projectId));
  const team = useStore((s) => s.team);
  const toggle = useStore((s) => s.toggleChecklistItem);

  if (!shoot || !project)
    return (
      <Shell title="Shoot not found">
        <Link to="/schedule">
          <Btn>Back to Schedule</Btn>
        </Link>
      </Shell>
    );

  const ready = readinessScore(project);
  const crew = team.filter((m) => shoot.crewIds.includes(m.id));
  const pre = project.checklists["Pre-Production"];
  const day = project.checklists["Shoot Day"];

  return (
    <Shell
      title="Shoot Day"
      subtitle={new Date(shoot.date).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      actions={
        <Link to="/schedule">
          <Btn variant="subtle" className="flex items-center gap-1.5">
            <ArrowLeft className="size-3.5" /> Back
          </Btn>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <div
          className="card-elevated rounded-2xl p-5"
          style={{ borderLeft: `4px solid ${palColor(project.palType)}` }}
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {project.palType}
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight mt-0.5">{project.title}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <Stat icon={<MapPin className="size-4" />} label="Location" value={shoot.location} />
            <Stat
              icon={<Clock className="size-4" />}
              label="Call time"
              value={shoot.arrival || "—"}
            />
            <Stat
              label="Start → End"
              value={[shoot.startTime, shoot.endTime].filter(Boolean).join(" → ") || "—"}
            />
            <Stat
              label="Readiness"
              value={`${ready}%`}
              accent={ready >= 80 ? "var(--color-chart-3)" : "var(--color-destructive)"}
            />
          </div>
          {shoot.goals && (
            <div className="mt-4 rounded-xl bg-surface-2 p-3 text-[14px] leading-relaxed">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">
                Goals
              </div>
              {shoot.goals}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {crew.map((m) => (
              <span
                key={m.id}
                className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-1 text-[12px]"
              >
                <span
                  className="size-5 rounded-full grid place-items-center text-[9.5px] font-semibold text-primary-foreground"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
                {m.name}
              </span>
            ))}
          </div>
        </div>

        <BigList
          title="Pre-Production"
          items={pre}
          onToggle={(iid) => toggle(project.id, "Pre-Production", iid)}
        />
        <BigList
          title="Shoot Day"
          items={day}
          onToggle={(iid) => toggle(project.id, "Shoot Day", iid)}
        />

        <Link to="/projects/$id" params={{ id: project.id }} className="block">
          <Btn variant="primary" className="w-full">
            Open project hub
          </Btn>
        </Link>
      </div>
    </Shell>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-2 p-2.5">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div
        className="num text-[15px] font-medium mt-0.5"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function BigList({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: { id: string; text: string; done: boolean }[];
  onToggle: (id: string) => void;
}) {
  const doneCount = items.filter((i) => i.done).length;
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <span className="num text-[12px] text-muted-foreground">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            <button
              onClick={() => onToggle(i.id)}
              className="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2 text-left"
            >
              {i.done ? (
                <CheckCircle2 className="size-5 text-primary shrink-0" />
              ) : (
                <Circle className="size-5 text-muted-foreground shrink-0" />
              )}
              <span className={`text-[14px] ${i.done ? "line-through text-muted-foreground" : ""}`}>
                {i.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
