import { useState } from "react";
import { Modal, Btn, Field, inputCls } from "@/components/ui-bits/Modal";
import { Sparkles, FileText, CheckSquare, Loader2, Copy, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import type { PalType } from "@/lib/types";

export function AiAssistantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"script" | "sop">("script");
  const [topic, setTopic] = useState("");
  const [palType, setPalType] = useState<PalType>("Visibility");
  
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult("");
    
    // Simulate AI generation delay
    setTimeout(() => {
      setGenerating(false);
      if (tab === "script") {
        setResult(`**TITLE IDEA:** 3 Uncomfortable Truths About [${topic}]

**HOOK (0:00-0:05):**
"Everyone tells you to do [Topic], but they are leaving out the one detail that actually makes it work."

**CONTEXT / THE PROBLEM (0:05-0:20):**
"When most business owners try to tackle this, they usually end up making [Common Mistake], which wastes time and burns cash."

**THE SOLUTION / THE PALMER HOUSE METHOD (0:20-0:45):**
"Here is the system we use instead. Step 1: Strip away the fluff. Step 2: Focus entirely on the handoffs. Step 3..."

**CALL TO ACTION (0:45-0:60):**
"If you want the exact checklist we use for this, comment 'SYSTEM' below and I'll send it over."`);
      } else {
        setResult(`**STANDARD OPERATING PROCEDURE: [${topic}]**

**Purpose:** 
To ensure [Topic] is handled predictably, cleanly, and without relying on Jevoy's memory.

**When to use this:**
Whenever a new project enters the [Topic] phase.

**Step-by-Step Checklist:**
1. [ ] Verify that the client has completed the prerequisite intake form.
2. [ ] Open the project in Palmer House OS and move the stage to the active column.
3. [ ] Generate the required asset folders in Google Drive using the standard naming convention (CLIENT_PROJECT_MMDDYY).
4. [ ] Send the 'Next Steps' template email to the client to set expectations.
5. [ ] Log any friction points or missing gear in the Scoreboard immediately.

**Troubleshooting:**
- If the client doesn't reply within 48 hours: Send Follow-Up sequence 1.
- If assets are missing: Flag in the 'Blockers' field in the OS.`);
      }
    }, 1500);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setResult("");
    setTopic("");
  };

  return (
    <Modal title="Pals AI Assistant" open={open} onClose={onClose} wide>
      {!result && !generating ? (
        <>
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <button
              onClick={() => setTab("script")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "script" ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-surface-3"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Draft a Script
              </div>
            </button>
            <button
              onClick={() => setTab("sop")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "sop" ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-surface-3"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Create an SOP
              </div>
            </button>
          </div>

          <div className="space-y-4">
            {tab === "script" && (
              <Field label="What kind of video is this?">
                <select className={inputCls} value={palType} onChange={(e) => setPalType(e.target.value as PalType)}>
                  <option value="Visibility">Visibility Pal (Social/Shorts)</option>
                  <option value="YouTube">YouTube Pal (Longform)</option>
                  <option value="Commercial">Commercial Pal (Ad/Promo)</option>
                  <option value="Systems">Systems Pal (Internal/Training)</option>
                </select>
              </Field>
            )}

            <Field label={tab === "script" ? "What is the topic or core message?" : "What process needs to be documented?"}>
              <textarea
                autoFocus
                className={inputCls + " min-h-[100px]"}
                placeholder={tab === "script" ? "e.g. Why most small businesses waste money on bad video ads..." : "e.g. How to prep a client for a shoot day..."}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
                }}
              />
            </Field>

            <div className="pt-2 flex justify-end gap-2">
              <Btn variant="subtle" onClick={onClose}>Cancel</Btn>
              <Btn variant="primary" onClick={generate} disabled={!topic.trim()} className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate
              </Btn>
            </div>
          </div>
        </>
      ) : generating ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm animate-pulse">
            {tab === "script" ? "Drafting the perfect hook and structure..." : "Structuring a foolproof operational checklist..."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {tab === "script" ? "Generated Script Outline" : "Generated SOP Document"}
            </h3>
            <div className="flex gap-2">
              <Btn variant="subtle" onClick={copy} className="flex items-center gap-1.5 h-8">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy to Clipboard"}
              </Btn>
              <Btn variant="subtle" onClick={reset} className="h-8">Start Over</Btn>
            </div>
          </div>
          
          <div className="bg-surface-2 p-4 rounded-xl border border-border text-[13px] leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 max-h-[400px] overflow-y-auto">
            {result}
          </div>
        </div>
      )}
    </Modal>
  );
}
