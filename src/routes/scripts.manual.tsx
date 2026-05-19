import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { Markdown } from "@/components/Markdown";
import { MANUAL } from "@/lib/scriptsIndex";

export const Route = createFileRoute("/scripts/manual")({
  validateSearch: z.object({ doc: z.string().optional() }),
  component: ManualPage,
  head: () => ({ meta: [{ title: "Operating Manual · Scripts · Palmer House OS" }] }),
});

function ManualPage() {
  const { doc } = Route.useSearch();
  const navigate = useNavigate();
  const active = MANUAL.find((m) => m.slug === doc) ?? MANUAL[0];

  return (
    <Shell
      title="Operating Manual"
      subtitle="Jevoy Palmer voice profile · ventures · content rules"
      actions={
        <Link to="/scripts">
          <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
            <ArrowLeft className="size-3.5" /> Back
          </Btn>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        <aside className="card-elevated rounded-2xl p-3 lg:sticky lg:top-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold px-3 pt-1 pb-2 flex items-center gap-1.5">
            <Sparkles className="size-3" /> Manual
          </div>
          <nav className="flex flex-col gap-0.5">
            {MANUAL.map((m) => (
              <button
                key={m.slug}
                onClick={() => navigate({ to: "/scripts/manual", search: { doc: m.slug } })}
                className={`text-left text-[13px] px-3 py-2 rounded-lg leading-snug transition-colors ${
                  active?.slug === m.slug
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-surface-2"
                }`}
              >
                {m.title}
              </button>
            ))}
          </nav>
        </aside>
        <div className="card-elevated rounded-2xl p-6 md:p-8 min-w-0">
          {active && (
            <>
              <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
                <h2 className="text-[18px] font-semibold tracking-tight">{active.title}</h2>
                <a href="/hubs/scripts/index.html" target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
                    <ExternalLink className="size-3.5" /> Original hub
                  </Btn>
                </a>
              </div>
              <Markdown source={active.source} />
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}