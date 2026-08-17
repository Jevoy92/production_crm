import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { celebrate } from "@/lib/confetti";
import { fmtDuration } from "@/lib/focusStore";
import { useStore } from "@/lib/store";
import type { Task, Stage, Subtask, TaskAttachment, ChecklistStage } from "@/lib/types";
import { CHECKLIST_STAGES } from "@/lib/types";
import {
  Plus, Trash2, FolderOpen, Calendar, CircleAlert, ChevronRight, ChevronDown, Check,
  Filter, ArrowDownWideNarrow, CircleCheck, X, Repeat, Pencil,
  FileText, FileType, FileImage, FileArchive, Upload, Sparkles, Pen, Paperclip, Timer, Play,
} from "lucide-react";

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/** Intelligently suggest sub-tasks from the task title + phase. */
function suggestSubtasks(task: Task, phase: string): Subtask[] {
  const steps = buildSteps(task.title);
  // first one done if the task is already in progress/done
  const startDone = task.status === "done" ? steps.length : task.status === "doing" ? 1 : 0;
  return steps.map((text, i) => ({ id: uid("st"), text, done: i < startDone }));
}

/**
 * Build context-aware sub-tasks from the task title itself.
 * Uses keyword buckets first, then falls back to a verb+object parse so the
 * steps always reference what the task is actually about — never generic
 * "Do the core work" boilerplate.
 */
function buildSteps(rawTitle: string): string[] {
  const title = rawTitle.trim();
  const t = title.toLowerCase();

  // Strong-signal buckets — title-aware copy.
  if (/\b(podcast|interview|guest)\b/.test(t)) {
    const who = extractProper(title) ?? "the guest";
    return [`Listen to a recent ${rawTitle.includes("podcast") ? "episode" : "interview"} to gauge fit`, `Draft pitch / response to ${who}`, "Confirm date, format & talking points", "Add to content tracker & calendar"];
  }
  if (/\b(respond|reply|answer|email|dm|message|substack|comment)\b/.test(t)) {
    const who = extractProper(title) ?? "them";
    return [`Re-read ${who}'s original message in full`, `Draft a reply addressing each question`, "Proofread tone & length", `Send to ${who} and log the thread`];
  }
  if (/\b(check\s*out|watch|review|look at|explore)\b/.test(t)) {
    const link = extractUrl(title);
    const obj = extractProper(title) ?? "the source";
    return [link ? `Open ${link}` : `Open / find ${obj}`, `Watch or skim end-to-end, take notes`, "Capture 2–3 takeaways worth stealing", "File notes + link in the swipe folder"];
  }
  if (/\b(cancel|unsubscribe|pause|downgrade)\b/.test(t)) {
    const svc = extractProper(title) ?? wordAfter(t, "cancel") ?? "the service";
    return [`Log into ${svc} account`, "Export anything worth keeping", `Cancel / downgrade ${svc}`, "Confirm cancellation email received"];
  }
  if (/\b(setup|set up|configure|install|profile|account)\b/.test(t)) {
    const what = extractProper(title) ?? wordAfter(t, "setup") ?? wordAfter(t, "set up") ?? "the tool";
    return [`Create / open ${what} account`, "Fill out profile, bio, links & avatar", "Connect required integrations", "Test it end-to-end with a dry run"];
  }
  if (/\b(script|draft|outline|write)\b/.test(t)) {
    return [`Outline the beats for "${shortTitle(title)}"`, "Write the first full pass", "Read aloud and tighten", "Send to reviewer with a deadline"];
  }
  if (/\b(shoot|film|record|location|permit|call sheet|rooftop|studio)\b/.test(t)) {
    return ["Confirm location, permits & call time", "Finalize gear pull list", "Brief crew on the shot list", "Pack and prep night-before checklist"];
  }
  if (/\b(invoice|payment|overdue|contract|sign-?off|finance)\b/.test(t)) {
    const who = extractProper(title) ?? "the client";
    return [`Pull latest statement / contract for ${who}`, `Email ${who} with amount & link`, "Log a follow-up date", "Update the finance tracker"];
  }
  if (/\b(upload|footage|drive|ingest|backup|export)\b/.test(t)) {
    return ["Verify all cards / files offloaded", "Rename & sort into folders", "Push to the shared drive", "Confirm backup integrity"];
  }
  if (/\b(schedule|sync|meeting|plan|book)\b/.test(t)) {
    const who = extractProper(title) ?? "attendees";
    return [`Draft agenda for "${shortTitle(title)}"`, `Confirm ${who} availability`, "Share prep doc 24h before", "Capture action items after"];
  }
  if (/\b(post|insta|instagram|reel|tiktok|content|buffer|repurpose|publish)\b/.test(t)) {
    return [`Draft the copy for "${shortTitle(title)}"`, "Pull / design the visual", "Schedule the post", "Add to the tracker"];
  }
  if (/\b(opportunity|pr|pitch|partnership|sponsor|deal|tv show)\b/.test(t)) {
    const who = extractProper(title) ?? "the contact";
    return [`Research ${who} — audience, fit, recent work`, "Decide yes/no/maybe with a reason", "Reply with next-step proposal", "Add to opportunities pipeline"];
  }

  // Generic but title-aware fallback — never the same for two different tasks.
  const verbObj = parseVerbObject(title);
  if (verbObj) {
    const { verb, object } = verbObj;
    return [
      `Clarify the goal: what does "${verb} ${object}" actually finish?`,
      `Gather what you need to ${verb} ${object}`,
      `${cap(verb)} ${object}`,
      `Confirm it's done and log the outcome`,
    ];
  }
  const obj = extractProper(title) ?? shortTitle(title);
  return [
    `Clarify what "done" looks like for ${obj}`,
    `Pull the info / context you need for ${obj}`,
    `Take the next concrete action on ${obj}`,
    `Wrap up ${obj} and log the outcome`,
  ];
}

