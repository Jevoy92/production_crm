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

const PILLARS = [
  { name: "Reel", hex: "#E8720C", desc: "Short cinematic. Hook, body, payoff." },
  { name: "Spotlight", hex: "#3D1A66", desc: "Hero brand films. The full story." },
  { name: "Evergreen", hex: "#5B8A2D", desc: "Always-on, always-relevant assets." },
  { name: "System", hex: "#0A9B8F", desc: "Templates, frameworks, repeatable engines." },
];

function BrandPage() {
  return (
    <Shell
      title="Brand"
      subtitle="Palmer House Productions · design canon"
      actions={
        <a href="/hubs/brand/index.html" target="_blank" rel="noopener noreferrer">
          <Btn variant="primary" className="flex items-center gap-1.5 h-8">
            <ExternalLink className="size-3.5" /> Open full Brand Hub
          </Btn>
        </a>
      }
    >
      <div className="card-elevated rounded-2xl p-6 md:p-8 mb-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-2">
          The thesis
        </div>
        <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight leading-tight max-w-3xl mb-3">
          A translation company that happens to own cameras.
        </h2>
        <p className="text-[14px] text-muted-foreground leading-relaxed max-w-2xl">
          Palmer House helps businesses become easier to understand, trust, and choose — through
          strategic cinematic video. The full system, tokens, type, and 50+ carousel references
          live in the original Brand Hub.
        </p>
      </div>

      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">
        The four pillars
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {PILLARS.map((p) => (
          <div key={p.name} className="card-elevated rounded-2xl overflow-hidden">
            <div className="h-24" style={{ background: p.hex }} />
            <div className="p-4">
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-[15px] font-semibold tracking-tight">{p.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{p.hex}</div>
              </div>
              <div className="text-[12.5px] text-muted-foreground leading-relaxed">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">
        Typography
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <TypeCard family="Playfair Display" role="Serif headlines" sample="Translation, not decoration." font='"Playfair Display", Georgia, serif' />
        <TypeCard family="Inter" role="Body & UI" sample="Clear over clever. Always." font='"Inter", system-ui, sans-serif' />
        <TypeCard family="JetBrains Mono" role="Code & numerics" sample="01 / 12 · Pillar System" font='"JetBrains Mono", ui-monospace, monospace' />
      </div>

      <div className="card-elevated rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[15px] font-semibold tracking-tight mb-1">
            Everything else lives in the full hub
          </div>
          <div className="text-[13px] text-muted-foreground leading-relaxed max-w-xl">
            Voice, carousel system, lane-by-lane treatments, swatches, ratios, and the source
            MASTER-SKILL canon. Opens in a new tab with its own typography.
          </div>
        </div>
        <a href="/hubs/brand/index.html" target="_blank" rel="noopener noreferrer">
          <Btn variant="primary" className="flex items-center gap-1.5 h-9">
            <ExternalLink className="size-3.5" /> Open full Brand Hub
          </Btn>
        </a>
      </div>
    </Shell>
  );
}

function TypeCard({
  family,
  role,
  sample,
  font,
}: {
  family: string;
  role: string;
  sample: string;
  font: string;
}) {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
        {role}
      </div>
      <div className="text-[13px] font-medium text-foreground mb-3">{family}</div>
      <div className="text-[20px] leading-snug text-foreground/90" style={{ fontFamily: font }}>
        {sample}
      </div>
    </div>
  );
}