import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { productsQuery, effectivePrice } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/shop";
import { Checkbox } from "@/components/ui/checkbox";
import { trackEvent } from "@/lib/tracking";

/**
 * ORDER BUMP — a single, low-friction add-on right above the pay button.
 * Uses the cheapest in-stock catalog piece so pricing stays server-verifiable.
 */
export function OrderBump() {
  const { data: products = [] } = useQuery(productsQuery);
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);

  const bump = useMemo(() => {
    const inCart = new Set(items.map((i) => i.product.id));
    return [...products]
      .filter((p) => p.stock > 0 && !inCart.has(p.id))
      .sort((a, b) => effectivePrice(a) - effectivePrice(b))[0];
  }, [products, items]);

  const inCartLine = items.find((i) => bump && i.product.id === bump.id);
  if (!bump) return null;

  const price = effectivePrice(bump);

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 backdrop-blur-xl transition hover:bg-primary/10">
      <Checkbox
        checked={Boolean(inCartLine)}
        onCheckedChange={(checked) => {
          if (checked) {
            add(bump);
            void trackEvent("upsell_add", { productId: bump.id, productSlug: bump.slug, value: price, metadata: { type: "order_bump" } });
          } else if (inCartLine) {
            remove(inCartLine.id);
          }
        }}
        className="mt-0.5"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Gift className="h-4 w-4 text-primary" /> Add {bump.name} for {formatPrice(price)}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Add to your order in one click — ships together in the same parcel.
        </span>
      </span>
      <img src={bump.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
    </label>
  );
}
