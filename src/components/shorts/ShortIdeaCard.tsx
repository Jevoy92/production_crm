import type { ShortIdea } from "@/lib/shortIdeas.functions";
import { copyToClipboard } from "@/lib/clipboard";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function ShortIdeaCard({ idea, index }: { idea: ShortIdea; index: number }) {
  const copy = async () => {
    const text = [
      idea.title,
      `Prop: ${idea.prop}`,
      `First frame: "${idea.firstFrameText}"`,
      `Hook: "${idea.hook}"`,
      "",
      idea.script,
      "",
      idea.cta,
    ].join("\n");
    const ok = await copyToClipboard(text);
    toast[ok ? "success" : "error"](ok ? "Short copied" : "Copy failed");
  };

  return (
    <div className="border border-border bg-card p-3.5 flex flex-col gap-2.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] tracking-[0.2em] font-bold uppercase text-muted-foreground/70 truncate">
          {idea.hookFamily || `Idea ${index + 1}`}
        </span>
        <span className="text-[9px] tracking-[0.15em] font-bold uppercase px-1.5 py-0.5 border border-border text-muted-foreground/80 shrink-0">
          {idea.durationSec}s
        </span>
      </div>
      <h4
        className="text-[15px] leading-snug font-medium tracking-tight break-words"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {idea.title}
      </h4>
      <div className="text-[11px] leading-relaxed break-words">
        <span className="uppercase tracking-[0.15em] text-[9px] font-bold text-muted-foreground/70">Prop </span>
        <span className="text-foreground/90">{idea.prop}</span>
      </div>
      {idea.firstFrameText && (
        <div className="text-[11px] leading-relaxed break-words">
          <span className="uppercase tracking-[0.15em] text-[9px] font-bold text-muted-foreground/70">Frame 1 </span>
          <span className="text-foreground/90">“{idea.firstFrameText}”</span>
        </div>
      )}
      <p className="text-[12px] leading-relaxed text-muted-foreground break-words">{idea.premise}</p>
      <p className="text-[12px] leading-relaxed italic border-l-2 border-border pl-2.5 break-words">“{idea.hook}”</p>
      <ol className="text-[11.5px] leading-relaxed text-foreground/85 list-decimal pl-4 space-y-0.5">
        {idea.beats.map((b, bi) => (
          <li key={bi} className="break-words">{b}</li>
        ))}
      </ol>
      {idea.script && (
        <details>
          <summary className="cursor-pointer text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/70 hover:text-foreground">
            Full script
          </summary>
          <p className="mt-1.5 text-[11.5px] leading-relaxed whitespace-pre-wrap text-foreground/85">{idea.script}</p>
        </details>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground break-words">{idea.tieBack}</p>
      <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-border">
        <span className="text-[11px] text-foreground/90 min-w-0 break-words">{idea.cta}</span>
        <button
          onClick={copy}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy short"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
