import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { Markdown } from "@/components/Markdown";
import { STRATEGY_DOCS } from "@/lib/scriptsIndex";
import { z } from "zod";

export const Route = createFileRoute("/scripts/strategy")({
  validateSearch: z.object({ doc: z.string().optional() }),
  component: StrategyPage,
  head: () => ({ meta: [{ title: "Strategy · Scripts · Palmer House OS" }] }),
});

function StrategyPage() {
  return <DocReader docs={STRATEGY_DOCS} title="Strategy" backTo="/scripts" />;
}

export function DocReader({
  docs,
  title,
  backTo,
}: {
  docs: typeof STRATEGY_DOCS;
  title: string;
  backTo: string;
}) {
  const search = (Route.useSearch?.() ?? {}) as { doc?: string };
  const active = docs.find((d) => d.slug === search.doc) ?? docs[0];

  return (
    <Shell
      title={title}
      subtitle={`${docs.length} document${docs.length === 1 ? "" : "s"}`}
      actions={
        <Link to={backTo}>
          <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
            <ArrowLeft className="size-3.5" /> Back
          </Btn>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        <aside className="card-elevated rounded-2xl p-3 lg:sticky lg:top-4">
          <nav className="flex flex-col gap-0.5">
            {docs.map((d) => (
              <Link
                key={d.slug}
                to="."
                search={{ doc: d.slug }}
                className={`text-[13px] px-3 py-2 rounded-lg leading-snug transition-colors ${
                  active?.slug === d.slug
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-surface-2"
                }`}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="card-elevated rounded-2xl p-6 md:p-8 min-w-0">
          {active ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <h2 className="text-[18px] font-semibold tracking-tight">{active.title}</h2>
                <a href={active.originalPath} target="_blank" rel="noopener noreferrer">
                  <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
                    <ExternalLink className="size-3.5" /> Original
                  </Btn>
                </a>
              </div>
              <Markdown source={active.source} />
            </>
          ) : (
            <div className="text-muted-foreground text-[13px] italic">No documents.</div>
          )}
        </div>
      </div>
    </Shell>
  );
}