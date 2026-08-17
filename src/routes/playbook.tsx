import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Reveal } from "@/components/motion/Motion";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import { PLAYBOOK_LOOPS } from "@/lib/types";
import type { PlaybookLoop, PlaybookPage } from "@/lib/types";
import {
  Plus, Search, ArrowRight, ArrowDownWideNarrow, ChevronDown, ClipboardList, Camera, Clapperboard,
  Scissors, Send, Handshake, Wallet, Megaphone, GraduationCap,
} from "lucide-react";

function PlaybookLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = /^\/playbook\/[^/]+/.test(pathname);
  return isChild ? <Outlet /> : <PlaybookIndex />;
}

export const Route = createFileRoute("/playbook")({
  component: PlaybookLayout,
  head: () => ({ meta: [{ title: "Playbooks · Production OS" }] }),
});

const LOOP_META: Record<PlaybookLoop, { icon: any; accent: string }> = {
  "Prep Loop": { icon: ClipboardList, accent: "brand" },
  "Gear Loop": { icon: Camera, accent: "cyan" },
  "Shoot Day Loop": { icon: Clapperboard, accent: "emerald" },
  "Edit Handoff Loop": { icon: Scissors, accent: "violet" },
  "Delivery Loop": { icon: Send, accent: "amber" },
  "Sales Loop": { icon: Handshake, accent: "rose" },
  "Finance Loop": { icon: Wallet, accent: "emerald" },
  "Content Loop": { icon: Megaphone, accent: "violet" },
  "Internal Training Loop": { icon: GraduationCap, accent: "cyan" },
};
const ACCENT_CLS: Record<string, { chip: string; text: string; bar: string; badge: string }> = {
  brand: { chip: "bg-brand-600/15 text-brand-400", text: "text-brand-400", bar: "bg-brand-500", badge: "bg-brand-600/10 text-brand-400 border-brand-500/20" },
  cyan: { chip: "bg-cyan/15 text-cyan", text: "text-cyan", bar: "bg-cyan", badge: "bg-cyan/10 text-cyan border-cyan/20" },
  emerald: { chip: "bg-emerald/15 text-emerald", text: "text-emerald", bar: "bg-emerald", badge: "bg-emerald/10 text-emerald border-emerald/20" },
  violet: { chip: "bg-violet/15 text-violet", text: "text-violet", bar: "bg-violet", badge: "bg-violet/10 text-violet border-violet/20" },
  amber: { chip: "bg-amber/15 text-amber", text: "text-amber", bar: "bg-amber", badge: "bg-amber/10 text-amber border-amber/20" },
  rose: { chip: "bg-rose/15 text-rose", text: "text-rose", bar: "bg-rose", badge: "bg-rose/10 text-rose border-rose/20" },
};
const OWNER: Record<string, { name: string; color: string }> = {
  owner: { name: "Jevoy", color: "var(--brand-600)" },
  cfo: { name: "Adrienne", color: "var(--accent-emerald)" },
  pa: { name: "Shannen", color: "var(--accent-violet)" },
  company: { name: "Team", color: "var(--accent-cyan)" },
};

function isComplete(p: PlaybookPage) {
  return (p.content?.length ?? 0) > 60 && p.checklist.length > 0 && Boolean(p.definitionOfDone);
}
function relTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
}

