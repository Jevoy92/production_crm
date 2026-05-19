import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { Markdown } from "@/components/Markdown";
import type { DocEntry } from "@/lib/scriptsIndex";
import { useLazySource } from "@/lib/useLazySource";

export function DocReader({
  title,
  docs,
  activeSlug,
  onSelect,
  backTo,
}: {
  title: string;
  docs: DocEntry[];
  activeSlug?: string;
  onSelect: (slug: string) => void;
  backTo: string;
}) {
  const active = docs.find((d) => d.slug === activeSlug) ?? docs[0];
  const { source, loading } = useLazySource(active?.load);

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
              <button
                key={d.slug}
                onClick={() => onSelect(d.slug)}
                className={`text-left text-[13px] px-3 py-2 rounded-lg leading-snug transition-colors ${
                  active?.slug === d.slug
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-surface-2"
                }`}
              >
                {d.title}
              </button>
            ))}
          </nav>
        </aside>
        <div className="card-elevated rounded-2xl p-6 md:p-8 min-w-0">
          {active ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
                <h2 className="text-[18px] font-semibold tracking-tight">{active.title}</h2>
                <a href={active.originalPath} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
                    <ExternalLink className="size-3.5" /> Original
                  </Btn>
                </a>
              </div>
              {loading ? (
                <div className="text-muted-foreground text-[13px] italic">Loading…</div>
              ) : (
                <Markdown source={source} />
              )}
            </>
          ) : (
            <div className="text-muted-foreground text-[13px] italic">No documents.</div>
          )}
        </div>
      </div>
    </Shell>
  );
}