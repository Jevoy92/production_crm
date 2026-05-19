import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, Modal, inputCls } from "@/components/ui-bits/Modal";
import { useStore, palColor, checklistProgress } from "@/lib/store";
import { STAGES, PAL_TYPES } from "@/lib/types";
import type { Stage, PalType, Project } from "@/lib/types";
import { Plus, LayoutGrid, Rows, Filter, ExternalLink, Pencil, Trash2, UserPlus, Check } from "lucide-react";
import { Inbox, Handshake, ClipboardList, Camera, Scissors, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/productions")({
  component: ProductionsPage,
  head: () => ({
    meta: [
      { title: "Productions · Palmer House" },
      {
        name: "description",
        content: "Kanban pipeline and table view of every active Palmer House production.",
      },
    ],
  }),
});

function ProductionsPage() {
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);

  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [palF, setPalF] = useState<PalType | "All">("All");
  const [ownF, setOwnF] = useState<string>("All");
  const [openNew, setOpenNew] = useState(false);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) => (palF === "All" || p.palType === palF) && (ownF === "All" || p.ownerId === ownF),
      ),
    [projects, palF, ownF],
  );

  return (
    <Shell
      title="Productions"
      subtitle={`${projects.length} total · ${projects.filter((p) => p.stage !== "Archived").length} active`}
      actions={
        <Btn
          variant="primary"
          onClick={() => setOpenNew(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-3.5" /> New Project
        </Btn>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 rounded-lg bg-surface-2 ring-inset-soft p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] ${view === "kanban" ? "bg-card text-foreground ring-inset-soft" : "text-muted-foreground"}`}
          >
            <LayoutGrid className="size-3.5" /> Pipeline
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] ${view === "table" ? "bg-card text-foreground ring-inset-soft" : "text-muted-foreground"}`}
          >
            <Rows className="size-3.5" /> Table
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[12px]">
          <Filter className="size-3.5 text-muted-foreground" />
          <select
            value={palF}
            onChange={(e) => setPalF(e.target.value as PalType | "All")}
            className={inputCls + " w-36 py-1.5"}
          >
            <option value="All">All Pals</option>
            {PAL_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={ownF}
            onChange={(e) => setOwnF(e.target.value)}
            className={inputCls + " w-40 py-1.5"}
          >
            <option value="All">All owners</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "kanban" ? (
        <>
          <ProductionTimeline projects={filtered} />
          <Kanban projects={filtered} />
          <div className="mt-6">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mb-2 px-1">
              All productions
            </div>
            <Table projects={filtered} />
          </div>
        </>
      ) : (
        <Table projects={filtered} />
      )}

      <NewProjectModal open={openNew} onClose={() => setOpenNew(false)} />
    </Shell>
  );
}