function PlaybookIndex() {
  const pages = useStore((s) => s.playbook);
  const upsert = useStore((s) => s.upsertPlaybookPage);
  const [q, setQ] = useState("");
  const [loopFilter, setLoopFilter] = useState<PlaybookLoop | "all">("all");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<PlaybookLoop>>(new Set());
  const toggleCollapse = (l: PlaybookLoop) => setCollapsed((prev) => { const n = new Set(prev); n.has(l) ? n.delete(l) : n.add(l); return n; });

  const filtered = useMemo(
    () => pages.filter((p) =>
      (!q || p.title.toLowerCase().includes(q.toLowerCase()) || p.purpose?.toLowerCase().includes(q.toLowerCase())) &&
      (loopFilter === "all" || p.loops.includes(loopFilter)),
    ),
    [pages, q, loopFilter],
  );

  const sections = useMemo(() => {
    return PLAYBOOK_LOOPS.map((loop) => {
      const items = filtered.filter((p) => p.loops.includes(loop));
      const complete = items.filter(isComplete).length;
      return { loop, items, coverage: items.length ? Math.round((complete / items.length) * 100) : 0, complete };
    }).filter((s) => s.items.length > 0);
  }, [filtered]);

  const overallComplete = pages.filter(isComplete).length;
  const overallPct = pages.length ? Math.round((overallComplete / pages.length) * 100) : 0;
  const recent = [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <Shell title="Playbooks" subtitle="Institutional knowledge, organized by loop.">
      {/* Utility bar */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search playbooks, procedures, topics…" className="ph-input" style={{ paddingLeft: 34 }} />
        </div>
        <div className="flex items-center gap-2">
          <select value={loopFilter} onChange={(e) => setLoopFilter(e.target.value as PlaybookLoop | "all")} className="bg-sunken border border-line text-hi text-[13px] rounded-lg px-2.5 h-8 focus:outline-none focus:border-brand-500 max-w-[160px]">
            <option value="all">All Loops</option>
            {PLAYBOOK_LOOPS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <span className="ph-btn ph-btn-soft ph-btn-sm hidden sm:inline-flex"><ArrowDownWideNarrow size={12} /> Last Updated</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-lo text-xs hidden md:inline">{pages.length} playbooks</span>
          <Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5 shrink-0"><Plus className="size-3.5" /> <span className="hidden sm:inline">New Playbook</span></Btn>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sections */}
        <div className="flex-1 min-w-0 space-y-7">
          {sections.length === 0 && (
            <div className="border border-dashed border-line rounded-xl py-12 text-center text-mid text-[13px]">No playbooks match that search.</div>
          )}
          {sections.map(({ loop, items, coverage }) => {
            const m = LOOP_META[loop];
            const a = ACCENT_CLS[m.accent];
            const Icon = m.icon;
            const isCollapsed = collapsed.has(loop);
            return (
              <Reveal key={loop}>
                <section>
                  <div className="flex items-center gap-2.5 mb-3">
                    <button onClick={() => toggleCollapse(loop)} className="flex items-center gap-3 min-w-0 group/h" aria-label={isCollapsed ? "Expand" : "Collapse"}>
                      <ChevronDown size={15} className={`text-lo transition-transform flex-shrink-0 ${isCollapsed ? "-rotate-90" : ""}`} />
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.chip}`}><Icon size={14} /></div>
                      <h2 className="font-display text-[15px] font-bold text-hi tracking-tight truncate group-hover/h:text-brand-400 transition-colors">{loop}</h2>
                      <span className="text-lo text-xs font-medium hidden sm:inline">· {items.length}</span>
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="w-16 sm:w-24 h-1.5 bg-sunken rounded-full overflow-hidden"><div className={`h-full rounded-full ${a.bar}`} style={{ width: `${coverage}%` }} /></div>
                      <span className={`text-[11px] font-semibold tabular-nums ${a.text}`}>{coverage}%</span>
                    </div>
                  </div>
                  {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {items.map((p) => {
                      const owner = OWNER[p.ownerRole] ?? OWNER.company;
                      return (
                        <Link key={p.slug} to="/playbook/$slug" params={{ slug: p.slug }}
                          className="group/card bg-panel border border-line rounded-lg p-3.5 hover:border-brand-500/40 transition-all flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${a.chip}`}><Icon size={13} /></div>
                            <h3 className="font-semibold text-hi text-[13px] leading-snug line-clamp-2 min-w-0 flex-1">{p.title}</h3>
                            <ArrowRight size={13} className={`${a.text} mt-1 opacity-0 -translate-x-1 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all flex-shrink-0`} />
                          </div>
                          <p className="text-mid text-[11.5px] leading-relaxed line-clamp-2">{p.purpose || "No summary yet — open to document this SOP."}</p>
                          <div className="flex items-center gap-2 pt-2 border-t border-line mt-auto">
                            <span className="w-4.5 h-4.5 min-w-[18px] h-[18px] rounded-full grid place-items-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: owner.color }}>{owner.name[0]}</span>
                            <span className="text-lo text-[11px] truncate">{relTime(p.updatedAt)}</span>
                            <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${a.badge}`}>{loop.replace(" Loop", "")}</span>
                          </div>
                        </Link>
                      );
                    })}
                    {/* add card */}
                    <button onClick={() => setOpen(true)} className="border border-dashed border-line rounded-lg p-3.5 flex items-center gap-2 hover:border-brand-500/50 hover:bg-brand-600/5 transition-all text-left group/add">
                      <div className="w-7 h-7 rounded-md bg-sunken group-hover/add:bg-brand-600/15 flex items-center justify-center transition-colors shrink-0"><Plus size={14} className="text-lo group-hover/add:text-brand-400" /></div>
                      <span className="text-mid text-[12.5px] font-medium">Add {loop.replace(" Loop", "")} playbook</span>
                    </button>
                  </div>
                  )}
                </section>
              </Reveal>
            );
          })}
        </div>

        {/* Coverage rail */}
        <aside className="w-64 flex-shrink-0 hidden xl:block">
          <div className="sticky top-0 space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-lo uppercase tracking-wider mb-1">Documentation Coverage</h3>
              <p className="text-lo text-xs leading-relaxed">How completely each loop is documented.</p>
            </div>
            <div className="space-y-4">
              {sections.map(({ loop, items, coverage, complete }) => {
                const a = ACCENT_CLS[LOOP_META[loop].accent];
                return (
                  <div key={loop} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-mid text-xs font-semibold truncate">{loop}</span>
                      <span className={`text-xs font-bold ${a.text}`}>{coverage}%</span>
                    </div>
                    <div className="w-full h-2 bg-sunken rounded-full overflow-hidden"><div className={`h-full rounded-full ${a.bar}`} style={{ width: `${coverage}%` }} /></div>
                    <p className="text-lo text-[11px]">{complete} of {items.length} complete</p>
                  </div>
                );
              })}
            </div>
            <div className="pt-5 border-t border-line">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-hi">Overall Coverage</span>
                <span className="text-xs font-bold text-brand-400">{overallPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-sunken rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${overallPct}%` }} /></div>
              <p className="text-lo text-[11px] mt-2">{overallComplete} of {pages.length} SOPs complete</p>
            </div>
            <div className="pt-5 border-t border-line">
              <h4 className="text-[10px] font-bold text-lo uppercase tracking-wider mb-3">Recently Updated</h4>
              <div className="space-y-3">
                {recent.map((p) => {
                  const owner = OWNER[p.ownerRole] ?? OWNER.company;
                  return (
                    <Link key={p.slug} to="/playbook/$slug" params={{ slug: p.slug }} className="flex items-center gap-2 group/r">
                      <span className="w-6 h-6 rounded-full grid place-items-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: owner.color }}>{owner.name[0]}</span>
                      <div className="min-w-0">
                        <p className="text-mid group-hover/r:text-hi text-xs font-medium truncate transition-colors">{p.title}</p>
                        <p className="text-lo text-[11px]">{relTime(p.updatedAt)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 text-xs font-semibold rounded-lg py-2.5 transition-colors">
              <Plus size={12} /> Add Playbook
            </button>
          </div>
        </aside>
      </div>

      <NewPage open={open} onClose={() => setOpen(false)} upsert={upsert} />
    </Shell>
  );
}

function NewPage({ open, onClose, upsert }: { open: boolean; onClose: () => void; upsert: (p: PlaybookPage) => void }) {
  const [title, setTitle] = useState("");
  const [loop, setLoop] = useState<PlaybookLoop>(PLAYBOOK_LOOPS[0]);
  const submit = () => {
    if (!title.trim()) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    upsert({
      slug, title, loops: [loop], purpose: "", ownerRole: "company", whenToUse: "", trigger: "",
      inputsNeeded: "", content: `# ${title}\n\nWrite SOP here.`, checklist: [], definitionOfDone: "",
      commonMistakes: "", updatedAt: new Date().toISOString(),
    });
    setTitle("");
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="New playbook page"
      footer={<><Btn variant="subtle" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit}>Create</Btn></>}>
      <Field label="Title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Primary Loop">
        <select className={inputCls} value={loop} onChange={(e) => setLoop(e.target.value as PlaybookLoop)}>
          {PLAYBOOK_LOOPS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
    </Modal>
  );
}
