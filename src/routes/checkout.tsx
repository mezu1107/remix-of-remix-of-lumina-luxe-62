import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/store/shop";
import { formatPrice } from "@/lib/utils";
import { couponsQuery, effectivePrice, paymentSettingsQuery } from "@/lib/catalog";
import { validateCoupon } from "@/lib/coupons";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Lock,
  Loader2,
  Truck,
  ShieldCheck,
  CreditCard,
  Package,
  HeadphonesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/tracking";
import { captureLead } from "@/lib/leads";
import { FreeShipProgress } from "@/components/conversion/FreeShipProgress";
import { captureAttribution, attributionForOrder } from "@/lib/attribution";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Timera Pakistan" },
      {
        name: "description",
        content:
          "Complete your Timera order — Cash on Delivery, Easypaisa, JazzCash and bank transfer across Pakistan.",
      },
      { property: "og:title", content: "Checkout — Timera Pakistan" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/checkout" }],
  }),
  component: CheckoutPage,
});

type PayMethod = "cod" | "easypaisa" | "jazzcash" | "bank";

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { data: coupons = [] } = useQuery(couponsQuery);
  const { data: settings } = useQuery(paymentSettingsQuery);

  const { data: payInfo } = useQuery({
    queryKey: ["payment-instructions"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/public/v1/payment-instructions");
      if (!res.ok) throw new Error("Failed to load payment details");
      return (await res.json()) as {
        easypaisa: { number: string | null; accountName: string | null } | null;
        jazzcash: { number: string | null; accountName: string | null } | null;
        bank: {
          bankName: string | null;
          accountTitle: string | null;
          accountNumber: string | null;
          iban: string | null;
        } | null;
      };
    },
  });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("timera.coupon"); } catch { return null; }
  });
  const [payMethod, setPayMethod] = useState<PayMethod>("cod");
  const [placed, setPlaced] = useState<{ orderNumber: string; total: number } | null>(null);
  const checkoutTracked = useRef(false);
  // Stable idempotency key for this checkout session — prevents duplicate orders
  // from double-clicks or slow-network retries
  const idempotencyKey = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const warrantyMonths = settings?.warrantyMonths ?? 12;
  const warrantyLabel =
    warrantyMonths >= 12
      ? `${Math.round(warrantyMonths / 12)}-Year Warranty`
      : `${warrantyMonths}-Month Warranty`;

  const subtotal = items.reduce(
    (a, i) => a + effectivePrice(i.product) * i.quantity,
    0,
  );

  const coupon = useMemo(
    () =>
      coupons.find(
        (c) => c.code.toLowerCase() === (appliedCode ?? "").toLowerCase(),
      ) ?? null,
    [coupons, appliedCode],
  );
  const discount = useMemo(() => {
    if (!coupon || subtotal < coupon.minOrder) return 0;
    const value =
      coupon.discountType === "percent"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    return Math.min(Math.round(value * 100) / 100, subtotal);
  }, [coupon, subtotal]);

  const deliveryBase = settings?.deliveryCharge ?? 250;
  const freeAbove = settings?.freeDeliveryAbove ?? 5000;
  const shipping = subtotal - discount >= freeAbove ? 0 : deliveryBase;
  const codExtra = payMethod === "cod" ? Number(settings?.codCharge ?? 0) : 0;
  const total = Math.max(0, subtotal - discount + shipping + codExtra);

  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    void trackEvent("begin_checkout", {
      value: total,
      metadata: {
        items: items.map((i) => ({
          item_id: i.product.id,
          item_name: i.product.name,
          quantity: i.quantity,
          price: effectivePrice(i.product),
        })),
      },
    });
    void captureLead({
      stage: "checkout_started",
      cartValue: total,
      items: items.map((i) => ({
        name: i.product.name,
        slug: i.product.slug,
        quantity: i.quantity,
        price: effectivePrice(i.product),
      })),
    });
  }, [items, total]);

  const captureContact = (form: HTMLFormElement | null) => {
    if (!form) return;
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const phone = get("phone");
    const name = get("name");
    if (!phone && !name) return;
    void captureLead({
      stage: "checkout_details",
      cartValue: total,
      phone: phone || null,
      name: name || null,
      address: get("address") || null,
      city: get("city") || null,
      items: items.map((i) => ({
        name: i.product.name,
        slug: i.product.slug,
        quantity: i.quantity,
        price: effectivePrice(i.product),
      })),
    });
  };

  const methods: { id: PayMethod; label: string; sub?: string }[] = [];
  if (settings?.codEnabled ?? true)
    methods.push({
      id: "cod",
      label: "Cash on Delivery",
      sub: codExtra
        ? `+ ${formatPrice(codExtra)} COD handling fee`
        : "Pay in cash when your order arrives",
    });
  if (settings?.easypaisaEnabled)
    methods.push({
      id: "easypaisa",
      label: "Easypaisa",
      sub: payInfo?.easypaisa?.number
        ? `Send to ${payInfo.easypaisa.number}`
        : undefined,
    });
  if (settings?.jazzcashEnabled)
    methods.push({
      id: "jazzcash",
      label: "JazzCash",
      sub: payInfo?.jazzcash?.number
        ? `Send to ${payInfo.jazzcash.number}`
        : undefined,
    });
  if (settings?.bankEnabled)
    methods.push({
      id: "bank",
      label: "Bank Transfer",
      sub: payInfo?.bank?.bankName ?? undefined,
    });

  if (methods.length && !methods.some((m) => m.id === payMethod)) {
    setTimeout(() => setPayMethod(methods[0].id), 0);
  }

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    const result = await validateCoupon(code, subtotal, coupons);
    if (!result.valid) return toast.error(result.reason);
    setAppliedCode(result.code);
    try { localStorage.setItem("timera.coupon", result.code); } catch { /* ignore */ }
    toast.success(`Code ${result.code} applied.`);
  };

  const placeOrder = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      const get = (k: string) => String(fd.get(k) ?? "").trim();
      const address = [get("address"), get("city"), get("province")]
        .filter(Boolean)
        .join(", ");
      const methodLabel =
        methods.find((m) => m.id === payMethod)?.label ?? "Cash on Delivery";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Capture attribution right before the order is placed
      captureAttribution();
      const attr = attributionForOrder();

      const res = await fetch("/api/public/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name: get("name"),
          customer_email: get("email") || `${get("phone")}@timera.noemail`,
          customer_phone: get("phone") || null,
          shipping_address: address,
          notes: [get("notes"), `Payment: ${methodLabel}`]
            .filter(Boolean)
            .join(" — "),
          coupon_code: appliedCode,
          // Idempotency key — same key on retry returns the existing order
          idempotency_key: idempotencyKey.current,
          items: items.map((i) => ({
            product_id: i.product.id,
            slug: i.product.slug,
            quantity: i.quantity,
            color: i.color ?? null,
            size: i.size ?? null,
          })),
          // Attribution fields — stored on the order row for Meta CAPI + reporting
          ...(attr ?? {}),
        }),
      });

      const out = await res.json().catch(() => ({}) as any);
      if (!res.ok || !out?.ok)
        throw new Error(
          out?.error ?? "We couldn't save your order. Please try again.",
        );
      return {
        orderNumber: out.order?.order_number as string,
        // Use the server-authoritative total for the Purchase pixel, not the
        // client-calculated value which may differ due to coupon/shipping race
        confirmedTotal: Number(out.order?.total ?? total),
        // event_id matches what the CAPI handler will use: 'purchase_<order_uuid>'
        // This is how browser pixel + server CAPI deduplicate the same conversion
        eventId: String(out.event_id ?? ""),
      };
    },

    onSuccess: (r) => {
      // Fire browser pixel Purchase with the SERVER-confirmed total and the
      // server-assigned event_id so it deduplicates against the CAPI call
      void trackEvent("purchase", {
        orderNumber: r.orderNumber,
        value: r.confirmedTotal,          // ← server value, not client estimate
        metadata: {
          coupon: appliedCode,
          payment_method: payMethod,
          event_id: r.eventId,            // ← dedup key for Meta Events Manager
          items: items.map((i) => ({
            item_id: i.product.id,
            item_name: i.product.name,
            quantity: i.quantity,
            price: effectivePrice(i.product),
          })),
        },
      });
      // Fire CAPI via our server bridge so it deduplicates with the browser pixel
      void fetch("/api/public/v1/meta/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: "Purchase",
          event_id: r.eventId,
          order_number: r.orderNumber,
          browser_sent: true,
          event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      }).catch(() => { /* CAPI is best-effort; don't block the confirmation */ });

      void captureLead({
        stage: "purchased",
        orderNumber: r.orderNumber,
        cartValue: r.confirmedTotal,
      });
      setPlaced({ orderNumber: r.orderNumber, total: r.confirmedTotal });
      clear();
      try { localStorage.removeItem("timera.coupon"); } catch { /* ignore */ }
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Something went wrong. Please try again."),
  });

  /* ── Order confirmation ── */
  if (placed) {
    return (
      <div className="container-luxe mx-auto max-w-lg py-16 text-center sm:py-24">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#B08D57" }}>
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl">Order Confirmed!</h1>
        <p className="mt-3 text-muted-foreground">
          Order number: <span className="font-semibold text-foreground">{placed.orderNumber}</span>
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: "#B08D57" }}>
          {formatPrice(placed.total)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
          Shukriya! Aap ka order receive ho gaya hai.{" "}
          {settings?.paymentNote
            ? settings.paymentNote
            : "Hamari team jald WhatsApp ya call par rabta kare gi."}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-muted-foreground max-w-xs mx-auto">
          <div className="flex items-center gap-1.5 rounded-lg border border-border p-2.5">
            <Truck className="h-4 w-4 text-primary shrink-0" /> 2–4 business days
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border p-2.5">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" /> {warrantyLabel}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/track">Track Order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Empty cart ── */
  if (items.length === 0) {
    return (
      <div className="container-luxe mx-auto max-w-lg py-16 text-center sm:py-24">
        <h1 className="font-serif text-3xl sm:text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Add a watch to your cart to continue.
        </p>
        <Button asChild className="mt-8">
          <Link to="/shop">Browse Watches</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-luxe py-8 sm:py-12">
      <h1 className="font-serif text-3xl sm:text-4xl">Checkout</h1>

      {/* Pakistan trust strip */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary" /> Delivery all over Pakistan
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {warrantyLabel} on every watch
        </span>
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-primary" /> Premium gift packaging included
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          placeOrder.mutate(e.currentTarget);
        }}
        onBlur={(e) => captureContact(e.currentTarget)}
        className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12"
      >
        <div className="space-y-8 min-w-0">
          {/* Contact — Phone first for Pakistan UX */}
          <section>
            <h2 className="font-serif text-xl mb-5">Contact Details</h2>
            <div className="space-y-4">
              <Field
                id="name"
                name="name"
                label="Full Name"
                placeholder="Muhammad Ali"
                required
              />
              <Field
                id="phone"
                name="phone"
                label="Phone Number (WhatsApp preferred)"
                type="tel"
                placeholder="03XX-XXXXXXX"
                required
              />
              <Field
                id="email"
                name="email"
                label="Email Address (optional)"
                type="email"
                placeholder="your@email.com"
              />
            </div>
          </section>

          {/* Delivery Address */}
          <section>
            <h2 className="font-serif text-xl mb-5">Delivery Address</h2>
            <div className="space-y-4">
              <Field
                id="address"
                name="address"
                label="Street Address (House No., Street, Area)"
                placeholder="House 5, Street 3, Gulberg"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="city" name="city" label="City" placeholder="Lahore" required />
                <Field id="province" name="province" label="Province" placeholder="Punjab" />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="font-serif text-xl mb-5">Payment Method</h2>
            {methods.length === 0 ? (
              <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                No payment methods are currently enabled. Please contact us to place your order.
              </div>
            ) : (
              <RadioGroup
                value={payMethod}
                onValueChange={(v) => setPayMethod(v as PayMethod)}
                className="space-y-2.5"
              >
                {methods.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={m.id} id={`pay-${m.id}`} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{m.label}</p>
                      {m.sub && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
                      )}
                    </div>
                    {m.id === "cod" && (
                      <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white" style={{ background: "#16a34a" }}>
                        Recommended
                      </span>
                    )}
                  </label>
                ))}
              </RadioGroup>
            )}

            {/* Payment details panels */}
            {payMethod === "easypaisa" && settings?.easypaisaEnabled && (
              <PayDetails
                lines={[
                  ["Easypaisa number", payInfo?.easypaisa?.number ?? "Loading…"],
                  ["Account title", payInfo?.easypaisa?.accountName ?? "Loading…"],
                ]}
                hint="Transfer the total amount and send a screenshot on WhatsApp after placing your order."
              />
            )}
            {payMethod === "jazzcash" && settings?.jazzcashEnabled && (
              <PayDetails
                lines={[
                  ["JazzCash number", payInfo?.jazzcash?.number ?? "Loading…"],
                  ["Account title", payInfo?.jazzcash?.accountName ?? "Loading…"],
                ]}
                hint="Transfer the total amount and send a screenshot on WhatsApp after placing your order."
              />
            )}
            {payMethod === "bank" && settings?.bankEnabled && (
              <PayDetails
                lines={[
                  ["Bank", payInfo?.bank?.bankName ?? "Loading…"],
                  ["Account title", payInfo?.bank?.accountTitle ?? "Loading…"],
                  ["Account number", payInfo?.bank?.accountNumber ?? "Loading…"],
                  ["IBAN", payInfo?.bank?.iban ?? "Loading…"],
                ]}
                hint="Transfer the total and send a deposit slip on WhatsApp after placing your order."
              />
            )}
          </section>

          {/* Order notes */}
          <section>
            <h2 className="font-serif text-xl mb-4">Order Notes (optional)</h2>
            <Textarea
              name="notes"
              rows={3}
              placeholder="Delivery instructions, special requests…"
            />
          </section>
        </div>

        {/* Order Summary */}
        <aside className="glass h-fit rounded-2xl p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-xl">Your Order</h2>

          {/* Items */}
          <div className="mt-5 max-h-64 space-y-4 overflow-y-auto border-t border-border/40 pt-5">
            {items.map((i) => (
              <div key={i.id} className="flex gap-3">
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-card border border-border/30">
                  <img
                    src={i.product.image}
                    alt={i.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {i.quantity}
                    {i.color ? ` · ${i.color}` : ""}
                    {i.size ? ` · ${i.size}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">
                  {formatPrice(effectivePrice(i.product) * i.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-5 border-t border-border/40 pt-5">
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                placeholder="Promo code"
                className="h-10 flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 text-xs"
                onClick={applyCoupon}
              >
                Apply
              </Button>
            </div>
            {appliedCode && discount > 0 && (
              <p className="mt-1.5 text-xs text-primary">
                ✓ {appliedCode} — saves {formatPrice(discount)}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="mt-5 space-y-2 border-t border-border/40 pt-5 text-sm">
            <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
            {discount > 0 && (
              <SummaryRow label="Discount" value={`− ${formatPrice(discount)}`} accent />
            )}
            <SummaryRow
              label="Delivery"
              value={shipping === 0 ? "Free" : formatPrice(shipping)}
            />
            {codExtra > 0 && (
              <SummaryRow label="COD fee" value={formatPrice(codExtra)} />
            )}
            <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4 font-serif text-xl">
              <span>Total</span>
              <span style={{ color: "#B08D57" }}>{formatPrice(total)}</span>
            </div>
          </div>

          <FreeShipProgress subtotal={subtotal - discount} className="mt-4" />

          {/* Place order button */}
          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full text-[12px] font-bold uppercase tracking-[0.2em]"
            style={{ height: "3.25rem" }}
            disabled={placeOrder.isPending || methods.length === 0}
          >
            {placeOrder.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order…
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Place Order
              </>
            )}
          </Button>
          {/* COD reminder directly under Place Order */}
          {payMethod === "cod" && !placeOrder.isPending && (
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              You will pay cash when your order arrives.
            </p>
          )}

          {/* Final trust row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-primary" /> Cash on Delivery</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {warrantyLabel}</span>
            <span className="flex items-center gap-1"><HeadphonesIcon className="h-3.5 w-3.5 text-primary" /> Support Available</span>
          </div>

          {settings?.warrantyNote && (
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              {settings.warrantyNote}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}

/* ── Helpers ── */
function Field({
  id,
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="h-11"
      />
    </div>
  );
}

function PayDetails({
  lines,
  hint,
}: {
  lines: [string, string][];
  hint: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        {lines.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
            <p className="mt-0.5 break-all font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${accent ? "text-primary" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
