import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Search,
  CalendarDays,
  CircleHelp,
  CheckCheck,
  Film,
  ListTodo,
  Clapperboard,
  Users,
  Inbox,
} from "lucide-react";
import { useNotifications, useUnreadCount } from "@/lib/notifications";
import { useStore } from "@/lib/store";
import { useCCStore } from "@/lib/ccStore";
import { usePalsUI } from "@/lib/palsUI";

/* ── Notification bell ─────────────────────────────────────────────────── */

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const KIND_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  task: ListTodo,
  schedule: CalendarDays,
  content: Clapperboard,
  system: Inbox,
};

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const items = useNotifications((s) => s.items);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const clear = useNotifications((s) => s.clear);
  const unread = useUnreadCount();
  const ref = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) setTimeout(markAllRead, 1200);
        }}
        className="relative w-10 h-10 rounded-xl bg-sunken border border-line flex items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors"
      >
        <motion.span
          key={unread} // re-trigger ring shake when count changes
          animate={unread ? { rotate: [0, -12, 10, -6, 4, 0] } : { rotate: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="inline-flex"
        >
          <Bell size={16} />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose text-white text-[9.5px] font-bold flex items-center justify-center shadow-[0_0_10px_color-mix(in_oklab,var(--accent-rose)_60%,transparent)]"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-[min(360px,calc(100vw-24px))] bg-panel border border-line rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <span className="font-display font-bold text-hi text-sm">Notifications</span>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <>
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-mid hover:text-hi flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={12} /> Read all
                    </button>
                    <button
                      onClick={clear}
                      className="text-[11px] text-lo hover:text-rose transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={20} className="mx-auto text-lo mb-2" />
                  <p className="text-mid text-xs">All caught up.</p>
                  <p className="text-lo text-[11px]">Task assignments and updates land here.</p>
                </div>
              ) : (
                items.slice(0, 20).map((n) => {
                  const Icon = KIND_ICON[n.kind] ?? Inbox;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        if (n.to) navigate({ to: n.to });
                      }}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-sunken transition-colors border-b border-line/50 last:border-b-0"
                    >
                      <span
                        className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? "bg-sunken text-lo" : "bg-brand-600/15 text-brand-400"}`}
                      >
                        <Icon size={13} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block text-[12.5px] leading-snug ${n.read ? "text-mid" : "text-hi font-semibold"}`}
                        >
                          {n.title}
                        </span>
                        {n.description && (
                          <span className="block text-[11.5px] text-lo truncate">
                            {n.description}
                          </span>
                        )}
                        <span className="block text-[10px] text-lo mt-0.5">{timeAgo(n.ts)}</span>
                      </span>
                      {!n.read && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Global search ─────────────────────────────────────────────────────── */

type Hit = {
  label: string;
  sub: string;
  to: string;
  params?: Record<string, string>;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export function GlobalSearch() {
  const [q, setQ] = React.useState("");
  const [focus, setFocus] = React.useState(false);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const clients = useStore((s) => s.clients);
  const library = useCCStore((s) => s.library);
  const ref = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocus(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hits = React.useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const out: Hit[] = [];
    for (const p of projects) {
      if (p.title.toLowerCase().includes(needle))
        out.push({
          label: p.title,
          sub: `Production · ${p.stage}`,
          to: "/projects/$id",
          params: { id: p.id },
          icon: Film,
        });
    }
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(needle))
        out.push({ label: t.title, sub: `Task · ${t.status}`, to: "/tasks", icon: ListTodo });
    }
    for (const c of clients) {
      if (c.name.toLowerCase().includes(needle))
        out.push({
          label: c.name,
          sub: "Client",
          to: "/clients/$id",
          params: { id: c.id },
          icon: Users,
        });
    }
    for (const it of library) {
      if (it.title.toLowerCase().includes(needle))
        out.push({
          label: it.title,
          sub: `Content · ${it.platform}`,
          to: "/content",
          icon: Clapperboard,
        });
    }
    return out.slice(0, 8);
  }, [q, projects, tasks, clients, library]);

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        placeholder="Search projects, tasks, content…"
        className="bg-sunken border border-line text-hi placeholder-lo text-sm rounded-xl pl-9 pr-4 py-2.5 w-64 focus:outline-none focus:border-brand-500 focus:w-72 transition-all"
      />
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo" />
      <AnimatePresence>
        {focus && q.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-[360px] bg-panel border border-line rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {hits.length === 0 ? (
              <div className="px-4 py-6 text-center text-mid text-xs">
                No matches for “{q.trim()}”.
              </div>
            ) : (
              hits.map((h, i) => {
                const Icon = h.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setFocus(false);
                      setQ("");
                      navigate({ to: h.to, params: h.params as never });
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-sunken transition-colors border-b border-line/50 last:border-b-0"
                  >
                    <span className="w-7 h-7 rounded-lg bg-sunken flex items-center justify-center text-mid flex-shrink-0">
                      <Icon size={13} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-hi truncate">
                        {h.label}
                      </span>
                      <span className="block text-[10.5px] text-lo">{h.sub}</span>
                    </span>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Quick actions: calendar + help ───────────────────────────────────── */

export function TopbarQuickActions() {
  const { toggle } = usePalsUI();
  return (
    <>
      <Link
        to="/schedule"
        aria-label="Open schedule"
        className="hidden sm:flex w-10 h-10 rounded-xl bg-sunken border border-line items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors"
      >
        <CalendarDays size={16} />
      </Link>
      <button
        type="button"
        aria-label="Ask Pals (help)"
        onClick={toggle}
        className="hidden md:flex w-10 h-10 rounded-xl bg-sunken border border-line items-center justify-center text-mid hover:text-hi hover:bg-raised transition-colors"
      >
        <CircleHelp size={16} />
      </button>
    </>
  );
}
