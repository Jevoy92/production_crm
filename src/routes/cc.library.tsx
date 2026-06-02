import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/dashboard/Shell";
import { CCNav, LaneBadge, StatusBadge } from "@/components/cc/CCNav";
import { useCCStore, CC_STATUSES, CONTENT_TYPES, PLATFORMS, PAL_LANES, type CCStatus, type ContentType, type Platform, type PalLane } from "@/lib/ccStore";

export const Route = createFileRoute("/cc/library")({
  component: LibraryPage,
  head: () => ({ meta: [{ title: "Content Library · Content Command Center" }] }),
});

function LibraryPage() {
  const { library, addContentItem, updateContentItem, removeContentItem } = useCCStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [lane, setLane] = useState<string>("");

  const filtered = library.filter((c) =>
    (!q || c.title.toLowerCase().includes(q.toLowerCase())) &&
    (!type || c.type === type) &&
    (!status || c.status === status) &&
    (!lane || c.palLane === lane)
  );

  const addNew = () => addContentItem({
    title: "New content item", type: "Short", platform: "Instagram Reels", status: "Idea", palLane: "Reel",
    businessPurpose: "", cta: "", fileLocation: "", editorNotes: "", caption: "", thumbnailIdea: "", repurposingStatus: "", performanceNotes: "",
  });

  return (
    <Shell title="Content Library" subtitle="Every asset, searchable"
      actions={<button onClick={addNew} className="text-[13px] px-3 py-1.5 rounded-md bg-primary text-primary-foreground">+ Add item</button>}>
      <CCNav />

      <div className="flex flex-wrap gap-2 mb-3">
        <input className="flex-1 min-w-[200px] bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-[13px]"
          placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="bg-surface-2 border border-border rounded-md px-2 text-[13px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>{CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="bg-surface-2 border border-border rounded-md px-2 text-[13px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="bg-surface-2 border border-border rounded-md px-2 text-[13px]" value={lane} onChange={(e) => setLane(e.target.value)}>
          <option value="">All lanes</option>{PAL_LANES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="card-elevated rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-surface-3">
            <tr className="text-left">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Platform</th>
              <th className="px-3 py-2">Lane</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Core 12</th>
              <th className="px-3 py-2">Published</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-surface-2 group">
                <td className="px-3 py-1.5"><input className="bg-transparent w-full focus:outline-none focus:bg-surface-2 px-1 rounded" value={c.title} onChange={(e) => updateContentItem(c.id, { title: e.target.value })} /></td>
                <td className="px-3 py-1.5">
                  <select className="bg-transparent" value={c.type} onChange={(e) => updateContentItem(c.id, { type: e.target.value as ContentType })}>
                    {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select className="bg-transparent" value={c.platform} onChange={(e) => updateContentItem(c.id, { platform: e.target.value as Platform })}>
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select className="bg-transparent" value={c.palLane} onChange={(e) => updateContentItem(c.id, { palLane: e.target.value as PalLane })}>
                    {PAL_LANES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select className="bg-transparent" value={c.status} onChange={(e) => updateContentItem(c.id, { status: e.target.value as CCStatus })}>
                    {CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" min={0} max={12} className="bg-transparent w-12" value={c.relatedCore12 ?? ""} onChange={(e) => updateContentItem(c.id, { relatedCore12: e.target.value ? Number(e.target.value) : undefined })} />
                </td>
                <td className="px-3 py-1.5"><input type="date" className="bg-transparent" value={c.publishedDate ?? ""} onChange={(e) => updateContentItem(c.id, { publishedDate: e.target.value })} /></td>
                <td className="px-3 py-1.5"><button onClick={() => { if (confirm("Delete this item?")) removeContentItem(c.id); }} className="text-[12px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">×</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No items match.</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
