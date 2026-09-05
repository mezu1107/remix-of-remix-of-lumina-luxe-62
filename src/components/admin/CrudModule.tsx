import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, RefreshCw, Sparkles, Loader2, Download, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { ImageField, ImagesField } from "./ImageField";
import { ColorsField } from "./ColorsField";
import { VideosField } from "./VideoField";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "switch"
  | "select"
  | "list"
  | "image"
  | "images"
  | "videos"
  | "datetime"
  | "colors";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: (string | { label: string; value: string })[];
  required?: boolean;
  help?: string;
  default?: unknown;
  section?: string;
};

export type ColumnDef = {
  key: string;
  label: string;
  primary?: boolean;
  render?: (row: Record<string, any>) => React.ReactNode;
};

export type AdminTable =
  | "products"
  | "hero_slides"
  | "collections"
  | "blog_posts"
  | "orders"
  | "categories"
  | "deals"
  | "popups"
  | "coupons"
  | "reviews"
  | "trust_sections"
  | "faqs";

type Props = {
  table: AdminTable;
  title: string;
  description: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  orderBy?: { column: string; ascending?: boolean };
  invalidate: string[];
  allowCreate?: boolean;
  allowDelete?: boolean;
  /** Optional AI helper shown inside the create/edit dialog. */
  aiAssist?: {
    label: string;
    help?: string;
    run: (form: Record<string, any>) => Promise<Record<string, any>>;
  };
  /** Show checkboxes, CSV export and bulk edit for the listed field keys. */
  bulkFieldKeys?: string[];
};

