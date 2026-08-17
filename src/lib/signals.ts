/**
 * Derived operational intelligence for Production OS.
 *
 * Everything here is computed from real store state — no hand-written copy.
 * Three consumers: Watch-outs (exception management), Daily Insights
 * (interpretation), Yesterday Recap (continuity).
 */
import type { Project, Task, Shoot, TeamMember, Client } from "./types";

export type Severity = "urgent" | "action" | "attention";

export type WatchOut = {
  id: string;
  severity: Severity;
  /** Short exception label. */
  title: string;
  /** What happened — factual, drawn from data. */
  what: string;
  /** Why it matters operationally. */
  why: string;
  /** What happens if it is ignored. */
  cost: string;
  /** The action that resolves it. */
  action: { label: string; to: string };
  /** Rank used to cut the list down — higher surfaces first. */
  weight: number;
};

export type WaitingItem = {
  id: string;
  what: string;
  who: string;
  days: number;
  stale: boolean;
  to: string;
};

export type Insight = {
  id: string;
  kind: "throughput" | "load" | "risk" | "creative" | "money";
  /** The interpretation — a sentence with a decision attached. */
  text: string;
  /** Supporting figures, shown small. */
  evidence: string;
};

export type RecapEntry = {
  id: string;
  bucket: "completed" | "moved" | "slipped" | "open" | "waiting";
  text: string;
};

export type SignalInput = {
  tasks: Task[];
  projects: Project[];
  shoots: Shoot[];
  team: TeamMember[];
  clients: Client[];
  /** Calendar events for today (already filtered by the caller). */
  events: Array<{ title: string; start: string; allDay?: boolean }>;
  now?: Date;
};

const DAY = 86_400_000;

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / DAY);
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

/* ------------------------------------------------------------------ */
/* Waiting-on: work that is neither done nor being worked on.          */
/* ------------------------------------------------------------------ */

/** Stale after this many days with no movement. */
export const STALE_AFTER_DAYS = 3;

export function deriveWaiting(input: SignalInput): WaitingItem[] {
  const now = input.now ?? new Date();
  const out: WaitingItem[] = [];

  for (const t of input.tasks) {
    if (t.status === "done" || !t.waitingOn) continue;
    const since = new Date(t.waitingOn.since || t.createdAt);
    const days = Math.max(0, daysBetween(now, since));
    out.push({
      id: `task-${t.id}`,
      what: t.title,
      who: t.waitingOn.who,
      days,
      stale: days >= STALE_AFTER_DAYS,
      to: "/tasks",
    });
  }

  // A production sitting in a review stage is implicitly waiting on someone.
  for (const p of input.projects) {
    if (p.stage !== "In Post" && p.stage !== "Proposal Sent") continue;
    const ref = new Date(p.createdAt);
    const days = Math.max(0, daysBetween(now, ref));
    if (days < STALE_AFTER_DAYS) continue;
    out.push({
      id: `proj-${p.id}`,
      what: p.title,
      who: p.stage === "Proposal Sent" ? "Client — proposal decision" : "Client — review",
      days,
      stale: days >= STALE_AFTER_DAYS * 2,
      to: "/productions",
    });
  }

  return out.sort((a, b) => b.days - a.days);
}

/* ------------------------------------------------------------------ */
/* Watch-outs: exception management, not a notification feed.          */
/* ------------------------------------------------------------------ */

