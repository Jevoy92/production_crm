import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import { Plus, ExternalLink } from "lucide-react";

function ClientsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = /^\/clients\/[^/]+/.test(pathname);
  return isChild ? <Outlet /> : <ClientsPage />;
}

export const Route = createFileRoute("/clients")({
  component: ClientsLayout,
  head: () => ({ meta: [{ title: "Clients · Palmer House" }] }),
});

function ClientsPage() {
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const add = useStore((s) => s.addClient);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", company: "", email: "", phone: "", honeybookLink: "" });

  const rows = clients
    .map((c) => {
      const ps = projects.filter((p) => p.clientId === c.id);
      return { c, count: ps.length, ltv: ps.reduce((a, p) => a + (p.quoted ?? 0), 0) };
    })
    .sort((a, b) => b.ltv - a.ltv);

  return (
    <Shell
      title="Clients"
      subtitle={`${clients.length} clients · $${rows.reduce((a, r) => a + r.ltv, 0).toLocaleString()} LTV`}
      actions={
        <Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5">
          <Plus className="size-3.5" /> New client
        </Btn>
      }
    >
      <div className="card-elevated rounded-2xl overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="text-left font-medium px-5 py-3">Company</th>
              <th className="text-left font-medium">Contact</th>
              <th className="text-left font-medium">Email</th>
              <th className="text-left font-medium">Projects</th>
              <th className="text-left font-medium">LTV</th>
              <th className="px-5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, count, ltv }) => (
              <tr key={c.id} className="border-t border-border hover:bg-surface-2/60">
                <td className="px-5 py-3 font-medium">
                  <Link
                    to="/clients/$id"
                    params={{ id: c.id }}
                    className="hover:text-primary flex items-center gap-1.5"
                  >
                    {c.company ?? c.name}{" "}
                    <ExternalLink className="size-3 text-muted-foreground/60" />
                  </Link>
                </td>
                <td>{c.name}</td>
                <td className="text-muted-foreground">{c.email ?? "—"}</td>
                <td className="num">{count}</td>
                <td className="num">${ltv.toLocaleString()}</td>
                <td className="px-5 text-right">
                  {c.honeybookLink && (
                    <a
                      href={c.honeybookLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11.5px] text-primary"
                    >
                      HoneyBook ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New client"
        footer={
          <>
            <Btn variant="subtle" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={() => {
                if (!f.name.trim()) return;
                add(f);
                setF({ name: "", company: "", email: "", phone: "", honeybookLink: "" });
                setOpen(false);
              }}
            >
              Create
            </Btn>
          </>
        }
      >
        <Field label="Contact name">
          <input
            className={inputCls}
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="Company">
          <input
            className={inputCls}
            value={f.company}
            onChange={(e) => setF({ ...f, company: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputCls}
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </Field>
        <Field label="HoneyBook link">
          <input
            className={inputCls}
            value={f.honeybookLink}
            onChange={(e) => setF({ ...f, honeybookLink: e.target.value })}
          />
        </Field>
      </Modal>
    </Shell>
  );
}
