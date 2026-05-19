import { useEffect, useRef, useState } from "react";
import { Modal, Btn, inputCls } from "@/components/ui-bits/Modal";
import { Sparkles, Loader2, Mic, MicOff, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { Markdown } from "@/components/Markdown";

type Msg = { role: "user" | "assistant"; content: string; applied?: string[]; error?: string };

type Action =
  | { type: "create_task"; title: string; assigneeId?: string; projectId?: string; dueDate?: string; priority?: "Low" | "Med" | "High" }
  | { type: "create_project"; title: string; clientId?: string; palType: "Visibility" | "Systems" | "YouTube" | "Commercial"; ownerId?: string; shootDate?: string; deliveryDate?: string; priority?: "Low" | "Med" | "High" }
  | { type: "update_shoot"; shootId: string; patch: Record<string, string> }
  | { type: "create_shoot"; projectId: string; date: string; startTime?: string; endTime?: string; location: string; goals?: string }
  | { type: "set_project_stage"; projectId: string; stage: string };

// Lightweight typings for the Web Speech API
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function AiAssistantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey — I'm Pals. Ask me to draft a script, write an SOP, add a todo, or move a shoot. Voice or text both work.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const applyActions = (actions: Action[]): string[] => {
    const applied: string[] = [];
    for (const a of actions) {
      try {
        if (a.type === "create_task") {
          store.addTask({
            title: a.title,
            assigneeId: a.assigneeId ?? store.team[0]?.id ?? "",
            projectId: a.projectId,
            dueDate: a.dueDate,
            priority: a.priority ?? "Med",
            status: "todo",
          });
          applied.push(`Task added: ${a.title}`);
        } else if (a.type === "create_project") {
          store.addProject({
            title: a.title,
            clientId: a.clientId ?? store.clients[0]?.id ?? "",
            palType: a.palType,
            ownerId: a.ownerId ?? store.team[0]?.id ?? "",
            shootDate: a.shootDate,
            deliveryDate: a.deliveryDate,
            priority: a.priority,
          });
          applied.push(`Project created: ${a.title}`);
        } else if (a.type === "update_shoot") {
          store.updateShoot(a.shootId, a.patch);
          applied.push(`Shoot updated`);
        } else if (a.type === "create_shoot") {
          store.addShoot({
            projectId: a.projectId,
            date: a.date,
            startTime: a.startTime,
            endTime: a.endTime,
            location: a.location,
            goals: a.goals,
            crewIds: [],
            status: "Scheduled",
          });
          applied.push(`Shoot scheduled for ${a.date}`);
        } else if (a.type === "set_project_stage") {
          // store.setStage expects Stage union; cast safely
          store.setStage(a.projectId, a.stage as Parameters<typeof store.setStage>[1]);
          applied.push(`Stage updated`);
        }
      } catch (e) {
        applied.push(`Action failed: ${(e as Error).message}`);
      }
    }
    return applied;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);

    const context = {
      team: store.team.map((t) => ({ id: t.id, name: t.name, role: t.role })),
      clients: store.clients.map((c) => ({ id: c.id, name: c.name, company: c.company })),
      projects: store.projects.map((p) => ({
        id: p.id,
        title: p.title,
        stage: p.stage,
        palType: p.palType,
        clientId: p.clientId,
        shootDate: p.shootDate,
      })),
      shoots: store.shoots.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        date: s.date,
        startTime: s.startTime,
        location: s.location,
        status: s.status,
      })),
      today: new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await fetch("/api/pals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        let pretty = errText;
        if (res.status === 429) pretty = "Rate limit reached. Try again in a moment.";
        else if (res.status === 402) pretty = "AI credits exhausted. Add credits in Settings → Workspace → Usage.";
        setMessages((m) => [...m, { role: "assistant", content: "", error: pretty }]);
      } else {
        const data = (await res.json()) as { reply: string; actions: Action[] };
        const applied = data.actions?.length ? applyActions(data.actions) : [];
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "", applied }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "", error: (e as Error).message }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const W = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(finalText + interim);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) void send(finalText);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <Modal title="Pals — AI Assistant" open={open} onClose={onClose} wide>
      <div className="flex flex-col h-[70vh] max-h-[640px]">
        <div ref={scrollerRef} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-foreground"
                }`}
              >
                {m.error ? (
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{m.error}</span>
                  </div>
                ) : m.role === "assistant" ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
                {m.applied && m.applied.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                    {m.applied.map((a, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[12px] text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-surface-2 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-muted-foreground text-[13px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-border">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy}
              className={`size-10 shrink-0 rounded-xl grid place-items-center transition-colors ${
                listening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-surface-2 hover:bg-surface-3 text-foreground"
              }`}
              title={listening ? "Stop listening" : "Voice input"}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder={listening ? "Listening…" : "Ask Pals anything — Enter to send, Shift+Enter for newline"}
              className={inputCls + " resize-none min-h-[40px] max-h-[140px]"}
              disabled={busy}
            />
            <Btn
              variant="primary"
              onClick={() => void send(input)}
              disabled={!input.trim() || busy}
              className="h-10 flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Btn>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            Powered by Lovable AI. Try: "Draft a 60s Visibility script on creator burnout" or "Add a todo to follow up with the Henderson lead Friday".
          </div>
        </div>
      </div>
    </Modal>
  );
}