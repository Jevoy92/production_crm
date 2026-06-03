import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Shell } from "@/components/dashboard/Shell";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";
import { ChartTooltip } from "@/components/charts/Charts";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore, checklistProgress } from "@/lib/store";
import { useCCStore } from "@/lib/ccStore";
import { ownerKpis, cfoKpis } from "@/lib/kpis";
import type { TrackedKpi, KpiOwnerRole } from "@/lib/types";
import { HeartPulse, Clapperboard, ArrowLeftRight, ArrowUp, Plus } from "lucide-react";

export const Route = createFileRoute("/scoreboard")({
  component: ScoreboardPage,
  head: () => ({ meta: [{ title: "KPI Scoreboard · Production OS" }] }),
});

const usd = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${Math.round(n)}`);

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 40, c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="transparent" strokeWidth="8" stroke="var(--sunken)" />
        <circle cx="50" cy="50" r={r} fill="transparent" strokeWidth="8" strokeLinecap="round" stroke={color} strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-hi">{Math.round(pct)}%</div>
    </div>
  );
}

function meetsTarget(k: TrackedKpi): boolean {
  if (k.isRatio) return k.ratioDenominator > 0 && k.ratioNumerator / k.ratioDenominator >= k.target / 100;
  return k.isLowerBetter ? k.actual <= k.target : k.actual >= k.target;
}

function ownerLabel(o: KpiOwnerRole): string {
  return o === "owner" ? "Jevoy" : o === "cfo" ? "Adrienne" : o === "pa" ? "Shannen" : "Team";
}

function ScoreboardPage() {
  const kpis = useStore((s) => s.trackedKpis);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const team = useStore((s) => s.team);
  const addKpi = useStore((s) => s.addKpi);
  const library = useCCStore((s) => s.library);

  const [filter, setFilter] = useState<KpiOwnerRole | "all">("all");
  const [open, setOpen] = useState(false);

  const ok = ownerKpis();
  const cf = cfoKpis();

  const activeProjects = projects.filter((p) => p.stage !== "Archived" && p.stage !== "Delivered");
  const handoff = activeProjects.length
    ? Math.round(activeProjects.reduce((a, p) => a + checklistProgress(p).pct, 0) / activeProjects.length)
    : 0;
  const activeKpis = kpis.filter((k) => k.active);
  const health = activeKpis.length
    ? Math.round((activeKpis.filter(meetsTarget).length / activeKpis.length) * 100)
    : Math.min(100, 70 + Math.round(handoff * 0.25));
  const outputVol = library.length + ok.deliveredThisMonth;
  const outputTarget = Math.max(1, Math.round(outputVol * 0.9));

  const goals = [
    { label: "Client Acquisition", sub: `${clients.length}/20 clients`, pct: Math.min(100, (clients.length / 20) * 100), color: "var(--brand-500)" },
    { label: "Production Revenue", sub: `${usd(cf.booked)} / $500K target`, pct: Math.min(100, (cf.booked / 500000) * 100), color: "var(--accent-emerald)" },
    { label: "Studio Utilization", sub: `${ok.shootsThisMonth}/40 days booked`, pct: Math.min(100, (ok.shootsThisMonth / 40) * 100), color: "var(--accent-amber)" },
  ];

  const chartData = useMemo(() => {
    const now = new Date();
    const rows: { m: string; actual: number; target: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const actual = projects.filter((p) => (p.deliveryDate || p.createdAt)?.slice(0, 7) === key && p.stage === "Delivered").length;
      rows.push({ m: d.toLocaleString(undefined, { month: "short" }), actual, target: 5 });
    }
    return rows;
  }, [projects]);

  const scorecards = useMemo(() => {
    if (kpis.length) {
      return kpis
        .filter((k) => filter === "all" || k.owner === filter)
        .map((k) => ({
          metric: k.name,
          owner: ownerLabel(k.owner),
          target: k.isRatio ? `${k.target}%` : `${k.target}${k.unit}`,
          actual: k.isRatio ? `${Math.round((k.ratioNumerator / Math.max(1, k.ratioDenominator)) * 100)}%` : `${k.actual}${k.unit}`,
          ok: meetsTarget(k),
        }));
    }
    return [
      { metric: "Active Projects", owner: "Jevoy", target: "20", actual: String(ok.activeCount), ok: ok.activeCount >= 20 },
      { metric: "Booked Revenue", owner: "Adrienne", target: "$500K", actual: usd(cf.booked), ok: cf.booked >= 500000 },
      { metric: "Content Published", owner: "Shannen", target: "40/mo", actual: String(library.filter((l) => l.status === "Published").length), ok: false },
      { metric: "Handoff Completion", owner: "Team", target: "95%", actual: `${handoff}%`, ok: handoff >= 95 },
    ];
  }, [kpis, filter, ok, cf, library, handoff]);

  const FILTERS: { key: KpiOwnerRole | "all"; label: string }[] = [
    { key: "all", label: "All Scorecards" },
    { key: "owner", label: "Jevoy" },
    { key: "cfo", label: "Adrienne" },
    { key: "pa", label: "Shannen" },
  ];

  return (
    <Shell
      title="KPI Scoreboard"
      subtitle="The nervous system of the company — handoffs, targets, and output."
      actions={<Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5"><Plus className="size-3.5" /> Add KPI</Btn>}
    >
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${filter === f.key ? "bg-brand-600 text-white" : "bg-sunken text-mid hover:text-hi border border-line"}`}>{f.label}</button>
        ))}
      </div>

      <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6" stagger={0.06}>
        <StaggerItem variant="scaleIn"><MetricBig icon={<HeartPulse size={16} />} accent="emerald" label="Company Health Score" value={`${health}/100`} foot={<span className="text-emerald font-medium flex items-center gap-1"><ArrowUp size={11} /> {Math.max(1, Math.round(health * 0.04))} pts</span>} footMuted="vs last quarter" /></StaggerItem>
        <StaggerItem variant="scaleIn"><MetricBig icon={<Clapperboard size={16} />} accent="brand" label="Total Output Volume" value={<>{outputVol} <span className="text-base text-lo font-normal">assets</span></>} foot={<span className="text-emerald font-medium flex items-center gap-1"><ArrowUp size={11} /> {Math.round(((outputVol - outputTarget) / outputTarget) * 100)}%</span>} footMuted={`vs target (${outputTarget})`} /></StaggerItem>
        <StaggerItem variant="scaleIn"><MetricBig icon={<ArrowLeftRight size={16} />} accent="cyan" label="Handoff Efficiency" value={`${handoff}%`} foot={<span className="text-mid font-medium">{handoff >= 95 ? "On track" : "Below target"}</span>} footMuted="Target: 95%" /></StaggerItem>
      </Stagger>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Reveal>
          <div className="bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)] h-full">
            <h2 className="font-display text-lg font-bold text-hi mb-6">Q2 Targets</h2>
            <div className="space-y-6">
              {goals.map((g) => (
                <div key={g.label} className="flex items-center gap-4">
                  <ProgressRing pct={g.pct} color={g.color} />
                  <div>
                    <h4 className="text-sm font-bold text-hi">{g.label}</h4>
                    <p className="text-xs text-mid mt-1">{g.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-2">
          <div className="bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-hi">Production Output vs Target</h2>
              <span className="text-xs text-lo bg-sunken border border-line rounded-lg px-3 py-1.5">Last 6 months</span>
            </div>
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} stroke="var(--text-lo)" fontSize={11} dy={4} />
                  <YAxis tickLine={false} axisLine={false} stroke="var(--text-lo)" fontSize={11} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="actual" name="Actual Output" stroke="var(--brand-500)" strokeWidth={3} dot={{ r: 4, fill: "var(--brand-500)" }} animationDuration={900} />
                  <Line type="monotone" dataKey="target" name="Target" stroke="var(--line-2)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.05}>
        <div className="bg-panel border border-line rounded-2xl overflow-hidden shadow-[var(--elev-card)]">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-hi">Team Scorecards</h2>
            <span className="text-lo text-xs">{scorecards.length} metric{scorecards.length === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sunken/50 text-lo text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Metric</th>
                  <th className="px-6 py-3 font-semibold">Owner</th>
                  <th className="px-6 py-3 font-semibold">Target</th>
                  <th className="px-6 py-3 font-semibold">Actual</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {scorecards.map((s, i) => (
                  <tr key={i} className="hover:bg-hover transition-colors">
                    <td className="px-6 py-4 font-medium text-hi">{s.metric}</td>
                    <td className="px-6 py-4 text-mid">{s.owner}</td>
                    <td className="px-6 py-4 text-mid">{s.target}</td>
                    <td className={`px-6 py-4 font-bold ${s.ok ? "text-hi" : "text-amber"}`}>{s.actual}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.ok ? "bg-emerald/15 text-emerald border border-emerald/20" : "bg-amber/15 text-amber border border-amber/20"}`}>{s.ok ? "On Track" : "Needs Attention"}</span>
                    </td>
                  </tr>
                ))}
                {scorecards.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-mid py-10 text-sm">No KPIs for this owner yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <AddKpiModal open={open} onClose={() => setOpen(false)} onAdd={addKpi} team={team} />
    </Shell>
  );
}

function MetricBig({ icon, accent, label, value, foot, footMuted }: { icon: React.ReactNode; accent: "emerald" | "brand" | "cyan"; label: string; value: React.ReactNode; foot: React.ReactNode; footMuted: string }) {
  const chip: Record<string, string> = { emerald: "bg-emerald/15 text-emerald", brand: "bg-brand-600/15 text-brand-400", cyan: "bg-cyan/15 text-cyan" };
  return (
    <div className="bg-panel border border-line rounded-2xl p-6 shadow-[var(--elev-card)] h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-mid text-sm font-medium mb-1">{label}</h3>
          <div className="text-3xl font-display font-bold text-hi num">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${chip[accent]}`}>{icon}</div>
      </div>
      <div className="flex items-center gap-2 text-sm">{foot}<span className="text-lo">{footMuted}</span></div>
    </div>
  );
}

function AddKpiModal({ open, onClose, onAdd, team }: { open: boolean; onClose: () => void; onAdd: (k: any) => void; team: any[] }) {
  void team;
  const [name, setName] = useState("");
  const [owner, setOwner] = useState<KpiOwnerRole>("owner");
  const [target, setTarget] = useState("");
  const [actual, setActual] = useState("");
  const [unit, setUnit] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(), owner, category: "Output", target: Number(target) || 0, actual: Number(actual) || 0,
      unit, isLowerBetter: false, isRatio: false, ratioNumerator: 0, ratioDenominator: 0,
      ratioNumeratorLabel: "", ratioDenominatorLabel: "", frequency: "Monthly", whyItMatters: "", notes: "", active: true,
    });
    setName(""); setTarget(""); setActual(""); setUnit("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add KPI" footer={<><Btn variant="subtle" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit}>Add KPI</Btn></>}>
      <Field label="Metric name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Scripts approved" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner">
          <select className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value as KpiOwnerRole)}>
            <option value="owner">Jevoy</option><option value="cfo">Adrienne</option><option value="pa">Shannen</option><option value="company">Team</option>
          </select>
        </Field>
        <Field label="Unit"><input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="/mo, %, $…" /></Field>
        <Field label="Target"><input className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <Field label="Actual"><input className={inputCls} value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
