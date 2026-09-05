import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiExtractProducts } from "@/lib/ai.functions";

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='1125' viewBox='0 0 900 1125'%3E%3Crect width='900' height='1125' fill='%23f4efe6'/%3E%3Ccircle cx='450' cy='530' r='210' fill='none' stroke='%23a77a43' stroke-width='26'/%3E%3Ccircle cx='450' cy='530' r='160' fill='%23fffaf0' stroke='%23d0b27c' stroke-width='8'/%3E%3Cpath d='M450 410v120l86 58' stroke='%232b2720' stroke-width='14' stroke-linecap='round' fill='none'/%3E%3Ctext x='450' y='980' text-anchor='middle' font-family='Georgia,serif' font-size='58' fill='%232b2720'%3ETIMERA%3C/text%3E%3C/svg%3E";

type CsvRow = Record<string, string>;

const aliases: Record<string, string[]> = {
  name: ["name", "productname", "title", "product"],
  slug: ["slug", "handle"],
  brand: ["brand", "vendor"],
  collection: ["collection", "series"],
  category: ["category", "type"],
  price: ["price", "regularprice", "rate", "mrp"],
  sale_price: ["saleprice", "offerprice", "discountedprice"],
  compare_at: ["compareat", "oldprice"],
  image_url: ["image", "imageurl", "mainimage", "photo", "picture"],
  gallery: ["gallery", "images"],
  movement: ["movement"],
  case_material: ["casematerial", "case"],
  strap: ["strap", "band"],
  water_resistance: ["waterresistance"],
  description: ["description", "body", "details", "detail"],
  features: ["features", "specs"],
  colors: ["colors", "colours", "color"],
  sizes: ["sizes", "size"],
  stock: ["stock", "inventory", "qty", "quantity"],
  badge: ["badge", "tag"],
  active: ["active", "published", "status"],
  featured: ["featured"],
  sort_order: ["sortorder", "position"],
  seo_title: ["seotitle", "metatitle"],
  seo_description: ["seodescription", "metadescription"],
  seo_keywords: ["seokeywords", "keywords"],
};

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
const list = (v: string) => v.split(/[\n;|,]+/).map((x) => x.trim()).filter(Boolean);
const num = (v: string, fallback: number | null = null) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && String(v).trim() !== "" ? n : fallback;
};
const bool = (v: string, fallback = false) =>
  v.trim() ? ["1", "yes", "true", "live", "active", "published"].includes(v.trim().toLowerCase()) : fallback;

function read(row: CsvRow, field: keyof typeof aliases) {
  for (const key of aliases[field]) if (row[key]?.trim()) return row[key].trim();
  return "";
}

function build(row: CsvRow, i: number) {
  const name = read(row, "name");
  if (!name) return null;
  const image = read(row, "image_url") || placeholderImage;
  const slug = slugify(read(row, "slug") || name);
  if (!slug) return null;
  return {
    name,
    slug,
    brand: read(row, "brand") || "Timera",
    collection: read(row, "collection") || "Signature",
    category: read(row, "category") || null,
    price: num(read(row, "price"), 0) ?? 0,
    sale_price: num(read(row, "sale_price")),
    compare_at: num(read(row, "compare_at")),
    image_url: image,
    gallery: list(read(row, "gallery")).length ? list(read(row, "gallery")) : [image],
    movement: read(row, "movement") || "Quartz",
    case_material: read(row, "case_material") || "Stainless Steel",
    strap: read(row, "strap") || "Premium Strap",
    water_resistance: read(row, "water_resistance") || "30m",
    rating: 4.8,
    reviews: 0,
    badge: read(row, "badge") || null,
    stock: num(read(row, "stock"), 10) ?? 10,
    description: read(row, "description") || `${name} by Timera.`,
    features: list(read(row, "features")),
    colors: list(read(row, "colors")).length ? list(read(row, "colors")) : ["Black #111111", "Silver #c0c5cd"],
    sizes: list(read(row, "sizes")).length ? list(read(row, "sizes")) : ["Standard"],
    featured: bool(read(row, "featured")),
    active: bool(read(row, "active"), true),
    sort_order: num(read(row, "sort_order"), i + 1) ?? i + 1,
    deal_id: null,
    seo_title: read(row, "seo_title") || null,
    seo_description: read(row, "seo_description") || null,
    seo_keywords: read(row, "seo_keywords") || null,
  };
}

