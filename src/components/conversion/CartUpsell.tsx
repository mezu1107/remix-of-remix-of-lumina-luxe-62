import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { productsQuery, effectivePrice } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/shop";
import { trackEvent } from "@/lib/tracking";

/** CART UPSELL — "complete the look" row inside the cart drawer. */
export function CartUpsell() {
  const { data: products = [] } = useQuery(productsQuery);
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);

  const suggestions = useMemo(() => {
    const inCart = new Set(items.map((i) => i.product.id));
    return products.filter((p) => p.stock > 0 && !inCart.has(p.id)).slice(0, 4);
  }, [products, items]);

  if (items.length === 0 || suggestions.length === 0) return null;

  return (
    <div className="border-t border-border/50 pt-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Complete the look</p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {suggestions.map((p) => (
          <div key={p.id} className="w-32 shrink-0 rounded-xl border border-border/60 bg-background/60 p-2 backdrop-blur-xl">
            <img src={p.image} alt={p.name} loading="lazy" className="h-24 w-full rounded-lg object-cover" />
            <p className="mt-2 truncate text-[11px] leading-tight">{p.name}</p>
            <p className="text-[11px] font-medium text-primary">{formatPrice(effectivePrice(p))}</p>
            <button
              onClick={() => {
                add(p);
                void trackEvent("upsell_add", { productId: p.id, productSlug: p.slug, value: effectivePrice(p), metadata: { type: "cart_drawer" } });
              }}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-border py-1.5 text-[10px] uppercase tracking-[0.16em] transition hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
