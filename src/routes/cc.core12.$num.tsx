import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav, LaneBadge, StatusBadge } from "@/components/cc/CCNav";
import { useCCStore, CC_STATUSES, PAL_LANES, PLATFORMS, type CCStatus, type PalLane, type Platform } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/core12/$num")({
  component: Core12Detail,
  head: () => ({ meta: [{ title: "Core 12 detail · Content Command Center" }] }),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

const input = "w-full bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary";
const ta = input + " min-h-[80px] resize-y";

function Core12Detail() {
  const { num } = useParams({ from: "/cc/core12/$num" });
  const core = useCCStore((s) => s.core12.find((c) => c.number === Number(num)));
  const update = useCCStore((s) => s.updateCore12);

  if (!core) return <Shell title="Not found"><CCNav /><div>Core 12 #{num} not found.</div></Shell>;

  const upd = (patch: any) => update(core.id, patch);

  return (
    <Shell title={`#${core.number}: ${core.title}`} subtitle={core.series}>
      <CCNav />
      <Link to="/cc/core12" className="text-[12px] text-primary mb-3 inline-block">← Back to Core 12</Link>

      <div className="flex items-center gap-2 mb-4">
        <LaneBadge lane={core.palLane} />
        <StatusBadge status={core.status} />
        <span className="text-[11px] text-muted-foreground">Last updated {new Date(core.updatedAt).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-elevated rounded-xl p-4 space-y-3">
            <Field label="Title"><input className={input} value={core.title} onChange={(e) => upd({ title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Series"><input className={input} value={core.series} onChange={(e) => upd({ series: e.target.value })} /></Field>
              <Field label="Pal Lane">
                <select className={input} value={core.palLane} onChange={(e) => upd({ palLane: e.target.value as PalLane })}>
                  {PAL_LANES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary platform">
                <select className={input} value={core.primaryPlatform} onChange={(e) => upd({ primaryPlatform: e.target.value as Platform })}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={input} value={core.status} onChange={(e) => upd({ status: e.target.value as CCStatus })}>
                  {CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Business purpose"><textarea className={ta} value={core.businessPurpose} onChange={(e) => upd({ businessPurpose: e.target.value })} /></Field>
            <Field label="Hypothesis"><textarea className={ta} value={core.hypothesis} onChange={(e) => upd({ hypothesis: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hook"><input className={input} value={core.hook} onChange={(e) => upd({ hook: e.target.value })} /></Field>
              <Field label="CTA"><input className={input} value={core.cta} onChange={(e) => upd({ cta: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Audience"><input className={input} value={core.audience} onChange={(e) => upd({ audience: e.target.value })} /></Field>
              <Field label="Website placement"><input className={input} value={core.websitePlacement} onChange={(e) => upd({ websitePlacement: e.target.value })} /></Field>
            </div>
            <Field label="Shoot date"><input type="date" className={input} value={core.shootDate ?? ""} onChange={(e) => upd({ shootDate: e.target.value })} /></Field>
          </div>

          <div className="card-elevated rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Shorts hooks</div>
            <ul className="space-y-1.5">
              {core.shortsHooks.map((h, i) => (
                <li key={i} className="text-[13px] flex gap-2">
                  <span className="num text-muted-foreground">{i + 1}.</span>
                  <span className="italic">"{h}"</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Editor notes"><textarea className={ta} value={core.editorNotes} onChange={(e) => upd({ editorNotes: e.target.value })} /></Field>
            <Field label="Shannen notes"><textarea className={ta} value={core.shannenNotes} onChange={(e) => upd({ shannenNotes: e.target.value })} /></Field>
            <Field label="Jevoy notes"><textarea className={ta} value={core.jevoyNotes} onChange={(e) => upd({ jevoyNotes: e.target.value })} /></Field>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-elevated rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Production checklist</div>
            {[
              { k: "scriptDone" as const, label: "Script ready" },
              { k: "filmedDone" as const, label: "Filmed" },
              { k: "editorDone" as const, label: "Editor finished" },
              { k: "thumbnailDone" as const, label: "Thumbnail done" },
              { k: "captionDone" as const, label: "Caption written" },
              { k: "publishedDone" as const, label: "Published" },
            ].map((f) => (
              <label key={f.k} className="flex items-center gap-2 py-1.5 text-[13px] cursor-pointer">
                <input type="checkbox" checked={(core as any)[f.k]} onChange={(e) => upd({ [f.k]: e.target.checked })} className="size-4 accent-primary" />
                <span className={(core as any)[f.k] ? "line-through text-muted-foreground" : ""}>{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
