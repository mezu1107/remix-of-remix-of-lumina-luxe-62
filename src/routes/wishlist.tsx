import { createFileRoute, Link } from "@tanstack/react-router";
import { useWishlist } from "@/store/shop";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Timera" },
      { name: "description", content: "The Timera timepieces you're considering, saved to your wishlist." },
      { property: "og:title", content: "Your Wishlist — Timera" },
      { property: "og:description", content: "Your saved Timera timepieces." },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/wishlist" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const { data: products = [] } = useQuery(productsQuery);
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="container-luxe py-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Saved for you</p>
      <h1 className="mt-3 font-serif text-5xl">Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="mx-auto h-16 w-16 rounded-full glass flex items-center justify-center mb-6">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <p className="font-serif text-2xl">No timepieces yet</p>
          <p className="mt-2 text-muted-foreground">Tap the heart on any watch to save it here.</p>
          <Button asChild className="mt-8"><Link to="/shop">Discover Timepieces</Link></Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-12 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
