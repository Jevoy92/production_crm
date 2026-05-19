import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { Field, inputCls } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/finance")({
  component: FinancePage,
  head: () => ({ meta: [{ title: "Finance · Palmer House" }] }),
});

function FinancePage() {
  const finance = useStore((s) => s.finance);
  const setF = useStore((s) => s.setFinance);
  const projects = useStore((s) => s.projects);

  const missingQuoted = projects.filter(
    (p) => !p.quoted && p.stage !== "Lead" && p.stage !== "Strategy Call",
  ).length;
  const missingCost = projects.filter(
    (p) => !p.cost && (p.stage === "Delivered" || p.stage === "In Post"),
  ).length;

  return (
    <Shell title="Finance" subtitle="Adrienne · CFO view">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Manual entries (from HoneyBook)
          </div>
          <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-4">
            Cash & spend this month
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Cash collected ($)">
              <input
                className={inputCls}
                value={finance.cashCollectedMonth}
                onChange={(e) => setF({ cashCollectedMonth: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Outstanding ($)">
              <input
                className={inputCls}
                value={finance.outstanding}
                onChange={(e) => setF({ outstanding: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Tool / software spend ($)">
              <input
                className={inputCls}
                value={finance.toolSpend}
                onChange={(e) => setF({ toolSpend: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="AI credit spend ($)">
              <input
                className={inputCls}
                value={finance.aiSpend}
                onChange={(e) => setF({ aiSpend: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Contractor spend ($)">
              <input
                className={inputCls}
                value={finance.contractorSpend}
                onChange={(e) => setF({ contractorSpend: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Data hygiene
          </div>
          <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-4">What's missing</h3>
          <Row label="Projects missing quoted value" value={missingQuoted} />
          <Row label="Projects missing cost estimate" value={missingCost} />
          <Row label="Aged AR · 30 days" value="—" muted />
          <Row label="Aged AR · 60 days" value="—" muted />
          <Row label="Aged AR · 90+ days" value="—" muted />
        </div>
      </div>

      <div className="mt-4 card-elevated rounded-2xl p-5">
        <h3 className="text-[15px] font-semibold tracking-tight mb-3">Project P&amp;L (manual)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-2 py-2">Project</th>
                <th className="text-left font-medium">Pal</th>
                <th className="text-right font-medium">Quoted</th>
                <th className="text-right font-medium">Cost</th>
                <th className="text-right font-medium">Margin</th>
                <th className="text-right font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const q = p.quoted ?? 0,
                  c = p.cost ?? 0;
                const m = q - c;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-2 py-2">{p.title}</td>
                    <td>{p.palType}</td>
                    <td className="num text-right">{q ? `$${q.toLocaleString()}` : "—"}</td>
                    <td className="num text-right">{c ? `$${c.toLocaleString()}` : "—"}</td>
                    <td
                      className={`num text-right ${m > 0 ? "text-success" : m < 0 ? "text-destructive" : ""}`}
                    >
                      {q ? `$${m.toLocaleString()}` : "—"}
                    </td>
                    <td className="num text-right">{q ? `${Math.round((m / q) * 100)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value, muted }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className={`num text-[13px] ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
