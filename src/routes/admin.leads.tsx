import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, ShoppingCart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/admin/leads")({ component: LeadsAdmin });

const STAGES = [
  { id: "all", label: "All shoppers" },
  { id: "add_to_cart", label: "Added to cart" },
  { id: "checkout_started", label: "Reached checkout" },
  { id: "checkout_details", label: "Left details" },
  { id: "purchased", label: "Purchased" },
] as const;

const stageLabel: Record<string, string> = {
  add_to_cart: "Added to cart",
  checkout_started: "Reached checkout",
  checkout_details: "Left details",
  purchased: "Purchased",
};

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function LeadsAdmin() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("all");

  const list = useQuery({
    queryKey: ["admin", "cart-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("cart_leads" as any) as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    return (list.data ?? [])
      .filter((r) => (stage === "all" ? true : r.stage === stage))
      .filter((r) => (!t ? true : Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(t))));
  }, [list.data, search, stage]);

  const abandoned = (list.data ?? []).filter((r) => r.stage !== "purchased");
  const reachable = abandoned.filter((r) => r.email || r.phone);
  const lostValue = abandoned.reduce((a, r) => a + Number(r.cart_value ?? 0), 0);

  const exportCsv = () => {
    const head = ["stage", "name", "email", "phone", "city", "items", "cart_value", "order_number", "updated_at"];
    const body = rows.map((r) =>
      [
        r.stage,
        r.name ?? "",
        r.email ?? "",
        r.phone ?? "",
        r.city ?? "",
        (r.items ?? []).map((i: any) => `${i.quantity}x ${i.name}`).join(" | "),
        r.cart_value ?? 0,
        r.order_number ?? "",
        r.updated_at ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timera-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Shopper leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone who added to cart or started checkout — follow up with the ones who never ordered.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Abandoned carts" value={String(abandoned.length)} />
        <Stat label="Contactable leads" value={String(reachable.length)} />
        <Stat label="Value left in carts" value={formatPrice(lostValue)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((s) => (
          <Button key={s.id} size="sm" variant={stage === s.id ? "default" : "outline"} onClick={() => setStage(s.id)}>
            {s.label}
          </Button>
        ))}
        <Input
          className="ml-auto w-full sm:w-64"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {list.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading leads…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          No leads captured yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.name || r.email || r.phone || "Anonymous shopper"}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {r.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{r.email}</span>}
                    {r.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{r.phone}</span>}
                    <span className="inline-flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" />{r.item_count ?? 0} items</span>
                    <span>{fmt(r.updated_at)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs ${r.stage === "purchased" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {stageLabel[r.stage] ?? r.stage}
                  </span>
                  <span className="text-sm font-medium">{formatPrice(Number(r.cart_value ?? 0))}</span>
                </div>
              </div>

              {(r.items ?? []).length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {(r.items ?? []).map((i: any) => `${i.quantity}× ${i.name}`).join(", ")}
                </p>
              )}

              {r.stage !== "purchased" && (r.phone || r.email) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  {r.email && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`mailto:${r.email}?subject=Your Timera cart is waiting`}>
                        <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
    </div>
  );
}