/** Turns a matrix of cells (from CSV or a spreadsheet) into product rows. */
function rowsToProducts(table: string[][]) {
  const headers = table[0]?.map((h) => norm(String(h ?? ""))) ?? [];
  const known = headers.filter((h) => Object.values(aliases).some((a) => a.includes(h)));
  if (known.length < 2) return [];
  return table
    .slice(1)
    .map((cells, i) => {
      const row: CsvRow = {};
      headers.forEach((h, idx) => {
        row[h] = String(cells[idx] ?? "");
      });
      return build(row, i);
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

function parseCsv(text: string) {
  const delimiter = text.split("\n")[0]?.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"') {
      if (q && n === '"') {
        cell += '"';
        i += 1;
      } else q = !q;
    } else if (c === delimiter && !q) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !q) {
      if (c === "\r" && n === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

async function readSpreadsheet(file: File) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
}

async function readPdfText(file: File) {
  const pdfjs: any = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = "";
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return out.trim();
}

/** Maps AI-extracted products onto the products table shape. */
function fromAi(p: any, i: number) {
  const image = p.image_url || placeholderImage;
  const name = String(p.name ?? "").trim();
  const slug = slugify(name);
  if (!name || !slug) return null;
  return {
    name,
    slug,
    brand: p.brand || "Timera",
    collection: p.collection || "Signature",
    category: p.category || null,
    price: Number(p.price ?? 0) || 0,
    sale_price: p.sale_price ?? null,
    compare_at: null,
    image_url: image,
    gallery: [image],
    movement: p.movement || "Quartz",
    case_material: p.case_material || "Stainless Steel",
    strap: p.strap || "Premium Strap",
    water_resistance: p.water_resistance || "30m",
    rating: 4.8,
    reviews: 0,
    badge: null,
    stock: p.stock ?? 10,
    description: p.description || `${name} by Timera.`,
    features: p.features ?? [],
    colors: p.colors?.length ? p.colors : ["Black #111111", "Silver #c0c5cd"],
    sizes: p.sizes?.length ? p.sizes : ["Standard"],
    featured: false,
    active: true,
    sort_order: i + 1,
    deal_id: null,
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
  };
}

export function ProductCsvImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const qc = useQueryClient();

  const importFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Reading file…");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let products: any[] = [];
      let rawText = "";

      if (["xlsx", "xls", "xlsm", "ods"].includes(ext)) {
        const table = await readSpreadsheet(file);
        products = rowsToProducts(table.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : [])));
        rawText = table.map((r) => (Array.isArray(r) ? r.join(" | ") : "")).join("\n");
      } else if (ext === "pdf") {
        setStatus("Extracting text from the PDF…");
        rawText = await readPdfText(file);
      } else if (ext === "json") {
        const parsed = JSON.parse(await file.text());
        const arr = Array.isArray(parsed) ? parsed : (parsed.products ?? []);
        products = arr.map(fromAi).filter(Boolean);
        rawText = JSON.stringify(arr).slice(0, 100_000);
      } else {
        rawText = await file.text();
        products = rowsToProducts(parseCsv(rawText));
      }

      // Nothing structured found → let AI read the document.
      if (products.length === 0) {
        if (rawText.trim().length < 20) throw new Error("Could not read any text from this file.");
        setStatus("Reading the document with AI…");
        const result = await aiExtractProducts({ data: { text: rawText.slice(0, 120_000), source: file.name } });
        products = result.products.map(fromAi).filter(Boolean);
      }

      if (!products.length) throw new Error("No products could be found in this file.");

      setStatus(`Saving ${products.length} products…`);
      for (let s = 0; s < products.length; s += 100) {
        const { error } = await (supabase.from("products") as any).upsert(products.slice(s, s + 100), {
          onConflict: "slug",
        });
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["admin", "products"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${products.length} products imported — live on the storefront.`);
    } catch (error: any) {
      toast.error(error?.message ?? "Import failed.");
    } finally {
      setBusy(false);
      setStatus("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary">
            <FileSpreadsheet className="h-4 w-4" /> Product file import
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> AI powered
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload CSV, Excel (XLSX/XLS), JSON, TXT or PDF. Names, prices, descriptions and specs are read automatically —
            matching slugs update, new ones are created.
          </p>
          {status && <p className="mt-1 text-xs text-primary">{status}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt,.json,.pdf,.xlsx,.xls,.xlsm,.ods"
            className="h-11 sm:w-64"
            onChange={(e) => importFile(e.target.files)}
          />
          <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="h-11 shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="ml-2">Import</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
