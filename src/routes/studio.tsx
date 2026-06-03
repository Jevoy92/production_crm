import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { Stagger, StaggerItem } from "@/components/motion/Motion";
import { useStudioStore, wordCount, runtimeEstimate } from "@/lib/studioStore";
import { Plus, Clapperboard, Trash2, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/studio")({
  component: StudioLayout,
  head: () => ({ meta: [{ title: "Studio · Production OS" }] }),
});

function StudioLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/studio") return <Outlet />;
  return <StudioList />;
}

const STATUS_TONE: Record<string, string> = {
  "Client Approved": "text-emerald bg-emerald/10 border-emerald/20",
  Draft: "text-mid bg-sunken border-line",
  "In Review": "text-amber bg-amber/10 border-amber/20",
};

function StudioList() {
  const scripts = useStudioStore((s) => s.scripts);
  const createScript = useStudioStore((s) => s.createScript);
  const del = useStudioStore((s) => s.deleteScript);
  const navigate = useNavigate();

  const create = () => {
    const id = createScript();
    navigate({ to: "/studio/$id", params: { id } });
  };

  return (
    <Shell
      title="Studio"
      subtitle="Script & idea drafting workspace"
      actions={
        <button onClick={create} className="ph-btn ph-btn-primary ph-btn-sm flex items-center gap-1.5">
          <Plus size={14} /> New script
        </button>
      }
    >
      {scripts.length === 0 ? (
        <div className="bg-panel border border-line rounded-2xl py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sunken mx-auto mb-3 flex items-center justify-center"><Clapperboard size={20} className="text-lo" /></div>
          <div className="text-hi font-semibold text-sm mb-1">No scripts yet</div>
          <div className="text-mid text-sm mb-4">Create one and the scene editor opens with a starter template.</div>
          <button onClick={create} className="ph-btn ph-btn-primary ph-btn-sm inline-flex items-center gap-1.5"><Plus size={14} /> New script</button>
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" stagger={0.05}>
          {scripts.map((s) => (
            <StaggerItem key={s.id} variant="scaleIn">
              <div className="group bg-panel border border-line rounded-2xl p-5 hover:border-brand-500/40 transition-all flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center"><Clapperboard size={16} className="text-brand-400" /></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_TONE[s.status] ?? STATUS_TONE.Draft}`}>{s.status}</span>
                </div>
                <Link to="/studio/$id" params={{ id: s.id }} className="font-display font-bold text-hi text-base leading-snug mb-1 hover:text-brand-300 transition-colors line-clamp-2">{s.title}</Link>
                <div className="text-lo text-xs mb-4 capitalize">{s.brand.replace("-", " ")} · {s.version}</div>
                <div className="mt-auto pt-3 border-t border-line flex items-center gap-3 text-lo text-xs">
                  <span className="flex items-center gap-1"><FileText size={11} /> {s.scenes.length} scenes</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {runtimeEstimate(s)}</span>
                  <span>{wordCount(s).toLocaleString()} words</span>
                  <button onClick={() => { if (confirm(`Delete "${s.title}"?`)) del(s.id); }} className="ml-auto text-lo hover:text-rose transition-colors" aria-label="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Shell>
  );
}
