import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, CreditCard, Lock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { couponsQuery, effectivePrice, paymentSettingsQuery } from "@/lib/catalog";
import { validateCoupon } from "@/lib/coupons";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Timera" },
      { name: "description", content: "Review your Timera order and proceed to checkout with Cash on Delivery." },
      { property: "og:title", content: "Your Cart — Timera" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, remove } = useCart();
  const { data: coupons = [] } = useQuery(couponsQuery);
  const { data: settings } = useQuery(paymentSettingsQuery);
  const [coupon, setCoupon] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const subtotal = items.reduce((a, i) => a + effectivePrice(i.product) * i.quantity, 0);
  const activeCoupon = coupons.find(
    (c) => c.code.toLowerCase() === (appliedCode ?? "").toLowerCase(),
  ) ?? null;
  const discount =
    activeCoupon && subtotal >= activeCoupon.minOrder
      ? Math.min(
          activeCoupon.discountType === "percent"
            ? Math.round(((subtotal * activeCoupon.discountValue) / 100) * 100) / 100
            : activeCoupon.discountValue,
          subtotal,
        )
      : 0;

  const freeAbove = settings?.freeDeliveryAbove ?? 5000;
  const deliveryCharge = settings?.deliveryCharge ?? 250;
  const shipping =
    items.length === 0 || subtotal - discount >= freeAbove ? 0 : deliveryCharge;
  const total = Math.max(0, subtotal + shipping - discount);

  const remaining = freeAbove - (subtotal - discount);

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    const result = await validateCoupon(code, subtotal, coupons);
    if (!result.valid) return toast.error(result.reason);
    setAppliedCode(result.code);
    try { localStorage.setItem("timera.coupon", result.code); } catch { /* ignore */ }
    toast.success(`Code ${result.code} applied.`);
  };

  if (items.length === 0) {
    return (
      <div className="container-luxe py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Browse our collection and add a watch you love.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/shop">
            Browse Watches <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-luxe py-10">
      <h1 className="font-serif text-3xl sm:text-4xl">Your Cart</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {items.reduce((a, i) => a + i.quantity, 0)} item{items.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div>
          {/* Column headers — desktop */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-3 border-b border-border/50 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>Product</span>
            <span className="w-28 text-center">Quantity</span>
            <span className="w-24 text-right">Price</span>
            <span className="w-8" />
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="grid md:grid-cols-[1fr_auto_auto_auto] gap-4 py-5 border-b border-border/40 items-center"
            >
              <div className="flex gap-4">
                <Link
                  to="/product/$slug"
                  params={{ slug: item.product.slug }}
                  className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-card border border-border/30"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    {item.product.brand}
                  </p>
                  <Link
                    to="/product/$slug"
                    params={{ slug: item.product.slug }}
                    className="font-serif text-base hover:text-primary transition block leading-snug"
                  >
                    {item.product.name}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[item.color, item.size].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {/* Mobile price */}
                  <p className="mt-1.5 text-sm font-semibold md:hidden" style={{ color: "#B08D57" }}>
                    {formatPrice(effectivePrice(item.product) * item.quantity)}
                  </p>
                </div>
              </div>

              {/* Qty stepper */}
              <div className="flex items-center rounded-lg border border-border md:w-28 justify-center">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="p-2 text-muted-foreground hover:text-primary transition"
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="p-2 text-muted-foreground hover:text-primary transition"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Desktop price */}
              <p className="hidden md:block text-sm font-semibold w-24 text-right" style={{ color: "#B08D57" }}>
                {formatPrice(effectivePrice(item.product) * item.quantity)}
              </p>

              <button
                onClick={() => remove(item.id)}
                className="text-muted-foreground hover:text-destructive transition"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="glass h-fit rounded-2xl p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-xl">Order Summary</h2>

          {/* Free shipping progress */}
          {remaining > 0 && (
            <div className="mt-4 rounded-lg border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground">
              Add <strong className="text-foreground">{formatPrice(remaining)}</strong> more for free delivery
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, ((subtotal - discount) / freeAbove) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {shipping === 0 && items.length > 0 && (
            <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
              ✓ Free delivery unlocked
            </p>
          )}

          {/* Coupon */}
          <div className="mt-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Promo code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  className="pl-9 h-10 text-sm"
                />
              </div>
              <Button variant="outline" onClick={applyCoupon} className="h-10 shrink-0 text-xs">
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
          <div className="mt-5 space-y-2.5 border-t border-border/40 pt-5 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            {discount > 0 && (
              <Row label="Discount" value={`− ${formatPrice(discount)}`} accent />
            )}
            <Row
              label="Delivery"
              value={shipping === 0 ? "Free" : formatPrice(shipping)}
            />
            <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4 font-serif text-xl">
              <span>Total</span>
              <span style={{ color: "#B08D57" }}>{formatPrice(total)}</span>
            </div>
          </div>

          <Button asChild size="lg" className="mt-5 w-full h-12 text-xs uppercase tracking-[0.18em]">
            <Link to="/checkout">
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {/* Trust strip */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-primary" /> Cash on Delivery</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> 1-Year Warranty</span>
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-primary" /> Secure Checkout</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${accent ? "text-primary" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