function Kanban({ projects }: { projects: Project[] }) {
  // placeholder anchor
  // (ProductionTimeline defined below)
  // eslint-disable-next-line
  const setStage = useStore((s) => s.setStage);
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);
  const [drag, setDrag] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {(["Pre-Production", "Shoot Day", "In Post", "Delivered"] as Stage[]).map((stage) => {
          const col = projects.filter((p) => p.stage === stage);
          return (
            <div
              key={stage}
              className="w-72 shrink-0 card-elevated rounded-2xl p-3 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag) {
                  setStage(drag, stage);
                  setDrag(null);
                }
              }}
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {stage}
                </div>
                <span className="num text-[10.5px] rounded-md bg-surface-3 px-1.5 py-0.5 text-muted-foreground">
                  {col.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const owner = team.find((m) => m.id === p.ownerId);
                  const prog = checklistProgress(p);
                  return (
                    <Link
                      key={p.id}
                      to="/projects/$id"
                      params={{ id: p.id }}
                      draggable
                      onDragStart={() => setDrag(p.id)}
                      className="rounded-xl bg-surface-2 ring-inset-soft p-3 hover:bg-surface-3 transition-colors block"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: palColor(p.palType) }}
                        />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.palType}
                        </span>
                        {p.blocker && (
                          <span
                            title={p.blocker}
                            className="ml-auto inline-flex items-center gap-1 text-[10px] text-destructive"
                          >
                            <span className="size-1.5 rounded-full bg-destructive animate-pulse" />{" "}
                            Blocker
                          </span>
                        )}
                        {!p.blocker && p.priority === "High" && (
                          <span className="ml-auto text-[10px] text-destructive">● High</span>
                        )}
                      </div>
                      <div className="mt-1.5 text-[13px] font-medium leading-snug">{p.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {client?.company ?? "—"}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {owner && (
                          <div
                            className="size-6 rounded-full grid place-items-center text-[9.5px] font-semibold text-primary-foreground"
                            style={{ background: owner.color }}
                          >
                            {owner.initials}
                          </div>
                        )}
                        <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${prog.pct}%` }}
                          />
                        </div>
                        <span className="num text-[10.5px] text-muted-foreground">{prog.pct}%</span>
                      </div>
                    </Link>
                  );
                })}
                {col.length === 0 && (
                  <div className="text-[11px] text-muted-foreground/70 px-1 py-3 text-center">
                    Drop projects here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Table({ projects }: { projects: Project[] }) {
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);
  const remove = useStore((s) => s.removeProject);
  const [edit, setEdit] = useState<Project | null>(null);
  return (
    <div className="card-elevated rounded-2xl overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="text-left font-medium px-5 py-3">Project</th>
            <th className="text-left font-medium">Pal</th>
            <th className="text-left font-medium">Stage</th>
            <th className="text-left font-medium">Owner</th>
            <th className="text-left font-medium">Shoot</th>
            <th className="text-left font-medium">Delivery</th>
            <th className="text-left font-medium">Quoted</th>
            <th className="text-left font-medium">Progress</th>
            <th className="px-5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const client = clients.find((c) => c.id === p.clientId);
            const owner = team.find((m) => m.id === p.ownerId);
            const prog = checklistProgress(p);
            return (
              <tr
                key={p.id}
                className="border-t border-border hover:bg-surface-2/60 transition-colors"
              >
                <td className="px-5 py-3">
                  <Link
                    to="/projects/$id"
                    params={{ id: p.id }}
                    className="font-medium text-foreground flex items-center gap-1.5"
                  >
                    {p.title} <ExternalLink className="size-3 text-muted-foreground/60" />
                  </Link>
                  <div className="text-[11px] text-muted-foreground">
                    {client?.company ?? "—"}
                    {p.internal && " · Internal"}
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <span
                      className="size-2 rounded-sm"
                      style={{ background: palColor(p.palType) }}
                    />{" "}
                    {p.palType}
                  </span>
                </td>
                <td className="text-foreground/85">{p.stage}</td>
                <td>
                  {owner && (
                    <div
                      className="size-6 rounded-full grid place-items-center text-[9.5px] font-semibold text-primary-foreground"
                      style={{ background: owner.color }}
                    >
                      {owner.initials}
                    </div>
                  )}
                </td>
                <td className="num">
                  {p.shootDate
                    ? new Date(p.shootDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </td>
                <td className="num">
                  {p.deliveryDate
                    ? new Date(p.deliveryDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </td>
                <td className="num">{p.quoted ? `$${p.quoted.toLocaleString()}` : "—"}</td>
                <td>
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${prog.pct}%` }}
                      />
                    </div>
                    <span className="num text-[11px] text-muted-foreground">{prog.pct}%</span>
                  </div>
                </td>
                <td className="px-5 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Btn variant="ghost" onClick={() => setEdit(p)} title="Edit">
                      <Pencil className="size-3.5" />
                    </Btn>
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"?`)) remove(p.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Btn>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <EditProjectModal project={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

