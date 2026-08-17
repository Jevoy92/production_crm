import * as React from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DailyCheckout } from "@/components/dashboard/DailyCheckout";
import { SHANNEN_BLOCKS } from "@/lib/shannenPlaybook";
import { JEVOY_BLOCKS } from "@/lib/jevoyPlaybook";

const PEOPLE = [
  { id: "u_shannen", blocks: SHANNEN_BLOCKS },
  { id: "u_jevoy", blocks: JEVOY_BLOCKS },
] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Read live playbook progress across both people from localStorage. */
function readVelocity() {
  if (typeof window === "undefined") return { done: 0, total: 0 };
  let done = 0;
  let total = 0;
  const day = todayKey();
  for (const p of PEOPLE) {
    let overrides: Record<string, string[]> = {};
    try { overrides = JSON.parse(localStorage.getItem(`dayItems:${p.id}`) ?? "{}"); } catch {}
    let checked: Record<string, boolean> = {};
    try { checked = JSON.parse(localStorage.getItem(`dayChecked:${p.id}:${day}`) ?? "{}"); } catch {}
    for (const b of p.blocks) {
      const items = overrides[b.id] ?? b.items;
      total += items.length;
      for (let i = 0; i < items.length; i++) {
        if (checked[`${b.id}-${i}`]) done += 1;
      }
    }
  }
  return { done, total };
}

/**
 * Compact "End of Day Sync" banner for the global topbar.
 * Mirrors the dashboard close-out card: flag avatar, title + blurb,
 * team velocity stat, and a Start Wrap-up Review CTA that opens the
 * full DailyCheckout in a dialog.
 */
export function EndOfDaySync() {
  const [open, setOpen] = React.useState(false);
  const [{ done, total }, setVel] = React.useState(readVelocity);

  // Live updates: storage events fire across tabs; a short interval covers
  // same-tab playbook check-offs (localStorage writes don't emit "storage"
  // in the originating tab).
  React.useEffect(() => {
    const tick = () => setVel(readVelocity());
    tick();
    const i = window.setInterval(tick, 1200);
    window.addEventListener("storage", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(i);
      window.removeEventListener("storage", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);
  // Refresh whenever the dialog closes (user may have logged checkout).
  React.useEffect(() => { if (!open) setVel(readVelocity()); }, [open]);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group hidden md:flex items-center gap-4 pl-2.5 pr-2.5 py-2 rounded-2xl border border-line bg-sunken/60 hover:border-brand-500/40 hover:bg-sunken transition-colors text-left"
          title={`Start end-of-day wrap-up · ${done}/${total} playbook items done`}
        >
          <span className="relative shrink-0 w-9 h-9 rounded-xl bg-zinc-900/60 border border-line grid place-items-center text-mid">
            <Flag size={15} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald border-2 border-panel" />
          </span>
          <span className="min-w-0 hidden 2xl:flex flex-col leading-tight">
            <span className="text-[12.5px] font-bold text-hi whitespace-nowrap">End of Day Sync</span>
            <span className="text-[10.5px] text-lo whitespace-nowrap">Review outcomes &amp; close loops</span>
          </span>
          <span className="hidden 2xl:flex flex-col items-end pl-4 ml-1 border-l border-line leading-tight whitespace-nowrap">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-lo">Team Velocity</span>
            <span className="text-[12px] font-bold text-hi num">
              {done}<span className="text-lo font-semibold"> / {total}</span>
              <span className="ml-1.5 text-[10px] text-emerald font-semibold">{pct}%</span>
            </span>
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-line bg-zinc-900/60 text-hi group-hover:border-brand-500/50 group-hover:text-brand-300 whitespace-nowrap">
            Start
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 bg-panel border-line overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line bg-sunken/40">
          <span className="relative shrink-0 w-10 h-10 rounded-xl bg-zinc-900/60 border border-line grid place-items-center text-mid">
            <Flag size={16} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald border-2 border-panel" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-hi text-base leading-tight">End of Day Sync</h2>
            <p className="text-lo text-xs mt-0.5">Review outcomes, log friction points, and close loops.</p>
          </div>
          <div className="hidden sm:flex flex-col items-end pl-3 border-l border-line leading-tight whitespace-nowrap">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-lo">Team Velocity</span>
            <span className="text-xs font-bold text-hi num">{done} / {total} done · {pct}%</span>
          </div>
        </div>
        <div className="px-5 pb-5 -mt-2 max-h-[70vh] overflow-y-auto">
          <DailyCheckout personName="Today" />
        </div>
      </DialogContent>
    </Dialog>
  );
}