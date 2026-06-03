import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore, palColor } from "@/lib/store";
import { PAL_TYPES, CHECKLIST_STAGES } from "@/lib/types";
import type { PalType, ChecklistStage } from "@/lib/types";
import { SCRIPTS } from "@/lib/scriptsIndex";
import {
  Plus, Trash2, RotateCcw, Layers, Zap, Users, Clock, FileText, FolderTree, Palette,
  Bolt, PenSquare, MoreVertical, ArrowUp, ArrowDown,
} from "lucide-react";

export const Route = createFileRoute("/admin/templates")({
  component: TemplatesPage,
  head: () => ({ meta: [{ title: "Templates · Production OS" }] }),
});

type Category = "scripts" | "project" | "brand";
type Tpl = {
  id: string; title: string; desc: string; category: Category;
  owner: string; uses: number; popular?: boolean; pal?: PalType; link?: string;
};

const CAT_META: Record<Category, { label: string; icon: any; tint: string; text: string }> = {
  scripts: { label: "Script", icon: FileText, tint: "from-brand-500/15 to-brand-500/5", text: "text-brand-400" },
  project: { label: "Project", icon: FolderTree, tint: "from-emerald/15 to-emerald/5", text: "text-emerald" },
  brand: { label: "Brand", icon: Palette, tint: "from-amber/15 to-amber/5", text: "text-amber" },
};

