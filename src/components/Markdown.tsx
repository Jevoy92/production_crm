import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Circle } from "lucide-react";

// Shared markdown renderer — pins styling to design tokens.
// Originally lived inline in playbook.$slug.tsx; extracted so the Scripts
// section can reuse the exact same look.
const md = {
  h1: (p: any) => (
    <h1 className="text-[22px] font-semibold tracking-tight mt-6 mb-3" {...p} />
  ),
  h2: (p: any) => (
    <h2
      className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold mt-6 mb-3 pb-2 border-b border-border"
      {...p}
    />
  ),
  h3: (p: any) => (
    <h3 className="text-[14px] font-semibold tracking-tight mt-4 mb-1.5 text-foreground" {...p} />
  ),
  h4: (p: any) => (
    <h4 className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase mt-3 mb-1" {...p} />
  ),
  p: (p: any) => <p className="my-2 leading-relaxed text-[13.5px] text-foreground/90" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-foreground" {...p} />,
  em: (p: any) => <em className="text-muted-foreground" {...p} />,
  a: (p: any) => (
    <a className="text-primary underline decoration-primary/30 hover:decoration-primary" {...p} />
  ),
  ul: (p: any) => (
    <ul className="my-2 space-y-1 pl-5 list-disc marker:text-muted-foreground/60 text-[13.5px]" {...p} />
  ),
  ol: (p: any) => (
    <ol className="my-2 space-y-1 pl-5 list-decimal marker:text-muted-foreground/60 text-[13.5px]" {...p} />
  ),
  li: ({ children, className, ...rest }: any) => {
    if (typeof className === "string" && className.includes("task-list-item")) {
      return (
        <li className="list-none flex items-start gap-2 -ml-5 my-1" {...rest}>
          {children}
        </li>
      );
    }
    return (
      <li className="leading-relaxed" {...rest}>
        {children}
      </li>
    );
  },
  input: ({ type, checked, ...rest }: any) => {
    if (type === "checkbox") {
      return checked ? (
        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <Circle className="size-4 text-muted-foreground/50 shrink-0 mt-0.5" />
      );
    }
    return <input type={type} checked={checked} {...rest} />;
  },
  blockquote: (p: any) => (
    <blockquote
      className="my-3 border-l-2 border-primary/60 bg-primary/5 pl-4 pr-3 py-2 rounded-r-md italic text-[13px] text-foreground/85"
      {...p}
    />
  ),
  code: ({ className, children, ...rest }: any) => {
    const raw = String(children ?? "");
    const isBlock = (className && /^language-/.test(className)) || raw.includes("\n");
    if (!isBlock) {
      return (
        <code
          className="bg-surface-2 px-1.5 py-0.5 rounded text-[12px] font-mono text-foreground/90 border border-border"
          {...rest}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono text-[12.5px] leading-relaxed text-[#F6F1E8]" {...rest}>
        {children}
      </code>
    );
  },
  pre: (p: any) => (
    <pre
      className="my-3 bg-[#1F1A17] text-[#F6F1E8] p-4 rounded-lg overflow-x-auto text-[12.5px] leading-relaxed selection:bg-[#F26522]/40 selection:text-[#F6F1E8]"
      {...p}
    />
  ),
  table: (p: any) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-[13px]" {...p} />
    </div>
  ),
  thead: (p: any) => <thead className="bg-surface-2" {...p} />,
  th: (p: any) => (
    <th
      className="text-left p-2.5 border-b border-border font-semibold text-[10px] tracking-wider uppercase text-muted-foreground"
      {...p}
    />
  ),
  td: (p: any) => (
    <td className="p-2.5 border-b border-border align-top text-foreground/90" {...p} />
  ),
  hr: () => <hr className="my-4 border-border" />,
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
        {source}
      </ReactMarkdown>
    </div>
  );
}