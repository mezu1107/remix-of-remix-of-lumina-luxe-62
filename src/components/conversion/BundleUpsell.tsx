import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { productsQuery, effectivePrice, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/shop";
import { trackEvent } from "@/lib/tracking";
import { toast } from "sonner";

/**
 * BundleUpsell — "Frequently bought together" section.
 *
 * Rules:
 *  - Shows real prices only — no fake percentage discounts
 *  - The "combined price" is simply the sum of real effective prices
 *  - Only renders when 2+ complementary in-stock products exist
 *  - Same-collection products are preferred as partners
 */
export function BundleUpsell({ product }: { product: Product }) {
  const { data: products = [] } = useQuery(productsQuery);
  const add = useCart((s) => s.add);
  const cartItems = useCart((s) => s.items);
  const [added, setAdded] = useState(false);

  const partners = useMemo(() => {
    const pool = products.filter((p) => p.id !== product.id && p.stock > 0);
    // Prefer same collection, then anything in-stock
    const same = pool.filter((p) => p.collection === product.collection);
    const rest = pool.filter((p) => p.collection !== product.collection);
    return [...same, ...rest].slice(0, 2);
  }, [products, product]);

  // Need exactly 2 partners to form a meaningful "together" suggestion
  if (partners.length < 2) return null;

  const bundle = [product, ...partners];
  // Real combined price — no artificial discount
  const combinedTotal = bundle.reduce((sum, p) => sum + effectivePrice(p), 0);

  // Check if all bundle items are already in cart
  const cartIds = new Set(cartItems.map((i) => i.product.id));
  const allInCart = bundle.every((p) => cartIds.has(p.id));

  function handleAddBundle() {
    bundle.forEach((p) => {
      if (!cartIds.has(p.id)) add(p);
    });
    setAdded(true);
    void trackEvent("upsell_add", {
      productId: product.id,
      productSlug: product.slug,
      value: combinedTotal,
      metadata: { type: "bundle", count: bundle.length },
    });
    toast.success(`${bundle.length} items added to your cart`);
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl">
      <h3 className="font-serif text-xl">Frequently bought together</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Add all three to your order in one tap.
      </p>

      {/* Product thumbnails */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {bundle.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            {i > 0 && (
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <div className="w-20">
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="h-20 w-20 rounded-xl object-cover border border-border/40"
              />
              <p className="mt-1 truncate text-[10px] text-muted-foreground">{p.name}</p>
              <p className="text-[11px] font-medium" style={{ color: "#B08D57" }}>
                {formatPrice(effectivePrice(p))}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Combined price</p>
          <p className="text-base font-semibold" style={{ color: "#B08D57" }}>
            {formatPrice(combinedTotal)}
          </p>
        </div>

        <Button
          variant="outline"
          className="h-11 text-xs uppercase tracking-[0.18em]"
          onClick={handleAddBundle}
          disabled={allInCart}
        >
          {allInCart ? (
            <>
              <Check className="mr-2 h-4 w-4 text-primary" />
              All in cart
            </>
          ) : added ? (
            <>
              <Check className="mr-2 h-4 w-4 text-primary" />
              Added to cart
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add all {bundle.length}
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
