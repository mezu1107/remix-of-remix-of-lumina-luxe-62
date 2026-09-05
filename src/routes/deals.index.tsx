import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgePercent, Tag } from "lucide-react";
import { dealsQuery, productsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/deals/")({
  head: () => ({
    meta: [
      { title: "Watch Deals & Sale Offers in Pakistan | Timera" },
      { name: "description", content: "Live Timera deals: discounted luxury watches, limited-time sale offers and promo codes with nationwide cash-on-delivery." },
      { property: "og:title", content: "Watch Deals & Sale Offers | Timera" },
      { property: "og:description", content: "Live discounts on Timera timepieces, updated daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/deals" }],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { data: deals = [], isLoading } = useQuery(dealsQuery);
  const { data: products = [] } = useQuery(productsQuery);

  return (
    <div className="container-luxe py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Limited time</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">
        Current <span className="italic gold-text">deals</span>
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Every live offer in one place. Tap a deal to see exactly which timepieces are included.
      </p>

      {isLoading ? (
        <p className="mt-16 text-muted-foreground">Loading deals…</p>
      ) : deals.length === 0 ? (
        <p className="mt-16 text-muted-foreground">No deals are running right now. Check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {deals.map((d, i) => {
            const count = products.filter((p) => p.dealId === d.id).length;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
              >
                <Link
                  to="/deals/$slug"
                  params={{ slug: d.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-luxe"
                >
                  {d.image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={d.image} alt={d.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
                      {d.badge && <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{d.badge}</span>}
                      {d.discountPercent > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1">
                          <BadgePercent className="h-3.5 w-3.5" /> {d.discountPercent}% off
                        </span>
                      )}
                      {d.code && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1">
                          <Tag className="h-3.5 w-3.5" /> {d.code}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-2xl">{d.title}</h2>
                    {d.subtitle && <p className="text-sm text-muted-foreground">{d.subtitle}</p>}
                    <p className="mt-auto flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                      {count} {count === 1 ? "watch" : "watches"} in this deal <ArrowUpRight className="h-3.5 w-3.5" />
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
