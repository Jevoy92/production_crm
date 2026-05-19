import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import type { Role, TeamMember } from "@/lib/types";
import { Plus, Pencil, Trash2, Crown, DollarSign, ClipboardCheck } from "lucide-react";
import { KpiCard, KpiBar, KpiDonut, KpiList, Section, usd } from "@/components/kpi/KpiPrimitives";
import { ownerKpis, cfoKpis, paKpis } from "@/lib/kpis";

export const Route = createFileRoute("/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team & KPIs · Palmer House" }] }),
});

const ROLES: Role[] = ["owner", "cfo", "pa", "editor", "camera", "freelancer"];
const PALETTE = [
  "oklch(0.70 0.16 55)",
  "oklch(0.62 0.15 158)",
  "oklch(0.58 0.17 235)",
  "oklch(0.62 0.22 330)",
  "oklch(0.62 0.13 210)",
  "oklch(0.68 0.18 30)",
];

function TeamPage() {
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const shoots = useStore((s) => s.shoots);
  const remove = useStore((s) => s.removeMember);
  const add = useStore((s) => s.addMember);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<TeamMember | null>(null);

  // subscribe for live KPI updates
  useStore((s) => s.finance);

  return (
    <Shell
      title="Team & KPIs"
      subtitle={`${team.length} members · master view — all dashboards`}
      actions={
        <Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5">
          <Plus className="size-3.5" /> Add member
        </Btn>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map((m) => {
          const active = projects.filter(
            (p) => p.ownerId === m.id && p.stage !== "Archived" && p.stage !== "Delivered",
          ).length;
          const upcomingShoots = shoots.filter(
            (s) =>
              s.crewIds.includes(m.id) && new Date(s.date) >= new Date(new Date().toDateString()),
          ).length;
          const cap = m.capacity ?? 40;
          const load = Math.min(100, Math.round(((active * 10 + upcomingShoots * 8) / cap) * 100));
          return (
            <div key={m.id} className="card-elevated rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div
                  className="size-12 rounded-full grid place-items-center text-[15px] font-semibold text-primary-foreground"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{m.name}</div>
                  <div className="text-[11.5px] text-muted-foreground capitalize">
                    {m.role} {m.rate ? ` · $${m.rate}/hr` : ""}
                  </div>
                </div>
                <Btn
                  variant="subtle"
                  onClick={() => setEdit(m)}
                  title="Edit member"
                  className="flex items-center gap-1"
                >
                  <Pencil className="size-3.5" /> Edit
                </Btn>
                <Btn
                  variant="subtle"
                  onClick={() => {
                    if (confirm(`Remove ${m.name}?`)) remove(m.id);
                  }}
                  title="Remove member"
                  className="flex items-center gap-1 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Btn>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Active projects" value={active} />
                <Stat label="Upcoming shoots" value={upcomingShoots} />
                <Stat label="Capacity" value={`${cap}h`} />
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Workload</span>
                  <span className="num text-foreground">{load}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${load}%`, background: m.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Master KPI View — all three dashboards always visible ── */}
      <div className="mt-8 space-y-10">
        {team.find((m) => m.role === "owner") && (
          <OwnerPanel member={team.find((m) => m.role === "owner")!} />
        )}
        <div className="border-t border-border" />
        {team.find((m) => m.role === "cfo") && (
          <CfoPanel member={team.find((m) => m.role === "cfo")!} />
        )}
        <div className="border-t border-border" />
        {team.find((m) => m.role === "pa") && (
          <PaPanel member={team.find((m) => m.role === "pa")!} />
        )}
      </div>

      <NewMember open={open} onClose={() => setOpen(false)} />
      <EditMember member={edit} onClose={() => setEdit(null)} />
    </Shell>
  );

  function NewMember({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [name, setName] = useState("");
    const [role, setRole] = useState<Role>("freelancer");
    const [rate, setRate] = useState("");
    const [color, setColor] = useState(PALETTE[0]);
    const submit = () => {
      if (!name.trim()) return;
      const parts = name.trim().split(/\s+/);
      const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
      add({
        name: name.trim(),
        role,
        initials,
        color,
        rate: rate ? Number(rate) : undefined,
        capacity: 40,
      });
      setName("");
      setRate("");
      onClose();
    };
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Add team member"
        footer={
          <>
            <Btn variant="subtle" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={submit}>
              Add
            </Btn>
          </>
        }
      >
        <Field label="Name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select
              className={inputCls}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rate ($/hr)">
            <input className={inputCls} value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </div>
        <Field label="Color">
          <div className="flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`size-7 rounded-full ${color === c ? "ring-2 ring-ring" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </Modal>
    );
  }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-2 ring-inset-soft py-2">
      <div className="num text-[16px] font-semibold">{value}</div>
      <div className="text-[10.5px] text-muted-foreground">{label}</div>
    </div>
  );
}

function EditMember({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  const update = useStore((s) => s.updateMember);
  const [form, setForm] = useState<TeamMember | null>(member);
  useEffect(() => {
    setForm(member);
  }, [member]);
  if (!member || !form) return null;
  const f = form;
  const set = (patch: Partial<TeamMember>) => setForm({ ...f, ...patch });
  const submit = () => {
    update(member.id, {
      name: f.name,
      role: f.role,
      email: f.email,
      initials: f.initials,
      color: f.color,
      rate: f.rate,
      capacity: f.capacity,
    });
    onClose();
  };
  return (
    <Modal
      open={!!member}
      onClose={onClose}
      title={`Edit · ${member.name}`}
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
      <Field label="Name">
        <input
          className={inputCls}
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Role">
          <select
            className={inputCls}
            value={f.role}
            onChange={(e) => set({ role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Initials">
          <input
            className={inputCls}
            value={f.initials}
            onChange={(e) => set({ initials: e.target.value.toUpperCase().slice(0, 2) })}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            value={f.email ?? ""}
            onChange={(e) => set({ email: e.target.value })}
          />
        </Field>
        <Field label="Rate ($/hr)">
          <input
            className={inputCls}
            value={f.rate ?? ""}
            onChange={(e) => set({ rate: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
        <Field label="Capacity (h/wk)">
          <input
            className={inputCls}
            value={f.capacity ?? ""}
            onChange={(e) => set({ capacity: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
      </div>
      <Field label="Color">
        <div className="flex gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ color: c })}
              className={`size-7 rounded-full ${f.color === c ? "ring-2 ring-ring" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
    </Modal>
  );
}

function RolePanelHeader({
  member,
  icon: Icon,
  title,
  sub,
}: {
  member: TeamMember;
  icon: typeof Crown;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="size-10 rounded-full grid place-items-center text-[13px] font-semibold text-primary-foreground"
        style={{ background: member.color }}
      >
        {member.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </div>
        </div>
        <div className="text-[15px] font-semibold tracking-tight">
          {member.name} <span className="text-muted-foreground font-normal">· {sub}</span>
        </div>
      </div>
    </div>
  );
}

function OwnerPanel({ member }: { member: TeamMember }) {
  const k = ownerKpis();
  return (
    <div>
      <RolePanelHeader
        member={member}
        icon={Crown}
        title="Owner Dashboard"
        sub="revenue, throughput, momentum"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Active projects"
          value={k.activeCount}
          sub="across all Pal types"
          accent="var(--color-chart-1)"
        />
        <KpiCard
          label="Quoted (active)"
          value={usd(k.quotedTotal)}
          sub="pipeline value"
          accent="var(--color-chart-2)"
        />
        <KpiCard
          label="Delivered MTD"
          value={k.deliveredThisMonth}
          sub="this month"
          accent="var(--color-chart-3)"
        />
        <KpiCard
          label="Shoots this month"
          value={k.shootsThisMonth}
          sub={`${k.internalCount} internal projects`}
          accent="var(--color-chart-4)"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Section title="Active by Pal type" eyebrow="Mix">
          <KpiDonut data={k.activeByPal} />
        </Section>
        <Section title="Delivered · MTD" eyebrow="Throughput">
          <KpiBar data={k.deliveredByPal} />
        </Section>
        <Section
          title="What's stuck"
          eyebrow="Needs you"
          right={<span className="num text-[11px] text-destructive">{k.stuck.length}</span>}
        >
          <KpiList
            rows={k.stuck.slice(0, 6).map((p) => ({
              label: (
                <Link to="/projects/$id" params={{ id: p.id }} className="hover:text-primary">
                  {p.title}
                </Link>
              ),
              sub: p.blocker ?? `${p.stage} · stale`,
              value: <span className="text-[11px] text-muted-foreground">{p.stage}</span>,
            }))}
          />
        </Section>
      </div>
    </div>
  );
}

function CfoPanel({ member }: { member: TeamMember }) {
  const k = cfoKpis();
  return (
    <div>
      <RolePanelHeader
        member={member}
        icon={DollarSign}
        title="CFO Dashboard"
        sub="cash, margins, AR"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Cash collected MTD"
          value={usd(k.cashCollected)}
          accent="var(--color-chart-1)"
        />
        <KpiCard
          label="Outstanding AR"
          value={usd(k.outstanding)}
          sub={`${usd(k.aging[2].value)} 90d+`}
          accent="var(--color-chart-2)"
        />
        <KpiCard
          label="Booked revenue"
          value={usd(k.booked)}
          sub={`${usd(k.retainer)} retainer`}
          accent="var(--color-chart-3)"
        />
        <KpiCard
          label="Booked MTD"
          value={usd(k.bookedMonth)}
          sub={`${usd(k.bookedQuarter)} QTD`}
          accent="var(--color-chart-4)"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Section title="AR aging" eyebrow="Collect">
          <KpiBar data={k.aging} color="var(--color-chart-2)" />
        </Section>
        <Section title="Margin by Pal" eyebrow="Profit %">
          <KpiBar data={k.marginByPal} color="var(--color-chart-3)" />
        </Section>
        <Section title="Top clients (LTV)" eyebrow="Revenue">
          <KpiList rows={k.topClients.map((c) => ({ label: c.name, value: usd(c.value) }))} />
        </Section>
      </div>
    </div>
  );
}

function PaPanel({ member }: { member: TeamMember }) {
  const k = paKpis();
  return (
    <div>
      <RolePanelHeader
        member={member}
        icon={ClipboardCheck}
        title="PA Dashboard"
        sub="readiness, hygiene, throughput"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Shoots this week"
          value={k.upcomingThisWeek}
          sub={`${k.upcomingAll} upcoming total`}
          accent="var(--color-chart-1)"
        />
        <KpiCard
          label="Overdue pre-pro"
          value={k.overduePre}
          sub="<80% checklist, <7d out"
          accent="var(--color-chart-2)"
        />
        <KpiCard
          label="On-time delivery"
          value={`${k.onTimePct}%`}
          sub="of delivered projects"
          accent="var(--color-chart-3)"
        />
        <KpiCard
          label="Checklist avg"
          value={`${k.checklistAvg}%`}
          sub={`${k.driveOrganized}/${k.driveTotal} Drives linked`}
          accent="var(--color-chart-4)"
        />
      </div>
      <Section title="Shoot readiness · next up" eyebrow="Ready?">
        <KpiList
          rows={k.readiness.map((r) => ({
            label: r.project ? (
              <Link to="/projects/$id" params={{ id: r.project.id }} className="hover:text-primary">
                {r.project.title}
              </Link>
            ) : (
              "Untitled shoot"
            ),
            sub: `${new Date(r.shoot.date).toLocaleDateString()} · ${r.shoot.location ?? "TBD"}`,
            value: (
              <span
                className={
                  r.score >= 80
                    ? "text-emerald-500"
                    : r.score >= 50
                      ? "text-amber-500"
                      : "text-destructive"
                }
              >
                {r.score}%
              </span>
            ),
          }))}
        />
      </Section>
    </div>
  );
}