// ─── Inline client picker with quick-add ──────────────────────────────────────
function ClientSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const clients = useStore((s) => s.clients);
  const addClient = useStore((s) => s.addClient);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "__new__") {
      setAdding(true);
    } else {
      onChange(e.target.value);
    }
  }

  function saveNew() {
    if (!newName.trim()) return;
    const id = addClient({ name: newName.trim(), company: newCompany.trim() || undefined, email: newEmail.trim() || undefined });
    onChange(id);
    setAdding(false);
    setNewName("");
    setNewCompany("");
    setNewEmail("");
  }

  return (
    <div className="space-y-2">
      <select
        value={adding ? "__new__" : value}
        onChange={handleSelectChange}
        className={inputCls}
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company ?? c.name}
          </option>
        ))}
        <option value="__new__">＋ New client…</option>
      </select>

      {adding && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
            <UserPlus className="w-3 h-3" /> Quick add client
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputCls + " text-[12px]"}
              placeholder="Contact name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <input
              className={inputCls + " text-[12px]"}
              placeholder="Company"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
            />
          </div>
          <input
            className={inputCls + " text-[12px]"}
            placeholder="Email (optional)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveNew(); }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setAdding(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={saveNew}
              disabled={!newName.trim()}
              className="flex items-center gap-1 text-[11px] font-medium bg-primary text-primary-foreground rounded-md px-3 py-1 disabled:opacity-40"
            >
              <Check className="w-3 h-3" /> Save & select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addProject = useStore((s) => s.addProject);
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);
  const [title, setTitle] = useState("");
  const [clientId, setClient] = useState(clients[0]?.id ?? "");
  const [palType, setPal] = useState<PalType>("Visibility");
  const [ownerId, setOwner] = useState(team[0]?.id ?? "");
  const [stage, setStage] = useState<Stage>("Lead");
  const [shootDate, setShoot] = useState("");
  const [deliveryDate, setDel] = useState("");
  const [quoted, setQuoted] = useState("");
  const [internal, setInternal] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    addProject({
      title,
      clientId,
      palType,
      ownerId,
      stage,
      internal,
      shootDate: shootDate || undefined,
      deliveryDate: deliveryDate || undefined,
      quoted: quoted ? Number(quoted) : undefined,
    });
    setTitle("");
    setQuoted("");
    setShoot("");
    setDel("");
    setInternal(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Project"
      wide
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
      <Field label="Project title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder="e.g. Founder Story · Pt. 3"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Client">
          <ClientSelect value={clientId} onChange={setClient} />
        </Field>
        <Field label="Pal type">
          <select
            value={palType}
            onChange={(e) => setPal(e.target.value as PalType)}
            className={inputCls}
          >
            {PAL_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <select value={ownerId} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stage">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
            className={inputCls}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Shoot date">
          <input
            type="date"
            value={shootDate}
            onChange={(e) => setShoot(e.target.value ? new Date(e.target.value).toISOString() : "")}
            className={inputCls}
          />
        </Field>
        <Field label="Delivery date">
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDel(e.target.value ? new Date(e.target.value).toISOString() : "")}
            className={inputCls}
          />
        </Field>
        <Field label="Quoted value ($)">
          <input
            value={quoted}
            onChange={(e) => setQuoted(e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </Field>
        <Field label="Project type">
          <label className="flex items-center gap-2 text-[13px] mt-1">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
            />{" "}
            Internal project
          </label>
        </Field>
      </div>
    </Modal>
  );
}

function EditProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const update = useStore((s) => s.updateProject);
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);

  const [form, setForm] = useState<Project | null>(project);
  useEffect(() => {
    setForm(project);
  }, [project]);

  if (!project || !form) return null;
  const f = form;
  const set = (patch: Partial<Project>) => setForm({ ...f, ...patch });
  const submit = () => {
    update(project.id, {
      title: f.title,
      clientId: f.clientId,
      palType: f.palType,
      ownerId: f.ownerId,
      stage: f.stage,
      priority: f.priority,
      internal: f.internal,
      shootDate: f.shootDate || undefined,
      deliveryDate: f.deliveryDate || undefined,
      quoted: f.quoted,
      cost: f.cost,
      driveLink: f.driveLink,
      honeybookLink: f.honeybookLink,
      reviewLink: f.reviewLink,
      notes: f.notes,
      blocker: f.blocker,
    });
    onClose();
  };
  const dateVal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

  return (
    <Modal
      open={!!project}
      onClose={onClose}
      title={`Edit · ${project.title}`}
      wide
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit}>
            Save
          </Btn>
        </>
      }
    >
      <Field label="Project title">
        <input
          className={inputCls}
          value={f.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Client">
          <ClientSelect value={f.clientId} onChange={(id) => set({ clientId: id })} />
        </Field>
        <Field label="Pal type">
          <select
            className={inputCls}
            value={f.palType}
            onChange={(e) => set({ palType: e.target.value as PalType })}
          >
            {PAL_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <select
            className={inputCls}
            value={f.ownerId}
            onChange={(e) => set({ ownerId: e.target.value })}
          >
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stage">
          <select
            className={inputCls}
            value={f.stage}
            onChange={(e) => set({ stage: e.target.value as Stage })}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select
            className={inputCls}
            value={f.priority}
            onChange={(e) => set({ priority: e.target.value as Project["priority"] })}
          >
            {["Low", "Med", "High"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <label className="flex items-center gap-2 text-[13px] mt-1.5">
            <input
              type="checkbox"
              checked={f.internal}
              onChange={(e) => set({ internal: e.target.checked })}
            />{" "}
            Internal project
          </label>
        </Field>
        <Field label="Shoot date">
          <input
            type="date"
            className={inputCls}
            value={dateVal(f.shootDate)}
            onChange={(e) =>
              set({
                shootDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              })
            }
          />
        </Field>
        <Field label="Delivery date">
          <input
            type="date"
            className={inputCls}
            value={dateVal(f.deliveryDate)}
            onChange={(e) =>
              set({
                deliveryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              })
            }
          />
        </Field>
        <Field label="Quoted ($)">
          <input
            className={inputCls}
            value={f.quoted ?? ""}
            onChange={(e) => set({ quoted: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
        <Field label="Cost ($)">
          <input
            className={inputCls}
            value={f.cost ?? ""}
            onChange={(e) => set({ cost: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
      </div>
      <Field label="Drive link">
        <input
          className={inputCls}
          value={f.driveLink ?? ""}
          onChange={(e) => set({ driveLink: e.target.value })}
        />
      </Field>
      <Field label="HoneyBook link">
        <input
          className={inputCls}
          value={f.honeybookLink ?? ""}
          onChange={(e) => set({ honeybookLink: e.target.value })}
        />
      </Field>
      <Field label="Review link">
        <input
          className={inputCls}
          value={f.reviewLink ?? ""}
          onChange={(e) => set({ reviewLink: e.target.value })}
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={inputCls + " min-h-20"}
          value={f.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>
      <Field label="Blocker">
        <input
          className={inputCls}
          value={f.blocker ?? ""}
          onChange={(e) => set({ blocker: e.target.value })}
          placeholder="What's stuck?"
        />
      </Field>
    </Modal>
  );
}


// ─── Production Timeline (real pipeline stages) ──────────────────────────────
const TIMELINE_STAGES: { key: Stage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "Booked", label: "Booked", icon: Handshake },
  { key: "Pre-Production", label: "Pre-Production", icon: ClipboardList },
  { key: "Shoot Day", label: "Shoot Day", icon: Camera },
  { key: "In Post", label: "In Post", icon: Scissors },
  { key: "Delivered", label: "Delivered", icon: PackageCheck },
];

function ProductionTimeline({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<"all" | PalType>("all");
  const scoped = projects.filter((p) => filter === "all" || p.palType === filter);
  const total = scoped.length || 1;

  const byStage = TIMELINE_STAGES.map((s) => ({
    ...s,
    count: scoped.filter((p) => p.stage === s.key).length,
  }));
  const activeIdx = byStage.findIndex((s) => s.count > 0);

  const activeProjects = scoped.filter((p) =>
    ["Pre-Production", "Shoot Day", "In Post"].includes(p.stage),
  );
  const deliveredProjects = scoped.filter((p) => p.stage === "Delivered");

  return (
    <div className="mb-6 space-y-4">
      <div className="card-elevated rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        {(["all", ...PAL_TYPES] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as "all" | PalType)}
            className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-2"
            }`}
          >
            {f === "all" ? "All Pals" : f}
          </button>
        ))}
        <div className="ml-auto text-[11px] text-muted-foreground num">
          {scoped.length} project{scoped.length === 1 ? "" : "s"} in view
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5">
        <div className="mb-5">
          <div className="text-[14px] font-semibold">Production Pipeline</div>
          <div className="text-[11.5px] text-muted-foreground">
            Live distribution of projects across each stage
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-7 left-[6%] right-[6%] h-px bg-border" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 relative">
            {byStage.map((s, i) => {
              const Icon = s.icon;
              const pct = Math.round((s.count / total) * 100);
              const isActive = i === activeIdx && s.count > 0;
              const isPast = activeIdx >= 0 && i < activeIdx;
              const isDelivered = s.key === "Delivered" && s.count > 0;
              return (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div
                    className={`size-14 rounded-full grid place-items-center mb-3 relative z-10 ring-4 ring-card ${
                      isDelivered || isPast
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-3 text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="text-[12.5px] font-semibold">{s.label}</div>
                  <div className="text-[10.5px] text-muted-foreground num mb-1.5">
                    {s.count} project{s.count === 1 ? "" : "s"}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md ${
                      isDelivered
                        ? "bg-emerald-500/10 text-emerald-500"
                        : isActive
                          ? "bg-primary/10 text-primary"
                          : isPast
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-surface-3 text-muted-foreground"
                    }`}
                  >
                    {pct}% of pipeline
                  </span>
                  <div className="mt-2 w-full h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isDelivered || isPast
                          ? "bg-emerald-500"
                          : isActive
                            ? "bg-primary"
                            : "bg-transparent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PalBreakdownCard
          title="Active Productions"
          subtitle={`${activeProjects.length} in flight · Pre-Pro → Post`}
          projects={activeProjects}
          tone="primary"
        />
        <PalBreakdownCard
          title="Delivered"
          subtitle={`${deliveredProjects.length} shipped`}
          projects={deliveredProjects}
          tone="emerald"
        />
      </div>
    </div>
  );
}

function PalBreakdownCard({
  title,
  subtitle,
  projects,
  tone,
}: {
  title: string;
  subtitle: string;
  projects: Project[];
  tone: "primary" | "emerald";
}) {
  const total = projects.length || 1;
  const rows = PAL_TYPES.map((pt) => {
    const count = projects.filter((p) => p.palType === pt).length;
    return { pt, count, pct: Math.round((count / total) * 100) };
  });
  const badgeBg = tone === "emerald" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary";
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[14px] font-semibold">{title}</div>
          <div className="text-[11.5px] text-muted-foreground">{subtitle}</div>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-md ${badgeBg} num`}>
          {projects.length} total
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.pt}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: palColor(r.pt) }} />
                {r.pt}
              </span>
              <span className="num font-medium text-muted-foreground">
                {r.count} · {r.pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${r.pct}%`, background: palColor(r.pt) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
