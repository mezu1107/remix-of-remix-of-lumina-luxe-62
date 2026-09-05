import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "./ImageField";
import { colorSlug } from "@/lib/catalog";

export type ColorRow = { name: string; hex: string; image: string };

/** Same shape the storefront parses: `Name #hex | imageUrl` (one per line). */
export function serializeColors(rows: ColorRow[]) {
  return rows
    .filter((r) => r.name.trim())
    .map((r) => `${r.name.trim()} ${r.hex || "#1a1a1a"}${r.image ? ` | ${r.image}` : ""}`)
    .join("\n");
}

export function parseColorsText(text: string): ColorRow[] {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, ...rest] = line.split("|");
      const image = rest.join("|").trim();
      const base = left.trim();
      const match = base.match(/(#[0-9a-fA-F]{3,8})\s*$/);
      const hex = match ? match[1] : "#1a1a1a";
      const name = (match ? base.slice(0, match.index).trim() : base) || hex;
      return { name, hex, image };
    });
}


export function ColorsField({
  value,
  onChange,
  productSlug,
}: {
  value: string;
  onChange: (v: string) => void;
  productSlug?: string;
}) {
  // Rows live in local state so a brand-new empty row stays visible until it is named.
  const [rows, setRows] = useState<ColorRow[]>(() => parseColorsText(value));
  const lastPushed = useRef(value);

  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value;
      setRows(parseColorsText(value));
    }
  }, [value]);

  const commit = (next: ColorRow[]) => {
    setRows(next);
    const serialized = serializeColors(next);
    lastPushed.current = serialized;
    onChange(serialized);
  };

  const update = (i: number, patch: Partial<ColorRow>) =>
    commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="mt-1.5 space-y-3">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          No colours yet. Add one for every colour of this watch — each gets its own photo and its own link.
        </p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <span
                className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-border"
                style={{ backgroundColor: row.hex }}
              >
                {row.image ? (
                  <img src={row.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <input
                type="color"
                aria-label="Colour swatch"
                value={/^#[0-9a-fA-F]{6}$/.test(row.hex) ? row.hex : "#1a1a1a"}
                onChange={(e) => update(i, { hex: e.target.value })}
                className="h-11 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
              />
            </div>

            <div className="min-w-[10rem] flex-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Colour name</Label>
              <Input
                value={row.name}
                placeholder="e.g. Midnight Blue"
                onChange={(e) => update(i, { name: e.target.value })}
                className="mt-1 h-11"
              />
            </div>

            <ColorPhotoPicker value={row.image} onChange={(v) => update(i, { image: v })} />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove colour"
              onClick={() => commit(rows.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <p className="mt-2 break-all text-[11px] text-muted-foreground">
            Link:{" "}
            <code className="rounded bg-background px-1 py-0.5">
              /product/{productSlug || "your-product"}?color={colorSlug(row.name) || "colour"}
            </code>
          </p>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => commit([...rows, { name: "", hex: "#1a1a1a", image: "" }])}
      >
        <Plus className="mr-2 h-4 w-4" /> Add colour
      </Button>
    </div>
  );
}

function ColorPhotoPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await compressImage(file));
      toast.success("Photo ready — save to publish it");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not read that image");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="min-w-[9rem]">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Photo of this colour</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" aria-label="Remove photo" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
