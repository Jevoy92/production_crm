import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore, palColor, checklistProgress, readinessScore } from "@/lib/store";
import { CHECKLIST_STAGES, STAGES, PAL_TYPES } from "@/lib/types";
import type { ChecklistStage, Stage, PalType } from "@/lib/types";
import {
  ArrowLeft,
  Plus,
  ExternalLink,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Link as LinkIcon,
} from "lucide-react";

export const Route = createFileRoute("/projects/$id")({
  component: ProjectHub,
});

function ProjectHub() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);
  const allShoots = useStore((s) => s.shoots);
  const allAssets = useStore((s) => s.assets);
  const shoots = useMemo(() => allShoots.filter((sh) => sh.projectId === id), [allShoots, id]);
  const assets = useMemo(() => allAssets.filter((a) => a.projectId === id), [allAssets, id]);
  const update = useStore((s) => s.updateProject);
  const remove = useStore((s) => s.removeProject);
  const toggle = useStore((s) => s.toggleChecklistItem);
  const addItem = useStore((s) => s.addChecklistItem);
  const addLog = useStore((s) => s.addLogEntry);

  const [tab, setTab] = useState<"checklists" | "shoots" | "assets" | "log" | "details">(
    "checklists",
  );
  const [stageF, setStageF] = useState<ChecklistStage>("Pre-Production");
  const [newItem, setNewItem] = useState("");
  const [logText, setLogText] = useState("");

  if (!project)
    return (
      <Shell title="Project not found">
        <div className="card-elevated rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">This project doesn't exist.</p>
          <Link to="/productions" className="mt-3 inline-block">
            <Btn>Back to Productions</Btn>
          </Link>
        </div>
      </Shell>
    );

  const client = clients.find((c) => c.id === project.clientId);
  const owner = team.find((m) => m.id === project.ownerId);
  const prog = checklistProgress(project);
  const ready = readinessScore(project);

  return (
    <Shell
      title={project.title}
      subtitle={`${project.palType} · ${client?.company ?? "—"}`}
      actions={
        <>
          <Link to="/productions">
            <Btn variant="subtle" className="flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" /> Back
            </Btn>
          </Link>
          <Btn
            variant="danger"
            onClick={() => {
              if (confirm("Delete this project?")) {
                remove(project.id);
                navigate({ to: "/productions" });
              }
            }}
          >
            <Trash2 className="size-3.5 inline mr-1" /> Delete
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Header card */}
          <div className="card-elevated rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] rounded-md px-2 py-0.5 ring-inset-soft"
                style={{
                  background: palColor(project.palType) + "22",
                  color: palColor(project.palType),
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: palColor(project.palType) }}
                />{" "}
                {project.palType}
              </span>
              <select
                value={project.stage}
                onChange={(e) => update(project.id, { stage: e.target.value as Stage })}
                className="rounded-md bg-surface-2 ring-inset-soft px-2 py-1 text-[12px]"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {project.internal && (
                <span className="text-[11px] rounded-md bg-surface-2 ring-inset-soft px-2 py-0.5 text-muted-foreground">
                  Internal
                </span>
              )}
              <div className="ml-auto flex items-center gap-3 text-[12px] text-muted-foreground">
                <span>
                  Progress <span className="num text-foreground font-medium">{prog.pct}%</span>
                </span>
                <span>
                  Readiness <span className="num text-foreground font-medium">{ready}%</span>
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px]">
              <Info
                icon={Calendar}
                label="Shoot date"
                value={project.shootDate ? new Date(project.shootDate).toLocaleDateString() : "—"}
              />
              <Info
                icon={Calendar}
                label="Delivery"
                value={
                  project.deliveryDate ? new Date(project.deliveryDate).toLocaleDateString() : "—"
                }
              />
              <Info
                icon={DollarSign}
                label="Quoted"
                value={project.quoted ? `$${project.quoted.toLocaleString()}` : "—"}
              />
              <Info
                icon={DollarSign}
                label="Cost"
                value={project.cost ? `$${project.cost.toLocaleString()}` : "—"}
              />
            </div>

            {project.blocker && (
              <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                ⚠ Blocker: {project.blocker}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="card-elevated rounded-2xl">
            <div className="flex border-b border-border px-3">
              {(["checklists", "shoots", "assets", "log", "details"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2.5 text-[12.5px] capitalize border-b-2 -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "checklists" && (
                <>
                  <div className="flex items-center gap-1.5 mb-4">
                    {CHECKLIST_STAGES.map((s) => {
                      const items = project.checklists[s];
                      const done = items.filter((i) => i.done).length;
                      return (
                        <button
                          key={s}
                          onClick={() => setStageF(s)}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] ${stageF === s ? "bg-surface-3 text-foreground ring-inset-soft" : "text-muted-foreground hover:bg-surface-2"}`}
                        >
                          {s}
                          <span className="num text-[10.5px] text-muted-foreground">
                            {done}/{items.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <ul className="space-y-1.5">
                    {project.checklists[stageF].map((i) => (
                      <li key={i.id} className="flex items-center gap-2.5 group">
                        <input
                          type="checkbox"
                          checked={i.done}
                          onChange={() => toggle(project.id, stageF, i.id)}
                          className="accent-primary size-4"
                        />
                        <span
                          className={`text-[13px] ${i.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                        >
                          {i.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newItem.trim()) {
                        addItem(project.id, stageF, newItem.trim());
                        setNewItem("");
                      }
                    }}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add a checklist item…"
                      className={inputCls}
                    />
                    <Btn variant="subtle" type="submit">
                      <Plus className="size-3.5" />
                    </Btn>
                  </form>
                </>
              )}

              {tab === "shoots" && (
                <div className="space-y-2">
                  {shoots.length === 0 && (
                    <p className="text-[12.5px] text-muted-foreground">
                      No shoots scheduled. Add one from{" "}
                      <Link to="/schedule" className="text-primary">
                        Schedule
                      </Link>
                      .
                    </p>
                  )}
                  {shoots.map((s) => (
                    <Link
                      key={s.id}
                      to="/shoots/$id"
                      params={{ id: s.id }}
                      className="block rounded-xl bg-surface-2 ring-inset-soft p-3 hover:bg-surface-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="num text-[13px] font-medium">
                          {new Date(s.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {s.status} · Open →
                        </span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin className="size-3" /> {s.location}
                      </div>
                      {s.goals && (
                        <div className="text-[12px] text-foreground/85 mt-1">{s.goals}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {tab === "assets" && (
                <div className="space-y-2">
                  {assets.length === 0 && (
                    <p className="text-[12.5px] text-muted-foreground">
                      No assets logged. Add them in{" "}
                      <Link to="/assets" className="text-primary">
                        Assets
                      </Link>
                      .
                    </p>
                  )}
                  {assets.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-surface-2 ring-inset-soft p-3"
                    >
                      <div className="flex-1">
                        <div className="text-[13px] font-medium">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {a.type} · {a.status}
                          {a.sizeGb ? ` · ${a.sizeGb} GB` : ""}
                        </div>
                      </div>
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] text-primary flex items-center gap-1"
                        >
                          <LinkIcon className="size-3" /> Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === "log" && (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (logText.trim()) {
                        addLog(project.id, owner?.name ?? "User", "general", logText.trim());
                        setLogText("");
                      }
                    }}
                    className="flex gap-2 mb-4"
                  >
                    <input
                      value={logText}
                      onChange={(e) => setLogText(e.target.value)}
                      placeholder="Add note…"
                      className={inputCls}
                    />
                    <Btn variant="primary" type="submit">
                      Post
                    </Btn>
                  </form>
                  <div className="space-y-2">
                    {project.log.length === 0 && (
                      <p className="text-[12.5px] text-muted-foreground">No log entries yet.</p>
                    )}
                    {project.log.map((e) => (
                      <div key={e.id} className="rounded-xl bg-surface-2 ring-inset-soft p-3">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            {e.who} · {e.type}
                          </span>
                          <span className="num">{new Date(e.ts).toLocaleString()}</span>
                        </div>
                        <div className="text-[13px] text-foreground mt-1">{e.text}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "details" && <DetailsForm project={project} />}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card-elevated rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Client
            </div>
            {client ? (
              <Link to="/clients/$id" params={{ id: client.id }} className="block group">
                <div className="mt-1 text-[15px] font-semibold group-hover:text-primary">
                  {client.company ?? client.name}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  {client.name} · {client.email ?? "—"}
                </div>
              </Link>
            ) : (
              <div className="mt-1 text-[15px] font-semibold">—</div>
            )}
          </div>

          <div className="card-elevated rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Owner
            </div>
            {owner && (
              <Link to="/team" className="mt-2 flex items-center gap-2 group">
                <div
                  className="size-8 rounded-full grid place-items-center text-[11px] font-semibold text-primary-foreground"
                  style={{ background: owner.color }}
                >
                  {owner.initials}
                </div>
                <div>
                  <div className="text-[13px] font-medium group-hover:text-primary">
                    {owner.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground capitalize">{owner.role}</div>
                </div>
              </Link>
            )}
          </div>

          <div className="card-elevated rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
              Links
            </div>
            <LinkRow label="Google Drive" url={project.driveLink} />
            <LinkRow label="HoneyBook" url={project.honeybookLink} />
            <LinkRow label="Review link" url={project.reviewLink} />
          </div>

          <div className="card-elevated rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
              Blocker
            </div>
            <textarea
              value={project.blocker ?? ""}
              onChange={(e) => update(project.id, { blocker: e.target.value })}
              placeholder="Note anything blocking this project…"
              rows={3}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-2 ring-inset-soft p-3">
      <Icon className="size-3.5 text-muted-foreground" />
      <div className="leading-tight">
        <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="num text-[13px] font-medium">{value}</div>
      </div>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url?: string }) {
  if (!url) return <div className="text-[12px] text-muted-foreground py-1">{label}: —</div>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between py-1.5 text-[12.5px] hover:text-primary"
    >
      <span>{label}</span>
      <ExternalLink className="size-3.5" />
    </a>
  );
}

function DetailsForm({
  project,
}: {
  project: ReturnType<typeof useStore.getState>["projects"][number];
}) {
  const update = useStore((s) => s.updateProject);
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Title">
        <input
          className={inputCls}
          value={project.title}
          onChange={(e) => update(project.id, { title: e.target.value })}
        />
      </Field>
      <Field label="Client">
        <select
          className={inputCls}
          value={project.clientId}
          onChange={(e) => update(project.id, { clientId: e.target.value })}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company ?? c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pal type">
        <select
          className={inputCls}
          value={project.palType}
          onChange={(e) => update(project.id, { palType: e.target.value as PalType })}
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
          value={project.ownerId}
          onChange={(e) => update(project.id, { ownerId: e.target.value })}
        >
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Shoot date">
        <input
          type="date"
          className={inputCls}
          value={project.shootDate?.slice(0, 10) ?? ""}
          onChange={(e) =>
            update(project.id, {
              shootDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
        />
      </Field>
      <Field label="Delivery date">
        <input
          type="date"
          className={inputCls}
          value={project.deliveryDate?.slice(0, 10) ?? ""}
          onChange={(e) =>
            update(project.id, {
              deliveryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
        />
      </Field>
      <Field label="Quoted ($)">
        <input
          className={inputCls}
          value={project.quoted ?? ""}
          onChange={(e) =>
            update(project.id, { quoted: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </Field>
      <Field label="Cost ($)">
        <input
          className={inputCls}
          value={project.cost ?? ""}
          onChange={(e) =>
            update(project.id, { cost: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </Field>
      <Field label="Drive link">
        <input
          className={inputCls}
          value={project.driveLink ?? ""}
          onChange={(e) => update(project.id, { driveLink: e.target.value })}
        />
      </Field>
      <Field label="HoneyBook link">
        <input
          className={inputCls}
          value={project.honeybookLink ?? ""}
          onChange={(e) => update(project.id, { honeybookLink: e.target.value })}
        />
      </Field>
      <Field label="Review link">
        <input
          className={inputCls}
          value={project.reviewLink ?? ""}
          onChange={(e) => update(project.id, { reviewLink: e.target.value })}
        />
      </Field>
      <Field label="Priority">
        <select
          className={inputCls}
          value={project.priority}
          onChange={(e) =>
            update(project.id, { priority: e.target.value as "Low" | "Med" | "High" })
          }
        >
          <option>Low</option>
          <option>Med</option>
          <option>High</option>
        </select>
      </Field>
      <div className="col-span-2">
        <Field label="Notes">
          <textarea
            rows={3}
            className={inputCls}
            value={project.notes ?? ""}
            onChange={(e) => update(project.id, { notes: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
