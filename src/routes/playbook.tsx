import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { useStore } from "@/lib/store";
import { PLAYBOOK_LOOPS, PlaybookLoop } from "@/lib/types";
import { Plus, Search, FileText } from "lucide-react";

function PlaybookLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = /^\/playbook\/[^/]+/.test(pathname);
  return isChild ? <Outlet /> : <PlaybookIndex />;
}

export const Route = createFileRoute("/playbook")({
  component: PlaybookLayout,
  head: () => ({ meta: [{ title: "Playbook · Palmer House" }] }),
});



function PlaybookIndex() {
  const pages = useStore((s) => s.playbook);
  const upsert = useStore((s) => s.upsertPlaybookPage);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const [activeLoop, setActiveLoop] = useState<PlaybookLoop | "All">("All");

  const grouped = useMemo(() => {
    const filtered = pages.filter(
      (p) =>
        (!q ||
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.content.toLowerCase().includes(q.toLowerCase())) &&
        (activeLoop === "All" || p.loops.includes(activeLoop))
    );
    const g = new Map<string, typeof pages>();
    filtered.forEach((p) => {
      p.loops.forEach((loop) => {
        if (activeLoop === "All" || loop === activeLoop) {
          const a = g.get(loop) ?? [];
          a.push(p);
          g.set(loop, a);
        }
      });
    });
    return g;
  }, [pages, q, activeLoop]);

  return (
    <Shell
      title="Playbook"
      subtitle={`${pages.length} SOPs`}
      actions={
        <Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5">
          <Plus className="size-3.5" /> New page
        </Btn>
      }
    >
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search playbook…"
          className={inputCls + " pl-9"}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        <button
          onClick={() => setActiveLoop("All")}
          className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-colors whitespace-nowrap ${
            activeLoop === "All" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          }`}
        >
          All SOPs
        </button>
        {PLAYBOOK_LOOPS.map((loop) => (
          <button
            key={loop}
            onClick={() => setActiveLoop(loop)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-colors whitespace-nowrap ${
              activeLoop === loop ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
            }`}
          >
            {loop}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(activeLoop === "All" ? PLAYBOOK_LOOPS : [activeLoop]).map((loop) => {
          const items = grouped.get(loop) ?? [];
          if (items.length === 0 && activeLoop === "All") return null;
          return (
            <div key={loop} className="card-elevated rounded-2xl p-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {loop}
              </div>
              <h3 className="text-[15px] font-semibold tracking-tight mt-0.5 mb-3">
                {items.length} {items.length === 1 ? "page" : "pages"}
              </h3>
              <div className="space-y-1">
                {items.length === 0 && (
                  <p className="text-[12px] text-muted-foreground/70">No pages yet.</p>
                )}
                {items.map((p) => (
                  <Link
                    key={p.slug}
                    to="/playbook/$slug"
                    params={{ slug: p.slug }}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-surface-2"
                  >
                    <FileText className="size-3.5 text-muted-foreground" /> {p.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <NewPage open={open} onClose={() => setOpen(false)} />
    </Shell>
  );

  function NewPage({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [loop, setLoop] = useState<PlaybookLoop>(PLAYBOOK_LOOPS[0]);
    const submit = () => {
      if (!title.trim()) return;
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      upsert({
        slug,
        title,
        loops: [loop],
        purpose: "",
        ownerRole: "company",
        whenToUse: "",
        trigger: "",
        inputsNeeded: "",
        content: `# ${title}\n\nWrite SOP here.`,
        checklist: [],
        definitionOfDone: "",
        commonMistakes: "",
        updatedAt: new Date().toISOString(),
      });
      setTitle("");
      onClose();
    };
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="New playbook page"
        footer={
          <>
            <Btn variant="subtle" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={submit}>
              Create
            </Btn>
          </>
        }
      >
        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Primary Loop">
          <select className={inputCls} value={loop} onChange={(e) => setLoop(e.target.value as PlaybookLoop)}>
            {PLAYBOOK_LOOPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </Modal>
    );
  }
}
