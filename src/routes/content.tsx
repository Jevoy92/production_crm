import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, Card } from "@/components/app/AppShell";
import {
  useCCStore,
  CC_STATUSES,
  CONTENT_TYPES,
  PLATFORMS,
  PAL_LANES,
  platformColor,
  type CCStatus,
  type ContentType,
  type Platform,
  type PalLane,
} from "@/lib/ccStore";
import { Plus, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/content")({
  component: ContentPage,
  head: () => ({ meta: [{ title: "Content · Palmer House OS" }] }),
});

function ContentPage() {
  const library = useCCStore((s) => s.library);
  const addContentItem = useCCStore((s) => s.addContentItem);
  const updateContentItem = useCCStore((s) => s.updateContentItem);
  const removeContentItem = useCCStore((s) => s.removeContentItem);

  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [lane, setLane] = useState<string>("");

  const filtered = useMemo(
    () =>
      library.filter(
        (c) =>
          (!q || c.title.toLowerCase().includes(q.toLowerCase())) &&
          (!type || c.type === type) &&
          (!status || c.status === status) &&
          (!lane || c.palLane === lane),
      ),
    [library, q, type, status, lane],
  );

  const addNew = () =>
    addContentItem({
      title: "New content item",
      type: "Short",
      platform: "Instagram Reels",
      status: "Idea",
      palLane: "Reel",
      businessPurpose: "",
      cta: "",
      fileLocation: "",
      editorNotes: "",
      caption: "",
      thumbnailIdea: "",
      repurposingStatus: "",
      performanceNotes: "",
    });

  const subtitleParts = [
    `${library.length} items`,
    `${library.filter((l) => l.type === "Short").length} shorts`,
    `${library.filter((l) => l.status === "Published").length} published`,
  ];

  return (
    <AppShell>
      <PageHeader
        title="Content"
        subtitle={subtitleParts.join(" · ")}
        actions={
          <>
            <Link to="/repurpose" className="ph-btn ph-btn-soft">
              Repurpose a script →
            </Link>
            <button className="ph-btn ph-btn-primary" onClick={addNew}>
              <Plus size={14} /> Add item
            </button>
          </>
        }
      />

      <Card>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ph-text-muted)" }} />
            <input
              className="ph-input"
              style={{ paddingLeft: 34 }}
              placeholder="Search title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="ph-select" style={{ width: "auto" }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="ph-select" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="ph-select" style={{ width: "auto" }} value={lane} onChange={(e) => setLane(e.target.value)}>
            <option value="">All lanes</option>
            {PAL_LANES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ph-text-secondary)", fontSize: 13 }}>
            No content matches. Add an item, or generate shorts from the{" "}
            <Link to="/repurpose" style={{ color: "var(--ph-primary)", fontWeight: 700 }}>
              Repurpose
            </Link>{" "}
            engine.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ph-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Title</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Type</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Platform</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Lane</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Publish</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--ph-border-soft)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <input
                        style={{
                          background: "transparent",
                          border: 0,
                          outline: "none",
                          width: "100%",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ph-text-primary)",
                        }}
                        value={c.title}
                        onChange={(e) => updateContentItem(c.id, { title: e.target.value })}
                      />
                      {c.parentScriptNum != null && (
                        <div style={{ fontSize: 10.5, color: "var(--ph-text-muted)", marginTop: 2 }}>
                          ↳ from script #{String(c.parentScriptNum).padStart(2, "0")}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <select
                        className="ph-select"
                        style={{ background: "transparent", padding: "4px 6px", border: 0 }}
                        value={c.type}
                        onChange={(e) => updateContentItem(c.id, { type: e.target.value as ContentType })}
                      >
                        {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className="ph-dot" style={{ background: platformColor(c.platform), marginRight: 6 }} />
                      <select
                        className="ph-select"
                        style={{ background: "transparent", padding: "4px 6px", border: 0 }}
                        value={c.platform}
                        onChange={(e) => updateContentItem(c.id, { platform: e.target.value as Platform })}
                      >
                        {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <select
                        className="ph-select"
                        style={{ background: "transparent", padding: "4px 6px", border: 0 }}
                        value={c.palLane}
                        onChange={(e) => updateContentItem(c.id, { palLane: e.target.value as PalLane })}
                      >
                        {PAL_LANES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <select
                        className="ph-select"
                        style={{ background: "transparent", padding: "4px 6px", border: 0 }}
                        value={c.status}
                        onChange={(e) => updateContentItem(c.id, { status: e.target.value as CCStatus })}
                      >
                        {CC_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <input
                        type="date"
                        className="ph-input"
                        style={{ padding: "4px 8px", fontSize: 12, width: "auto" }}
                        value={c.publishDate ?? ""}
                        onChange={(e) => updateContentItem(c.id, { publishDate: e.target.value || undefined })}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <button
                        onClick={() => { if (confirm("Delete this item?")) removeContentItem(c.id); }}
                        className="ph-btn ph-btn-soft ph-btn-icon"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}