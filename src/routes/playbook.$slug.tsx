import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import {
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  Circle,
  FileText,
  Settings2,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import type { PlaybookPage } from "@/lib/types";

export const Route = createFileRoute("/playbook/$slug")({
  component: PlaybookPageDetail,
});

// ─── Markdown component map ─────────────────────────────────────────────────
// react-markdown lets us replace each HTML element with a styled component.
// We use this instead of @tailwindcss/typography to keep total CSS small and
// pin the styling to our design tokens.

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
    <h3
      className="text-[14px] font-semibold tracking-tight mt-4 mb-1.5 text-foreground"
      {...p}
    />
  ),
  h4: (p: any) => (
    <h4
      className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase mt-3 mb-1"
      {...p}
    />
  ),
  p: (p: any) => <p className="my-2 leading-relaxed text-[13.5px] text-foreground/90" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-foreground" {...p} />,
  em: (p: any) => <em className="text-muted-foreground" {...p} />,
  a: (p: any) => (
    <a
      className="text-primary underline decoration-primary/30 hover:decoration-primary"
      {...p}
    />
  ),
  ul: (p: any) => (
    <ul
      className="my-2 space-y-1 pl-5 list-disc marker:text-muted-foreground/60 text-[13.5px]"
      {...p}
    />
  ),
  ol: (p: any) => (
    <ol
      className="my-2 space-y-1 pl-5 list-decimal marker:text-muted-foreground/60 text-[13.5px]"
      {...p}
    />
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
    // react-markdown v10 removed the `inline` prop. Detect block code by
    // (a) presence of a `language-*` className or (b) a newline in the text.
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
    // Inside <pre> — inherit the pre's paper-on-black colors. No background here.
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

function MarkdownContent({ source }: { source: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
        {source}
      </ReactMarkdown>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

function PlaybookPageDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const page = useStore((s) => s.playbook.find((p) => p.slug === slug));
  const upsert = useStore((s) => s.upsertPlaybookPage);
  const remove = useStore((s) => s.removePlaybookPage);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlaybookPage | null>(null);

  if (!page) {
    return (
      <Shell title="Page not found">
        <Link to="/playbook">
          <Btn>Back</Btn>
        </Link>
      </Shell>
    );
  }

  const current = editing && draft ? draft : page;
  const isPal = Boolean(current.imageUrl && current.relatedPalType);

  const toggleChecklist = (itemId: string) => {
    if (editing) return;
    const next = page.checklist.map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i,
    );
    upsert({ ...page, checklist: next });
  };

  return (
    <Shell
      title={current.title}
      subtitle={current.loops.join(" • ")}
      actions={
        <>
          <Link to="/playbook">
            <Btn variant="subtle" className="flex items-center gap-1.5 h-8">
              <ArrowLeft className="size-3.5" /> Back
            </Btn>
          </Link>
          {editing ? (
            <>
              <Btn
                variant="subtle"
                onClick={() => {
                  setDraft(null);
                  setEditing(false);
                }}
                className="h-8"
              >
                Cancel
              </Btn>
              <Btn
                variant="primary"
                onClick={() => {
                  if (draft) upsert({ ...draft, updatedAt: new Date().toISOString() });
                  setEditing(false);
                }}
                className="h-8"
              >
                Save
              </Btn>
            </>
          ) : (
            <>
              <Btn
                variant="subtle"
                onClick={() => {
                  setDraft({ ...page });
                  setEditing(true);
                }}
                className="h-8"
              >
                Edit SOP
              </Btn>
              <Btn
                variant="danger"
                className="h-8 w-8 p-0 grid place-items-center"
                onClick={() => {
                  if (confirm("Delete playbook page?")) {
                    remove(page.slug);
                    navigate({ to: "/playbook" });
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </Btn>
            </>
          )}
        </>
      }
    >
      {/* ─── Pal character hero (only for Pal cards) ──────────────────── */}
      {isPal && !editing && (
        <div className="card-elevated rounded-2xl overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
            <div className="bg-[#1F1A17] flex items-end justify-center aspect-[3/4] md:aspect-auto md:min-h-[360px] relative">
              <div className="absolute top-3 left-3 text-[9px] font-mono tracking-[0.18em] uppercase text-primary bg-black/40 backdrop-blur px-2 py-1 rounded">
                {current.relatedPalType} Pal
              </div>
              <img
                src={current.imageUrl}
                alt={current.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold mb-2 flex items-center gap-1.5">
                <Sparkles className="size-3" /> The Pal
              </div>
              <div className="text-[26px] font-semibold tracking-tight leading-tight mb-2">
                {current.title}
              </div>
              <div className="text-[15px] italic text-muted-foreground leading-relaxed">
                {current.purpose}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* ─── Main column ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Metadata block — hidden for Pal hero (already showed purpose) */}
          {!isPal && (
            <div className="card-elevated rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <MetaField
                    label="Purpose"
                    value={current.purpose}
                    editing={editing}
                    onChange={(v) =>
                      setDraft((d) => (d ? { ...d, purpose: v } : d))
                    }
                    placeholder="No purpose defined."
                  />
                  <MetaField
                    label="When to use"
                    value={current.whenToUse}
                    editing={editing}
                    onChange={(v) =>
                      setDraft((d) => (d ? { ...d, whenToUse: v } : d))
                    }
                    placeholder="Not specified."
                    multiline
                  />
                </div>
                <div className="space-y-3">
                  <MetaField
                    label="Trigger"
                    value={current.trigger}
                    editing={editing}
                    onChange={(v) =>
                      setDraft((d) => (d ? { ...d, trigger: v } : d))
                    }
                    placeholder="Not specified."
                    multiline
                  />
                  <MetaField
                    label="Inputs needed"
                    value={current.inputsNeeded}
                    editing={editing}
                    onChange={(v) =>
                      setDraft((d) => (d ? { ...d, inputsNeeded: v } : d))
                    }
                    placeholder="None."
                    multiline
                  />
                </div>
              </div>
            </div>
          )}

          {/* Process content (markdown) */}
          <div className="card-elevated rounded-2xl p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              {isPal ? "Character Profile" : "Step-by-Step Process"}
            </h2>
            {editing ? (
              <textarea
                value={current.content}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, content: e.target.value } : d))
                }
                rows={20}
                className={inputCls + " font-mono text-[12.5px] leading-relaxed resize-y"}
                placeholder="Write the SOP in Markdown — supports # headings, lists, tables, > blockquotes, ``` code blocks, and - [ ] checkboxes (GFM)."
              />
            ) : current.content?.trim() ? (
              <MarkdownContent source={current.content} />
            ) : (
              <div className="text-[13px] text-muted-foreground/70 italic">
                No process documented yet.
              </div>
            )}
          </div>

          {/* Checklist (interactive) */}
          {(current.checklist.length > 0 || editing) && (
            <div className="card-elevated rounded-2xl p-6">
              <h2 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
                <CheckSquare className="size-4 text-primary" /> Execution Checklist
                {!editing && current.checklist.length > 0 && (
                  <span className="ml-auto text-[11px] font-medium text-muted-foreground font-mono">
                    {current.checklist.filter((i) => i.done).length}/
                    {current.checklist.length}
                  </span>
                )}
              </h2>
              {editing ? (
                <div className="space-y-2">
                  {current.checklist.map((item, idx) => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        className={inputCls}
                        value={item.text}
                        onChange={(e) => {
                          const nc = [...current.checklist];
                          nc[idx] = { ...nc[idx], text: e.target.value };
                          setDraft((d) =>
                            d ? { ...d, checklist: nc } : d,
                          );
                        }}
                      />
                      <Btn
                        variant="danger"
                        onClick={() => {
                          const nc = current.checklist.filter((_, i) => i !== idx);
                          setDraft((d) =>
                            d ? { ...d, checklist: nc } : d,
                          );
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Btn>
                    </div>
                  ))}
                  <Btn
                    variant="subtle"
                    onClick={() => {
                      setDraft((d) =>
                        d
                          ? {
                              ...d,
                              checklist: [
                                ...d.checklist,
                                {
                                  id: `chk_${Math.random()
                                    .toString(36)
                                    .slice(2, 8)}`,
                                  text: "",
                                  done: false,
                                },
                              ],
                            }
                          : d,
                      );
                    }}
                    className="text-[12px] h-8 mt-2"
                  >
                    + Add item
                  </Btn>
                </div>
              ) : (
                <div className="space-y-1">
                  {current.checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left group"
                    >
                      {item.done ? (
                        <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground/40 group-hover:text-muted-foreground/80 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-[13px] leading-snug ${
                          item.done
                            ? "text-muted-foreground line-through decoration-muted-foreground/30"
                            : "text-foreground/90"
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Pal metadata (only when isPal) */}
          {isPal && (
            <div className="card-elevated rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold tracking-tight uppercase text-muted-foreground/80 flex items-center gap-1.5 mb-2">
                <Sparkles className="size-3.5" /> Deployment
              </h3>
              <ReadOnlyField label="Pal type" value={current.relatedPalType ?? "—"} />
              <ReadOnlyField label="Best for" value={current.whenToUse || "—"} />
              <ReadOnlyField
                label="Cadence / length"
                value={current.inputsNeeded || "—"}
              />
              <ReadOnlyField
                label="Avoid"
                value={current.commonMistakes || "—"}
                tone="warn"
              />
            </div>
          )}

          {/* Parameters card (non-Pal) */}
          {!isPal && (
            <div className="card-elevated rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold tracking-tight uppercase text-muted-foreground/80 flex items-center gap-1.5 mb-2">
                <Settings2 className="size-3.5" /> Parameters
              </h3>
              <Field label="Owner role">
                {editing ? (
                  <select
                    className={inputCls}
                    value={current.ownerRole}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, ownerRole: e.target.value as any } : d,
                      )
                    }
                  >
                    <option value="company">Company</option>
                    <option value="owner">Owner</option>
                    <option value="cfo">CFO</option>
                    <option value="pa">PA</option>
                  </select>
                ) : (
                  <div className="text-[13px] capitalize font-medium">
                    {current.ownerRole === "pa" ? "PA" : current.ownerRole}
                  </div>
                )}
              </Field>
              <Field label="Definition of done">
                {editing ? (
                  <textarea
                    className={inputCls + " min-h-[60px]"}
                    value={current.definitionOfDone}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, definitionOfDone: e.target.value } : d,
                      )
                    }
                  />
                ) : current.definitionOfDone ? (
                  <div className="text-[12px] leading-relaxed text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 markdown-tight">
                    <MarkdownContent source={current.definitionOfDone} />
                  </div>
                ) : (
                  <div className="text-[12px] text-muted-foreground/70 italic">
                    N/A
                  </div>
                )}
              </Field>
              <Field label="Common mistakes">
                {editing ? (
                  <textarea
                    className={inputCls + " min-h-[60px]"}
                    value={current.commonMistakes}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, commonMistakes: e.target.value } : d,
                      )
                    }
                  />
                ) : current.commonMistakes ? (
                  <div className="text-[12px] leading-relaxed text-red-700 dark:text-red-300 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 markdown-tight">
                    <MarkdownContent source={current.commonMistakes} />
                  </div>
                ) : (
                  <div className="text-[12px] text-muted-foreground/70 italic">
                    N/A
                  </div>
                )}
              </Field>
            </div>
          )}

          {/* Media / Loom */}
          <div className="card-elevated rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold tracking-tight uppercase text-muted-foreground/80 flex items-center gap-1.5 mb-2">
              <Video className="size-3.5" /> Video walkthrough
            </h3>
            <Field label="Loom embed URL">
              {editing ? (
                <input
                  className={inputCls}
                  value={current.loomUrl || ""}
                  placeholder="https://www.loom.com/embed/..."
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, loomUrl: e.target.value } : d))
                  }
                />
              ) : current.loomUrl ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-surface-2 border border-border">
                  <iframe
                    src={current.loomUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-[12px] text-muted-foreground italic">
                  No video training linked yet.
                </div>
              )}
            </Field>
          </div>

          {/* Actions */}
          <div className="card-elevated rounded-2xl p-5 space-y-3">
            <div className="text-[11px] text-muted-foreground/70">
              Last updated: {new Date(page.updatedAt).toLocaleString()}
            </div>
            <button className="w-full py-2.5 bg-primary text-primary-foreground text-[13px] font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
              Use this on a Project
            </button>
            <button className="w-full py-2.5 bg-surface-2 text-foreground text-[13px] font-medium rounded-lg hover:bg-surface-3 transition-colors border border-border shadow-sm">
              Create Task from Step
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ─── Tiny helpers ───────────────────────────────────────────────────────────

function MetaField({
  label,
  value,
  editing,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            className={inputCls + " min-h-[44px]"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            className={inputCls}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      ) : (
        <div className="text-[13px] text-foreground/90 whitespace-pre-wrap">
          {value || (
            <span className="text-muted-foreground/70 italic">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </div>
      <div
        className={
          tone === "warn"
            ? "text-[12px] text-red-700 dark:text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20"
            : "text-[13px] text-foreground/90"
        }
      >
        {value}
      </div>
    </div>
  );
}
