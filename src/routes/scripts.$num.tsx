import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, Download, ExternalLink } from "lucide-react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { Markdown } from "@/components/Markdown";
import { findScript, VERSION_LABEL, type ScriptVersion } from "@/lib/scriptsIndex";
import { useLazySource } from "@/lib/useLazySource";
import { z } from "zod";

const searchSchema = z.object({
  v: z
    .enum(["original", "jevoy", "palmer-house", "mindyourbizniz"])
    .optional()
    .default("original"),
});

export const Route = createFileRoute("/scripts/$num")({
  validateSearch: searchSchema,
  component: ScriptDetail,
  head: ({ params }) => ({
    meta: [{ title: `Script ${params.num} · Palmer House OS` }],
  }),
});

function ScriptDetail() {
  const { num } = Route.useParams();
  const { v } = Route.useSearch() as { v: ScriptVersion };
  const navigate = useNavigate();
  const script = findScript(num);

  if (!script) {
    return (
      <Shell title="Script not found">
        <Link to="/scripts">
          <Btn>Back to Scripts</Btn>
        </Link>
      </Shell>
    );
  }

  // Fall back to first available version if requested one is missing
  const ALL: ScriptVersion[] = ["original", "jevoy", "palmer-house", "mindyourbizniz"];
  const available: ScriptVersion[] = ALL.filter((k) => Boolean(script.versions[k]));
  const current: ScriptVersion = script.versions[v] ? v : (available[0] ?? "original");
  const entry = script.versions[current];
  const { source, loading } = useLazySource(entry?.load);

  const copyText = async () => {
    if (!source) return;
    await navigator.clipboard.writeText(source);
  };
  const downloadMd = () => {
    if (!entry || !source) return;
    const blob = new Blob([source], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell
      title={`Script ${script.num} — ${script.title}`}
      subtitle={VERSION_LABEL[current]}
      actions={
        <>
          <Link to="/scripts">
            <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
              <ArrowLeft className="size-3.5" /> Back
            </Btn>
          </Link>
          <Btn variant="subtle" onClick={copyText} className="flex items-center gap-1.5 h-8">
            <Copy className="size-3.5" /> Copy
          </Btn>
          <Btn variant="subtle" onClick={downloadMd} className="flex items-center gap-1.5 h-8">
            <Download className="size-3.5" /> .md
          </Btn>
          {entry && (
            <a href={entry.originalPath} target="_blank" rel="noopener noreferrer">
              <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
                <ExternalLink className="size-3.5" /> Original
              </Btn>
            </a>
          )}
        </>
      }
    >
      {/* Tabs */}
      <div className="card-elevated rounded-2xl p-1 mb-6 inline-flex flex-wrap gap-1">
        {(["original", "jevoy", "palmer-house", "mindyourbizniz"] as ScriptVersion[]).map((b) => {
          const has = Boolean(script.versions[b]);
          const active = b === current;
          return (
            <button
              key={b}
              disabled={!has}
              onClick={() =>
                navigate({
                  to: "/scripts/$num",
                  params: { num: script.num },
                  search: { v: b },
                })
              }
              className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : has
                    ? "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                    : "text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              {VERSION_LABEL[b]}
            </button>
          );
        })}
      </div>

      <div className="card-elevated rounded-2xl p-6 md:p-8 max-w-4xl">
        {entry ? (
          loading ? (
            <div className="text-muted-foreground text-[13px] italic">Loading…</div>
          ) : (
            <Markdown source={source} />
          )
        ) : (
          <div className="text-muted-foreground text-[13px] italic">
            This version hasn't been written yet.
          </div>
        )}
      </div>
    </Shell>
  );
}