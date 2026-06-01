import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Plus, Trash2, Pencil, Repeat, Zap } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks · Palmer House" }] }),
});

const COLS: Task["status"][] = ["todo", "doing", "done"];
const LABEL: Record<Task["status"], string> = { todo: "To do", doing: "Doing", done: "Done" };
const PRIORITY_RANK: Record<Task["priority"], number> = { High: 0, Med: 1, Low: 2 };
type SortMode = "priority" | "due" | "created";
type KindFilter = "all" | "recurring" | "oneoff";

function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const add = useStore((s) => s.addTask);
  const update = useStore((s) => s.updateTask);
  const remove = useStore((s) => s.removeTask);
  const activeRole = useStore((s) => s.activeRole);
  const [mineOnly, setMine] = useState(activeRole === "pa");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Task["status"] | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("priority");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const me = team.find((m) => m.role === activeRole);
  const base = mineOnly && me ? tasks.filter((t) => t.assigneeId === me.id) : tasks;
  const filtered =
    kindFilter === "all"
      ? base
      : kindFilter === "recurring"
        ? base.filter((t) => t.recurring)
        : base.filter((t) => !t.recurring);

  const sortTasks = (list: Task[]) => {
    const arr = [...list];
    if (sortBy === "priority") {
      arr.sort((a, b) => {
        const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (p !== 0) return p;
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return ad - bd;
      });
    } else if (sortBy === "due") {
      arr.sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (ad !== bd) return ad - bd;
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      });
    } else {
      arr.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return arr;
  };

  return (
    <Shell
      title="Tasks"
      subtitle={`${tasks.length} total · ${tasks.filter((t) => t.status !== "done").length} open`}
      actions={
        <>
          <div className="flex items-center rounded-lg bg-surface-2 ring-inset-soft p-0.5 text-[11.5px]">
            {([
              { id: "all", label: "All" },
              { id: "recurring", label: "Recurring" },
              { id: "oneoff", label: "One-off" },
            ] as { id: KindFilter; label: string }[]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setKindFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  kindFilter === opt.id
                    ? "bg-surface-3 text-foreground ring-inset-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className="rounded-md bg-surface-2 ring-inset-soft px-2 py-1 text-[12px] text-foreground"
            >
              <option value="priority">Priority</option>
              <option value="due">Due date</option>
              <option value="created">Newest</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMine(e.target.checked)} />{" "}
            My tasks only
          </label>
          <Btn
            variant="primary"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> New task
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {COLS.map((col) => {
          const colItems = filtered.filter((t) => t.status === col);
          const recurring = sortTasks(colItems.filter((t) => t.recurring));
          const oneoff = sortTasks(colItems.filter((t) => !t.recurring));
          const isOver = dragOverCol === col;
          return (
            <div
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== col) setDragOverCol(col);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverCol((c) => (c === col ? null : c));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || draggingId;
                if (id) {
                  const task = tasks.find((t) => t.id === id);
                  if (task && task.status !== col) update(id, { status: col });
                }
                setDraggingId(null);
                setDragOverCol(null);
              }}
              className={`card-elevated rounded-2xl p-3 transition-all ${
                isOver ? "ring-2 ring-primary/60 bg-primary/[0.04]" : ""
              }`}
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {LABEL[col]}
                </div>
                <span className="num text-[10.5px] rounded-md bg-surface-3 px-1.5 py-0.5 text-muted-foreground">
                  {colItems.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[60px]">
                {recurring.length > 0 && kindFilter !== "oneoff" && (
                  <TaskGroup
                    icon={<Repeat className="size-3" />}
                    label="Recurring"
                    tone="recurring"
                  />
                )}
                {kindFilter !== "oneoff" &&
                  recurring.map((t) => renderCard(t))}
                {recurring.length > 0 &&
                  oneoff.length > 0 &&
                  kindFilter === "all" && (
                    <TaskGroup
                      icon={<Zap className="size-3" />}
                      label="One-off"
                      tone="oneoff"
                    />
                  )}
                {kindFilter !== "recurring" &&
                  oneoff.map((t) => renderCard(t))}
                {colItems.length === 0 && (
                  <div className="text-[11px] text-muted-foreground/70 px-1 py-3 text-center">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );

          function renderCard(t: Task) {
                  const assignee = team.find((m) => m.id === t.assigneeId);
                  const project = projects.find((p) => p.id === t.projectId);
                  const isDragging = draggingId === t.id;
                  const isHigh = t.priority === "High";
                  const isMed = t.priority === "Med";
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", t.id);
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverCol(null);
                      }}
                      className={`relative overflow-hidden rounded-xl ring-inset-soft p-3 pl-4 group cursor-grab active:cursor-grabbing transition-opacity ${
                        isHigh
                          ? "bg-destructive/10 ring-1 ring-destructive/40"
                          : isMed
                            ? "bg-surface-2"
                            : "bg-surface-2"
                      } ${isDragging ? "opacity-40" : ""}`}
                    >
                      <span
                        aria-hidden
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isHigh
                            ? "bg-destructive"
                            : isMed
                              ? "bg-primary/60"
                              : "bg-muted-foreground/30"
                        }`}
                      />
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {isHigh && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                                ● High priority
                              </span>
                            )}
                            {t.recurring ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary/90">
                                <Repeat className="size-2.5" /> Recurring
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                <Zap className="size-2.5" /> One-off
                              </span>
                            )}
                          </div>
                          {project ? (
                            <Link
                              to="/projects/$id"
                              params={{ id: project.id }}
                              className="block hover:text-primary"
                            >
                              <div className="text-[13px] font-medium leading-snug">{t.title}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {project.title}
                              </div>
                            </Link>
                          ) : (
                            <div className="text-[13px] font-medium leading-snug">{t.title}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditing(t)}
                            className="size-7 grid place-items-center rounded-md hover:bg-surface-3"
                            aria-label="Edit task"
                            title="Edit task"
                          >
                            <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${t.title}"?`)) remove(t.id);
                            }}
                            className="size-7 grid place-items-center rounded-md hover:bg-surface-3"
                            aria-label="Delete task"
                            title="Delete task"
                          >
                            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {assignee && (
                          <span
                            className="size-5 rounded-full grid place-items-center text-[9px] font-semibold text-primary-foreground"
                            style={{ background: assignee.color }}
                          >
                            {assignee.initials}
                          </span>
                        )}
                        {t.dueDate && (
                          <span className="num">
                            Due{" "}
                            {new Date(t.dueDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {isMed && <span className="text-primary/80">● Med</span>}
                        {t.priority === "Low" && (
                          <span className="text-muted-foreground/70">● Low</span>
                        )}
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => update(t.id, { status: e.target.value as Task["status"] })}
                        className="mt-2 w-full text-[11px] rounded-md bg-surface-3 px-2 py-1 ring-inset-soft"
                      >
                        {COLS.map((c) => (
                          <option key={c} value={c}>
                            {LABEL[c]}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
          }
        })}
      </div>

      <TaskModal open={open} onClose={() => setOpen(false)} onCreate={add} />
      <TaskModal
        open={!!editing}
        onClose={() => setEditing(null)}
        editing={editing ?? undefined}
        onUpdate={(patch) => editing && update(editing.id, patch)}
      />
    </Shell>
  );
}

function TaskModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (t: Omit<Task, "id" | "createdAt">) => string;
  onUpdate?: (patch: Partial<Task>) => void;
  editing?: Task;
}) {
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const isEdit = !!editing;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [assigneeId, setA] = useState(editing?.assigneeId ?? team[0]?.id ?? "");
  const [projectId, setP] = useState(editing?.projectId ?? "");
  const [dueDate, setD] = useState(
    editing?.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "",
  );
  const [priority, setPrio] = useState<Task["priority"]>(editing?.priority ?? "Med");
  const [status, setStatus] = useState<Task["status"]>(editing?.status ?? "todo");

  // Re-sync when editing target changes
  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setA(editing.assigneeId);
      setP(editing.projectId ?? "");
      setD(editing.dueDate ? new Date(editing.dueDate).toISOString().slice(0, 10) : "");
      setPrio(editing.priority);
      setStatus(editing.status);
    } else if (open && !isEdit) {
      setTitle("");
      setA(team[0]?.id ?? "");
      setP("");
      setD("");
      setPrio("Med");
      setStatus("todo");
    }
  }, [editing, open, isEdit, team]);

  const submit = () => {
    if (!title.trim() || !assigneeId) return;
    const payload = {
      title: title.trim(),
      assigneeId,
      projectId: projectId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
      priority,
    };
    if (isEdit && onUpdate) {
      onUpdate(payload);
    } else if (onCreate) {
      onCreate(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "New task"}
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit}>
            {isEdit ? "Save changes" : "Create"}
          </Btn>
        </>
      }
    >
      <Field label="Title">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assignee">
          <select className={inputCls} value={assigneeId} onChange={(e) => setA(e.target.value)}>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project (optional)">
          <select className={inputCls} value={projectId} onChange={(e) => setP(e.target.value)}>
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            className={inputCls}
            value={dueDate}
            onChange={(e) => setD(e.target.value)}
          />
        </Field>
        <Field label="Priority">
          <select
            className={inputCls}
            value={priority}
            onChange={(e) => setPrio(e.target.value as Task["priority"])}
          >
            <option>Low</option>
            <option>Med</option>
            <option>High</option>
          </select>
        </Field>
        {isEdit && (
          <Field label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as Task["status"])}
            >
              <option value="todo">To do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
