import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  HeadphonesIcon,
  Package,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import atelierImage from "@/assets/atelier.jpg";
import {
  productsQuery,
  collectionsQuery,
  blogPostsQuery,
  heroSlidesQuery,
  testimonialsQuery,
  faqsQuery,
  isPerfume,
  type Product,
} from "@/lib/catalog";
import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery } from "@/lib/site-settings";
import { paymentSettingsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { TwoRowSlider } from "@/components/product/TwoRowSlider";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Timera Watches Pakistan — Premium Watches | Cash on Delivery",
      },
      {
        name: "description",
        content:
          "Shop Timera premium watches online. Cash on Delivery across Pakistan, 1-year warranty on every timepiece. Strap watches, chain watches, automatic and quartz.",
      },
      {
        name: "keywords",
        content:
          "Timera, watches Pakistan, buy watches online, cash on delivery watches, quartz watches, strap watch, chain watch, arabic dial watch, automatic watch",
      },
      {
        property: "og:title",
        content: "Timera Watches Pakistan — Premium Watches | Cash on Delivery",
      },
      {
        property: "og:description",
        content:
          "Premium watches with Cash on Delivery across Pakistan. 1-year warranty on every timepiece.",
      },
      { property: "og:url", content: "https://timera.store/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Timera",
          url: "https://timera.store/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://timera.store/shop?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

/* ─── Hero Slider ─────────────────────────────────────────────── */
function HeroSlider() {
  const { data: slides = [] } = useQuery(heroSlidesQuery);
  const { data: paySettings } = useQuery(paymentSettingsQuery);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const next = useCallback(
    () => setIndex((i) => (count ? (i + 1) % count : 0)),
    [count],
  );
  const prev = useCallback(
    () => setIndex((i) => (count ? (i - 1 + count) % count : 0)),
    [count],
  );

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(next, 6500);
    return () => clearInterval(t);
  }, [count, next]);

  if (!count) {
    return (
      <div className="flex h-[62vh] min-h-[460px] items-center justify-center bg-muted animate-pulse">
        <p className="text-muted-foreground text-sm">
          Add hero slides in Admin → Hero
        </p>
      </div>
    );
  }

  const slide = slides[Math.min(index, count - 1)];
  const warrantyMonths = paySettings?.warrantyMonths ?? 12;
  const warrantyLabel =
    warrantyMonths >= 12
      ? `${Math.round(warrantyMonths / 12)}-Year Warranty`
      : `${warrantyMonths}-Month Warranty`;

  return (
    <section
      className="relative h-[80vh] min-h-[540px] max-h-[900px] overflow-hidden bg-secondary"
      aria-label="Hero banner"
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={slide.id}
          src={slide.image}
          alt={slide.title}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
      </AnimatePresence>

      {/* Gradient overlay — stronger on left for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

      <div className="container-luxe relative h-full flex items-center">
        <motion.div
          key={`copy-${slide.id}`}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg"
        >
          {slide.eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/70 mb-4">
              {slide.eyebrow}
            </p>
          )}

          <h1 className="font-serif text-4xl leading-[1.04] text-white sm:text-5xl lg:text-6xl">
            {slide.title}{" "}
            {slide.titleAccent && (
              <span className="italic" style={{ color: "#B08D57" }}>
                {slide.titleAccent}
              </span>
            )}
          </h1>

          {slide.description && (
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              {slide.description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={(slide.ctaHref as any) || "/shop"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md px-7 text-[11px] font-semibold uppercase tracking-[0.2em] transition"
              style={{ background: "#B08D57", color: "#FFFFFF" }}
            >
              {slide.ctaLabel || "Shop Now"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/shop"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/40 px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              View All Watches
            </Link>
          </div>

          {/* Pakistan-specific trust signals — data-driven from payment settings */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/65">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#B08D57]" />
              {warrantyLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-[#B08D57]" />
              Cash on Delivery
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#B08D57]" />
              Delivery Across Pakistan
            </span>
          </div>
        </motion.div>
      </div>

      {/* Slide controls */}
      {count > 1 && (
        <div className="absolute bottom-6 left-0 right-0">
          <div className="container-luxe flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === index ? "w-8 bg-[#B08D57]" : "w-3 bg-white/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur hover:bg-black/40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur hover:bg-black/40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Why Timera — Pakistan-specific trust section ────────────── */
function WhyTimera() {
  const { data: paySettings } = useQuery(paymentSettingsQuery);
  const warrantyMonths = paySettings?.warrantyMonths ?? 12;
  const warrantyLabel =
    warrantyMonths >= 12
      ? `${Math.round(warrantyMonths / 12)}-Year Warranty`
      : `${warrantyMonths}-Month Warranty`;
  const freeAbove = paySettings?.freeDeliveryAbove ?? 5000;

  const features = [
    {
      icon: CreditCard,
      title: "Cash on Delivery",
      desc: "Pay when your order arrives at your door. No advance payment required.",
    },
    {
      icon: ShieldCheck,
      title: warrantyLabel,
      desc: "Every Timera timepiece comes with a full manufacturer's warranty.",
    },
    {
      icon: Truck,
      title: "All Pakistan Delivery",
      desc: `Fast delivery to every city. Free shipping on orders above ${formatPrice(freeAbove)}.`,
    },
    {
      icon: Package,
      title: "Premium Packaging",
      desc: "Gift-ready box with warranty card included with every order.",
    },
    {
      icon: HeadphonesIcon,
      title: "Real Customer Support",
      desc: "Call or WhatsApp us directly. We respond the same day.",
    },
    {
      icon: ShieldCheck,
      title: "Quality Checked",
      desc: "Each watch is inspected before dispatch. Zero compromise on quality.",
    },
  ];

  return (
    <section className="bg-secondary py-16 sm:py-20" aria-labelledby="why-timera-heading">
      <div className="container-luxe">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#B08D57]">
            Why Choose Timera
          </p>
          <h2
            id="why-timera-heading"
            className="mt-3 font-serif text-3xl text-white sm:text-4xl"
          >
            Built for Pakistan's customers
          </h2>
          <p className="mt-3 text-sm text-white/55 max-w-xl mx-auto">
            We understand what matters when you shop online. Here's why
            thousands of customers trust Timera.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B08D57]/20">
                <f.icon className="h-5 w-5 text-[#B08D57]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials (real reviews from DB) ─────────────────────── */
function TestimonialsSection() {
  const { data: testimonials = [] } = useQuery(testimonialsQuery);
  if (!testimonials.length) return null;

  const half = Math.ceil(testimonials.length / 2);
  const rowA = testimonials.slice(0, half);
  const rowB = testimonials.slice(half).length
    ? testimonials.slice(half)
    : testimonials.slice(0, half);

  const Card = ({ t }: { t: (typeof testimonials)[number] }) => (
    <div className="mx-3 w-[280px] shrink-0 rounded-xl border border-border bg-card p-5 sm:w-[340px]">
      <div className="flex gap-0.5 text-[#B08D57]">
        {Array.from({ length: Math.max(1, Math.min(5, t.rating)) }).map(
          (_, k) => (
            <Star key={k} className="h-3.5 w-3.5 fill-current" />
          ),
        )}
      </div>
      <p className="mt-3 font-serif text-base leading-snug line-clamp-4">
        "{t.quote}"
      </p>
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-sm font-medium">{t.name}</p>
        {t.role && (
          <p className="text-xs text-muted-foreground">{t.role}</p>
        )}
      </div>
    </div>
  );

  const Row = ({
    items,
    reverse,
  }: {
    items: typeof testimonials;
    reverse?: boolean;
  }) => (
    <div className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className={`flex w-max ${reverse ? "marquee-reverse" : "marquee-slow"} group-hover:[animation-play-state:paused]`}
      >
        {[...items, ...items].map((t, i) => (
          <Card key={`${t.id}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );

  return (
    <section
      className="bg-onyx py-16 sm:py-20 overflow-hidden"
      aria-labelledby="reviews-heading"
    >
      <div className="container-luxe text-center mb-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
          Customer Reviews
        </p>
        <h2
          id="reviews-heading"
          className="mt-3 font-serif text-3xl sm:text-4xl"
        >
          What our customers say
        </h2>
      </div>
      <Row items={rowA} />
      <Row items={rowB} reverse />
      <div className="container-luxe mt-8 text-center">
        <Link
          to="/shop"
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition inline-flex items-center gap-2"
        >
          Read more reviews <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

/* ─── FAQ Section ─────────────────────────────────────────────── */
function FaqSection() {
  const { data: faqs = [] } = useQuery(faqsQuery);
  if (!faqs.length) return null;

  return (
    <section
      className="container-luxe py-16 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
            Questions
          </p>
          <h2
            id="faq-heading"
            className="mt-3 font-serif text-3xl sm:text-4xl"
          >
            Frequently Asked
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f) => (
            <AccordionItem
              key={f.id}
              value={f.id}
              className="rounded-xl border border-border px-5"
            >
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── Section Heading helper ──────────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          to={href as any}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ─── Perfume Section ─────────────────────────────────────────── */
function PerfumeSection({ products }: { products: Product[] }) {
  const perfumes = products.filter(isPerfume);
  if (!perfumes.length) return null;
  const giftSet = perfumes.find((p) => /set|bundle|trio/i.test(p.name));
  const bestsellers = perfumes
    .filter((p) => p.id !== giftSet?.id)
    .slice(0, 4);

  return (
    <section className="container-luxe py-16 sm:py-20">
      <SectionHeading
        eyebrow="Fragrances"
        title="Bestselling Perfumes"
        href="/perfumes"
      />
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Long-lasting eau de parfum — crafted for Pakistan's climate.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {bestsellers.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      {giftSet && (
        <div className="mt-14 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[1.1fr_1fr]">
          <div className="p-7 md:p-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
              Gift Sets
            </p>
            <h3 className="mt-3 font-serif text-2xl md:text-3xl">
              {giftSet.name}
            </h3>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {giftSet.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-7 text-xs uppercase tracking-[0.2em]">
                <Link
                  to="/product/$slug"
                  params={{ slug: giftSet.slug }}
                >
                  Shop Gift Set
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-7 text-xs uppercase tracking-[0.2em]"
              >
                <Link to="/perfumes">All Fragrances</Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-[240px] order-first md:order-none">
            <img
              src={giftSet.image}
              alt={giftSet.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Final CTA banner ────────────────────────────────────────── */
function FinalCta() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const { data: paySettings } = useQuery(paymentSettingsQuery);
  const whatsapp = settings?.whatsappNumber ?? settings?.contactPhone ?? "";
  const waNum = whatsapp.replace(/[^0-9]/g, "");

  return (
    <section className="container-luxe pb-20">
      <div className="relative overflow-hidden rounded-2xl bg-secondary p-10 text-center md:p-16">
        <div className="relative max-w-xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#B08D57]">
            Order Today
          </p>
          <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">
            Ready to wear a Timera?
          </h2>
          <p className="mt-4 text-sm text-white/60">
            Cash on Delivery across Pakistan.{" "}
            {paySettings?.warrantyMonths
              ? `${Math.round(paySettings.warrantyMonths / 12)}-year warranty`
              : "1-year warranty"}{" "}
            on every watch. Order now and receive it in 2–4 business days.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-8 text-xs uppercase tracking-[0.2em]">
              <Link to="/shop">
                Shop Watches <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {waNum && (
              <a
                href={`https://wa.me/${waNum}?text=${encodeURIComponent("Hi Timera! I want to order a watch.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/30 px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
              >
                WhatsApp Order
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main HomePage ───────────────────────────────────────────── */
function HomePage() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: collectionsList = [] } = useQuery(collectionsQuery);
  const { data: blogPosts = [] } = useQuery(blogPostsQuery);
  const { data: settings } = useQuery(siteSettingsQuery);

  const watches = products.filter((p) => p.productType !== "perfume");
  const featured = watches.filter((p) => p.featured).slice(0, 8);
  const displayFeatured = featured.length ? featured : watches.slice(0, 8);
  const bestsellers = watches.filter((p) => p.badge === "Bestseller").slice(0, 8);
  const newArrivals = watches.filter((p) => p.badge === "New").slice(0, 8);

  return (
    <>
      {/* 1. Hero — fully admin-controlled */}
      <HeroSlider />

      {/* 2. Best Sellers */}
      {bestsellers.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="container-luxe">
            <SectionHeading
              eyebrow="Most Popular"
              title="Best Sellers"
              href="/shop?badge=bestseller"
            />
          </div>
          <div className="container-luxe mt-10 relative">
            <TwoRowSlider products={bestsellers} priority />
          </div>
        </section>
      )}

      {/* 3. Featured / This Season */}
      {displayFeatured.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="container-luxe">
            <SectionHeading
              eyebrow="Featured"
              title="Our Finest Watches"
              href="/shop"
            />
          </div>
          <div className="container-luxe mt-10 relative">
            <TwoRowSlider products={displayFeatured} priority />
          </div>
        </section>
      )}

      {/* 4. Why Timera — Pakistan trust section */}
      <WhyTimera />

      {/* 5. Customer Reviews (real, from DB) */}
      <TestimonialsSection />

      {/* 6. New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="container-luxe">
            <SectionHeading
              eyebrow="Just Landed"
              title="New Arrivals"
              href="/shop?badge=new"
            />
          </div>
          <div className="container-luxe mt-10 relative">
            <TwoRowSlider products={newArrivals} />
          </div>
        </section>
      )}

      {/* 7. Collections */}
      {collectionsList.length > 0 && (
        <section className="container-luxe py-14 sm:py-20">
          <SectionHeading
            eyebrow="Browse by Style"
            title="Watch Collections"
            href="/collections"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collectionsList.map((c, i) => (
              <Link
                key={c.id}
                to="/collections/$slug"
                params={{ slug: c.slug }}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-card"
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  {c.tagline && (
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">
                      {c.tagline}
                    </p>
                  )}
                  <h3 className="mt-1 font-serif text-xl text-white">
                    {c.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-400">
                    Explore <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 8. Perfumes */}
      <PerfumeSection products={products} />

      {/* 9. Brand Story — minimal, Pakistan-relevant */}
      <section className="container-luxe py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[5/6] overflow-hidden rounded-2xl">
            <img
              src={atelierImage}
              alt="Timera watches"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
              Our Story
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.06]">
              A young brand,{" "}
              <span className="italic" style={{ color: "#B08D57" }}>
                one standard.
              </span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground max-w-lg">
              Timera was founded with a simple idea: a watch should look and
              feel genuinely premium without an inflated price tag. Every piece
              is inspected before dispatch, ships with a warranty card, and is
              backed by a team you can reach directly on WhatsApp.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-5">
              {[
                { n: "2025", l: "Founded" },
                {
                  n: `${Math.round((settings?.warrantyYears ?? 1))} yr`,
                  l: "Warranty",
                },
                { n: "All PK", l: "COD Available" },
              ].map((st) => (
                <div key={st.l}>
                  <div
                    className="font-serif text-3xl"
                    style={{ color: "#B08D57" }}
                  >
                    {st.n}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {st.l}
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="lg" className="mt-8 h-11">
              <Link to="/about">
                Read Our Story <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Blog / Journal — only if posts exist */}
      {blogPosts.length > 0 && (
        <section className="container-luxe py-14 sm:py-20">
          <SectionHeading
            eyebrow="The Journal"
            title="Watch Stories"
            href="/blog"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {blogPosts.slice(0, 4).map((post) => (
              <Link key={post.id} to="/blog" className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-xl bg-card">
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-primary">
                    {post.category} · {post.date}
                  </p>
                  <h3 className="mt-2 font-serif text-lg leading-tight group-hover:text-primary transition">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 11. FAQ */}
      <FaqSection />

      {/* 12. Final CTA */}
      <FinalCta />
    </>
  );
}
