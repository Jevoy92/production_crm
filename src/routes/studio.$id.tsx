import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link2 from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Save,
  Send,
  Sparkles,
  Trash2,
  FileDown,
  Wand2,
  Loader2,
} from "lucide-react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, inputCls } from "@/components/ui-bits/Modal";
import { Markdown } from "@/components/Markdown";
import {
  getScript,
  updateScript,
  listMessages,
  clearMessages,
} from "@/lib/studio.functions";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdownBridge";

export const Route = createFileRoute("/studio/$id")({
  component: StudioEditor,
  head: () => ({ meta: [{ title: "Editor · Script Studio" }] }),
});

const BRANDS = [
  { value: "jevoy", label: "Jevoy Palmer" },
  { value: "palmer-house", label: "Palmer House" },
  { value: "mindyourbizniz", label: "MindYourBizniz" },
  { value: "original", label: "Original" },
];

function StudioEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getScript);
  const updateFn = useServerFn(updateScript);
  const msgsFn = useServerFn(listMessages);
  const clearFn = useServerFn(clearMessages);

  const { data: script, isLoading } = useQuery({
    queryKey: ["studio", "script", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const { data: priorMessages = [] } = useQuery({
    queryKey: ["studio", "messages", id],
    queryFn: () => msgsFn({ data: { scriptId: id } }),
    enabled: Boolean(script),
  });

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("jevoy");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link2.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing or ask the AI to draft a script…" }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[60vh] px-8 py-6 text-[14.5px] leading-relaxed",
      },
    },
  });

  // Hydrate editor when script loads
  const hydrated = useRef(false);
  useEffect(() => {
    if (!script || !editor || hydrated.current) return;
    setTitle(script.title);
    setBrand(script.brand);
    editor.commands.setContent(script.body_html || markdownToHtml(script.body_md || ""));
    hydrated.current = true;
  }, [script, editor]);

  // Reset when script id changes
  useEffect(() => {
    hydrated.current = false;
  }, [id]);

  // Debounced autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSave = (immediate = false) => {
    if (!editor || !hydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const run = async () => {
      setSaving(true);
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      await updateFn({
        data: { id, title: title || "Untitled script", brand, body_html: html, body_md: md },
      });
      setSavedAt(Date.now());
      setSaving(false);
      qc.invalidateQueries({ queryKey: ["studio", "scripts"] });
    };
    if (immediate) run();
    else saveTimer.current = setTimeout(run, 800);
  };

  // Save on editor changes
  useEffect(() => {
    if (!editor) return;
    const handler = () => triggerSave();
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, title, brand, id]);

  // Save on title/brand change (debounced)
  useEffect(() => {
    if (!hydrated.current) return;
    triggerSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, brand]);

  // ---- AI chat ----
  const currentMdRef = useRef("");
  useEffect(() => {
    if (!editor) return;
    currentMdRef.current = htmlToMarkdown(editor.getHTML());
  });

  const initialMessages = useMemo<UIMessage[]>(
    () =>
      priorMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text", text: m.content }],
      })),
    [priorMessages],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/studio-chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            scriptId: id,
            brand,
            title: title || "Untitled script",
            bodyMd: currentMdRef.current,
            messages,
          },
        }),
      }),
    [id, brand, title],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id,
    messages: initialMessages,
    transport,
  });

  // Seed history once loaded
  useEffect(() => {
    if (initialMessages.length && messages.length === 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  const [input, setInput] = useState("");
  const isBusy = status === "submitted" || status === "streaming";

  const onSend = (text: string) => {
    if (!text.trim() || isBusy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const replaceEditorWithMd = (md: string) => {
    if (!editor) return;
    editor.commands.setContent(markdownToHtml(md));
    triggerSave(true);
  };

  const insertMd = (md: string) => {
    if (!editor) return;
    const html = markdownToHtml(md);
    editor.chain().focus().insertContent(html).run();
    triggerSave(true);
  };

  const exportMd = () => {
    if (!editor) return;
    const md = htmlToMarkdown(editor.getHTML());
    const blob = new Blob([`# ${title}\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "script").replace(/[^\w\- ]+/g, "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Shell title="Loading…">
        <div className="text-muted-foreground text-[13px]">Loading script…</div>
      </Shell>
    );
  }
  if (!script) {
    return (
      <Shell title="Script not found">
        <Link to="/studio">
          <Btn>Back to Studio</Btn>
        </Link>
      </Shell>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b border-border bg-card/40 px-4 py-2.5 flex items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled script"
          className="flex-1 bg-transparent text-[15px] font-semibold tracking-tight focus:outline-none"
        />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={inputCls + " !h-8 !w-[160px] !py-0 text-[12px]"}
        >
          {BRANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <div className="text-[11px] text-muted-foreground w-24 text-right">
          {saving ? "Saving…" : savedAt ? "Saved" : "—"}
        </div>
        <Btn variant="subtle" onClick={() => triggerSave(true)} className="!h-8 flex items-center gap-1.5">
          <Save className="size-3.5" /> Save
        </Btn>
        <Btn variant="subtle" onClick={exportMd} className="!h-8 flex items-center gap-1.5">
          <FileDown className="size-3.5" /> .md
        </Btn>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-border bg-card/20 px-4 py-1.5 flex items-center gap-1 flex-wrap">
        <TBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}>
          <Bold className="size-3.5" />
        </TBtn>
        <TBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}>
          <Italic className="size-3.5" />
        </TBtn>
        <TBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")}>
          <UnderlineIcon className="size-3.5" />
        </TBtn>
        <Sep />
        <TBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive("heading", { level: 1 })}
        >
          <Heading1 className="size-3.5" />
        </TBtn>
        <TBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive("heading", { level: 2 })}
        >
          <Heading2 className="size-3.5" />
        </TBtn>
        <TBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor?.isActive("heading", { level: 3 })}
        >
          <Heading3 className="size-3.5" />
        </TBtn>
        <Sep />
        <TBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}>
          <List className="size-3.5" />
        </TBtn>
        <TBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}>
          <ListOrdered className="size-3.5" />
        </TBtn>
        <TBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")}>
          <Quote className="size-3.5" />
        </TBtn>
        <Sep />
        <TBtn onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="size-3.5" />
        </TBtn>
        <TBtn onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="size-3.5" />
        </TBtn>
      </div>

      {/* Main split */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-y-auto bg-background">
          <EditorContent editor={editor} />
        </div>

        {/* Chat panel */}
        <div className="w-[400px] shrink-0 border-l border-border bg-card/30 flex flex-col">
          <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em]">AI Assistant</div>
            <div className="flex-1" />
            {messages.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm("Clear chat history for this script?")) return;
                  await clearFn({ data: { scriptId: id } });
                  setMessages([]);
                  qc.invalidateQueries({ queryKey: ["studio", "messages", id] });
                }}
                className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="size-3" /> Clear
              </button>
            )}
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1.5">
            <QuickAction onClick={() => onSend("Generate a full first draft of this script based on the title and brand voice.")}>
              <Wand2 className="size-3" /> Generate draft
            </QuickAction>
            <QuickAction onClick={() => onSend("Tighten the current draft. Cut anything flabby. Keep the through-line.")}>
              Tighten
            </QuickAction>
            <QuickAction onClick={() => onSend("Rewrite the hook so it stops the scroll in the first 2 seconds.")}>
              Rewrite hook
            </QuickAction>
            <QuickAction onClick={() => onSend(`Rewrite this script in the ${brand} voice.`)}>
              Convert voice
            </QuickAction>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-[12.5px] text-muted-foreground italic px-1">
                Ask the AI to draft, rewrite, or brainstorm. It knows your Strategy and Operating Manual files.
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <div key={m.id} className="text-[13px]">
                  {m.role === "user" ? (
                    <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[90%] ml-auto whitespace-pre-wrap">
                      {text}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1">
                        <Sparkles className="size-3" /> AI
                      </div>
                      <div className="text-foreground/90">
                        <Markdown source={text} />
                      </div>
                      {text && status !== "streaming" && (
                        <div className="flex gap-1 pt-1">
                          <button
                            onClick={() => insertMd(text)}
                            className="text-[10.5px] uppercase tracking-wider text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border"
                          >
                            Insert
                          </button>
                          <button
                            onClick={() => replaceEditorWithMd(text)}
                            className="text-[10.5px] uppercase tracking-wider text-primary hover:bg-primary/10 px-2 py-0.5 rounded border border-primary/40"
                          >
                            Replace script
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {isBusy && (
              <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend(input);
            }}
            className="border-t border-border p-2.5 flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend(input);
                }
              }}
              placeholder="Ask the AI…"
              rows={2}
              className={inputCls + " flex-1 resize-none !py-2 text-[13px]"}
            />
            <Btn
              variant="primary"
              type="submit"
              disabled={isBusy || !input.trim()}
              className="!h-9 !w-9 !p-0 flex items-center justify-center"
            >
              <Send className="size-3.5" />
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}

function TBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 w-7 grid place-items-center rounded-md transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}

function QuickAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md bg-surface-2 hover:bg-surface-3 text-foreground/85"
    >
      {children}
    </button>
  );
}