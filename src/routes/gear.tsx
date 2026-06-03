import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Btn, Field, inputCls, Modal } from "@/components/ui-bits/Modal";
import { FileDrop } from "@/components/ui-bits/FileDrop";
import { useStore } from "@/lib/store";
import type { GearItem, GearKit } from "@/lib/types";
import {
  Plus,
  Pencil,
  Trash2,
  Camera,
  Mic,
  Lightbulb,
  HardDrive,
  Monitor,
  Wrench,
  Aperture,
  ZapOff,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/gear")({
  component: GearPage,
  head: () => ({ meta: [{ title: "Gear · Palmer House" }] }),
});

const CATS = [
  "Camera",
  "Lens",
  "Audio",
  "Lighting",
  "Support",
  "Media",
  "Monitor",
  "Other",
] as const;
const STATUSES: GearItem["status"][] = ["Available", "On Shoot", "Repair"];

type Cat = (typeof CATS)[number];

const iconFor = (c: string) =>
  c === "Camera"
    ? Camera
    : c === "Lens"
      ? Aperture
      : c === "Audio"
        ? Mic
        : c === "Lighting"
          ? Lightbulb
          : c === "Media"
            ? HardDrive
            : c === "Monitor"
              ? Monitor
              : c === "Support"
                ? Activity
                : Wrench;

const tintFor = (c: string) =>
  c === "Camera"
    ? "oklch(0.72 0.14 55)"
    : c === "Lens"
      ? "oklch(0.62 0.16 280)"
      : c === "Audio"
        ? "oklch(0.62 0.18 330)"
        : c === "Lighting"
          ? "oklch(0.78 0.16 90)"
          : c === "Media"
            ? "oklch(0.62 0.15 158)"
            : c === "Monitor"
              ? "oklch(0.58 0.17 235)"
              : c === "Support"
                ? "oklch(0.62 0.13 210)"
                : "oklch(0.60 0.02 260)";

const statusPill = (s: GearItem["status"]) =>
  s === "Available"
    ? "bg-success/12 text-success ring-1 ring-success/25"
    : s === "On Shoot"
      ? "bg-warning/15 text-warning ring-1 ring-warning/25"
      : "bg-destructive/12 text-destructive ring-1 ring-destructive/25";

