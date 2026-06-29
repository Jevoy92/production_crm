import * as React from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DailyCheckout } from "@/components/dashboard/DailyCheckout";
import { useStore } from "@/lib/store";

/**
 * Compact "End of Day Sync" banner for the global topbar.
 * Mirrors the dashboard close-out card: flag avatar, title + blurb,
 * team velocity stat, and a Start Wrap-up Review CTA that opens the
 * full DailyCheckout in a dialog.
 */
export function EndOfDaySync() {
  const tasks = useStore((s) => s.tasks);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group hidden md:flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl border border-line bg-sunken/60 hover:border-brand-500/40 hover:bg-sunken transition-colors text-left max-w-[420px]"
          title="Start end-of-day wrap-up"
        >
          <span className="relative shrink-0 w-9 h-9 rounded-xl bg-zinc-900/60 border border-line grid place-items-center text-mid">
            <Flag size={15} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald border-2 border-panel" />
          </span>
          <span className="min-w-0 hidden lg:flex flex-col leading-tight">
            <span className="text-[12px] font-bold text-hi truncate">End of Day Sync</span>
            <span className="text-[10.5px] text-lo truncate">Review outcomes, log friction, close loops.</span>
          </span>
          <span className="hidden xl:flex flex-col items-end pl-3 ml-1 border-l border-line leading-tight">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-lo">Team Velocity</span>
            <span className="text-[11.5px] font-bold text-hi num">{done} / {total} Logged</span>
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-line bg-zinc-900/60 text-hi group-hover:border-brand-500/50 group-hover:text-brand-300">
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
          <div className="hidden sm:flex flex-col items-end pl-3 border-l border-line leading-tight">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-lo">Team Velocity</span>
            <span className="text-xs font-bold text-hi num">{done} / {total} Tasks Logged</span>
          </div>
        </div>
        <div className="px-5 pb-5 -mt-2 max-h-[70vh] overflow-y-auto">
          <DailyCheckout personName="Today" />
        </div>
      </DialogContent>
    </Dialog>
  );
}