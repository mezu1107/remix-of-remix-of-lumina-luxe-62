import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Package, Loader2, Mail, Phone, MapPin, Truck,
  ChevronLeft, ChevronRight, RefreshCw, Globe,
} from "lucide-react";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

const STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAGE_SIZE = 50;

type OrderItem = {
  name?: string;
  brand?: string | null;
  slug?: string | null;
  image_url?: string | null;
  price?: number;
  quantity?: number;
  color?: string | null;
  size?: string | null;
};

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const toLocalInput = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function sourceBadge(row: Record<string, any>) {
  const src = row.utm_source ?? row.attribution?.last?.utm_source ?? row.attribution?.first?.utm_source;
  const campaign = row.utm_campaign ?? row.attribution?.last?.utm_campaign ?? row.attribution?.first?.utm_campaign;
  if (!src) return null;
  const label = campaign ? `${src} / ${campaign}` : src;
  const isMeta = /facebook|instagram|meta/i.test(String(src));
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
      style={{ background: isMeta ? "#1877F2" : "#252525", color: "#fff" }}
      title={`Campaign: ${campaign ?? "unknown"}`}
    >
      <Globe className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function OrdersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  // Paginated + filtered server-side query
  const list = useQuery({
    queryKey: ["admin", "orders", statusFilter, page],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data, error, count } = await (q as any);
      if (error) throw error;
      return { rows: (data ?? []) as Record<string, any>[], total: count ?? 0 };
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    const all = list.data?.rows ?? [];
    if (!t) return all;
    return all.filter((r) =>
      Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(t)),
    );
  }, [list.data, search]);

  const totalPages = Math.ceil((list.data?.total ?? 0) / PAGE_SIZE);

  // Reset to page 0 when filter changes
  const changeStatus = useCallback((v: string) => { setStatusFilter(v); setPage(0); }, []);

  const open = (row: Record<string, any>) => {
    setActive(row);
    setForm({
      status: row.status ?? "pending",
      courier: row.courier ?? "",
      tracking_number: row.tracking_number ?? "",
      estimated_delivery: toLocalInput(row.estimated_delivery),
      notes: row.notes ?? "",
    });
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("orders") as any)
        .update({
          status: form.status,
          courier: form.courier || null,
          tracking_number: form.tracking_number || null,
          estimated_delivery: form.estimated_delivery ? new Date(form.estimated_delivery).toISOString() : null,
          notes: form.notes || null,
        })
        .eq("id", active!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      setActive(null);
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update the order"),
  });

  const items: OrderItem[] = Array.isArray(active?.items) ? (active!.items as OrderItem[]) : [];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of list.data?.rows ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  }, [list.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.data?.total ?? "…"} total orders
            {statusFilter !== "all" && ` · filtered by "${statusFilter}"`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "orders"] })}
          disabled={list.isFetching}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${list.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition
                ${statusFilter === s
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
            >
              {s}
              {s !== "all" && statusCounts[s] ? ` (${statusCounts[s]})` : ""}
            </button>
          ))}
        </div>

        {/* Search */}
        <Input
          placeholder="Search order, customer, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-sm"
        />
      </div>

      {/* Orders list */}
      {list.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border/70 p-8 text-center text-sm text-muted-foreground">
          {statusFilter !== "all"
            ? `No "${statusFilter}" orders found.`
            : "No orders yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const rowItems: OrderItem[] = Array.isArray(row.items) ? row.items : [];
            const statusColor: Record<string, string> = {
              pending: "bg-amber-100 text-amber-800",
              confirmed: "bg-blue-100 text-blue-800",
              processing: "bg-violet-100 text-violet-800",
              shipped: "bg-indigo-100 text-indigo-800",
              delivered: "bg-green-100 text-green-800",
              cancelled: "bg-red-100 text-red-800",
            };
            return (
              <button
                key={row.id}
                onClick={() => open(row)}
                className="w-full rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:shadow-sm sm:p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Product thumbnails */}
                    <div className="flex -space-x-2.5">
                      {rowItems.slice(0, 3).map((it, i) =>
                        it.image_url ? (
                          <img
                            key={i}
                            src={it.image_url}
                            alt={it.name ?? ""}
                            loading="lazy"
                            className="h-10 w-10 rounded-lg border-2 border-background object-cover"
                          />
                        ) : (
                          <div key={i} className="h-10 w-10 rounded-lg border-2 border-background bg-muted flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        ),
                      )}
                      {rowItems.length > 3 && (
                        <div className="h-10 w-10 rounded-lg border-2 border-background bg-muted text-[10px] font-semibold flex items-center justify-center text-muted-foreground">
                          +{rowItems.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Order info */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm font-semibold">{row.order_number}</p>
                        {sourceBadge(row)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {row.customer_name}
                        {row.customer_phone ? ` · ${row.customer_phone}` : ""}
                        {" · "}
                        {fmt(row.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Right: status + total */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor[row.status] ?? "bg-muted text-muted-foreground"}`}>
                      {row.status}
                    </span>
                    <span className="text-sm font-semibold">{formatPrice(Number(row.total))}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4 text-sm">
          <p className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl sm:text-2xl">
              Order {active?.order_number}
            </DialogTitle>
          </DialogHeader>

          {active && (
            <div className="space-y-6">
              {/* Attribution / source */}
              {(active.utm_source || active.attribution?.last?.utm_source) && (
                <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Traffic Source</p>
                  <p>Source: {active.utm_source ?? active.attribution?.last?.utm_source ?? "—"}</p>
                  <p>Medium: {active.utm_medium ?? active.attribution?.last?.utm_medium ?? "—"}</p>
                  <p>Campaign: {active.utm_campaign ?? active.attribution?.last?.utm_campaign ?? "—"}</p>
                  {(active.fbclid || active.attribution?.last?.fbclid) && (
                    <p>fbclid: {(active.fbclid ?? active.attribution?.last?.fbclid ?? "").slice(0, 20)}…</p>
                  )}
                  {active.first_landing_page && (
                    <p>Landing: {active.first_landing_page}</p>
                  )}
                </div>
              )}

              {/* Customer info */}
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="flex gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  {active.customer_email}
                </p>
                <p className="flex gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  {active.customer_phone ?? "—"}
                </p>
                <p className="flex gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  {active.shipping_address ?? "—"}
                </p>
              </div>

              {/* Products */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Products</p>
                <div className="mt-3 divide-y divide-border/50">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.name ?? ""} loading="lazy" className="h-14 w-14 rounded-lg border border-border/50 object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[it.brand, it.color, it.size].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(Number(it.price ?? 0))} × {it.quantity ?? 1}
                        </p>
                      </div>
                      <p className="text-sm font-medium shrink-0">
                        {formatPrice(Number(it.price ?? 0) * Number(it.quantity ?? 1))}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-3 space-y-1.5 text-sm border-t border-border/40 pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{formatPrice(Number(active.subtotal))}</span>
                  </div>
                  {Number(active.discount) > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount {active.coupon_code ? `(${active.coupon_code})` : ""}</span>
                      <span>−{formatPrice(Number(active.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>{Number(active.shipping) > 0 ? formatPrice(Number(active.shipping)) : "Free"}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 font-semibold border-t border-border/40">
                    <span>Total</span><span>{formatPrice(Number(active.total))}</span>
                  </div>
                </div>
              </div>

              {/* Status history */}
              {Array.isArray(active.status_history) && active.status_history.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">History</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(active.status_history as { status: string; at: string }[]).map((h, i) => (
                      <li key={i} className="flex justify-between text-muted-foreground">
                        <span className="capitalize text-foreground">{h.status}</span>
                        <span>{fmt(h.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Edit fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.filter((s) => s !== "all").map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Courier</Label>
                  <Input className="mt-1.5" placeholder="TCS / Leopards / M&P" value={form.courier} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Tracking number</Label>
                  <Input className="mt-1.5" value={form.tracking_number} onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Estimated delivery</Label>
                  <Input className="mt-1.5" type="datetime-local" value={form.estimated_delivery} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Internal notes</Label>
                  <Textarea className="mt-1.5" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Truck className="mr-2 h-4 w-4" />Save &amp; update</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