function GearThumb({
  item,
  Icon,
  tint,
}: {
  item: GearItem;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  tint: string;
}) {
  return (
    <div
      className="relative aspect-[4/3] grid place-items-center"
      style={{ background: `color-mix(in oklab, ${tint} 10%, var(--color-surface-2))` }}
    >
      <Icon className="size-14 opacity-80" style={{ color: tint }} />
      <span
        className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPill(
          item.status,
        )}`}
      >
        <span className="size-1.5 rounded-full bg-current opacity-80" /> {item.status}
      </span>
    </div>
  );
}

function GearPage() {

  const items = useStore((s) => s.gearItems);
  const kits = useStore((s) => s.gearKits);
  const remove = useStore((s) => s.removeGearItem);
  const removeKit = useStore((s) => s.removeGearKit);
  const [openItem, setOpenItem] = useState(false);
  const [openKit, setOpenKit] = useState(false);
  const [editItem, setEditItem] = useState<GearItem | null>(null);
  const [editKit, setEditKit] = useState<GearKit | null>(null);
  const [catF, setCatF] = useState<Cat | "All">("All");
  const [statF, setStatF] = useState<GearItem["status"] | "All">("All");

  const counts = STATUSES.map((s) => ({ s, n: items.filter((i) => i.status === s).length }));
  const utilization = items.length ? Math.round((counts[1].n / items.length) * 100) : 0;

  const filtered = useMemo(
    () =>
      items.filter(
        (i) => (catF === "All" || i.category === catF) && (statF === "All" || i.status === statF),
      ),
    [items, catF, statF],
  );

  return (
    <Shell
      title="Gear"
      subtitle={`${items.length} items · ${kits.length} kits`}
      actions={
        <Btn
          variant="primary"
          onClick={() => setOpenItem(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="size-3.5" /> Add item
        </Btn>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {counts.map((c) => (
          <div
            key={c.s}
            className="card-elevated rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {c.s}
              </div>
              <div className="num text-[26px] font-semibold mt-0.5 tracking-tight">{c.n}</div>
            </div>
            <div
              className={`size-9 rounded-xl grid place-items-center ${
                c.s === "Available"
                  ? "bg-success/10 text-success"
                  : c.s === "On Shoot"
                    ? "bg-warning/15 text-warning"
                    : "bg-destructive/12 text-destructive"
              }`}
            >
              {c.s === "Available" ? (
                <Activity className="size-4" />
              ) : c.s === "On Shoot" ? (
                <Camera className="size-4" />
              ) : (
                <ZapOff className="size-4" />
              )}
            </div>
          </div>
        ))}
        <div className="card-elevated rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              Utilization
            </div>
            <div className="num text-[26px] font-semibold mt-0.5 tracking-tight">
              {utilization}%
            </div>
            <div className="mt-1.5 h-1.5 w-28 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>
          <div className="size-9 rounded-xl grid place-items-center bg-primary/12 text-primary">
            <Activity className="size-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Inventory */}
        <div className="card-elevated rounded-2xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h3 className="text-[15px] font-semibold tracking-tight">Inventory</h3>
            <div className="flex flex-wrap items-center gap-1">
              {(["All", ...CATS] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCatF(c as Cat | "All")}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                    catF === c
                      ? "bg-foreground text-background"
                      : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 mb-3">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatF(s as GearItem["status"] | "All")}
                className={`rounded-md px-2 py-0.5 text-[10.5px] ring-inset-soft transition-colors ${
                  statF === s
                    ? "bg-card text-foreground"
                    : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((it) => {
              const Icon = iconFor(it.category);
              const tint = tintFor(it.category);
              return (
                <div
                  key={it.id}
                  className="group rounded-2xl ring-inset-soft bg-surface-2 overflow-hidden hover:bg-surface-3 transition-colors"
                >
                  <GearThumb item={it} Icon={Icon} tint={tint} />
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                      <Icon className="size-3" style={{ color: tint }} /> {it.category}
                    </div>
                    <div className="mt-1 text-[13px] font-medium leading-snug truncate">
                      {it.name}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1">
                      <Btn
                        variant="subtle"
                        onClick={() => setEditItem(it)}
                        className="flex-1 !py-1 flex items-center justify-center gap-1.5"
                      >
                        <Pencil className="size-3" /> Edit
                      </Btn>
                      <Btn
                        variant="subtle"
                        onClick={() => {
                          if (confirm(`Remove ${it.name}?`)) remove(it.id);
                        }}
                        className="!px-2 !py-1"
                        title="Remove"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Btn>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-[12px] text-muted-foreground py-10">
                No items match these filters.
              </div>
            )}
          </div>
        </div>

        {/* Kits */}
        <div className="card-elevated rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold tracking-tight">Kits</h3>
            <button
              onClick={() => setOpenKit(true)}
              className="text-[12px] text-primary hover:underline"
            >
              + New Kit
            </button>
          </div>
          <div className="space-y-2.5">
            {kits.map((k) => {
              const kItems = k.itemIds
                .map((id) => items.find((x) => x.id === id))
                .filter(Boolean) as GearItem[];
              const onShoot = kItems.some((i) => i.status === "On Shoot");
              const broken = kItems.some((i) => i.status === "Repair");
              return (
                <div key={k.id} className="rounded-xl bg-surface-2 ring-inset-soft p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{k.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{k.useCase}</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Btn variant="subtle" onClick={() => setEditKit(k)} className="!px-1.5 !py-1">
                        <Pencil className="size-3" />
                      </Btn>
                      <Btn
                        variant="subtle"
                        onClick={() => {
                          if (confirm(`Remove ${k.name}?`)) removeKit(k.id);
                        }}
                        className="!px-1.5 !py-1"
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Btn>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      {kItems.slice(0, 4).map((it) => {
                        const Icon = iconFor(it.category);
                        return (
                          <div
                            key={it.id}
                            className="size-7 rounded-full ring-2 ring-card grid place-items-center"
                            style={{
                              background: `color-mix(in oklab, ${tintFor(it.category)} 18%, var(--color-card))`,
                            }}
                            title={it.name}
                          >
                            <Icon className="size-3" style={{ color: tintFor(it.category) }} />
                          </div>
                        );
                      })}
                    </div>
                    {kItems.length > 4 && (
                      <span className="text-[10.5px] text-muted-foreground ml-1">
                        +{kItems.length - 4}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      {broken && (
                        <span className="text-[10px] rounded-full bg-destructive/12 text-destructive px-1.5 py-0.5">
                          Repair
                        </span>
                      )}
                      {onShoot && !broken && (
                        <span className="text-[10px] rounded-full bg-warning/15 text-warning px-1.5 py-0.5">
                          On shoot
                        </span>
                      )}
                      {!onShoot && !broken && (
                        <span className="text-[10px] rounded-full bg-success/12 text-success px-1.5 py-0.5">
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {kits.length === 0 && (
              <div className="text-[12px] text-muted-foreground text-center py-6">No kits yet.</div>
            )}
          </div>
        </div>
      </div>

      <NewItem open={openItem} onClose={() => setOpenItem(false)} />
      <EditItem item={editItem} onClose={() => setEditItem(null)} />
      <KitModal kit={null} open={openKit} onClose={() => setOpenKit(false)} />
      <KitModal kit={editKit} open={!!editKit} onClose={() => setEditKit(null)} />
    </Shell>
  );
}

function NewItem({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useStore((s) => s.addGearItem);
  const [name, setName] = useState("");
  const [category, setCat] = useState<Cat>("Camera");
  const [imageUrl, setImg] = useState("");
  const submit = () => {
    if (!name.trim()) return;
    add({
      name: name.trim(),
      category,
      status: "Available",
      kitIds: [],
      imageUrl: imageUrl || undefined,
    });
    setName("");
    setImg("");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add gear item"
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
      <Field label="Name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <select
          className={inputCls}
          value={category}
          onChange={(e) => setCat(e.target.value as Cat)}
        >
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Photo">
        <FileDrop
          accept="image/*"
          label="Upload a photo of the gear"
          onFile={(f) => setImg(f.dataUrl)}
          currentPreview={imageUrl || undefined}
          currentName={imageUrl ? "Photo" : undefined}
          onClear={() => setImg("")}
        />
      </Field>
      <Field label="…or paste an image URL">
        <input
          className={inputCls}
          value={imageUrl.startsWith("data:") ? "" : imageUrl}
          onChange={(e) => setImg(e.target.value)}
          placeholder="https://…"
        />
      </Field>
    </Modal>
  );
}

function EditItem({ item, onClose }: { item: GearItem | null; onClose: () => void }) {
  const update = useStore((s) => s.updateGearItem);
  const [form, setForm] = useState<GearItem | null>(item);
  useEffect(() => {
    setForm(item);
  }, [item]);
  if (!item || !form) return null;
  const f = form;
  const set = (patch: Partial<GearItem>) => setForm({ ...f, ...patch });
  const submit = () => {
    update(item.id, {
      name: f.name,
      category: f.category,
      status: f.status,
      notes: f.notes,
      imageUrl: f.imageUrl,
    });
    onClose();
  };
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={`Edit · ${item.name}`}
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
      <Field label="Name">
        <input
          className={inputCls}
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select
            className={inputCls}
            value={f.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputCls}
            value={f.status}
            onChange={(e) => set({ status: e.target.value as GearItem["status"] })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Photo">
        <FileDrop
          accept="image/*"
          label="Upload a photo"
          onFile={(uf) => set({ imageUrl: uf.dataUrl })}
          currentPreview={f.imageUrl}
          currentName={f.imageUrl ? "Photo" : undefined}
          onClear={() => set({ imageUrl: undefined })}
        />
      </Field>
      <Field label="…or paste an image URL">
        <input
          className={inputCls}
          value={f.imageUrl?.startsWith("data:") ? "" : (f.imageUrl ?? "")}
          onChange={(e) => set({ imageUrl: e.target.value })}
          placeholder="https://…"
        />
      </Field>
      <Field label="Notes">
        <textarea
          className={inputCls + " min-h-20"}
          value={f.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>
    </Modal>
  );
}

function KitModal({
  kit,
  open,
  onClose,
}: {
  kit: GearKit | null;
  open: boolean;
  onClose: () => void;
}) {
  const items = useStore((s) => s.gearItems);
  const addKit = useStore((s) => s.addGearKit);
  const updateKit = useStore((s) => s.updateGearKit);

  const [name, setName] = useState(kit?.name ?? "");
  const [useCase, setUC] = useState(kit?.useCase ?? "");
  const [itemIds, setIds] = useState<string[]>(kit?.itemIds ?? []);
  useEffect(() => {
    setName(kit?.name ?? "");
    setUC(kit?.useCase ?? "");
    setIds(kit?.itemIds ?? []);
  }, [kit, open]);

  if (!open) return null;
  const submit = () => {
    if (!name.trim()) return;
    if (kit) updateKit(kit.id, { name: name.trim(), useCase: useCase.trim(), itemIds });
    else addKit({ name: name.trim(), useCase: useCase.trim(), itemIds });
    onClose();
  };
  const toggle = (id: string) =>
    setIds(itemIds.includes(id) ? itemIds.filter((x) => x !== id) : [...itemIds, id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kit ? `Edit · ${kit.name}` : "New kit"}
      wide
      footer={
        <>
          <Btn variant="subtle" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit}>
            {kit ? "Save" : "Create"}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kit name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Use case">
          <input
            className={inputCls}
            value={useCase}
            onChange={(e) => setUC(e.target.value)}
            placeholder="e.g. Solo interview shoots"
          />
        </Field>
      </div>
      <Field label={`Items (${itemIds.length})`}>
        <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
          {items.map((it) => {
            const Icon = iconFor(it.category);
            const on = itemIds.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => toggle(it.id)}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] ring-inset-soft transition-colors ${
                  on
                    ? "bg-primary/10 text-foreground"
                    : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                }`}
              >
                <Icon className="size-3.5" style={{ color: tintFor(it.category) }} />
                <span className="flex-1 truncate">{it.name}</span>
                {on && <span className="size-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </Field>
    </Modal>
  );
}
