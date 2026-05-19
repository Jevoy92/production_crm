import { useRef, useState } from "react";
import { Upload, X, FileIcon, Image as ImageIcon } from "lucide-react";

export type UploadedFile = {
  dataUrl: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB safety cap for localStorage persistence

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export async function fileToUpload(file: File): Promise<UploadedFile> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max is 8 MB — host larger files on Drive and paste the link instead.`,
    );
  }
  const dataUrl = await readAsDataUrl(file);
  return {
    dataUrl,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  };
}

export function humanBytes(b?: number) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FileDrop({
  onFile,
  accept,
  label = "Drop a file or click to upload",
  currentPreview,
  currentName,
  onClear,
  compact,
}: {
  onFile: (f: UploadedFile) => void;
  accept?: string;
  label?: string;
  currentPreview?: string;
  currentName?: string;
  onClear?: () => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (file: File | undefined | null) => {
    setErr(null);
    if (!file) return;
    try {
      onFile(await fileToUpload(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const isImage =
    currentPreview &&
    (currentPreview.startsWith("data:image") ||
      /\.(png|jpe?g|gif|webp|svg)$/i.test(currentPreview));

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => ref.current?.click()}
        className={`cursor-pointer rounded-xl ring-inset-soft bg-surface-2 hover:bg-surface-3 transition-colors flex items-center gap-3 ${compact ? "p-2.5" : "p-4"} ${drag ? "ring-2 ring-primary" : ""}`}
      >
        {currentPreview ? (
          isImage ? (
            <img
              src={currentPreview}
              alt={currentName ?? "preview"}
              className={`${compact ? "size-10" : "size-14"} rounded-md object-cover ring-inset-soft`}
            />
          ) : (
            <div
              className={`${compact ? "size-10" : "size-14"} rounded-md bg-surface-3 grid place-items-center`}
            >
              <FileIcon className="size-5 text-muted-foreground" />
            </div>
          )
        ) : (
          <div
            className={`${compact ? "size-10" : "size-14"} rounded-md bg-surface-3 grid place-items-center`}
          >
            {accept?.startsWith("image") ? (
              <ImageIcon className="size-5 text-muted-foreground" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium truncate">{currentName ?? label}</div>
          <div className="text-[11px] text-muted-foreground">
            {currentPreview ? "Click to replace · max 8 MB" : "Click or drag · max 8 MB"}
          </div>
        </div>
        {currentPreview && onClear && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="rounded-md p-1 hover:bg-surface-3"
            title="Remove"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {err && <div className="mt-1.5 text-[11px] text-destructive">{err}</div>}
    </div>
  );
}
