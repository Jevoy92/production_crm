import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { useStore } from "@/lib/store";
import type { TrackedKpi, KpiOwnerRole, KpiCategory, KpiFrequency } from "@/lib/types";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import {
  TrendingUp,
  Plus,
  Target,
  BarChart,
  Check,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/scoreboard")({
  component: ScoreboardPage,
  head: () => ({ meta: [{ title: "Scoreboard · Palmer House" }] }),
});

const OWNERS: { role: KpiOwnerRole; label: string }[] = [
  { role: "owner", label: "Jevoy" },
  { role: "cfo", label: "Adrienne" },
  { role: "pa", label: "Shannen" },
];

function ScoreboardPage() {
  const kpis = useStore((s) => s.trackedKpis);
  const updateKpi = useStore((s) => s.updateKpi);
  const [activeTab, setActiveTab] = useState<KpiOwnerRole | "all">("all");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = activeTab === "all" ? kpis : kpis.filter((k) => k.owner === activeTab);

  return (
    <>
      <Shell
        title="KPI Scoreboard"
        subtitle="Tracking the nervous system of the company — handoffs, targets, and output."
        actions={
          <Btn variant="primary" onClick={() => setNewOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add KPI
          </Btn>
        }
      >
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-gray-800 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All Scorecards
          </button>
          {OWNERS.map((o) => (
            <button
              key={o.role}
              onClick={() => setActiveTab(o.role)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === o.role
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} onUpdate={(patch) => updateKpi(kpi.id, patch)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-gray-400">
              No active KPIs for this view.
            </div>
          )}
        </div>
      </Shell>
      {newOpen && <NewKpiModal onClose={() => setNewOpen(false)} />}
    </>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ kpi, onUpdate }: { kpi: TrackedKpi; onUpdate: (patch: Partial<TrackedKpi>) => void }) {
  const [editing, setEditing] = useState(false);
  const [act, setAct] = useState(String(kpi.actual));
  const [num, setNum] = useState(String(kpi.ratioNumerator));
  const [den, setDen] = useState(String(kpi.ratioDenominator));

  const removeKpi = useStore((s) => s.removeKpi);

  const save = () => {
    if (kpi.isRatio) {
      onUpdate({ ratioNumerator: Number(num) || 0, ratioDenominator: Number(den) || 0 });
    } else {
      onUpdate({ actual: Number(act) || 0 });
    }
    setEditing(false);
  };

  const progress = kpi.isRatio
    ? kpi.ratioDenominator > 0
      ? (kpi.ratioNumerator / kpi.ratioDenominator) * 100
      : 0
    : kpi.target > 0
      ? (kpi.actual / kpi.target) * 100
      : 0;
  
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  // If lower is better, high progress is bad (e.g. outstanding invoices)
  const isGood = kpi.isLowerBetter ? pct <= 100 : pct >= 80;
  const colorCls = isGood ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col group relative">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={() => setEditing(!editing)} className="p-1 text-gray-400 hover:text-primary rounded">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => { if(confirm("Delete this KPI?")) removeKpi(kpi.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {kpi.category}
        </span>
        <span className="text-[10px] font-medium text-gray-400">{kpi.frequency}</span>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 leading-snug pr-10">{kpi.name}</h3>
      <p className="text-[11px] text-gray-500 mt-1 mb-4 line-clamp-2 min-h-[32px]">{kpi.whyItMatters}</p>

      {editing ? (
        <div className="mt-auto bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-xl border-t border-gray-100">
          {kpi.isRatio ? (
            <div className="flex items-center gap-2">
              <input className={inputCls + " text-center px-1"} value={num} onChange={e=>setNum(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") save();}} autoFocus />
              <span className="text-gray-400 font-medium">/</span>
              <input className={inputCls + " text-center px-1"} value={den} onChange={e=>setDen(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") save();}} />
              <button onClick={save} className="bg-primary text-white p-1.5 rounded-md hover:opacity-90 shrink-0"><Check className="w-4 h-4"/></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input className={inputCls} value={act} onChange={e=>setAct(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") save();}} autoFocus placeholder="Actual" />
              <button onClick={save} className="bg-primary text-white p-1.5 rounded-md hover:opacity-90 shrink-0"><Check className="w-4 h-4"/></button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-auto pt-3 border-t border-gray-50" onClick={() => setEditing(true)}>
          {kpi.isRatio ? (
            <div className="flex items-end justify-between cursor-pointer group/stat">
              <div>
                <div className="text-2xl font-bold text-gray-900 group-hover/stat:text-primary transition-colors">
                  {kpi.ratioNumerator} <span className="text-sm font-medium text-gray-400">/ {kpi.ratioDenominator}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {kpi.ratioNumeratorLabel} vs {kpi.ratioDenominatorLabel}
                </div>
              </div>
              <div className={`text-lg font-bold ${isGood ? "text-emerald-600" : "text-amber-600"}`}>
                {pct}%
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between cursor-pointer group/stat">
              <div>
                <div className="text-2xl font-bold text-gray-900 group-hover/stat:text-primary transition-colors">
                  {kpi.actual}{kpi.unit} <span className="text-sm font-medium text-gray-400">/ {kpi.target}{kpi.unit}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Actual vs Target</div>
              </div>
              <div className={`text-lg font-bold ${isGood ? "text-emerald-600" : "text-amber-600"}`}>
                {pct}%
              </div>
            </div>
          )}
          
          <div className="mt-2.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${colorCls}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New KPI Modal ────────────────────────────────────────────────────────────

function NewKpiModal({ onClose }: { onClose: () => void }) {
  const addKpi = useStore((s) => s.addKpi);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState<KpiOwnerRole>("owner");
  const [category, setCat] = useState<KpiCategory>("Sales");
  const [freq, setFreq] = useState<KpiFrequency>("Weekly");
  const [why, setWhy] = useState("");
  const [isRatio, setIsRatio] = useState(true);

  // Ratio mode
  const [numLabel, setNumLabel] = useState("booked");
  const [denLabel, setDenLabel] = useState("calls");

  // Numeric mode
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

  const save = () => {
    if (!name.trim()) return;
    addKpi({
      name,
      owner,
      category,
      frequency: freq,
      whyItMatters: why,
      isRatio,
      ratioNumeratorLabel: numLabel,
      ratioDenominatorLabel: denLabel,
      ratioNumerator: 0,
      ratioDenominator: 0,
      target: Number(target) || 0,
      actual: 0,
      unit,
      isLowerBetter: false,
      notes: "",
      active: true,
    });
    onClose();
  };

  return (
    <Modal title="Create Custom KPI" open={true} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="KPI Name">
          <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Deposit Collection Rate" autoFocus />
        </Field>
        <Field label="Owner">
          <select className={inputCls} value={owner} onChange={e=>setOwner(e.target.value as KpiOwnerRole)}>
            {OWNERS.map(o => <option key={o.role} value={o.role}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Category">
          <select className={inputCls} value={category} onChange={e=>setCat(e.target.value as KpiCategory)}>
            {["Sales", "Content", "Production", "Finance", "Operations", "Client Experience", "Systems"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Frequency">
          <select className={inputCls} value={freq} onChange={e=>setFreq(e.target.value as KpiFrequency)}>
            {["Daily", "Weekly", "Monthly", "Per Project", "Quarterly"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Why it matters">
        <input className={inputCls} value={why} onChange={e=>setWhy(e.target.value)} placeholder="e.g. Are booked clients actually committed?" />
      </Field>

      <div className="my-4 border-t border-gray-100" />

      <Field label="Tracking Method">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={isRatio} onChange={() => setIsRatio(true)} className="accent-primary" />
            Ratio (X vs Y)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!isRatio} onChange={() => setIsRatio(false)} className="accent-primary" />
            Target (Number)
          </label>
        </div>
      </Field>

      {isRatio ? (
        <div className="grid grid-cols-2 gap-3 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <Field label="Numerator Label (The Goal)">
            <input className={inputCls} value={numLabel} onChange={e=>setNumLabel(e.target.value)} placeholder="e.g. deposits paid" />
          </Field>
          <Field label="Denominator Label (The Total)">
            <input className={inputCls} value={denLabel} onChange={e=>setDenLabel(e.target.value)} placeholder="e.g. projects booked" />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <Field label="Target Number">
            <input className={inputCls} value={target} onChange={e=>setTarget(e.target.value)} placeholder="e.g. 10" />
          </Field>
          <Field label="Unit (optional)">
            <input className={inputCls} value={unit} onChange={e=>setUnit(e.target.value)} placeholder="e.g. $, posts, videos" />
          </Field>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save} disabled={!name.trim()}>Save KPI</Btn>
      </div>
    </Modal>
  );
}
