import { useState } from "react";
import { Star, CircleCheck, Pencil, Flag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCheckoutStore, todayKey, type CheckoutEntry } from "@/lib/checkoutStore";
import { useNotifications } from "@/lib/notifications";

export function DailyCheckout({ personName }: { personName: string }) {
  const key = todayKey();
  const saved = useCheckoutStore((s) => s.dailyCheckouts[key]);
  const save = useCheckoutStore((s) => s.saveCheckout);
  const clear = useCheckoutStore((s) => s.clearCheckout);
  const notify = useNotifications((s) => s.notify);

  const [editing, setEditing] = useState(!saved);
  const [stars, setStars] = useState<number>(saved?.stars ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [toolsOk, setToolsOk] = useState<boolean | null>(saved ? saved.toolsOk : null);
  const [toolsMissing, setToolsMissing] = useState<string>(saved?.toolsMissing ?? "");
  const [issues, setIssues] = useState<string>(saved?.issues ?? "");

  function submit() {
    if (!stars) {
      toast.error("Pick a star rating first");
      return;
    }
    const entry: Omit<CheckoutEntry, "savedAt"> = {
      stars,
      toolsOk: toolsOk ?? true,
      toolsMissing: toolsOk === false ? toolsMissing.trim() || undefined : undefined,
      issues: issues.trim() || undefined,
    };
    save(key, entry);
    setEditing(false);
    toast.success(`${personName.split(" ")[0]}'s check-out logged`, {
      description: `${"★".repeat(stars)}${"☆".repeat(5 - stars)} · ${entry.toolsOk ? "Tools OK" : "Tool gap flagged"}`,
    });
    notify({
      kind: "system",
      title: `${personName.split(" ")[0]} checked out — ${stars}/5`,
      description: entry.issues ? `Issue logged: ${entry.issues.slice(0, 80)}` : entry.toolsOk ? "Smooth day, no friction logged." : "Flagged a tool/resource gap.",
      to: "/",
    });
  }

  // Collapsed summary
  if (saved && !editing) {
    return (
      <div className="mt-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <CircleCheck size={14} className="text-emerald flex-shrink-0" />
            <div className="flex items-center gap-1 text-amber">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} className={i < saved.stars ? "fill-amber text-amber" : "text-line"} />
              ))}
            </div>
            <span className="text-xs text-mid">
              · Tools {saved.toolsOk ? "✓" : "⚠"}
              {saved.issues ? " · 1 issue logged" : " · no issues"}
            </span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1"
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="rounded-xl border border-line bg-sunken/40 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-brand-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-hi">End of Day Check-Out</p>
        </div>

        {/* Q1: stars */}
        <div>
          <p className="text-xs text-mid mb-2">1. How would you rate today?</p>
          <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover || stars) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setStars(n)}
                  className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    size={26}
                    className={`transition-all duration-150 ${active ? "fill-amber text-amber drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-line"}`}
                  />
                </button>
              );
            })}
            {stars > 0 && (
              <span className="ml-2 text-xs text-mid font-semibold">{stars}/5</span>
            )}
          </div>
        </div>

        {/* Q2: tools */}
        <div>
          <p className="text-xs text-mid mb-2">
            2. Did you have all the tools you needed to complete your tasks successfully and to a high degree?
          </p>
          <div className="inline-flex rounded-lg border border-line bg-zinc-900/50 p-0.5">
            <button
              type="button"
              onClick={() => setToolsOk(true)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${toolsOk === true ? "bg-emerald/20 text-emerald" : "text-mid hover:text-hi"}`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setToolsOk(false)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${toolsOk === false ? "bg-rose/20 text-rose" : "text-mid hover:text-hi"}`}
            >
              No
            </button>
          </div>
          {toolsOk === false && (
            <textarea
              value={toolsMissing}
              onChange={(e) => setToolsMissing(e.target.value)}
              rows={2}
              placeholder="What was missing?"
              className="mt-2 w-full rounded-lg bg-zinc-900/60 border border-line px-3 py-2 text-xs text-hi placeholder:text-lo focus:outline-none focus:border-brand-500/50 resize-y"
            />
          )}
        </div>

        {/* Q3: issues */}
        <div>
          <p className="text-xs text-mid mb-2">
            3. What issues, if any, did you have today — and were they solved? If not, what do you need to resolve them?
          </p>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            rows={3}
            placeholder="No friction today? Just say 'all smooth.' Otherwise, name the snag + what would unblock it."
            className="w-full rounded-lg bg-zinc-900/60 border border-line px-3 py-2 text-xs text-hi placeholder:text-lo focus:outline-none focus:border-brand-500/50 resize-y"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {saved ? (
            <button
              type="button"
              onClick={() => {
                clear(key);
                setStars(0); setToolsOk(null); setToolsMissing(""); setIssues("");
              }}
              className="text-[11px] text-lo hover:text-mid"
            >
              Reset
            </button>
          ) : <span />}
          <button
            type="button"
            onClick={submit}
            disabled={!stars}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Flag size={12} /> {saved ? "Update check-out" : "Log check-out"}
          </button>
        </div>
        <p className="text-[10px] text-lo">Logged — thanks. See you tomorrow.</p>
      </div>
    </div>
  );
}