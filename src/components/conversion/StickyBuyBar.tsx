import { useEffect, useState } from "react";
import { ShoppingBag, Zap } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { effectivePrice } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/store/shop";

/**
 * Mobile sticky purchase bar — appears once the main Add-to-Cart
 * button has scrolled off screen.
 *
 * Layout: [thumbnail + price] [Add to Cart] [Buy Now • Cash on Delivery ]
 */
export function StickyBuyBar({
  product,
  color,
  size,
  qty = 1,
  onAdd,
}: {
  product: Product;
  color?: string;
  size?: string;
  qty?: number;
  onAdd: () => void;
}) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  useEffect(() => {
    // Show after the main CTA is ~2 screens below the fold
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const price = effectivePrice(product);
  const hasSale = product.salePrice != null && product.salePrice < product.price;
  const isOutOfStock = product.stock <= 0;

  function handleBuyNow() {
    void trackEvent("add_to_cart", {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      value: price,
      metadata: { source: "sticky_buy_now" },
    });
    add(product, { color, size, quantity: qty });
    navigate({ to: "/checkout" });
  }

  function handleAdd() {
    void trackEvent("add_to_cart", {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      value: price,
      metadata: { source: "sticky_add_to_cart" },
    });
    onAdd();
  }

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-[60] border-t border-border/50 bg-background/95 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Safe-area padding for iPhone home bar */}
      <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        {/* Thumbnail + price */}
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={product.image}
            alt=""
            aria-hidden
            className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border/40"
          />
          <div className="min-w-0">
            <p className="truncate text-[10px] text-muted-foreground leading-none mb-0.5">
              {product.name}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold" style={{ color: "#B08D57" }}>
                {formatPrice(price)}
              </span>
              {hasSale && (
                <span className="text-[10px] text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add to Cart */}
        <button
          disabled={isOutOfStock}
          onClick={handleAdd}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Add</span>
        </button>

        {/* Buy Now • Cash on Delivery  — primary CTA */}
        <button
          disabled={isOutOfStock}
          onClick={handleBuyNow}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition disabled:opacity-40"
          style={{ background: isOutOfStock ? "#999" : "#111111" }}
        >
          <Zap className="h-3.5 w-3.5" />
          {isOutOfStock ? "Sold Out" : "Buy Now • Cash on Delivery "}
        </button>
      </div>
    </div>
  );
}
