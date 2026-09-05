import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { collectionsQuery, productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    const title = `${name} collection — Timera watches`;
    return {
      meta: [
        { title },
        { name: "description", content: `Every timepiece in the Timera ${name} collection, with live pricing and nationwide delivery across Pakistan.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `Timepieces in the ${name} collection.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CollectionDetail,
});

function CollectionDetail() {
  const { slug } = Route.useParams();
  const { data: collections = [], isLoading, isError } = useQuery(collectionsQuery);
  const { data: products = [], isLoading: productsLoading } = useQuery(productsQuery);
  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const collection = collections.find((c) => (c.slug ?? slugify(c.name)) === slug || slugify(c.name) === slug);
  const items = collection ? products.filter((p) => slugify(p.collection ?? "") === slugify(collection.name)) : [];

  if (isLoading && !isError) return <div className="container-luxe py-24 text-muted-foreground">Loading collection…</div>;

  if (!collection)
    return (
      <div className="container-luxe py-24">
        <h1 className="font-serif text-4xl">Collection not found</h1>
        <Link to="/collections" className="mt-6 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> All collections
        </Link>
      </div>
    );

  return (
    <div className="container-luxe py-16">
      <Link to="/collections" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> All collections
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{collection.tagline ?? "Collection"}</p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">{collection.name}</h1>
          <p className="mt-3 text-muted-foreground">
            {items.length} {items.length === 1 ? "timepiece" : "timepieces"} in this collection.
          </p>
        </div>
        {collection.image && (
          <img src={collection.image} alt={collection.name} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-16 text-muted-foreground">{productsLoading ? "Loading pieces…" : "No products in this collection yet."}</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
