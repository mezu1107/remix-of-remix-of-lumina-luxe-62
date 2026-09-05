import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery, isPerfume, effectivePrice } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import perfumeHero from "@/assets/perfume-hero.jpg";
import { Droplets, Gift, Sparkles, Timer, Truck, ShieldCheck } from "lucide-react";

const TITLE = "Perfumes Pakistan — Long-Lasting Luxury Fragrances | Timera";
const DESC =
  "Shop Timera perfumes: oud, floral, aquatic and attar fragrances with 8–12 hour longevity. Cash on delivery, free shipping over Rs 5,000 across Pakistan.";

export const Route = createFileRoute("/perfumes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "keywords", content: "perfume Pakistan, oud perfume, long lasting perfume, attar, eau de parfum, luxury fragrance online" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfumesPage,
});

const FAMILY_ALL = "All";
const GENDER_ALL = "Everyone";

function PerfumesPage() {
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const perfumes = useMemo(() => products.filter(isPerfume), [products]);
  const families = useMemo(
    () => [FAMILY_ALL, ...new Set(perfumes.map((p) => p.fragranceFamily).filter(Boolean) as string[])],
    [perfumes],
  );
  const genders = useMemo(
    () => [GENDER_ALL, ...new Set(perfumes.map((p) => p.gender).filter(Boolean) as string[])],
    [perfumes],
  );
  const [family, setFamily] = useState(FAMILY_ALL);
  const [gender, setGender] = useState(GENDER_ALL);

  const list = perfumes.filter(
    (p) =>
      (family === FAMILY_ALL || p.fragranceFamily === family) &&
      (gender === GENDER_ALL || p.gender === gender),
  );

  const giftSet = perfumes.find((p) => /set|bundle|trio/i.test(p.name));

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[58vh] min-h-[420px] overflow-hidden">
          <img src={perfumeHero} alt="Timera luxury perfume collection" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="container-luxe absolute inset-0 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary">New from the Maison</p>
            <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.05] md:text-6xl">
              Fragrances that <span className="italic gold-text">stay with you</span>
            </h1>
            <p className="mt-5 max-w-lg text-muted-foreground">
              Concentrated eau de parfum and pure attars, blended for Pakistan's climate — 8 to 12 hours of wear,
              heavy sillage, and bottles worth keeping.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-xs uppercase tracking-[0.25em]">
                <a href="#fragrances">Shop the fragrances</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-xs uppercase tracking-[0.25em]">
                <Link to="/shop">Browse everything</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* USP STRIP */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="container-luxe grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { icon: Timer, t: "8–12 hour longevity", s: "High oil concentration" },
            { icon: Truck, t: "Free delivery over Rs 5,000", s: "Nationwide, insured" },
            { icon: ShieldCheck, t: "Cash on delivery", s: "Pay when it arrives" },
            { icon: Droplets, t: "Skin-safe blends", s: "Alcohol & attar options" },
          ].map((u) => (
            <div key={u.t} className="flex items-start gap-3">
              <u.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">{u.t}</p>
                <p className="text-xs text-muted-foreground">{u.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section id="fragrances" className="container-luxe py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">The Fragrance Wardrobe</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">All Perfumes</h2>
          </div>
          <p className="text-sm text-muted-foreground">{list.length} fragrances</p>
        </div>

        <div className="mt-8 space-y-3">
          <Chips label="Family" options={families} value={family} onChange={setFamily} />
          <Chips label="For" options={genders} value={gender} onChange={setGender} />
        </div>

        {isLoading ? (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-12 text-muted-foreground">No fragrances match that combination yet.</p>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
            ))}
          </div>
        )}
      </section>

      {/* GIFT SET BANNER */}
      {giftSet && (
        <section className="container-luxe pb-20">
          <div className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2">
            <div className="relative min-h-[280px]">
              <img src={giftSet.image} alt={giftSet.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="p-8 md:p-12">
              <Badge className="mb-4">Gifting</Badge>
              <h2 className="font-serif text-3xl md:text-4xl">{giftSet.name}</h2>
              <p className="mt-4 text-muted-foreground">{giftSet.description}</p>
              <p className="mt-6 font-serif text-3xl gold-text">
                Rs {effectivePrice(giftSet).toLocaleString("en-PK")}
              </p>
              <Button asChild size="lg" className="mt-6 h-12 px-8 text-xs uppercase tracking-[0.25em]">
                <Link to="/product/$slug" params={{ slug: giftSet.slug }}>
                  <Gift className="mr-2 h-4 w-4" /> Shop the gift set
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* HOW TO CHOOSE */}
      <section className="container-luxe pb-24">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Fragrance guide
        </div>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl">How to pick your signature</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { t: "Woody & Oud", d: "Warm, smoky and dominant. Perfect for evenings, weddings and winter." },
            { t: "Floral & Amber", d: "Rose, jasmine and vanilla warmth — romantic, soft and long-wearing." },
            { t: "Fresh & Aquatic", d: "Citrus and marine notes for daily office wear in Pakistan's heat." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-serif text-xl">{c.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs transition",
            value === o
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
