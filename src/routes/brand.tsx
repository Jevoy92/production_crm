import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";

export const Route = createFileRoute("/brand")({
  component: BrandPage,
  head: () => ({
    meta: [
      { title: "Brand · Palmer House OS" },
      { name: "description", content: "Palmer House Productions brand & design hub — pillars, type, and color." },
    ],
  }),
});

function BrandPage() {
  return (
    <Shell
      title="Brand"
      subtitle="Palmer House Productions · design canon"
      actions={
        <a href="/hubs/brand/index.html" target="_blank" rel="noopener noreferrer">
          <Btn variant="primary" className="flex items-center gap-1.5 h-8">
            <ExternalLink className="size-3.5" /> Open in new tab
          </Btn>
        </a>
      }
    >
      <div className="card-elevated rounded-2xl overflow-hidden">
        <iframe
          src="/hubs/brand/index.html"
          title="Palmer House Brand Hub"
          className="w-full block bg-white"
          style={{ height: "calc(100vh - 180px)", border: 0 }}
        />
      </div>
    </Shell>
  );
}