/** Turns rows into a spreadsheet-safe CSV (every column, nested values as JSON). */
function rowsToCsv(rows: Record<string, any>[]) {
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const text = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


const emptyFor = (f: FieldDef) => {
  if (f.default !== undefined) return f.default;
  switch (f.type) {
    case "number":
      return 0;
    case "switch":
      return false;
    case "images":
      return [] as string[];
    default:
      return "";
  }
};

const toLocalInput = (v: unknown) => {
  if (!v) return "";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function CrudModule({
  table,
  title,
  description,
  fields,
  columns,
  orderBy,
  invalidate,
  allowCreate = true,
  allowDelete = true,
  aiAssist,
  bulkFieldKeys,
}: Props) {
  const [aiBusy, setAiBusy] = useState(false);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkKey, setBulkKey] = useState("");
  const [bulkValue, setBulkValue] = useState<any>("");

  const listQuery = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      let q = supabase.from(table).select("*");
      if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
  });

  const blank = useMemo(() => Object.fromEntries(fields.map((f) => [f.key, emptyFor(f)])), [fields]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  };

  const openEdit = (row: Record<string, any>) => {
    setEditing(row);
    setForm(
      Object.fromEntries(
        fields.map((f) => {
          const v = row[f.key];
          if (f.type === "list" || f.type === "colors") return [f.key, Array.isArray(v) ? v.join("\n") : (v ?? "")];
          if (f.type === "images") return [f.key, Array.isArray(v) ? v : []];
          if (f.type === "videos") return [f.key, Array.isArray(v) ? v : []];
          if (f.type === "datetime") return [f.key, toLocalInput(v)];
          return [f.key, v ?? emptyFor(f)];
        }),
      ),
    );
    setOpen(true);
  };

  const refreshPublic = () => {
    invalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        const raw = form[f.key];
        if (f.type === "number") payload[f.key] = raw === "" || raw === null ? null : Number(raw);
        else if (f.type === "switch") payload[f.key] = !!raw;
        else if (f.type === "images") payload[f.key] = Array.isArray(raw) ? raw : [];
        else if (f.type === "videos") payload[f.key] = Array.isArray(raw) ? raw : [];
        else if (f.type === "datetime") payload[f.key] = raw ? new Date(String(raw)).toISOString() : null;
        else if (f.type === "list" || f.type === "colors")
          payload[f.key] = String(raw ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        else payload[f.key] = raw === "" ? null : raw;
      }
      if (editing) {
        const { error } = await (supabase.from(table) as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from(table) as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Saved — live on the site" : "Created — live on the site");
      setOpen(false);
      refreshPublic();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      refreshPublic();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete"),
  });

  const bulkFields = (bulkFieldKeys ?? []).map((k) => fields.find((f) => f.key === k)).filter(Boolean) as FieldDef[];
  const bulkEnabled = bulkFields.length > 0;
  const bulkField = bulkFields.find((f) => f.key === bulkKey) ?? null;

  const bulkUpdate = useMutation({
    mutationFn: async () => {
      if (!bulkField || selected.length === 0) return;
      const raw = bulkValue;
      let value: any;
      if (bulkField.type === "number") value = raw === "" || raw === null ? null : Number(raw);
      else if (bulkField.type === "switch") value = !!raw;
      else value = raw === "" || raw === "__clear__" ? null : raw;
      const { error } = await (supabase.from(table) as any).update({ [bulkField.key]: value }).in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Updated ${selected.length} item(s)`);
      setSelected([]);
      refreshPublic();
    },
    onError: (e: any) => toast.error(e?.message ?? "Bulk update failed"),
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).delete().in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      setSelected([]);
      refreshPublic();
    },
    onError: (e: any) => toast.error(e?.message ?? "Bulk delete failed"),
  });

  const exportRows = async (onlySelected: boolean) => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) return toast.error(error.message);
    const list = (data ?? []) as Record<string, any>[];
    const picked = onlySelected ? list.filter((r) => selected.includes(r.id)) : list;
    if (!picked.length) return toast.error("Nothing to export");
    downloadCsv(`${table}-${new Date().toISOString().slice(0, 10)}.csv`, rowsToCsv(picked));
    toast.success(`Exported ${picked.length} row(s)`);
  };

  const allRows = listQuery.data ?? [];
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allRows;
    return allRows.filter((r) =>
      Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(term)),
    );
  }, [allRows, search]);

  const primaryCol = columns.find((c) => c.primary) ?? columns.find((c) => c.key !== "image_url") ?? columns[0];
  const sections = useMemo(() => {
    const map = new Map<string, FieldDef[]>();
    fields.forEach((f) => {
      const key = f.section ?? "Details";
      map.set(key, [...(map.get(key) ?? []), f]);
    });
    return [...map.entries()];
  }, [fields]);

  const renderField = (f: FieldDef) => (
    <div key={f.key} className={f.type === "switch" ? "flex items-center justify-between gap-4 rounded-lg border border-border/70 p-3" : ""}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{f.label}</Label>
      {f.type === "switch" ? (
        <Switch checked={!!form[f.key]} onCheckedChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} />
      ) : f.type === "image" ? (
        <ImageField value={String(form[f.key] ?? "")} onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} />
      ) : f.type === "images" ? (
        <ImagesField
          value={Array.isArray(form[f.key]) ? form[f.key] : []}
          onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
        />
      ) : f.type === "videos" ? (
        <VideosField
          value={Array.isArray(form[f.key]) ? form[f.key] : []}
          onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
        />
      ) : f.type === "colors" ? (
        <ColorsField
          value={String(form[f.key] ?? "")}
          onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
          productSlug={String(form.slug ?? "")}
        />
      ) : f.type === "textarea" || f.type === "list" ? (
        <Textarea
          required={f.required}
          rows={f.type === "list" ? 4 : 5}
          value={form[f.key] ?? ""}
          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
          className="mt-1.5"
        />
      ) : f.type === "select" ? (
        <Select value={String(form[f.key] ?? "")} onValueChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}>
          <SelectTrigger className="mt-1.5 h-11">
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {(f.options ?? []).map((o) => {
              const opt = typeof o === "string" ? { label: o, value: o } : o;
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : (
        <Input
          required={f.required}
          type={f.type === "number" ? "number" : f.type === "datetime" ? "datetime-local" : "text"}
          step={f.type === "number" ? "any" : undefined}
          value={form[f.key] ?? ""}
          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
          className="mt-1.5 h-11"
        />
      )}
      {f.help && <p className="mt-1.5 text-xs text-muted-foreground">{f.help}</p>}
    </div>
  );

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" className="sm:hidden" onClick={() => refreshPublic()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => refreshPublic()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          {bulkEnabled && (
            <Button variant="outline" size="sm" onClick={() => void exportRows(selected.length > 0)}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{selected.length ? `Export ${selected.length}` : "Export CSV"}</span>
            </Button>
          )}
          {allowCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">New</span>
            </Button>
          )}
        </div>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        className="mt-6 h-11 max-w-sm"
      />

      {bulkEnabled && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id))}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {selected.length === rows.length && rows.length > 0 ? "Clear selection" : "Select all shown"}
          </Button>
          <span className="text-xs text-muted-foreground">{selected.length} selected</span>

          <Select value={bulkKey} onValueChange={(v) => { setBulkKey(v); setBulkValue(""); }}>
            <SelectTrigger className="h-10 w-[190px]">
              <SelectValue placeholder="Bulk change…" />
            </SelectTrigger>
            <SelectContent>
              {bulkFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {bulkField?.type === "switch" ? (
            <Select value={String(bulkValue)} onValueChange={(v) => setBulkValue(v === "true")}>
              <SelectTrigger className="h-10 w-[140px]"><SelectValue placeholder="Value" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : bulkField?.type === "select" ? (
            <Select value={String(bulkValue)} onValueChange={setBulkValue}>
              <SelectTrigger className="h-10 w-[190px]"><SelectValue placeholder="Value" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">— Remove —</SelectItem>
                {(bulkField.options ?? []).map((o) => {
                  const opt = typeof o === "string" ? { label: o, value: o } : o;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : bulkField ? (
            <Input
              className="h-10 w-[170px]"
              type={bulkField.type === "number" ? "number" : "text"}
              value={bulkValue ?? ""}
              placeholder="New value"
              onChange={(e) => setBulkValue(e.target.value)}
            />
          ) : null}

          <Button
            type="button"
            size="sm"
            disabled={!bulkField || selected.length === 0 || bulkUpdate.isPending}
            onClick={() => bulkUpdate.mutate()}
          >
            {bulkUpdate.isPending ? "Applying…" : "Apply to selected"}
          </Button>
          {allowDelete && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={selected.length === 0 || bulkDelete.isPending}
              onClick={() => {
                if (confirm(`Delete ${selected.length} item(s) permanently?`)) bulkDelete.mutate();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete selected
            </Button>
          )}
        </div>
      )}

      {/* Mobile: cards */}
      <div className="mt-6 space-y-3 md:hidden">
        {listQuery.isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
        {!listQuery.isLoading && rows.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">Nothing here yet.</p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {bulkEnabled && (
                  <input
                    type="checkbox"
                    aria-label="Select row"
                    className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                    checked={selected.includes(row.id)}
                    onChange={(e) =>
                      setSelected((s) => (e.target.checked ? [...s, row.id] : s.filter((id) => id !== row.id)))
                    }
                  />
                )}
                {row.image_url && (
                  <img src={row.image_url} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {primaryCol?.render ? primaryCol.render(row) : String(row[primaryCol?.key ?? "id"] ?? "—")}
                  </p>
                  <dl className="mt-2 space-y-1">
                    {columns
                      .filter((c) => c.key !== primaryCol?.key && c.key !== "image_url")
                      .map((c) => (
                        <div key={c.key} className="flex gap-2 text-xs">
                          <dt className="shrink-0 uppercase tracking-widest text-muted-foreground">{c.label}</dt>
                          <dd className="min-w-0 truncate">{c.render ? c.render(row) : String(row[c.key] ?? "—")}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                {allowDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => {
                      if (confirm("Delete this item permanently?")) remove.mutate(row.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {bulkEnabled && <th className="w-10 px-4 py-3" />}
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-4 py-3 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading && (
              <tr>
                <td colSpan={columns.length + (bulkEnabled ? 2 : 1)} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (bulkEnabled ? 2 : 1)} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing here yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                {bulkEnabled && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, row.id] : s.filter((id) => id !== row.id)))
                      }
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className="max-w-[280px] truncate px-4 py-3 align-middle">
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {allowDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => {
                          if (confirm("Delete this item permanently?")) remove.mutate(row.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl sm:text-2xl">
              {editing ? `Edit ${title.replace(/s$/, "")}` : `New ${title.replace(/s$/, "")}`}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {aiAssist && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" /> {aiAssist.label}
                    </p>
                    {aiAssist.help && <p className="mt-1 text-xs text-muted-foreground">{aiAssist.help}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={aiBusy}
                    onClick={async () => {
                      setAiBusy(true);
                      try {
                        const result = await aiAssist.run(form);
                        setForm((s) => {
                          const next = { ...s };
                          for (const [k, v] of Object.entries(result)) {
                            if (v === undefined || v === null || v === "") continue;
                            const field = fields.find((f) => f.key === k);
                            if (!field) continue;
                            next[k] = field.type === "list" && Array.isArray(v) ? v.join("\n") : v;
                          }
                          return next;
                        });
                        toast.success("Draft generated — review before saving");
                      } catch (e: any) {
                        toast.error(e?.message ?? "Could not generate");
                      } finally {
                        setAiBusy(false);
                      }
                    }}
                  >
                    {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {aiBusy ? "Writing…" : "Generate"}
                  </Button>
                </div>
              </div>
            )}
            {sections.map(([name, list]) => (
              <div key={name} className="space-y-4">
                {sections.length > 1 && (
                  <p className="border-b border-border pb-2 text-[11px] uppercase tracking-[0.28em] text-primary">{name}</p>
                )}
                {list.map(renderField)}
              </div>
            ))}
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-background pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
