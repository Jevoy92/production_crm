import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { FileDrop, humanBytes, type UploadedFile } from "@/components/ui-bits/FileDrop";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { Plus, Pencil, Trash2, ExternalLink, Download, FileIcon } from "lucide-react";

export const Route = createFileRoute("/assets")({
  component: AssetsPage,
  head: () => ({ meta: [{ title: "Assets · Palmer House" }] }),
});

const TYPES: Asset["type"][] = [
  "Footage",
  "Audio",
  "Graphics",
  "Music",
  "Stills",
  "Final",
  "Review",
];
const STATUSES: Asset["status"][] = ["Draft", "Review", "Approved", "Delivered"];

function AssetsPage() {
  const assets = useStore((s) => s.assets);
  const projects = useStore((s) => s.projects);
  const update = useStore((s) => s.updateAsset);
  const remove = useStore((s) => s.removeAsset);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Asset | null>(null);
  const [filterType, setFT] = useState<Asset["type"] | "All">("All");
  const [filterStatus, setFS] = useState<Asset["status"] | "All">("All");

  const totalGb = assets.reduce((a, b) => a + (b.sizeGb ?? 0), 0);

  const filtered = assets.filter(
    (a) =>
      (filterType === "All" || a.type === filterType) &&
      (filterStatus === "All" || a.status === filterStatus),
  );

  return (
    <Shell
      title="Assets"
      subtitle={`${assets.length} files · ${totalGb.toFixed(1)} GB`}
      actions={
        <Btn variant="primary" onClick={() => setOpen(true)} className="flex items-center gap-1.5">
          <Plus className="size-3.5" /> Add asset
        </Btn>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className={inputCls + " w-40"}
          value={filterType}
          onChange={(e) => setFT(e.target.value as Asset["type"] | "All")}
        >
          <option value="All">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={inputCls + " w-40"}
          value={filterStatus}
          onChange={(e) => setFS(e.target.value as Asset["status"] | "All")}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card-elevated rounded-2xl overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="text-left font-medium px-5 py-3">Asset</th>
              <th className="text-left font-medium">Project</th>
              <th className="text-left font-medium">Type</th>
              <th className="text-left font-medium">Status</th>
              <th className="text-left font-medium">Size</th>
              <th className="text-left font-medium">Updated</th>
              <th className="px-5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const proj = projects.find((p) => p.id === a.projectId);
              return (
                <tr key={a.id} className="border-t border-border hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {a.fileDataUrl && a.mimeType?.startsWith("image/") ? (
                        <img
                          src={a.fileDataUrl}
                          alt={a.name}
                          className="size-10 rounded-md object-cover ring-inset-soft"
                        />
                      ) : a.fileDataUrl ? (
                        <div className="size-10 rounded-md bg-surface-3 grid place-items-center">
                          <FileIcon className="size-4 text-muted-foreground" />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{a.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.fileDataUrl && (
                            <a
                              href={a.fileDataUrl}
                              download={a.fileName ?? a.name}
                              className="text-[11px] text-primary inline-flex items-center gap-1"
                            >
                              <Download className="size-3" /> Download
                            </a>
                          )}
                          {a.link && (
                            <a
                              href={a.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary inline-flex items-center gap-1"
                            >
                              <ExternalLink className="size-3" /> Open link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {proj ? (
                      <Link
                        to="/projects/$id"
                        params={{ id: proj.id }}
                        className="hover:text-primary"
                      >
                        {proj.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{a.type}</td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => update(a.id, { status: e.target.value as Asset["status"] })}
                      className="rounded-md bg-surface-2 ring-inset-soft px-2 py-0.5 text-[11.5px]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num">
                    {a.sizeBytes ? humanBytes(a.sizeBytes) : a.sizeGb ? `${a.sizeGb} GB` : "—"}
                  </td>
                  <td className="num text-muted-foreground">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5">
                    <div className="inline-flex items-center gap-1">
                      <Btn variant="ghost" onClick={() => setEdit(a)} title="Edit">
                        <Pencil className="size-3.5" />
                      </Btn>
                      <Btn
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete?")) remove(a.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-[12px] text-muted-foreground py-8">
                  No assets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewAsset open={open} onClose={() => setOpen(false)} />
      <EditAsset asset={edit} onClose={() => setEdit(null)} />
    </Shell>
  );

  function NewAsset({ open, onClose }: { open: boolean; onClose: () => void }) {
    const add = useStore((s) => s.addAsset);
    const projects = useStore((s) => s.projects);
    const [name, setName] = useState("");
    const [projectId, setP] = useState(projects[0]?.id ?? "");
    const [type, setType] = useState<Asset["type"]>("Footage");
    const [status, setStatus] = useState<Asset["status"]>("Draft");
    const [link, setLink] = useState("");
    const [file, setFile] = useState<UploadedFile | null>(null);
    const submit = () => {
      if (!name.trim() && !file) return;
      const finalName = name.trim() || file?.name || "Untitled";
      add({
        name: finalName,
        projectId,
        type,
        status,
        link,
        fileDataUrl: file?.dataUrl,
        fileName: file?.name,
        mimeType: file?.mimeType,
        sizeBytes: file?.sizeBytes,
      });
      setName("");
      setLink("");
      setFile(null);
      onClose();
    };
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Add asset"
        footer={
          <>
            <Btn variant="subtle" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={submit}>
              Add
            </Btn>
          </>
        }
      >
        <Field label="Upload (image, audio, doc, video)">
          <FileDrop
            onFile={(f) => {
              setFile(f);
              if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
            }}
            currentPreview={file?.dataUrl}
            currentName={file?.name}
            onClear={() => setFile(null)}
          />
        </Field>
        <Field label="Name">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-filled from file"
          />
        </Field>
        <Field label="Project">
          <select className={inputCls} value={projectId} onChange={(e) => setP(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as Asset["type"])}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as Asset["status"])}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="External link (for files hosted on Drive, etc.)">
          <input
            className={inputCls}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/…"
          />
        </Field>
      </Modal>
    );
  }
}

function EditAsset({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const update = useStore((s) => s.updateAsset);
  const projects = useStore((s) => s.projects);
  const [form, setForm] = useState<Asset | null>(asset);
  useEffect(() => {
    setForm(asset);
  }, [asset]);
  if (!asset || !form) return null;
  const f = form;
  const set = (patch: Partial<Asset>) => setForm({ ...f, ...patch });
  const submit = () => {
    update(asset.id, {
      name: f.name,
      projectId: f.projectId,
      type: f.type,
      status: f.status,
      link: f.link,
      fileDataUrl: f.fileDataUrl,
      fileName: f.fileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
    });
    onClose();
  };
  return (
    <Modal
      open={!!asset}
      onClose={onClose}
      title={`Edit · ${asset.name}`}
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit}>
            Save
          </Btn>
        </>
      }
    >
      <Field label="File">
        <FileDrop
          onFile={(uf) =>
            set({
              fileDataUrl: uf.dataUrl,
              fileName: uf.name,
              mimeType: uf.mimeType,
              sizeBytes: uf.sizeBytes,
            })
          }
          currentPreview={f.fileDataUrl}
          currentName={f.fileName}
          onClear={() =>
            set({
              fileDataUrl: undefined,
              fileName: undefined,
              mimeType: undefined,
              sizeBytes: undefined,
            })
          }
        />
      </Field>
      <Field label="Name">
        <input
          className={inputCls}
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field label="Project">
        <select
          className={inputCls}
          value={f.projectId}
          onChange={(e) => set({ projectId: e.target.value })}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select
            className={inputCls}
            value={f.type}
            onChange={(e) => set({ type: e.target.value as Asset["type"] })}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputCls}
            value={f.status}
            onChange={(e) => set({ status: e.target.value as Asset["status"] })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="External link">
        <input
          className={inputCls}
          value={f.link ?? ""}
          onChange={(e) => set({ link: e.target.value })}
          placeholder="https://…"
        />
      </Field>
    </Modal>
  );
}
