import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks · Palmer House" }] }),
});

const COLS: Task["status"][] = ["todo", "doing", "done"];
const LABEL: Record<Task["status"], string> = { todo: "To do", doing: "Doing", done: "Done" };

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

  const me = team.find((m) => m.role === activeRole);
  const filtered = mineOnly && me ? tasks.filter((t) => t.assigneeId === me.id) : tasks;

  return (
    <Shell
      title="Tasks"
      subtitle={`${tasks.length} total · ${tasks.filter((t) => t.status !== "done").length} open`}
      actions={
        <>
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
          const items = filtered.filter((t) => t.status === col);
          return (
            <div key={col} className="card-elevated rounded-2xl p-3">
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {LABEL[col]}
                </div>
                <span className="num text-[10.5px] rounded-md bg-surface-3 px-1.5 py-0.5 text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((t) => {
                  const assignee = team.find((m) => m.id === t.assigneeId);
                  const project = projects.find((p) => p.id === t.projectId);
                  return (
                    <div key={t.id} className="rounded-xl bg-surface-2 ring-inset-soft p-3 group">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
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
                        <button
                          onClick={() => remove(t.id)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
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
                        {t.priority === "High" && <span className="text-destructive">● High</span>}
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
                })}
                {items.length === 0 && (
                  <div className="text-[11px] text-muted-foreground/70 px-1 py-3 text-center">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NewTaskModal open={open} onClose={() => setOpen(false)} onCreate={add} />
    </Shell>
  );
}

function NewTaskModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (t: Omit<Task, "id" | "createdAt">) => string;
}) {
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const [title, setTitle] = useState("");
  const [assigneeId, setA] = useState(team[0]?.id ?? "");
  const [projectId, setP] = useState("");
  const [dueDate, setD] = useState("");
  const [priority, setPrio] = useState<Task["priority"]>("Med");

  const submit = () => {
    if (!title.trim() || !assigneeId) return;
    onCreate({
      title,
      assigneeId,
      projectId: projectId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status: "todo",
      priority,
    });
    setTitle("");
    setD("");
    setP("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit}>
            Create
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
      </div>
    </Modal>
  );
}
