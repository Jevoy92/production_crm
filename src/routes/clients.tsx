import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import { Plus, ExternalLink, Search } from "lucide-react";

const usdK = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${Math.round(n)}`);
const nf = (n: number) => Math.round(n).toLocaleString();

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
  const [q, setQ] = useState("");

  const allRows = clients
    .map((c) => {
      const ps = projects.filter((p) => p.clientId === c.id);
      return { c, count: ps.length, ltv: ps.reduce((a, p) => a + (p.quoted ?? 0), 0) };
    })
    .sort((a, b) => b.ltv - a.ltv);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allRows;
    return allRows.filter(({ c }) =>
      [c.company, c.name, c.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [allRows, q]);

  const totalLtv = allRows.reduce((a, r) => a + r.ltv, 0);
  const totalProjects = allRows.reduce((a, r) => a + r.count, 0);
  const stats = [
    { label: "Clients", value: nf(clients.length) },
    { label: "Projects", value: nf(totalProjects) },
    { label: "Total LTV", value: usdK(totalLtv) },
    { label: "Avg LTV", value: usdK(clients.length ? totalLtv / clients.length : 0) },
  ];

  return (
    <Shell
      title="Clients"
      subtitle={`${clients.length} clients · $${totalLtv.toLocaleString()} LTV`}
      actions={
        <Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5 shrink-0">
          <Plus className="size-3.5" /> <span className="hidden sm:inline">New client</span>
        </Btn>
      }
    >
      <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 divide-x divide-line border border-line rounded-xl bg-panel overflow-hidden">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-3.5 py-2.5 ${i > 1 ? "border-t sm:border-t-0 border-line" : ""}`}>
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.label}</div>
            <div className="num text-[17px] font-semibold leading-tight mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 relative max-w-xs">
        <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients"
          className={`${inputCls} pl-8 h-8 text-[13px]`}
        />
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-8 text-center text-[13px] text-muted-foreground">
          {clients.length === 0 ? "No clients yet — add your first one." : "No clients match that search."}
        </div>
      ) : (
      <>
      <div className="hidden md:block bg-panel border border-line rounded-xl overflow-x-auto">
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
                <td className="px-5 py-2.5 font-medium">
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

      <div className="md:hidden space-y-2">
        {rows.map(({ c, count, ltv }) => (
          <Link
            key={c.id}
            to="/clients/$id"
            params={{ id: c.id }}
            className="block border-l-2 border-l-primary/60 border border-line rounded-lg bg-panel px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{c.company ?? c.name}</div>
                <div className="text-[11.5px] text-muted-foreground truncate">{c.name}{c.email ? ` · ${c.email}` : ""}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="num text-[13px] font-semibold">${ltv.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">{count} proj</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      </>
      )}

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