export function deriveWatchOuts(input: SignalInput, limit = 4): WatchOut[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const out: WatchOut[] = [];

  /* --- Overdue work ------------------------------------------------ */
  const overdue = input.tasks.filter(
    (t) => t.status !== "done" && t.dueDate && startOfDay(new Date(t.dueDate)) < today,
  );
  if (overdue.length) {
    const worst = overdue
      .map((t) => daysBetween(today, startOfDay(new Date(t.dueDate!))))
      .sort((a, b) => b - a)[0];
    const high = overdue.filter((t) => t.priority === "High").length;
    out.push({
      id: "overdue",
      severity: high > 0 ? "urgent" : "action",
      title: `${plural(overdue.length, "task")} past due`,
      what: `Oldest is ${plural(worst, "day")} late${high ? `; ${high} marked high priority` : ""}.`,
      why: high
        ? "High-priority overdue work is what turns into a missed delivery date."
        : "Overdue items quietly reset expectations with whoever is waiting on them.",
      cost: "Each day of drift compounds into the next production's schedule.",
      action: { label: "Triage tasks", to: "/tasks" },
      weight: 100 + overdue.length * 5 + high * 20,
    });
  }

  /* --- Shoot readiness --------------------------------------------- */
  for (const s of input.shoots) {
    if (s.status !== "Scheduled") continue;
    const d = startOfDay(new Date(s.date));
    const days = daysBetween(d, today);
    if (days < 0 || days > 2) continue;
    const project = input.projects.find((p) => p.id === s.projectId);
    const openPrep = input.tasks.filter(
      (t) => t.status !== "done" && t.projectId === s.projectId && t.stage === "Pre-Production",
    ).length;
    const missing: string[] = [];
    if (!s.crewIds?.length) missing.push("no crew assigned");
    if (!s.gearKitId) missing.push("no gear kit");
    if (!s.location) missing.push("no location");
    if (openPrep) missing.push(`${plural(openPrep, "prep task")} open`);
    if (!missing.length) continue;
    out.push({
      id: `shoot-${s.id}`,
      severity: days === 0 ? "urgent" : "action",
      title: `${project?.title ?? "Shoot"} — ${days === 0 ? "today" : days === 1 ? "tomorrow" : "in 2 days"}`,
      what: `Shoot is not ready: ${missing.join(", ")}.`,
      why: "Missing prep is discovered on location, where it costs the whole call time.",
      cost: "A reshoot or a shortened shoot day, both paid for by the edit schedule.",
      action: { label: "Open shoot", to: `/shoots/${s.id}` },
      weight: 120 - days * 15 + missing.length * 4,
    });
  }

  /* --- Blocked productions ----------------------------------------- */
  const blocked = input.projects.filter((p) => p.blocker && p.stage !== "Delivered" && p.stage !== "Archived");
  if (blocked.length) {
    out.push({
      id: "blocked",
      severity: "action",
      title: `${plural(blocked.length, "production")} blocked`,
      what: blocked
        .slice(0, 2)
        .map((p) => `${p.title}: ${p.blocker}`)
        .join(" · "),
      why: "A blocker held by someone else does not resolve itself with time.",
      cost: "The production keeps its slot on the schedule while making no progress.",
      action: { label: "Open productions", to: "/productions" },
      weight: 90 + blocked.length * 5,
    });
  }

  /* --- Stale waiting-on -------------------------------------------- */
  const waiting = deriveWaiting(input).filter((w) => w.stale);
  if (waiting.length) {
    const worst = waiting[0];
    out.push({
      id: "waiting",
      severity: "attention",
      title: `${plural(waiting.length, "thread")} waiting with no movement`,
      what: `Longest: "${worst.what}" — ${worst.who}, ${plural(worst.days, "day")}.`,
      why: "Waiting work is invisible in every view except this one.",
      cost: "Silence gets read as agreement until the deadline arrives.",
      action: { label: "Chase follow-ups", to: "/tasks" },
      weight: 70 + worst.days,
    });
  }

  /* --- Meeting load vs. deep work ---------------------------------- */
  const timed = input.events.filter((e) => !e.allDay);
  if (timed.length >= 3) {
    const hours = timed
      .map((e) => {
        const d = new Date(e.start);
        return d.getHours() + d.getMinutes() / 60;
      })
      .sort((a, b) => a - b);
    let largestGap = 0;
    for (let i = 1; i < hours.length; i++) largestGap = Math.max(largestGap, hours[i] - hours[i - 1]);
    const highOpen = input.tasks.filter((t) => t.status !== "done" && t.priority === "High").length;
    if (largestGap < 1.5 && highOpen > 0) {
      out.push({
        id: "fragmented",
        severity: "attention",
        title: "No uninterrupted block today",
        what: `${plural(timed.length, "call")} with a largest gap of ${largestGap.toFixed(1)}h, against ${plural(highOpen, "high-priority item")}.`,
        why: "Creative work does not fit inside the gaps between calls.",
        cost: "The priority work slides to tomorrow, which already has its own load.",
        action: { label: "Reshape the day", to: "/schedule" },
        weight: 60 + highOpen * 3,
      });
    }
  }

  /* --- Editing bottleneck ------------------------------------------ */
  const inPost = input.projects.filter((p) => p.stage === "In Post").length;
  const filming = input.projects.filter((p) => p.stage === "Shoot Day" || p.stage === "Pre-Production").length;
  if (inPost >= 3 && inPost > filming) {
    out.push({
      id: "post-bottleneck",
      severity: "attention",
      title: "Editing is the slowest stage",
      what: `${inPost} in post against ${filming} in prep or filming.`,
      why: "Post is absorbing work faster than it releases it.",
      cost: "Two more shoots this week and delivery dates start moving.",
      action: { label: "Review the pipeline", to: "/productions" },
      weight: 50 + inPost * 3,
    });
  }

  /* --- Creative cadence gap ---------------------------------------- */
  const lastShoot = input.shoots
    .filter((s) => s.status === "Complete" || new Date(s.date) <= now)
    .map((s) => new Date(s.date).getTime())
    .sort((a, b) => b - a)[0];
  if (lastShoot) {
    const dark = daysBetween(today, startOfDay(new Date(lastShoot)));
    if (dark >= 5) {
      out.push({
        id: "cadence",
        severity: "attention",
        title: `${plural(dark, "day")} without filming`,
        what: "No shoot logged since the last completed call sheet.",
        why: "The publishing calendar runs on a buffer that is currently draining.",
        cost: "A visible gap in output roughly two weeks from now.",
        action: { label: "Schedule a self-record", to: "/schedule" },
        weight: 40 + dark,
      });
    }
  }

  const rank: Record<Severity, number> = { urgent: 2, action: 1, attention: 0 };
  return out
    .sort((a, b) => rank[b.severity] - rank[a.severity] || b.weight - a.weight)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Daily Insights: interpretation, not row-counting.                   */
/* ------------------------------------------------------------------ */

export function deriveInsights(input: SignalInput, limit = 4): Insight[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const out: Insight[] = [];

  const open = input.tasks.filter((t) => t.status !== "done");
  const thisWeekEnd = new Date(today.getTime() + 7 * DAY);
  const schedulingRisk = open.filter(
    (t) => t.priority === "High" && t.dueDate && new Date(t.dueDate) <= thisWeekEnd,
  ).length;
  if (open.length) {
    out.push({
      id: "task-shape",
      kind: "risk",
      text: schedulingRisk
        ? `${open.length} tasks are open, but only ${schedulingRisk} genuinely threaten this week's schedule — the rest can wait without cost.`
        : `${open.length} tasks are open and none of them are due this week, so today's constraint is attention, not deadlines.`,
      evidence: `${open.length} open · ${schedulingRisk} time-critical`,
    });
  }

  const inPost = input.projects.filter((p) => p.stage === "In Post").length;
  const upstream = input.projects.filter(
    (p) => p.stage === "Booked" || p.stage === "Pre-Production" || p.stage === "Shoot Day",
  ).length;
  if (inPost || upstream) {
    out.push({
      id: "throughput",
      kind: "throughput",
      text:
        inPost > upstream
          ? `Post is carrying ${inPost} productions against ${upstream} upstream — editing is now the constraint, and adding shoots makes it worse before it makes it better.`
          : `${upstream} productions are heading toward a post queue holding ${inPost} — capacity is there, but only if edits keep clearing.`,
      evidence: `${upstream} upstream · ${inPost} in post`,
    });
  }

  const awaitingApproval = input.projects.filter((p) => p.stage === "In Post" || p.stage === "Proposal Sent");
  if (awaitingApproval.length) {
    const names = [...new Set(awaitingApproval.map((p) => input.clients.find((c) => c.id === p.clientId)?.name).filter(Boolean))];
    out.push({
      id: "approvals",
      kind: "risk",
      text: `${plural(awaitingApproval.length, "deliverable")} sit with ${plural(names.length, "client")} rather than with us — chasing these moves more revenue today than starting anything new.`,
      evidence: names.slice(0, 3).join(", ") || "clients pending",
    });
  }

  const timed = input.events.filter((e) => !e.allDay);
  const meetingHours = timed.length * 0.75;
  const highOpen = open.filter((t) => t.priority === "High").length;
  if (timed.length) {
    out.push({
      id: "load",
      kind: "load",
      text:
        timed.length >= 4 && highOpen
          ? `Roughly ${meetingHours.toFixed(1)}h of calls today leaves little room for the ${plural(highOpen, "high-priority item")} still open — pick one to protect and let the rest move.`
          : `${plural(timed.length, "call")} today with room around them — this is the kind of day where creative work actually lands.`,
      evidence: `${timed.length} calls · ${highOpen} high priority`,
    });
  }

  const unassigned = open.filter((t) => !t.assigneeId).length;
  if (unassigned >= 2) {
    out.push({
      id: "ownership",
      kind: "risk",
      text: `${plural(unassigned, "open task")} have no owner, which in practice means they belong to whoever notices them last.`,
      evidence: `${unassigned} unowned`,
    });
  }

  return out.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Yesterday Recap: continuity, so the morning does not restart cold.  */
/* ------------------------------------------------------------------ */

export function deriveRecap(input: SignalInput): { summary: string; entries: RecapEntry[] } {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today.getTime() - DAY);
  const entries: RecapEntry[] = [];

  const sameDay = (iso?: string) => !!iso && startOfDay(new Date(iso)).getTime() === yesterday.getTime();

  const completed = input.tasks.filter((t) => t.status === "done" && sameDay(t.dueDate));
  completed.slice(0, 3).forEach((t) =>
    entries.push({ id: `c-${t.id}`, bucket: "completed", text: t.title }),
  );

  const slipped = input.tasks.filter(
    (t) => t.status !== "done" && t.dueDate && startOfDay(new Date(t.dueDate)).getTime() === yesterday.getTime(),
  );
  slipped.slice(0, 3).forEach((t) =>
    entries.push({ id: `s-${t.id}`, bucket: "slipped", text: `${t.title} — still open from yesterday` }),
  );

  const moved = input.tasks.filter((t) => t.status === "doing");
  moved.slice(0, 2).forEach((t) =>
    entries.push({ id: `m-${t.id}`, bucket: "moved", text: `${t.title} — in progress` }),
  );

  const decisions = input.projects
    .flatMap((p) => (p.log ?? []).map((l) => ({ ...l, project: p.title })))
    .filter((l) => l.type === "decision" && sameDay(l.ts));
  decisions.slice(0, 2).forEach((l) =>
    entries.push({ id: `d-${l.id}`, bucket: "completed", text: `${l.project}: ${l.text}` }),
  );

  deriveWaiting(input)
    .slice(0, 2)
    .forEach((w) =>
      entries.push({ id: `w-${w.id}`, bucket: "waiting", text: `${w.what} — ${w.who} (${plural(w.days, "day")})` }),
    );

  const summary = completed.length
    ? `${plural(completed.length, "item")} closed yesterday${slipped.length ? `, ${slipped.length} carried into today` : " with nothing left hanging"}.`
    : slipped.length
      ? `Nothing closed yesterday and ${plural(slipped.length, "item")} carried over — today starts with a backlog, not a blank page.`
      : "Quiet day yesterday — no completions logged and nothing carried over.";

  return { summary, entries };
}