function shortTitle(s: string) { return s.length > 48 ? s.slice(0, 45) + "…" : s; }
function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function extractUrl(s: string): string | null {
  const m = s.match(/https?:\/\/\S+/i);
  return m ? m[0] : null;
}
function extractProper(s: string): string | null {
  // Strip URLs, then look for a Capitalized Word that isn't the first word.
  const cleaned = s.replace(/https?:\/\/\S+/gi, "").replace(/[.,:;!?"']/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const props = tokens.filter((w, i) => i > 0 && /^[A-Z][a-zA-Z]{1,}$/.test(w) && !STOP.has(w));
  return props.length ? props.slice(0, 2).join(" ") : null;
}
function wordAfter(lower: string, kw: string): string | null {
  const idx = lower.indexOf(kw);
  if (idx < 0) return null;
  const rest = lower.slice(idx + kw.length).trim().split(/\s+/)[0];
  return rest && rest.length > 1 ? rest : null;
}
function parseVerbObject(title: string): { verb: string; object: string } | null {
  const tokens = title.replace(/[.,:;!?"']/g, " ").split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  const verb = tokens[0].toLowerCase();
  const object = tokens.slice(1, 6).join(" ").trim();
  if (!object) return null;
  return { verb, object };
}
const STOP = new Set(["The", "A", "An", "And", "Or", "For", "To", "Of", "In", "On", "With", "From"]);

function suggestNote(task: Task, projectTitle?: string): string {
  const where = projectTitle ? ` for ${projectTitle}` : "";
  return `Context${where}: ${task.title}. ${
    task.priority === "High" ? "Flagged high priority — handle before lower-priority items today." : "Keep moving; loop in the assignee if blocked."
  }`;
}

const ATT_ICON: Record<TaskAttachment["kind"], React.ComponentType<{ size?: number; className?: string }>> = {
  doc: FileText, pdf: FileType, image: FileImage, zip: FileArchive, other: FileText,
};
function kindFromName(name: string): TaskAttachment["kind"] {
  const e = name.toLowerCase().split(".").pop() ?? "";
  if (["doc", "docx", "txt", "md", "rtf"].includes(e)) return "doc";
  if (e === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(e)) return "image";
  if (["zip", "rar", "7z"].includes(e)) return "zip";
  return "other";
}

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks · Production OS" }] }),
});

// Tasks group by their own stage (ChecklistStage), falling back to the linked
// project's stage, then "General". Set a task's stage in the New/Edit modal.
type Phase = ChecklistStage | "General";
const PHASE_ORDER: Phase[] = ["Pre-Production", "Shoot Day", "Post-Production", "Delivery", "General"];
const PHASE_META: Record<Phase, { label: string; dot: string; text: string; soft: string; border: string; short: string }> = {
  "Pre-Production": { label: "Pre-Production", dot: "bg-amber", text: "text-amber", soft: "bg-amber/10", border: "border-amber/20", short: "Pre-Pro" },
  "Shoot Day": { label: "Shooting", dot: "bg-emerald", text: "text-emerald", soft: "bg-emerald/10", border: "border-emerald/20", short: "Shoot" },
  "Post-Production": { label: "Post-Production", dot: "bg-violet", text: "text-violet", soft: "bg-violet/10", border: "border-violet/20", short: "Post" },
  Delivery: { label: "Client Review", dot: "bg-brand-400", text: "text-brand-400", soft: "bg-brand-600/10", border: "border-brand-500/20", short: "Review" },
  General: { label: "General", dot: "bg-surface-500", text: "text-mid", soft: "bg-sunken", border: "border-line", short: "General" },
};

function phaseOf(task: Task, stageById: Map<string, Stage>): Phase {
  if (task.stage) return task.stage; // explicit task stage wins
  const stage = task.projectId ? stageById.get(task.projectId) : undefined;
  if (stage) {
    if (["Lead", "Strategy Call", "Proposal Sent", "Booked", "Pre-Production"].includes(stage)) return "Pre-Production";
    if (stage === "Shoot Day") return "Shoot Day";
    if (stage === "In Post") return "Post-Production";
    if (stage === "Delivered") return "Delivery";
  }
  return "General";
}

const PRIORITY: Record<Task["priority"], { label: string; cls: string; icon: React.ReactNode }> = {
  High: { label: "High Priority", cls: "text-rose", icon: <CircleAlert size={11} /> },
  Med: { label: "Medium Priority", cls: "text-amber", icon: <CircleAlert size={11} /> },
  Low: { label: "Low Priority", cls: "text-lo", icon: <CircleAlert size={11} /> },
};

function fmtDue(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type TabKey = "my" | "team" | "deadlines" | "completed";
type SortKey = "phase" | "due" | "priority" | "title";
type FilterPriority = "all" | "High" | "Med" | "Low";

function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const add = useStore((s) => s.addTask);
  const update = useStore((s) => s.updateTask);
  const remove = useStore((s) => s.removeTask);
  const activeRole = useStore((s) => s.activeRole);
  const me = team.find((m) => m.role === activeRole);

  const [tab, setTab] = useState<TabKey>("my");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<Phase>>(new Set());
  const [presetStage, setPresetStage] = useState<ChecklistStage | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("phase");
  const toggleCollapse = (p: Phase) => setCollapsed((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const openNew = (stage?: ChecklistStage) => { setPresetStage(stage); setOpen(true); };

  const stageById = useMemo(() => new Map(projects.map((p) => [p.id, p.stage])), [projects]);

  const visible = useMemo(() => {
    let list = tasks;
    if (tab === "completed") {
      list = tasks.filter((t) => t.status === "done");
    } else {
      list = tasks.filter((t) => t.status !== "done");
      if (tab === "my" && me) list = list.filter((t) => t.assigneeId === me.id);
      if (tab === "deadlines") list = list.filter((t) => t.dueDate);
    }
    if (filterPriority !== "all") list = list.filter((t) => t.priority === filterPriority);
    if (filterProject !== "all") list = list.filter((t) => (t.projectId ?? "none") === filterProject);
    const prioRank: Record<Task["priority"], number> = { High: 0, Med: 1, Low: 2 };
    if (sortBy === "due" || tab === "deadlines") {
      list = [...list].sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
    } else if (sortBy === "priority") {
      list = [...list].sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
    } else if (sortBy === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [tasks, tab, me, filterPriority, filterProject, sortBy]);

  const groups = useMemo(() => {
    const map = new Map<Phase, Task[]>();
    PHASE_ORDER.forEach((p) => map.set(p, []));
    visible.forEach((t) => map.get(phaseOf(t, stageById))!.push(t));
    return PHASE_ORDER.map((p) => ({ phase: p, items: map.get(p)! })).filter((g) => g.items.length > 0);
  }, [visible, stageById]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const openCount = tasks.filter((t) => t.status !== "done").length;
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const dueToday = tasks.filter((t) => fmtDue(t.dueDate) === "Today").length;

  const toggleDone = (t: Task, e?: React.MouseEvent) => {
    const completing = t.status !== "done";
    update(t.id, { status: completing ? "done" : "todo" });
    if (completing) celebrate(e ?? null);
  };

  return (
    <Shell
      title="Tasks"
      subtitle={`${openCount} open · ${dueToday} due today`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/focus"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500/30 bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 hover:border-brand-500/50 transition-colors text-xs font-semibold"
            title="Open focus mode"
          >
            <Play className="size-3.5" /> Focus Mode
          </Link>
          <Btn variant="primary" onClick={() => openNew()} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> New Task
          </Btn>
        </div>
      }
    >
      <div className="flex gap-6 min-h-0">
        {/* List pane */}
        <div className="flex-1 min-w-0">
          {/* Filter bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div className="inline-flex items-center gap-1 p-1 bg-sunken border border-line rounded-xl">
              {([["my", "My Tasks"], ["team", "Team Overview"], ["deadlines", "Upcoming Deadlines"], ["completed", `Completed${completedCount ? ` (${completedCount})` : ""}`]] as [TabKey, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === k ? "bg-brand-600 text-white" : "text-mid hover:text-hi"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
                  className={`ph-btn ph-btn-soft ph-btn-sm ${filterPriority !== "all" || filterProject !== "all" ? "ring-1 ring-brand-500/40 text-brand-300" : ""}`}
                >
                  <Filter size={12} /> Filter
                  {(filterPriority !== "all" || filterProject !== "all") && (
                    <span className="ml-1 text-[10px] bg-brand-600 text-white rounded-full px-1.5">
                      {(filterPriority !== "all" ? 1 : 0) + (filterProject !== "all" ? 1 : 0)}
                    </span>
                  )}
                </button>
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-panel border border-line rounded-xl shadow-lg p-3 z-20" onMouseLeave={() => setFilterOpen(false)}>
                    <div className="text-[10px] uppercase tracking-wider text-lo font-bold mb-1.5">Priority</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(["all", "High", "Med", "Low"] as FilterPriority[]).map((p) => (
                        <button key={p} onClick={() => setFilterPriority(p)} className={`text-xs px-2 py-1 rounded-md border ${filterPriority === p ? "bg-brand-600 text-white border-brand-500" : "bg-sunken text-mid border-line hover:text-hi"}`}>
                          {p === "all" ? "All" : p}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-lo font-bold mb-1.5">Project</div>
                    <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={inputCls}>
                      <option value="all">All projects</option>
                      <option value="none">No project</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    {(filterPriority !== "all" || filterProject !== "all") && (
                      <button onClick={() => { setFilterPriority("all"); setFilterProject("all"); }} className="mt-3 text-xs text-brand-400 hover:text-brand-300 font-semibold">Clear filters</button>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
                  className={`ph-btn ph-btn-soft ph-btn-sm ${sortBy !== "phase" ? "ring-1 ring-brand-500/40 text-brand-300" : ""}`}
                >
                  <ArrowDownWideNarrow size={12} /> Sort
                </button>
                {sortOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-panel border border-line rounded-xl shadow-lg p-1.5 z-20" onMouseLeave={() => setSortOpen(false)}>
                    {([["phase", "By phase"], ["due", "Due date"], ["priority", "Priority"], ["title", "Title (A–Z)"]] as [SortKey, string][]).map(([k, l]) => (
                      <button key={k} onClick={() => { setSortBy(k); setSortOpen(false); }} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md ${sortBy === k ? "bg-brand-600/15 text-brand-300" : "text-mid hover:bg-hover hover:text-hi"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-16 text-mid text-sm">No tasks here. Create one to get going.</div>
          ) : (
            <div className="space-y-6">
              {groups.map(({ phase, items }) => {
                const m = PHASE_META[phase];
                const isCollapsed = collapsed.has(phase);
                const doneInGroup = items.filter((t) => t.status === "done").length;
                const stageForAdd = phase === "General" ? undefined : (phase as ChecklistStage);
                return (
                  <div key={phase}>
                    <div className="flex items-center gap-3 mb-3">
                      <button onClick={() => toggleCollapse(phase)} className="flex items-center gap-2 group/h" aria-label={isCollapsed ? "Expand" : "Collapse"}>
                        <ChevronDown size={14} className={`text-lo transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                        <span className={`w-2.5 h-2.5 rounded-full ${m.dot}`} />
                        <span className="font-display font-bold text-xs text-mid uppercase tracking-[0.14em] group-hover/h:text-hi transition-colors">{m.label}</span>
                      </button>
                      <div className="flex-1 h-px bg-line" />
                      <span className="text-xs text-lo font-medium">{doneInGroup}/{items.length} done</span>
                      <button onClick={() => openNew(stageForAdd)} className="w-6 h-6 rounded-md bg-sunken border border-line hover:border-brand-500/40 hover:text-brand-400 text-lo flex items-center justify-center transition-colors" aria-label={`Add task to ${m.label}`} title={`Add to ${m.label}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                    {!isCollapsed && (
                    <div className="rounded-xl border border-line bg-panel overflow-hidden divide-y divide-line">
                      {items.map((t) => {
                        const assignee = team.find((x) => x.id === t.assigneeId);
                        const project = projects.find((p) => p.id === t.projectId);
                        const done = t.status === "done";
                        const doing = t.status === "doing";
                        const active = selectedId === t.id;
                        const due = fmtDue(t.dueDate);
                        const overdue = due?.includes("overdue");
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedId(t.id)}
                            className={`group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 cursor-pointer transition-colors ${active ? "bg-brand-600/10" : "hover:bg-sunken/60"}`}
                          >
                            <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${active ? "bg-brand-500" : "bg-transparent"}`} />
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleDone(t, e); }}
                              className="flex-shrink-0"
                              aria-label={done ? "Mark not done" : "Mark done"}
                            >
                              {done ? (
                                <span className="check-pop w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-emerald flex items-center justify-center"><Check size={11} className="text-white" /></span>
                              ) : doing ? (
                                <span className="w-5 h-5 rounded-full border-2 border-brand-500 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-brand-500" /></span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border-2 border-line-strong group-hover:border-brand-400 transition-colors block" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium truncate ${done ? "text-lo line-through" : "text-hi"}`}>{t.title}</span>
                                {t.recurring && <Repeat size={11} className="text-lo flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-lo mt-0.5 empty:mt-0 flex-wrap">
                                {project && <span className="flex items-center gap-1 truncate"><FolderOpen size={11} /> {project.title}</span>}
                                {due && <span className={`flex items-center gap-1 ${overdue ? "text-rose font-semibold" : ""}`}><Calendar size={11} /> {due}</span>}
                                {t.priority === "High" && <span className={`flex items-center gap-1 font-semibold ${PRIORITY.High.cls}`}>{PRIORITY.High.icon} High</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(t.focusedSec ?? 0) > 0 && (
                                <span className="text-[10px] font-semibold text-brand-400 bg-brand-600/10 border border-brand-500/25 px-2 py-0.5 rounded-full num flex items-center gap-1">
                                  <Timer size={9} /> {fmtDuration(t.focusedSec!)}
                                </span>
                              )}
                              {!done && (
                                <Link
                                  to="/focus"
                                  search={{ task: t.id }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-sunken border border-line flex items-center justify-center text-mid hover:text-brand-400 hover:border-brand-500/40 transition-all"
                                  title="Start focus session"
                                  aria-label="Start focus session"
                                >
                                  <Play size={11} />
                                </Link>
                              )}
                              {t.subtasks && t.subtasks.length > 0 && (
                                <span className="text-[10px] font-semibold text-mid bg-sunken border border-line px-2 py-0.5 rounded-full">
                                  {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length} sub
                                </span>
                              )}
                              {t.attachments && t.attachments.length > 0 && (
                                <span className="text-lo flex items-center gap-0.5 text-[10px]"><Paperclip size={10} /> {t.attachments.length}</span>
                              )}
                              {assignee && (
                                <div className="w-6 h-6 rounded-full grid place-items-center text-[9.5px] font-semibold text-white" style={{ background: assignee.color }}>{assignee.initials}</div>
                              )}
                              <ChevronRight size={13} className={`transition-colors ${active ? "text-brand-400" : "text-lo group-hover:text-brand-400"}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspector */}
        <aside className="w-[360px] flex-shrink-0 hidden xl:block">
          <div className="sticky top-0">
            {selected ? (
              <Inspector
                key={selected.id}
                task={selected}
                team={team}
                projects={projects}
                stageById={stageById}
                onUpdate={(patch) => update(selected.id, patch)}
                onDelete={() => { if (confirm(`Delete "${selected.title}"?`)) { remove(selected.id); setSelectedId(null); } }}
                onEdit={() => setEditing(selected)}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="bg-panel border border-line rounded-2xl p-8 text-center text-mid">
                <div className="w-12 h-12 rounded-2xl bg-sunken mx-auto mb-3 flex items-center justify-center"><CircleCheck size={20} className="text-lo" /></div>
                <div className="text-hi font-semibold text-sm mb-1">No task selected</div>
                <div className="text-xs">Click any task to see its details, assignees, and actions.</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <TaskModal open={open} onClose={() => setOpen(false)} onCreate={add} initialStage={presetStage} />
      <TaskModal open={!!editing} onClose={() => setEditing(null)} editing={editing ?? undefined} onUpdate={(patch) => editing && update(editing.id, patch)} />
    </Shell>
  );
}

function Inspector({
  task, team, projects, stageById, onUpdate, onDelete, onEdit, onClose,
}: {
  task: Task;
  team: any[];
  projects: any[];
  stageById: Map<string, Stage>;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const assignee = team.find((m) => m.id === task.assigneeId);
  const project = projects.find((p) => p.id === task.projectId);
  const phase = phaseOf(task, stageById);
  const m = PHASE_META[phase];
  const due = fmtDue(task.dueDate);

  // Sub-tasks: use real ones, else intelligently-suggested (persist on first edit).
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => task.subtasks ?? suggestSubtasks(task, phase));
  const [newSub, setNewSub] = useState("");
  const [notes, setNotes] = useState(task.notes ?? "");
  const attachments = task.attachments ?? [];

  const commitSubtasks = (next: Subtask[]) => { setSubtasks(next); onUpdate({ subtasks: next }); };
  const doneCount = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : task.status === "done" ? 100 : task.status === "doing" ? 50 : 0;

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: TaskAttachment[] = [...attachments];
    for (const f of Array.from(files)) {
      next.push({ id: uid("at"), name: f.name, kind: kindFromName(f.name), meta: `${(f.size / 1024).toFixed(0)} KB` });
    }
    onUpdate({ attachments: next });
  };

  return (
    <div className="bg-panel border border-line rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
      <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.soft} ${m.text} border ${m.border}`}>{phase}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${PRIORITY[task.priority].cls} bg-sunken border border-line`}>{PRIORITY[task.priority].label}</span>
          </div>
          <h2 className="font-display font-bold text-hi text-base leading-snug">{task.title}</h2>
          {project && <p className="text-lo text-xs mt-1.5 flex items-center gap-1.5"><FolderOpen size={11} /> {project.title}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            to="/focus"
            search={{ task: task.id }}
            className="h-8 px-2.5 rounded-lg border border-brand-500/30 bg-brand-600/10 text-brand-400 hover:bg-brand-600/20 hover:border-brand-500/50 transition-colors text-[11px] font-semibold inline-flex items-center gap-1.5"
            title="Start focus session on this task"
            aria-label="Start focus session on this task"
          >
            <Play size={11} /> Focus
          </Link>
          <button onClick={onEdit} className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-lo hover:text-hi hover:bg-hover transition-colors" aria-label="Edit"><Pencil size={13} /></button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-lo hover:text-hi hover:bg-hover transition-colors" aria-label="Close"><X size={14} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Meta */}
        <div className="px-5 py-4 border-b border-line grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-lo uppercase tracking-wide mb-1.5">Assignee</div>
            {assignee ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full grid place-items-center text-[9.5px] font-semibold text-white" style={{ background: assignee.color }}>{assignee.initials}</div>
                <span className="text-hi text-xs font-medium truncate">{assignee.name}</span>
              </div>
            ) : <span className="text-lo text-xs">Unassigned</span>}
          </div>
          <div>
            <div className="text-[10px] font-bold text-lo uppercase tracking-wide mb-1.5">Due date</div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${due?.includes("overdue") || due === "Today" ? "bg-rose/10 text-rose border border-rose/20" : "bg-sunken text-hi border border-line"}`}>
              <Calendar size={11} /> {due ?? "No date"}
            </span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-lo uppercase tracking-wide mb-1.5">Status</div>
            <select value={task.status} onChange={(e) => onUpdate({ status: e.target.value as Task["status"] })} className="w-full text-xs font-semibold text-hi bg-sunken border border-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500">
              <option value="todo">To do</option><option value="doing">In Progress</option><option value="done">Done</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold text-lo uppercase tracking-wide mb-1.5">Stage</div>
            <select value={task.stage ?? ""} onChange={(e) => onUpdate({ stage: (e.target.value || undefined) as ChecklistStage | undefined })} className="w-full text-xs font-semibold text-hi bg-sunken border border-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500">
              <option value="">General</option>
              {CHECKLIST_STAGES.map((s) => <option key={s} value={s}>{s === "Shoot Day" ? "Shooting" : s === "Delivery" ? "Client Review" : s}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold text-lo uppercase tracking-wide mb-1.5">Project</div>
            <select value={task.projectId ?? ""} onChange={(e) => onUpdate({ projectId: e.target.value || undefined })} className="w-full text-xs font-semibold text-hi bg-sunken border border-line rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500">
              <option value="">— None —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-lo uppercase tracking-wide">Progress</span>
              <span className="text-xs font-bold text-brand-400">{pct}%</span>
            </div>
            <div className="h-1.5 bg-sunken rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Sub-tasks */}
        <div className="px-5 py-4 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-bold text-hi flex items-center gap-2">Sub-Tasks <span className="text-lo font-normal text-xs">{doneCount} of {subtasks.length} done</span></h3>
            {!task.subtasks && <span className="text-[10px] text-violet bg-violet/10 border border-violet/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={9} /> Suggested</span>}
          </div>
          <div className="space-y-1.5">
            {subtasks.map((st) => (
              <div key={st.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-hover transition-colors">
                <button onClick={() => commitSubtasks(subtasks.map((x) => x.id === st.id ? { ...x, done: !x.done } : x))} className="flex-shrink-0" aria-label="Toggle subtask">
                  {st.done
                    ? <span className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-emerald flex items-center justify-center"><Check size={10} className="text-white" /></span>
                    : <span className="w-5 h-5 rounded-full border-2 border-line-strong hover:border-brand-400 transition-colors block" />}
                </button>
                <span className={`flex-1 text-xs ${st.done ? "text-lo line-through" : "text-hi"}`}>{st.text}</span>
                <button onClick={() => commitSubtasks(subtasks.filter((x) => x.id !== st.id))} className="opacity-0 group-hover:opacity-100 text-lo hover:text-rose transition-all" aria-label="Remove"><X size={12} /></button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newSub.trim()) { commitSubtasks([...subtasks, { id: uid("st"), text: newSub.trim(), done: false }]); setNewSub(""); } }}
              placeholder="Add a sub-task…"
              className="flex-1 bg-sunken border border-line rounded-lg px-2.5 py-1.5 text-xs text-hi placeholder-lo outline-none focus:border-brand-500"
            />
            <button onClick={() => { if (newSub.trim()) { commitSubtasks([...subtasks, { id: uid("st"), text: newSub.trim(), done: false }]); setNewSub(""); } }} className="ph-btn ph-btn-soft ph-btn-icon ph-btn-sm" aria-label="Add subtask"><Plus size={13} /></button>
          </div>
        </div>

        {/* Production notes */}
        <div className="px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2 mb-3"><Pen size={12} className="text-lo" /><h3 className="text-sm font-display font-bold text-hi">Production Notes</h3></div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { if (notes !== (task.notes ?? "")) onUpdate({ notes }); }}
            placeholder={suggestNote(task, project?.title)}
            rows={4}
            className="w-full bg-sunken border border-line rounded-xl p-3 text-xs text-hi leading-relaxed placeholder-lo outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {/* Attachments */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-bold text-hi flex items-center gap-2">Attachments <span className="text-lo font-normal text-xs">{attachments.length} file{attachments.length === 1 ? "" : "s"}</span></h3>
            <label className="flex items-center gap-1 text-xs text-brand-400 font-semibold hover:text-brand-300 cursor-pointer transition-colors">
              <Upload size={12} /> Upload
              <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
          </div>
          {attachments.length === 0 ? (
            <div className="text-lo text-xs text-center py-4 border border-dashed border-line rounded-xl">Drop files or click Upload to attach references.</div>
          ) : (
            <div className="space-y-2">
              {attachments.map((a) => {
                const Icon = ATT_ICON[a.kind];
                return (
                  <div key={a.id} className="group flex items-center gap-3 px-3 py-2.5 bg-sunken border border-line rounded-xl hover:border-brand-500/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-panel border border-line flex items-center justify-center flex-shrink-0"><Icon size={14} className="text-brand-400" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-hi text-xs font-semibold truncate">{a.name}</div>
                      {a.meta && <div className="text-lo text-[11px]">{a.meta}</div>}
                    </div>
                    <button onClick={() => onUpdate({ attachments: attachments.filter((x) => x.id !== a.id) })} className="opacity-0 group-hover:opacity-100 text-lo hover:text-rose transition-all" aria-label="Remove"><X size={12} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-line flex items-center gap-2">
        <button onClick={() => onUpdate({ status: task.status === "done" ? "todo" : "done" })} className="flex-1 ph-btn ph-btn-primary justify-center">
          <CircleCheck size={14} /> {task.status === "done" ? "Reopen" : "Mark Complete"}
        </button>
        {project && (
          <Link to="/projects/$id" params={{ id: project.id }} className="ph-btn ph-btn-soft ph-btn-icon" aria-label="Open project"><FolderOpen size={14} /></Link>
        )}
        <button onClick={onDelete} className="ph-btn ph-btn-soft ph-btn-icon hover:text-rose" aria-label="Delete"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function TaskModal({
  open, onClose, onCreate, onUpdate, editing, initialStage,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (t: Omit<Task, "id" | "createdAt">) => string;
  onUpdate?: (patch: Partial<Task>) => void;
  editing?: Task;
  initialStage?: ChecklistStage;
}) {
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const activeRole = useStore((s) => s.activeRole);
  const meId = team.find((m) => m.role === activeRole)?.id ?? team[0]?.id ?? "";
  const isEdit = !!editing;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [assigneeId, setA] = useState(editing?.assigneeId ?? meId);
  const [projectId, setP] = useState(editing?.projectId ?? "");
  const [dueDate, setD] = useState(editing?.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "");
  const [priority, setPrio] = useState<Task["priority"]>(editing?.priority ?? "Med");
  const [status, setStatus] = useState<Task["status"]>(editing?.status ?? "todo");
  const [recurring, setRecurring] = useState<boolean>(editing?.recurring ?? false);
  const [stage, setStage] = useState<ChecklistStage | "">(editing?.stage ?? initialStage ?? "");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title); setA(editing.assigneeId); setP(editing.projectId ?? "");
      setD(editing.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "");
      setPrio(editing.priority); setStatus(editing.status); setRecurring(editing.recurring ?? false);
      setStage(editing.stage ?? "");
    } else if (open && !isEdit) {
      setTitle(""); setA(meId); setP(""); setD(""); setPrio("Med"); setStatus("todo"); setRecurring(false);
      setStage(initialStage ?? "");
    }
  }, [editing, open, isEdit, team, initialStage, meId]);

  const submit = () => {
    if (!title.trim() || !assigneeId) return;
    const payload = {
      title: title.trim(), assigneeId, projectId: projectId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, status, priority, recurring,
      stage: stage || undefined,
    };
    if (isEdit && onUpdate) onUpdate(payload);
    else if (onCreate) onCreate(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "New task"}
      footer={<><Btn variant="subtle" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit}>{isEdit ? "Save changes" : "Create"}</Btn></>}
    >
      <Field label="Title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assignee">
          <select className={inputCls} value={assigneeId} onChange={(e) => setA(e.target.value)}>
            {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Project (optional)">
          <select className={inputCls} value={projectId} onChange={(e) => setP(e.target.value)}>
            <option value="">—</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="Due date"><input type="date" className={inputCls} value={dueDate} onChange={(e) => setD(e.target.value)} /></Field>
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPrio(e.target.value as Task["priority"])}>
            <option>Low</option><option>Med</option><option>High</option>
          </select>
        </Field>
        <Field label="Stage / Phase">
          <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value as ChecklistStage | "")}>
            <option value="">General</option>
            {CHECKLIST_STAGES.map((s) => <option key={s} value={s}>{s === "Shoot Day" ? "Shooting" : s === "Delivery" ? "Client Review" : s}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputCls} value={recurring ? "recurring" : "oneoff"} onChange={(e) => setRecurring(e.target.value === "recurring")}>
            <option value="oneoff">One-off</option><option value="recurring">Recurring / everyday</option>
          </select>
        </Field>
        {isEdit && (
          <Field label="Status">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
              <option value="todo">To do</option><option value="doing">In Progress</option><option value="done">Done</option>
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
