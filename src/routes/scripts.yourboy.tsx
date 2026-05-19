import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { DocReader } from "@/components/DocReader";
import { YOURBOY_DOCS } from "@/lib/scriptsIndex";

export const Route = createFileRoute("/scripts/yourboy")({
  validateSearch: z.object({ doc: z.string().optional() }),
  component: YourBoyPage,
  head: () => ({ meta: [{ title: "YourBoyJevoy · Scripts · Palmer House OS" }] }),
});

function YourBoyPage() {
  const { doc } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <DocReader
      title="YourBoyJevoy"
      docs={YOURBOY_DOCS}
      activeSlug={doc}
      onSelect={(slug) => navigate({ to: "/scripts/yourboy", search: { doc: slug } })}
      backTo="/scripts"
    />
  );
}