import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const MAX_EDGE = 1400;
const QUALITY = 0.82;

/**
 * Reads a local file and returns a resized, compressed JPEG data URL.
 * Storing the data URL directly in the database avoids needing a public
 * storage bucket, so uploads work on every plan.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Not an image file"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode that image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await compressImage(file));
      toast.success("Image ready — save to publish it");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not use that image");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1.5 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value?.startsWith("data:") ? "Uploaded image" : (value ?? "")}
          readOnly={value?.startsWith("data:")}
          placeholder="Paste an image URL, or upload from your device"
          onChange={(e) => onChange(e.target.value)}
          className="h-11 flex-1"
        />
        <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="ml-2">Upload</span>
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="h-28 w-auto rounded-md border border-border object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ImagesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const out: string[] = [];
      for (const f of Array.from(files)) out.push(await compressImage(f));
      onChange([...value, ...out]);
      toast.success(`${out.length} image${out.length > 1 ? "s" : ""} ready`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not use those images");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1.5 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          placeholder="Paste an image URL and press Add"
          onChange={(e) => setUrl(e.target.value)}
          className="h-11 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0"
          onClick={() => {
            if (!url.trim()) return;
            onChange([...value, url.trim()]);
            setUrl("");
          }}
        >
          Add
        </Button>
        <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="ml-2">Upload</span>
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((src, i) => (
            <div key={`${src.slice(0, 24)}-${i}`} className="relative">
              <img src={src} alt="" className="h-20 w-20 rounded-md border border-border object-cover" />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
