import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { X, RotateCcw } from "lucide-react";
import palsAvatar from "@/assets/pals-avatar.png";
import { buildPalsSnapshot, executePalsTool } from "@/lib/pals.executor";
import {
  loadPalsMessages,
  savePalsMessage,
  clearPalsMessages,
} from "@/lib/pals.persistence";
import { WRITE_TOOL_NAMES } from "@/lib/pals.tools";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";

type PendingApproval = {
  messageId: string;
  toolCallId: string;
  toolName: string;
  input: any;
};

export function PalsDrawer({ onClose }: { onClose: () => void }) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);
  const [pending, setPending] = useState<PendingApproval | null>(null);
  const [busyToolCallId, setBusyToolCallId] = useState<string | null>(null);
  const savedIdsRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPalsMessages().then((msgs) => {
      if (cancelled) return;
      for (const m of msgs) savedIdsRef.current.add(m.id);
      setInitialMessages(msgs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (initialMessages === null) {
    return (
      <aside className="pals-drawer">
        <PalsHeader onClose={onClose} onClear={() => undefined} disabled />
        <div className="pals-loading">
          <Shimmer>Loading conversation…</Shimmer>
        </div>
      </aside>
    );
  }

  return (
    <PalsChat
      initialMessages={initialMessages}
      onClose={onClose}
      pending={pending}
      setPending={setPending}
      busyToolCallId={busyToolCallId}
      setBusyToolCallId={setBusyToolCallId}
      savedIdsRef={savedIdsRef}
      textareaRef={textareaRef}
    />
  );
}

function PalsHeader({
  onClose,
  onClear,
  disabled,
}: {
  onClose: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <header className="pals-header">
      <div className="pals-header-id">
        <img src={palsAvatar} alt="" width={28} height={28} loading="lazy" />
        <div>
          <div className="pals-name">Pals</div>
          <div className="pals-sub">Palmer House AI assistant</div>
        </div>
      </div>
      <div className="pals-header-actions">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          disabled={disabled}
          aria-label="New conversation"
          title="New conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function PalsChat({
  initialMessages,
  onClose,
  pending,
  setPending,
  busyToolCallId,
  setBusyToolCallId,
  savedIdsRef,
  textareaRef,
}: {
  initialMessages: UIMessage[];
  onClose: () => void;
  pending: PendingApproval | null;
  setPending: (p: PendingApproval | null) => void;
  busyToolCallId: string | null;
  setBusyToolCallId: (id: string | null) => void;
  savedIdsRef: React.MutableRefObject<Set<string>>;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const [resetKey, setResetKey] = useState(0);

  const chat = useChat({
    id: `pals-shared-${resetKey}`,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/pals",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, snapshot: await buildPalsSnapshot() },
      }),
    }),
    onError: (err: any) => console.error("[pals] chat error", err),
    sendAutomaticallyWhen: ({ messages }: { messages: UIMessage[] }) => {
      const last = messages[messages.length - 1];
      if (!last) return false;
      return (last.parts as any[]).some(
        (p) =>
          typeof p?.type === "string" &&
          p.type.startsWith("tool-") &&
          p.state === "output-available",
      );
    },
  } as any);

  const { messages, sendMessage, status, addToolResult, setMessages } = chat as any;

  useEffect(() => {
    for (const m of messages as UIMessage[]) {
      if (savedIdsRef.current.has(m.id)) continue;
      if (
        m.role === "user" ||
        (m.role === "assistant" && status !== "streaming" && status !== "submitted")
      ) {
        savedIdsRef.current.add(m.id);
        void savePalsMessage(m);
      }
    }
  }, [messages, status, savedIdsRef]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [textareaRef, resetKey]);

  useEffect(() => {
    if (pending || busyToolCallId) return;
    for (const m of messages as UIMessage[]) {
      for (const part of m.parts as any[]) {
        const t: string | undefined = part?.type;
        if (!t || !t.startsWith("tool-")) continue;
        if (part.state !== "input-available") continue;
        const toolName = t.slice("tool-".length);
        const toolCallId: string = part.toolCallId;
        if (WRITE_TOOL_NAMES.has(toolName)) {
          setPending({ messageId: m.id, toolCallId, toolName, input: part.input });
          return;
        } else {
          setBusyToolCallId(toolCallId);
          executePalsTool(toolName, part.input)
            .then((result) =>
              addToolResult({ tool: toolName, toolCallId, output: result }),
            )
            .catch((err: any) =>
              addToolResult({
                tool: toolName,
                toolCallId,
                output: { ok: false, error: err?.message ?? String(err) },
              }),
            )
            .finally(() => setBusyToolCallId(null));
          return;
        }
      }
    }
  }, [messages, pending, busyToolCallId, addToolResult, setPending, setBusyToolCallId]);

  async function approvePending() {
    if (!pending) return;
    const { toolCallId, toolName, input } = pending;
    setPending(null);
    setBusyToolCallId(toolCallId);
    try {
      const result = await executePalsTool(toolName, input);
      await addToolResult({ tool: toolName, toolCallId, output: result });
    } catch (err: any) {
      await addToolResult({
        tool: toolName,
        toolCallId,
        output: { ok: false, error: err?.message ?? String(err) },
      });
    } finally {
      setBusyToolCallId(null);
    }
  }

  async function rejectPending() {
    if (!pending) return;
    const { toolCallId, toolName } = pending;
    setPending(null);
    await addToolResult({
      tool: toolName,
      toolCallId,
      output: { ok: false, error: "User declined this action." },
    });
  }

  async function handleNewConversation() {
    if (!confirm("Clear the Pals conversation history? This can't be undone.")) return;
    await clearPalsMessages();
    savedIdsRef.current = new Set();
    setMessages([]);
    setResetKey((k) => k + 1);
  }

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <aside className="pals-drawer" role="dialog" aria-label="Pals AI assistant">
      <PalsHeader onClose={onClose} onClear={handleNewConversation} />

      <Conversation className="pals-conversation">
        <ConversationContent className="pals-conversation-content">
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={
                <img
                  src={palsAvatar}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  style={{ borderRadius: 12 }}
                />
              }
              title="Hey, I'm Pals."
              description="Ask me what's on for today, add a task, schedule a shoot, or generate the 3 supporting shorts for any Core 12 episode."
            />
          )}

          {(messages as UIMessage[]).map((m) => (
            <Message key={m.id} from={m.role as any}>
              <MessageContent>
                {(m.parts as any[]).map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                        {part.text}
                      </span>
                    );
                  }
                  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                    const toolName = part.type.slice("tool-".length);
                    const isWrite = WRITE_TOOL_NAMES.has(toolName);
                    const isPending = pending?.toolCallId === part.toolCallId;
                    const isBusy = busyToolCallId === part.toolCallId;
                    return (
                      <Tool key={part.toolCallId ?? i} defaultOpen={isPending}>
                        <ToolHeader type={part.type as any} state={part.state} />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          {isPending && isWrite ? (
                            <div className="pals-approval">
                              <div className="pals-approval-label">
                                Pals wants to <strong>{toolName}</strong>. Approve?
                              </div>
                              <div className="pals-approval-actions">
                                <Button size="sm" variant="outline" onClick={rejectPending}>
                                  Reject
                                </Button>
                                <Button size="sm" onClick={approvePending}>
                                  Approve
                                </Button>
                              </div>
                            </div>
                          ) : isBusy ? (
                            <div className="pals-tool-busy">
                              <Shimmer>Running…</Shimmer>
                            </div>
                          ) : (
                            <ToolOutput output={part.output} errorText={part.errorText} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}

          {isLoading && !pending && (
            <div className="pals-thinking">
              <Shimmer>Thinking…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="pals-composer">
        <PromptInput
          onSubmit={(msg) => {
            const text = msg.text?.trim();
            if (!text) return;
            void sendMessage({ text });
          }}
        >
          <PromptInputTextarea
            ref={textareaRef as any}
            placeholder="Ask Pals to do something…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={isLoading || !!pending} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </aside>
  );
}