import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav } from "@/components/cc/CCNav";
import { useCCStore, type CCShootDay } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/shoots/$id")({
  component: ShootDetail,
  head: () => ({ meta: [{ title: "Shoot day · Content Command Center" }] }),
});

const input = "w-full bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary";
const ta = input + " min-h-[70px] resize-y";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function Checklist({ id, list, items, onToggle }: { id: string; list: "before" | "during" | "after"; items: CCShootDay["before"]; onToggle: (id: string, list: any, itemId: string) => void }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={it.done} onChange={() => onToggle(id, list, it.id)} className="size-4 accent-primary" />
          <span className={it.done ? "line-through text-muted-foreground" : ""}>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ShootDetail() {
  const { id } = useParams({ from: "/cc/shoots/$id" });
  const navigate = useNavigate();
  const shoot = useCCStore((s) => s.shoots.find((x) => x.id === id));
  const update = useCCStore((s) => s.updateShoot);
  const toggle = useCCStore((s) => s.toggleShootItem);
  const remove = useCCStore((s) => s.removeShoot);

  if (!shoot) return <Shell title="Not found"><CCNav /><div>Shoot not found.</div></Shell>;
  const upd = (patch: Partial<CCShootDay>) => update(shoot.id, patch);

  return (
    <Shell title={shoot.theme || "Untitled shoot"} subtitle={shoot.date || "Date TBD"}
      actions={<button onClick={() => { if (confirm("Delete this shoot day?")) { remove(shoot.id); navigate({ to: "/cc/shoots" }); } }}
        className="text-[12px] text-destructive">Delete</button>}>
      <CCNav />
      <Link to="/cc/shoots" className="text-[12px] text-primary mb-3 inline-block">← Back to shoots</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-elevated rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><input type="date" className={input} value={shoot.date} onChange={(e) => upd({ date: e.target.value })} /></Field>
            <Field label="Status">
              <select className={input} value={shoot.status} onChange={(e) => upd({ status: e.target.value as any })}>
                {["Planned","In Progress","Wrapped","Cancelled"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Theme"><input className={input} value={shoot.theme} onChange={(e) => upd({ theme: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location"><input className={input} value={shoot.location} onChange={(e) => upd({ location: e.target.value })} /></Field>
            <Field label="Time blocks"><input className={input} value={shoot.timeBlocks} onChange={(e) => upd({ timeBlocks: e.target.value })} /></Field>
          </div>
          <Field label="Videos being filmed"><textarea className={ta} value={shoot.videos} onChange={(e) => upd({ videos: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wardrobe"><textarea className={ta} value={shoot.wardrobe} onChange={(e) => upd({ wardrobe: e.target.value })} /></Field>
            <Field label="Props"><textarea className={ta} value={shoot.props} onChange={(e) => upd({ props: e.target.value })} /></Field>
            <Field label="Gear"><textarea className={ta} value={shoot.gear} onChange={(e) => upd({ gear: e.target.value })} /></Field>
            <Field label="Lighting"><textarea className={ta} value={shoot.lighting} onChange={(e) => upd({ lighting: e.target.value })} /></Field>
            <Field label="Audio"><textarea className={ta} value={shoot.audio} onChange={(e) => upd({ audio: e.target.value })} /></Field>
            <Field label="Teleprompter"><textarea className={ta} value={shoot.teleprompter} onChange={(e) => upd({ teleprompter: e.target.value })} /></Field>
          </div>
          <Field label="BTS plan"><textarea className={ta} value={shoot.btsPlan} onChange={(e) => upd({ btsPlan: e.target.value })} /></Field>
          <Field label="Shot list (priority order)"><textarea className={ta} value={shoot.shotList} onChange={(e) => upd({ shotList: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shannen responsibilities"><textarea className={ta} value={shoot.shannenRoles} onChange={(e) => upd({ shannenRoles: e.target.value })} /></Field>
            <Field label="Jevoy responsibilities"><textarea className={ta} value={shoot.jevoyRoles} onChange={(e) => upd({ jevoyRoles: e.target.value })} /></Field>
          </div>
          <Field label="Pickups needed"><textarea className={ta} value={shoot.pickups} onChange={(e) => upd({ pickups: e.target.value })} /></Field>
        </div>

        <div className="space-y-4">
          <div className="card-elevated rounded-xl p-4">
            <h3 className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3">Before filming</h3>
            <Checklist id={shoot.id} list="before" items={shoot.before} onToggle={toggle} />
          </div>
          <div className="card-elevated rounded-xl p-4">
            <h3 className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3">During filming</h3>
            <Checklist id={shoot.id} list="during" items={shoot.during} onToggle={toggle} />
          </div>
          <div className="card-elevated rounded-xl p-4">
            <h3 className="text-[12px] uppercase tracking-wider text-muted-foreground mb-3">After filming</h3>
            <Checklist id={shoot.id} list="after" items={shoot.after} onToggle={toggle} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
