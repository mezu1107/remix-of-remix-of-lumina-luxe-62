import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  CheckCircle2,
  Truck,
  Home,
  Clock,
  XCircle,
  ShieldCheck,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Timera" },
      { name: "description", content: "Enter your Timera order number to see live status, courier details and delivery progress." },
      { property: "og:title", content: "Track Order — Timera" },
      { property: "og:description", content: "Live status of your Timera watch order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/track" }],
  }),
  component: TrackPage,
});

type OrderItem = {
  name?: string;
  slug?: string | null;
  brand?: string | null;
  image_url?: string | null;
  price?: number;
  quantity?: number;
  color?: string | null;
  size?: string | null;
};

type TrackedOrder = {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  shipping_address?: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  status_history?: { status: string; at: string }[];
  tracking_number?: string | null;
  courier?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  updated_at: string;
};

const FLOW = [
  { key: "pending", label: "Order placed", icon: Clock, note: "We received your order" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, note: "Payment / COD confirmed" },
  { key: "processing", label: "Packed", icon: Package, note: "Inspected & packed by our team" },
  { key: "shipped", label: "In transit", icon: Truck, note: "Handed to the courier" },
  { key: "delivered", label: "Delivered", icon: Home, note: "Enjoy your Timera" },
];

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;

function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");

  const lookup = useMutation<TrackedOrder, Error>({
    mutationFn: async () => {
      const num = orderNumber.trim();
      if (!num) throw new Error("Please enter your order number.");
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const qs = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
      const res = await fetch(`/api/public/v1/orders/${encodeURIComponent(num)}${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const body = await res.json();
      if (!res.ok || !body?.ok) throw new Error(body?.error ?? "We could not find that order.");
      return body.order as TrackedOrder;
    },
  });

  const order = lookup.data;
  const cancelled = order?.status === "cancelled";
  const historyAt = (key: string) => order?.status_history?.find((h) => h.status === key)?.at ?? null;
  const currentIndex = order ? Math.max(0, FLOW.findIndex((s) => s.key === order.status)) : 0;

  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
        Track Order
      </p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl animate-in fade-in slide-in-from-bottom-3 duration-700">
        Where's my watch?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-lg">
        Enter the order number from your confirmation (e.g. <span className="font-mono">TM-XXXXXX</span>). Guests should add
        the email used at checkout.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup.mutate();
        }}
        className="mt-8 grid gap-2 sm:grid-cols-[1.2fr_1fr_auto]"
      >
        <Input
          placeholder="Order number"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="h-12"
        />
        <Input
          type="email"
          placeholder="Email used at checkout"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />
        <Button type="submit" size="lg" className="h-12 px-8" disabled={lookup.isPending}>
          {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
        </Button>
      </form>

      {lookup.isError && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in">
          {lookup.error.message}
        </p>
      )}

      {order && (
        <div className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
                <p className="font-serif text-2xl">{order.order_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">Placed {fmtDate(order.created_at)}</p>
              </div>
              <span
                className={`rounded-full text-xs px-3 py-1 h-fit uppercase tracking-widest ${
                  cancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                }`}
              >
                {order.status}
              </span>
            </div>

            {(order.courier || order.tracking_number || order.estimated_delivery) && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
                {order.courier && (
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Courier</p>
                    <p className="mt-1">{order.courier}</p>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Tracking #</p>
                    <p className="mt-1 font-mono">{order.tracking_number}</p>
                  </div>
                )}
                {order.estimated_delivery && (
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Estimated delivery</p>
                    <p className="mt-1">{fmtDate(order.estimated_delivery)}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 space-y-6">
              {cancelled ? (
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div className="pt-1.5">
                    <p className="font-medium">Order cancelled</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(historyAt("cancelled") ?? order.updated_at)}</p>
                  </div>
                </div>
              ) : (
                FLOW.map((step, i) => {
                  const at = historyAt(step.key);
                  const done = i <= currentIndex;
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        } ${i === currentIndex ? "ring-4 ring-primary/15 animate-pulse" : ""}`}
                      >
                        <step.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className={`font-medium ${done ? "" : "text-muted-foreground"}`}>{step.label}</p>
                        <p className="text-xs text-muted-foreground">{at ? fmtDate(at) : step.note}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Items in this order</p>
            <div className="mt-4 divide-y divide-border/60">
              {(order.items ?? []).map((it, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  {it.image_url ? (
                    <img
                      src={it.image_url}
                      alt={it.name ?? "Product"}
                      loading="lazy"
                      className="h-16 w-16 rounded-xl object-cover border border-border/60"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[it.brand, it.color, it.size].filter(Boolean).join(" · ") || "—"} · Qty {it.quantity ?? 1}
                    </p>
                  </div>
                  <p className="text-sm">{formatPrice(Number(it.price ?? 0) * Number(it.quantity ?? 1))}</p>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{formatPrice(Number(order.subtotal))}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Discount</dt>
                  <dd>−{formatPrice(Number(order.discount))}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <dt>Delivery</dt>
                <dd>{Number(order.shipping) > 0 ? formatPrice(Number(order.shipping)) : "Free"}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(Number(order.total))}</dd>
              </div>
            </dl>

            {(order.shipping_address || order.customer_phone) && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
                {order.shipping_address && (
                  <p className="flex gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{order.shipping_address}</span>
                  </p>
                )}
                {order.customer_phone && (
                  <p className="flex gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{order.customer_phone}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Authenticity guaranteed
        </span>
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" /> Nationwide courier coverage
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" /> 7-day easy returns
        </span>
      </div>
    </div>
  );
}
