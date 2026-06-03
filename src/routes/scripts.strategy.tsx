import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { DocReader } from "@/components/DocReader";
import { STRATEGY_DOCS } from "@/lib/scriptsIndex";

export const Route = createFileRoute("/scripts/strategy")({
  validateSearch: z.object({ doc: z.string().optional() }),
  component: StrategyPage,
  head: () => ({ meta: [{ title: "Strategy · Scripts · Palmer House OS" }] }),
});

function StrategyPage() {
  const { doc } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <DocReader
      title="Strategy"
      docs={STRATEGY_DOCS}
      activeSlug={doc}
      onSelect={(slug) => navigate({ to: "/scripts/strategy", search: { doc: slug } })}
      backTo="/scripts"
    />
  );
}