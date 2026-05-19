import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls } from "@/components/ui-bits/Modal";
import { useStore, palColor } from "@/lib/store";
import { ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/clients/$id")({
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const projects = useStore((s) => s.projects.filter((p) => p.clientId === id));
  const update = useStore((s) => s.updateClient);
  const remove = useStore((s) => s.removeClient);

  if (!client)
    return (
      <Shell title="Client not found">
        <Link to="/clients">
          <Btn>Back</Btn>
        </Link>
      </Shell>
    );

  const ltv = projects.reduce((a, p) => a + (p.quoted ?? 0), 0);
  const ratings = projects.map((p) => p.clientRating).filter((r): r is number => !!r);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : "—";

  return (
    <Shell
      title={client.company ?? client.name}
      subtitle={client.name}
      actions={
        <>
          <Link to="/clients">
            <Btn variant="subtle" className="flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" /> Back
            </Btn>
          </Link>
          <Btn
            variant="danger"
            onClick={() => {
              if (confirm("Remove client?")) {
                remove(client.id);
                history.back();
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="card-elevated rounded-2xl p-5 grid grid-cols-3 gap-3">
            <Stat label="Projects" value={projects.length} />
            <Stat label="Lifetime value" value={`$${ltv.toLocaleString()}`} />
            <Stat label="Avg rating" value={avgRating} />
          </div>

          <div className="card-elevated rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold mb-3">Project history</h3>
            <div className="space-y-2">
              {projects.length === 0 && (
                <p className="text-[12px] text-muted-foreground">No projects yet.</p>
              )}
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$id"
                  params={{ id: p.id }}
                  className="flex items-center gap-3 rounded-xl bg-surface-2 p-3 hover:bg-surface-3"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: palColor(p.palType) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.palType} · {p.stage}
                    </div>
                  </div>
                  <div className="num text-[12px]">
                    {p.quoted ? `$${p.quoted.toLocaleString()}` : "—"}
                  </div>
                  {p.clientRating && (
                    <span className="text-[11px] text-amber-500">★ {p.clientRating}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-elevated rounded-2xl p-5 space-y-3">
            <Field label="Company">
              <input
                className={inputCls}
                value={client.company ?? ""}
                onChange={(e) => update(client.id, { company: e.target.value })}
              />
            </Field>
            <Field label="Contact">
              <input
                className={inputCls}
                value={client.name}
                onChange={(e) => update(client.id, { name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                value={client.email ?? ""}
                onChange={(e) => update(client.id, { email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={client.phone ?? ""}
                onChange={(e) => update(client.id, { phone: e.target.value })}
              />
            </Field>
            <Field label="HoneyBook">
              <input
                className={inputCls}
                value={client.honeybookLink ?? ""}
                onChange={(e) => update(client.id, { honeybookLink: e.target.value })}
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={4}
                className={inputCls}
                value={client.notes ?? ""}
                onChange={(e) => update(client.id, { notes: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="num text-[22px] font-semibold tracking-tight">{value}</div>
    </div>
  );
}
