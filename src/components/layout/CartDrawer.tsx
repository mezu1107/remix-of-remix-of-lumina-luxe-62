import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/store/shop";
import { useQuery } from "@tanstack/react-query";
import { paymentSettingsQuery, effectivePrice } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Truck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/utils";
import { FreeShipProgress } from "@/components/conversion/FreeShipProgress";
import { CartUpsell } from "@/components/conversion/CartUpsell";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, remove } = useCart();
  const { data: pay } = useQuery(paymentSettingsQuery);

  const subtotal = items.reduce((sum, i) => sum + effectivePrice(i.product) * i.quantity, 0);
  const freeAbove = Number(pay?.freeDeliveryAbove ?? 5000);
  const deliveryCharge = Number(pay?.deliveryCharge ?? 250);
  // Show real shipping cost so there are no surprises at checkout
  const shipping = subtotal >= freeAbove ? 0 : deliveryCharge;
  const total = subtotal + shipping;

  const warrantyMonths = pay?.warrantyMonths ?? 12;
  const warrantyLabel =
    warrantyMonths >= 12
      ? `${Math.round(warrantyMonths / 12)}-Year Warranty`
      : `${warrantyMonths}-Month Warranty`;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        className="w-full sm:max-w-md h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-background border-l border-border p-0"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b border-border/50 px-5 pb-4 pt-5">
          <SheetTitle className="font-serif text-xl">
            Your Cart
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({items.reduce((a, i) => a + i.quantity, 0)} item{items.length !== 1 ? "s" : ""})
              </span>
            )}
          </SheetTitle>
          {subtotal > 0 && <FreeShipProgress subtotal={subtotal} className="mt-3" />}
        </SheetHeader>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-serif text-xl">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse our watches and add something you like.
              </p>
            </div>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/shop">Browse Watches</Link>
            </Button>
            {/* Trust even on empty cart */}
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-primary" /> Cash on Delivery</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> {warrantyLabel}</span>
              <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> All Pakistan</span>
            </div>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-border/40 last:border-0 last:pb-0">
                  {/* Image */}
                  <Link
                    to="/product/$slug"
                    params={{ slug: item.product.slug }}
                    onClick={() => setOpen(false)}
                    className="h-[72px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-card border border-border/30"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          {item.product.brand}
                        </p>
                        <Link
                          to="/product/$slug"
                          params={{ slug: item.product.slug }}
                          onClick={() => setOpen(false)}
                          className="font-serif text-sm leading-snug hover:text-primary transition block"
                        >
                          {item.product.name}
                        </Link>
                        {(item.color || item.size) && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition p-0.5"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center rounded-lg border border-border/60">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="px-2 py-1.5 text-muted-foreground hover:text-primary transition"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="px-2 py-1.5 text-muted-foreground hover:text-primary transition"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#B08D57" }}>
                        {formatPrice(effectivePrice(item.product) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upsell — only on larger screens to avoid cluttering mobile */}
            <div className="hidden sm:block shrink-0 px-5">
              <CartUpsell />
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/50 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-3">
              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className={shipping === 0 ? "text-primary font-medium" : ""}>
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-2 font-serif text-base">
                  <span className="font-semibold">Total</span>
                  <span style={{ color: "#B08D57" }}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Primary CTA — COD callout baked in */}
              <Button
                asChild
                className="w-full h-12 text-[11px] uppercase tracking-[0.18em] font-semibold"
                onClick={() => setOpen(false)}
              >
                <Link to="/checkout">
                  Checkout — COD Available
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Secondary */}
              <Button
                variant="ghost"
                asChild
                className="w-full h-9 text-xs text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                <Link to="/cart">View full cart</Link>
              </Button>

              {/* Trust strip — always visible, including on mobile */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-primary" /> Cash on Delivery
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-primary" /> {warrantyLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3 text-primary" /> All Pakistan
                </span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
