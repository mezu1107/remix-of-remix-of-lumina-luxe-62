import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { collectionsQuery, productsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Watch Collections — Browse by Series | Timera" },
      { name: "description", content: "Explore every Timera collection: dress, dive, chronograph and heritage series. Open a collection to see only its timepieces." },
      { property: "og:title", content: "Watch Collections | Timera" },
      { property: "og:description", content: "Explore every Timera collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/collections" }],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: collections = [], isLoading } = useQuery(collectionsQuery);
  const { data: products = [] } = useQuery(productsQuery);

  return (
    <div className="container-luxe py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Curated</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">
        Our <span className="italic gold-text">collections</span>
      </h1>

      {isLoading ? (
        <p className="mt-16 text-muted-foreground">Loading collections…</p>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((c, i) => {
            const count = products.filter((p) => p.collection === c.name).length;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
              >
                <Link
                  to="/collections/$slug"
                  params={{ slug: c.slug }}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-card"
                >
                  {c.image && (
                    <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-background/80">{c.tagline}</p>
                    <h2 className="mt-2 font-serif text-3xl">{c.name}</h2>
                    <p className="mt-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                      {count} {count === 1 ? "piece" : "pieces"} <ArrowUpRight className="h-3.5 w-3.5" />
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
