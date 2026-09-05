import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { dealsQuery, effectivePrice, listPrice } from "@/lib/catalog";
import { useQuery } from "@tanstack/react-query";
import { useCart, useWishlist } from "@/store/shop";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export function ProductCard({
  product,
  index = 0,
  priority = false,
}: {
  product: Product;
  index?: number;
  priority?: boolean;
}) {
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const colorImage = product.colors.find((c) => c.name === hoverColor)?.image;
  const add = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const inWish = useWishlist((s) => s.ids.includes(product.id));
  const { data: deals = [] } = useQuery(dealsQuery);
  const deal = product.dealId ? deals.find((d) => d.id === product.dealId) : undefined;

  const price = effectivePrice(product);
  const orig = listPrice(product);
  const discountPct = orig && orig > price ? Math.round(100 - (price / orig) * 100) : null;
  const onSale = !!orig && orig > price;

  return (
    <article className="group relative flex flex-col" style={{ animationDelay: `${index * 50}ms` }}>
      {/* Image container */}
      <div className="relative overflow-hidden rounded-xl bg-card aspect-[4/5]">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block h-full w-full" tabIndex={-1}>
          <img
            src={colorImage ?? product.image}
            alt={product.name}
            width={480}
            height={600}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.03]"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {deal && (
            <span className="rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest bg-primary text-white shadow-sm">
              {deal.badge ?? `${deal.discountPercent}% off`}
            </span>
          )}
          {!deal && onSale && (
            <span className="rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white" style={{ background: "#dc2626" }}>
              Sale
            </span>
          )}
          {product.badge && (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                product.badge === "New" && "bg-foreground text-background",
                product.badge === "Bestseller" && "bg-primary text-white",
                product.badge === "Limited" && "border border-primary/50 bg-background/80 text-primary",
                !["New", "Bestseller", "Limited"].includes(product.badge) && "bg-foreground text-background",
              )}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWish(product.id);
            toast.success(inWish ? "Removed from wishlist" : "Saved to wishlist");
          }}
          className={cn(
            "absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center border border-border/40 bg-background/80 backdrop-blur transition",
            inWish ? "text-primary" : "text-muted-foreground hover:text-primary",
          )}
          aria-label={inWish ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart className={cn("h-3.5 w-3.5", inWish && "fill-current")} />
        </button>

        {/* Quick add — hover on desktop, always-visible on mobile */}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex">
          <button
            onClick={(e) => {
              e.preventDefault();
              add(product);
              toast.success(`${product.name} added to cart`);
            }}
            disabled={product.stock <= 0}
            className="flex w-full h-9 items-center justify-center gap-2 rounded-lg text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition disabled:opacity-50"
            style={{ background: product.stock > 0 ? "#111111" : "#888" }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {product.stock > 0 ? "Quick Add" : "Out of Stock"}
          </button>
        </div>

        {/* Mobile quick add — always visible, no hover required */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (product.stock <= 0) return;
            add(product);
            toast.success(`${product.name} added to cart`);
          }}
          disabled={product.stock <= 0}
          className="product-card-mobile-add absolute right-3 bottom-3 h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-background/85 backdrop-blur text-foreground transition active:scale-95 disabled:opacity-30 md:hidden"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{product.brand}</p>

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block font-serif text-base leading-snug hover:text-primary transition-colors"
        >
          {product.name}
        </Link>

        {/* Color swatches */}
        {product.colors.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {product.colors.slice(0, 5).map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                onMouseEnter={() => c.image && setHoverColor(c.name)}
                onMouseLeave={() => setHoverColor(null)}
                onFocus={() => c.image && setHoverColor(c.name)}
                onBlur={() => setHoverColor(null)}
                className="h-3.5 w-3.5 rounded-full ring-offset-1 ring-offset-background transition hover:ring-2 hover:ring-primary"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[9px] text-muted-foreground">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
          <span className="text-sm font-semibold" style={{ color: "#B08D57" }}>
            {formatPrice(price)}
          </span>
          {orig && orig > price && (
            <>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(orig)}</span>
              {discountPct && (
                <span className="text-[9px] font-semibold text-white rounded px-1.5 py-0.5" style={{ background: "#dc2626" }}>
                  -{discountPct}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Rating — only when real reviews exist */}
        {product.reviews > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            <div className="flex gap-0.5" style={{ color: "#B08D57" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-3 w-3", i < Math.round(product.rating) ? "fill-current" : "opacity-25")}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
          </div>
        )}
      </div>
    </article>
  );
}