function TemplatesPage() {
  const templates = useStore((s) => s.templates);
  const setTemplate = useStore((s) => s.setTemplate);
  const resetTemplates = useStore((s) => s.resetTemplates);
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);

  const [filter, setFilter] = useState<Category | "all">("all");
  const [editPal, setEditPal] = useState<PalType | null>(null);

  // Build the library intelligently from real data.
  const library = useMemo<Tpl[]>(() => {
    const projectTpls: Tpl[] = PAL_TYPES.map((p) => ({
      id: `proj-${p}`,
      title: `${p} Production Workflow`,
      desc: `4-stage checklist (Pre-Pro → Shoot → Post → Delivery) cloned into every new ${p} project.`,
      category: "project",
      owner: "Jevoy",
      uses: projects.filter((x) => x.palType === p).length,
      pal: p,
    }));
    const scriptTpls: Tpl[] = SCRIPTS.slice(0, 4).map((s, i) => ({
      id: `scr-${s.num}`,
      title: s.title,
      desc: `Long-form script blueprint — hook, body, and CTA structure, ready to repurpose into shorts.`,
      category: "scripts",
      owner: "Adrienne",
      uses: 60 - i * 11,
      popular: i === 0,
      link: "/repurpose",
    }));
    const brandTpls: Tpl[] = [
      { id: "brand-kit", title: "Brand Color & Typography Kit", desc: "Palette, font pairings, and usage guidelines for client packages.", category: "brand", owner: "Shannen", uses: 29, link: "/brand" },
      { id: "brand-social", title: "Social Media Brand Pack", desc: "Profile images, banners, and post overlays for every platform.", category: "brand", owner: "Shannen", uses: 41, link: "/brand" },
      { id: "brand-deck", title: "Brand Style Guide Deck", desc: "Logo usage, do/don'ts, and voice guidelines in a shareable deck.", category: "brand", owner: "Shannen", uses: 33, link: "/brand" },
    ];
    return [...scriptTpls, ...projectTpls, ...brandTpls];
  }, [projects]);

  const counts = {
    all: library.length,
    scripts: library.filter((t) => t.category === "scripts").length,
    project: library.filter((t) => t.category === "project").length,
    brand: library.filter((t) => t.category === "brand").length,
  };
  const totalUses = library.reduce((a, t) => a + t.uses, 0);
  const visible = filter === "all" ? library : library.filter((t) => t.category === filter);

  const stats = [
    { icon: <Layers size={15} />, tint: "bg-brand-600/15 text-brand-400", value: library.length, label: "Total Templates" },
    { icon: <Zap size={15} />, tint: "bg-emerald/15 text-emerald", value: totalUses, label: "Total Uses" },
    { icon: <Users size={15} />, tint: "bg-cyan/15 text-cyan", value: new Set(library.map((t) => t.owner)).size, label: "Contributors" },
    { icon: <Clock size={15} />, tint: "bg-amber/15 text-amber", value: "2d", label: "Last Updated" },
  ];

  const FILTERS: { key: Category | "all"; label: string }[] = [
    { key: "all", label: "All Templates" },
    { key: "scripts", label: "Scripts" },
    { key: "project", label: "Project Structures" },
    { key: "brand", label: "Brand Assets" },
  ];

  return (
    <Shell
      title="Templates Library"
      subtitle="Reusable blueprints for scripts, project structures, and brand assets."
      actions={
        <Btn variant="subtle" onClick={() => { if (confirm("Reset checklist templates to defaults?")) resetTemplates(); }} className="flex items-center gap-1.5">
          <RotateCcw className="size-3.5" /> Reset checklists
        </Btn>
      }
    >
      {/* Stats */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7" stagger={0.05}>
        {stats.map((s) => (
          <StaggerItem key={s.label} variant="scaleIn">
            <div className="bg-panel border border-line rounded-xl px-5 py-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.tint}`}>{s.icon}</div>
              <div>
                <div className="text-2xl font-display font-bold text-hi num">{s.value}</div>
                <div className="text-lo text-xs">{s.label}</div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${filter === f.key ? "bg-brand-600 text-white" : "bg-sunken text-mid hover:text-hi border border-line"}`}>
            {f.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-white/25 text-white" : "bg-panel text-mid"}`}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" stagger={0.04}>
        <StaggerItem variant="scaleIn">
          <button className="create-new w-full h-full min-h-[300px] border-2 border-dashed border-line rounded-2xl flex flex-col items-center justify-center group hover:border-brand-500/50 hover:bg-brand-600/5 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-sunken group-hover:bg-brand-600/15 flex items-center justify-center mb-4 transition-colors"><Plus size={22} className="text-lo group-hover:text-brand-400 transition-colors" /></div>
            <div className="font-semibold text-hi text-base mb-1">Create New Template</div>
            <div className="text-lo text-sm text-center px-6">Start from scratch or import an existing document</div>
            <span className="mt-5 px-5 py-2 bg-panel border border-line group-hover:border-brand-500/40 group-hover:text-brand-400 text-mid text-sm font-medium rounded-full transition-colors">Get Started</span>
          </button>
        </StaggerItem>

        {visible.map((t) => {
          const cm = CAT_META[t.category];
          const Icon = cm.icon;
          const member = team.find((m) => t.owner.startsWith(m.name.split(" ")[0]));
          return (
            <StaggerItem key={t.id} variant="scaleIn">
              <div className="group/card bg-panel border border-line rounded-2xl overflow-hidden hover:border-brand-500/40 hover:shadow-[var(--elev-hover)] transition-all flex flex-col h-full">
                {/* Thumbnail */}
                <div className={`relative h-44 bg-gradient-to-br ${cm.tint} flex items-center justify-center`}>
                  <span className="absolute top-3 left-3 bg-panel/80 backdrop-blur text-mid text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-line"><Icon size={10} /> {cm.label}</span>
                  {t.popular && <span className="absolute top-3 right-3 bg-brand-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">Popular</span>}
                  <ThumbMock category={t.category} />
                  {/* hover actions */}
                  <div className="absolute inset-0 bg-app/70 backdrop-blur-sm flex items-center justify-center gap-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    {t.link ? (
                      <Link to={t.link} className="ph-btn ph-btn-primary ph-btn-sm flex items-center gap-1.5"><Bolt size={12} /> Quick Use</Link>
                    ) : (
                      <button onClick={() => t.pal && setEditPal(t.pal)} className="ph-btn ph-btn-primary ph-btn-sm flex items-center gap-1.5"><Bolt size={12} /> Quick Use</button>
                    )}
                    <button onClick={() => t.pal ? setEditPal(t.pal) : undefined} className="ph-btn ph-btn-soft ph-btn-sm flex items-center gap-1.5"><PenSquare size={12} /> Edit</button>
                  </div>
                </div>
                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-hi text-sm leading-tight">{t.title}</h3>
                    <button className="w-7 h-7 rounded-lg hover:bg-hover flex items-center justify-center text-lo flex-shrink-0"><MoreVertical size={13} /></button>
                  </div>
                  <p className="text-mid text-xs mb-3 leading-relaxed flex-1 line-clamp-2">{t.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full grid place-items-center text-[8px] font-bold text-white" style={{ background: member?.color ?? "var(--brand-600)" }}>{(t.owner[0] ?? "?")}</span>
                      <span className="text-lo text-xs">{t.owner}</span>
                    </div>
                    <span className="flex items-center gap-1 text-lo text-xs"><Bolt size={10} /> {t.uses} uses</span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      <ChecklistEditorModal
        pal={editPal}
        onClose={() => setEditPal(null)}
        templates={templates}
        setTemplate={setTemplate}
      />
    </Shell>
  );
}

function ThumbMock({ category }: { category: Category }) {
  if (category === "scripts") {
    return (
      <div className="w-28 bg-panel rounded-xl shadow-[var(--elev-card)] p-3 space-y-2 border border-line">
        <div className="h-2 bg-brand-300 rounded w-full" />
        <div className="h-2 bg-line-strong rounded w-4/5" />
        <div className="h-2 bg-line-strong rounded w-full" />
        <div className="h-2 bg-line rounded w-3/5" />
        <div className="h-2 bg-brand-200 rounded w-full" />
      </div>
    );
  }
  if (category === "project") {
    return (
      <div className="flex flex-col gap-1.5 w-32">
        {["bg-emerald", "bg-cyan", "bg-emerald/70", "bg-line-strong"].map((c, i) => (
          <div key={i} className={`bg-panel border border-line rounded-lg shadow-sm px-3 py-1.5 flex items-center gap-2 ${i > 0 ? "ml-3" : ""}`}>
            <div className={`w-3 h-3 rounded ${c} flex-shrink-0`} />
            <div className="h-1.5 bg-line-strong rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-lg bg-brand-500 shadow-md" />
      <div className="w-8 h-12 rounded-lg bg-amber shadow-md" />
      <div className="w-8 h-6 rounded-lg bg-emerald shadow-md" />
      <div className="w-8 h-10 rounded-lg bg-cyan shadow-md" />
    </div>
  );
}

function ChecklistEditorModal({
  pal, onClose, templates, setTemplate,
}: {
  pal: PalType | null;
  onClose: () => void;
  templates: Record<PalType, Record<ChecklistStage, string[]>>;
  setTemplate: (pal: PalType, stage: ChecklistStage, items: string[]) => void;
}) {
  const [stage, setStage] = useState<ChecklistStage>("Pre-Production");
  const [newItem, setNewItem] = useState("");
  if (!pal) return null;
  const items = templates[pal][stage];
  const commit = (next: string[]) => setTemplate(pal, stage, next);

  return (
    <Modal open={!!pal} onClose={onClose} title={`${pal} · Checklist Template`} wide
      footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: palColor(pal) }} />
        <span className="text-xs text-mid">New {pal} projects clone these items.</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3 rounded-xl bg-sunken border border-line p-1 w-fit">
        {CHECKLIST_STAGES.map((s) => (
          <button key={s} onClick={() => setStage(s)} className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${stage === s ? "bg-brand-600 text-white" : "text-mid hover:text-hi"}`}>{s}</button>
        ))}
      </div>
      <ul className="space-y-1.5 max-h-[40vh] overflow-y-auto">
        {items.map((text, i) => (
          <li key={i} className="flex items-center gap-2 group">
            <span className="num text-[11px] text-lo w-5">{i + 1}.</span>
            <input className={inputCls + " flex-1"} value={text} onChange={(e) => commit(items.map((x, idx) => (idx === i ? e.target.value : x)))} />
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button onClick={() => { if (i > 0) { const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; commit(n); } }} className="ph-btn ph-btn-soft ph-btn-icon ph-btn-sm"><ArrowUp size={12} /></button>
              <button onClick={() => { if (i < items.length - 1) { const n = [...items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; commit(n); } }} className="ph-btn ph-btn-soft ph-btn-icon ph-btn-sm"><ArrowDown size={12} /></button>
              <button onClick={() => commit(items.filter((_, idx) => idx !== i))} className="ph-btn ph-btn-soft ph-btn-icon ph-btn-sm hover:text-rose"><Trash2 size={12} /></button>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); if (newItem.trim()) { commit([...items, newItem.trim()]); setNewItem(""); } }} className="mt-3 flex gap-2">
        <input className={inputCls} value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add new checklist item…" />
        <Btn variant="primary" type="submit"><Plus className="size-3.5" /></Btn>
      </form>
    </Modal>
  );
}
