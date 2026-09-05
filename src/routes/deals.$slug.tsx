import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, Tag, ArrowLeft } from "lucide-react";
import { dealsQuery, productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

export const Route = createFileRoute("/deals/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    const title = `${name} deal — Timera watches`;
    return {
      meta: [
        { title },
        { name: "description", content: `Shop every watch included in the ${name} offer at Timera. Limited-time pricing, nationwide delivery.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `Watches included in the ${name} offer.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DealDetail,
});

function DealDetail() {
  const { slug } = Route.useParams();
  const { data: deals = [], isLoading } = useQuery(dealsQuery);
  const { data: products = [] } = useQuery(productsQuery);

  const deal = deals.find((d) => d.slug === slug || d.id === slug);
  const items = deal ? products.filter((p) => p.dealId === deal.id) : [];

  if (isLoading) return <div className="container-luxe py-24 text-muted-foreground">Loading deal…</div>;

  if (!deal)
    return (
      <div className="container-luxe py-24">
        <h1 className="font-serif text-4xl">This deal has ended</h1>
        <Link to="/deals" className="mt-6 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> See live deals
        </Link>
      </div>
    );

  return (
    <div className="container-luxe py-16">
      <Link to="/deals" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> All deals
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
            {deal.badge && <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{deal.badge}</span>}
            {deal.discountPercent > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1">
                <BadgePercent className="h-3.5 w-3.5" /> {deal.discountPercent}% off
              </span>
            )}
            {deal.code && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1">
                <Tag className="h-3.5 w-3.5" /> Code {deal.code}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">{deal.title}</h1>
          {deal.subtitle && <p className="mt-3 text-lg text-muted-foreground">{deal.subtitle}</p>}
          {deal.description && <p className="mt-4 max-w-2xl text-muted-foreground">{deal.description}</p>}
        </div>
        {deal.image && (
          <img src={deal.image} alt={deal.title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        )}
      </div>

      <h2 className="mt-16 font-serif text-2xl">Watches in this deal</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No products are linked to this deal yet. Assign products to it in Admin → Products → Part of deal.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
