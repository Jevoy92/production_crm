import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/dashboard/Shell";
import { Btn } from "@/components/ui-bits/Modal";
import { listScripts, createScript, deleteScript } from "@/lib/studio.functions";
import { Plus, FileText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/studio")({
  component: StudioLayout,
  head: () => ({ meta: [{ title: "Script Studio · Palmer House OS" }] }),
});

function StudioLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/studio";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listScripts);
  const createFn = useServerFn(createScript);
  const deleteFn = useServerFn(deleteScript);

  const { data: scripts = [] } = useQuery({
    queryKey: ["studio", "scripts"],
    queryFn: () => listFn(),
  });

  const create = useMutation({
    mutationFn: () => createFn({ data: {} }),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["studio", "scripts"] });
      navigate({ to: "/studio/$id", params: { id: s.id } });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio", "scripts"] }),
  });

  if (isChild) {
    return (
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-border bg-card/40 flex flex-col">
          <div className="p-3 flex items-center justify-between border-b border-border">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Scripts
            </div>
            <Btn variant="primary" onClick={() => create.mutate()} className="!h-7 !px-2">
              <Plus className="size-3.5" />
            </Btn>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {scripts.length === 0 && (
              <div className="text-[12px] text-muted-foreground px-2 py-3">
                No scripts yet. Hit + to start one.
              </div>
            )}
            {scripts.map((s) => (
              <ScriptRail
                key={s.id}
                id={s.id}
                title={s.title}
                onDelete={() => {
                  if (confirm(`Delete "${s.title}"?`)) del.mutate(s.id);
                }}
              />
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Link to="/" className="text-[12px] text-muted-foreground hover:text-foreground">
              ← Back to dashboard
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <Shell title="Script Studio" subtitle="Generate, edit, and save scripts with the AI">
      <div className="card-elevated rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] text-muted-foreground">
            {scripts.length} saved script{scripts.length === 1 ? "" : "s"}
          </div>
          <Btn variant="primary" onClick={() => create.mutate()} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> New script
          </Btn>
        </div>
        {scripts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="text-[14px] text-muted-foreground">
              No scripts yet. Create one and the AI will help you build it.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {scripts.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <FileText className="size-4 text-muted-foreground" />
                <Link
                  to="/studio/$id"
                  params={{ id: s.id }}
                  className="flex-1 text-[13.5px] hover:text-primary"
                >
                  {s.title}
                </Link>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {s.brand}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${s.title}"?`)) del.mutate(s.id);
                  }}
                  className="opacity-50 hover:opacity-100 hover:text-destructive p-1"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function ScriptRail({
  id,
  title,
  onDelete,
}: {
  id: string;
  title: string;
  onDelete: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === `/studio/${id}`;
  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
        active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2/60"
      }`}
    >
      <Link to="/studio/$id" params={{ id }} className="flex-1 truncate">
        {title || "Untitled"}
      </Link>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}