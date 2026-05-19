import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { DocReader } from "@/components/DocReader";
import { RESEARCH_DOCS } from "@/lib/scriptsIndex";

export const Route = createFileRoute("/scripts/research")({
  validateSearch: z.object({ doc: z.string().optional() }),
  component: ResearchPage,
  head: () => ({ meta: [{ title: "Research · Scripts · Palmer House OS" }] }),
});

function ResearchPage() {
  const { doc } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <DocReader
      title="Research"
      docs={RESEARCH_DOCS}
      activeSlug={doc}
      onSelect={(slug) => navigate({ to: "/scripts/research", search: { doc: slug } })}
      backTo="/scripts"
    />
  );
}