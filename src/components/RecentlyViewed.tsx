import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { readRecentlyViewed } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/product/ProductCard";

/** "Continue where you left off" — a proven conversion nudge. */
export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const { data: products = [] } = useQuery(productsQuery);

  useEffect(() => {
    setSlugs(readRecentlyViewed());
  }, [excludeSlug]);

  const items = slugs
    .filter((s) => s !== excludeSlug)
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is (typeof products)[number] => Boolean(p))
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="container-luxe py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Recently viewed</p>
      <h2 className="mt-2 font-serif text-3xl">Pick up where you left off</h2>
      <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
