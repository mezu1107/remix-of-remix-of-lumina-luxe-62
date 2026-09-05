import { LiveVisitors } from "@/components/social-proof/LiveVisitors";
import { StockUrgency } from "@/components/conversion/StockUrgency";
import { DeliveryEstimate } from "@/components/conversion/DeliveryEstimate";
import { RecentlyBought } from "@/components/conversion/RecentlyBought";
import { TrustBadges } from "@/components/conversion/TrustBadges";
import { BundleUpsell } from "@/components/conversion/BundleUpsell";
import { StickyBuyBar } from "@/components/conversion/StickyBuyBar";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery } from "@/lib/site-settings";
import {
  colorSlug,
  mapProduct,
  paymentSettingsQuery,
  productsQuery,
  reviewsQuery,
  type Product,
} from "@/lib/catalog";
import { effectivePrice, listPrice } from "@/lib/catalog";
import { pushRecentlyViewed } from "@/lib/recently-viewed";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useCart, useWishlist } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  CreditCard,
  HeadphonesIcon,
  Check,
  ChevronRight,
  ChevronLeft,
  Zap,
  MessageCircle,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewSummary } from "@/components/product/ReviewSummary";
import { ProductCard } from "@/components/product/ProductCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/tracking";

export const Route = createFileRoute("/product/$slug")({
  validateSearch: (search: Record<string, unknown>): { color?: string } =>
    typeof search.color === "string" && search.color ? { color: search.color } : {},

  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { product: mapProduct(data) };
  },

  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Timera" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    const shareImage = /^https:\/\//i.test(p.image) ? p.image : null;
    const isPerfume = p.productType === "perfume";
    const base = (p.description ?? "").trim();
    const fallback = isPerfume
      ? `${p.name} — ${p.concentration ?? "long-lasting"} fragrance${p.sizeMl ? `, ${p.sizeMl}ml` : ""}. Cash on delivery across Pakistan.`
      : `${p.name} — ${p.movement} movement, ${p.case} case. 1-year warranty. Cash on delivery across Pakistan.`;
    const metaDescription = (base.length >= 50 ? base : fallback)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);

    return {
      meta: [
        {
          title: isPerfume
            ? `${p.name} — ${p.brand} Perfume | Timera Pakistan`
            : `${p.name} — ${p.brand} Watch | Cash on Delivery | Timera Pakistan`,
        },
        { name: "description", content: metaDescription },
        {
          name: "keywords",
          content: isPerfume
            ? `${p.name}, ${p.brand} perfume, buy perfume online Pakistan, cash on delivery, Timera`
            : `${p.name}, ${p.brand}, ${p.collection} watch, buy watch online Pakistan, COD watch, Timera`,
        },
        { property: "og:title", content: `${p.name} — Timera` },
        { property: "og:description", content: metaDescription },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `https://timera.store/product/${p.slug}` },
        ...(shareImage
          ? [
              { property: "og:image", content: shareImage },
              { name: "twitter:image", content: shareImage },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `https://timera.store/product/${p.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            ...(shareImage ? { image: shareImage } : {}),
            description: p.description,
            brand: { "@type": "Brand", name: p.brand },
            ...(p.reviews > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: p.rating,
                    reviewCount: p.reviews,
                  },
                }
              : {}),
            offers: {
              "@type": "Offer",
              url: `https://timera.store/product/${p.slug}`,
              priceCurrency: "PKR",
              price: effectivePrice(p),
              availability:
                p.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },

  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const isPerfume = product.productType === "perfume";
  const { color: colorParam } = Route.useSearch();
  const navigate = useNavigate();

  /* Payment settings for dynamic warranty label */
  const { data: paySettings } = useQuery(paymentSettingsQuery);
  const warrantyMonths = paySettings?.warrantyMonths ?? 12;
  const warrantyLabel =
    warrantyMonths >= 12
      ? `${Math.round(warrantyMonths / 12)}-Year Warranty`
      : `${warrantyMonths}-Month Warranty`;

  const initialColor =
    product.colors.find((c) => colorSlug(c.name) === colorParam) ??
    product.colors[0] ??
    { name: "Default", hex: "#1a1a1a" };

  const add = useCart((s) => s.add);
  const wish = useWishlist();
  const inWish = wish.ids.includes(product.id);

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<{ type: "image" | "video"; src: string } | null>(null);
  const [color, setColor] = useState(initialColor.name);
  const [colorImage, setColorImage] = useState<string | null>(initialColor.image ?? null);
  const [size, setSize] = useState<string | undefined>(
    product.sizes.length > 1 ? product.sizes[0] : undefined,
  );
  const [qty, setQty] = useState(1);

  // Unified media list: images first, then videos
  // This lets the customer swipe through all media in order
  const videoItems = (product.videos ?? []).filter(Boolean);
  const touchStartX = useRef<number | null>(null);
  const allImages = colorImage
    ? [colorImage, ...product.gallery.filter((g) => g !== colorImage)]
    : product.gallery.length
    ? product.gallery
    : [product.image];
  // Combined media: images + videos for the thumbnail strip
  type MediaItem = { type: "image" | "video"; src: string };
  const allMedia: MediaItem[] = [
    ...allImages.map((src) => ({ type: "image" as const, src })),
    ...videoItems.map((src) => ({ type: "video" as const, src })),
  ];
  const activeIdx = selectedMedia
    ? allMedia.findIndex((m) => m.src === selectedMedia.src)
    : colorImage
    ? 0
    : selectedImg;
  const totalMedia = allMedia.length;

  const goPrev = useCallback(() => {
    setSelectedMedia(null);
    setColorImage(null);
    setSelectedImg((i) => (i - 1 + totalMedia) % totalMedia);
  }, [totalMedia]);

  const goNext = useCallback(() => {
    setSelectedMedia(null);
    setColorImage(null);
    setSelectedImg((i) => (i + 1) % totalMedia);
  }, [totalMedia]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; // ignore tiny taps
    if (delta < 0) goNext();
    else goPrev();
  }

  // WhatsApp number from site settings
  const { data: siteSettings } = useQuery(siteSettingsQuery);
  const waRaw = siteSettings?.whatsappNumber ?? siteSettings?.contactPhone ?? "";
  const waNum = waRaw.replace(/[^0-9]/g, "").replace(/^0/, "92");
  const waHref = waNum
    ? `https://wa.me/${waNum}?text=${encodeURIComponent(
        `Hi Timera! I have a question about ${product.name}.`,
      )}`
    : null;

  const activeMedia = selectedMedia ?? (activeIdx < allMedia.length ? allMedia[activeIdx] : null) ?? { type: "image" as const, src: product.image };
  const mainImage = activeMedia.type === "image" ? activeMedia.src : (allImages[0] ?? product.image);

  const { data: allProducts = [] } = useQuery(productsQuery);
  const { data: productReviews = [] } = useQuery(reviewsQuery(product.id));
  const related = allProducts
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 4);

  const price = effectivePrice(product);
  const origPrice = listPrice(product);
  const discountPct =
    origPrice && origPrice > price
      ? Math.round(100 - (price / origPrice) * 100)
      : null;

  useEffect(() => {
    pushRecentlyViewed(product.slug);
    void trackEvent("view_item", {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      value: price,
      metadata: { collection: product.collection, category: product.category },
    });
  }, [product.id, product.slug, product.name, product.collection, product.category, price]);

  function handleAddToCart() {
    add(product, { color, size, quantity: qty });
    toast.success(`${product.name} added to cart`);
  }

  function handleBuyNow() {
    add(product, { color, size, quantity: qty });
    navigate({ to: "/checkout" });
  }

  return (
    <div className="container-luxe py-6 md:py-10">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-primary transition">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-primary transition">
          {isPerfume ? "Perfumes" : "Watches"}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate max-w-[180px] text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* ─── Gallery ─── */}
        <div className="flex gap-3 lg:sticky lg:top-24 lg:self-start">
          {/* Desktop vertical thumbnails — images + videos */}
          {totalMedia > 1 && (
            <div className="hidden md:flex flex-col gap-2">
              {allMedia.map((media, i) => (
                <button
                  key={`${media.type}-${i}`}
                  onClick={() => {
                    if (media.type === "video") {
                      setSelectedMedia(media);
                    } else {
                      setSelectedMedia(null);
                      setColorImage(null);
                      setSelectedImg(i);
                    }
                  }}
                  className={cn(
                    "relative h-[68px] w-[56px] shrink-0 overflow-hidden rounded-lg border-2 transition bg-card",
                    activeIdx === i ? "border-primary" : "border-transparent hover:border-border",
                  )}
                  aria-label={media.type === "video" ? `Play video ${i + 1}` : `View image ${i + 1}`}
                >
                  {media.type === "video" ? (
                    <>
                      <video src={media.src} muted preload="metadata" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    </>
                  ) : (
                    <img src={media.src} alt="" width={56} height={68} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main viewer — shows image or video */}
          <div className="relative flex-1">
            <div
              className="relative aspect-square overflow-hidden rounded-2xl bg-card shadow-luxe"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              aria-label="Product media gallery"
            >
              {activeMedia.type === "video" ? (
                <video
                  key={activeMedia.src}
                  src={activeMedia.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain bg-black"
                  aria-label="Product video"
                />
              ) : (
                <img
                  key={mainImage}
                  src={mainImage}
                  alt={`${product.name} — ${color}`}
                  width={800}
                  height={800}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover animate-in fade-in duration-200"
                />
              )}

              {/* Badges on image only */}
              {activeMedia.type === "image" && (
                <>
                  {product.badge && (
                    <span className="absolute left-4 top-4 rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest bg-primary text-white">
                      {product.badge}
                    </span>
                  )}
                  {discountPct && (
                    <span className="absolute right-4 top-4 rounded px-2.5 py-1 text-[10px] font-semibold text-white" style={{ background: "#dc2626" }}>
                      -{discountPct}%
                    </span>
                  )}
                </>
              )}

              {/* Mobile prev/next arrows */}
              {totalMedia > 1 && (
                <>
                  <button onClick={goPrev} aria-label="Previous media" className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur text-foreground shadow transition hover:bg-background md:hidden">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={goNext} aria-label="Next media" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur text-foreground shadow transition hover:bg-background md:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile thumbnail strip */}
            {totalMedia > 1 && (
              <div className="mt-3 flex justify-center gap-1.5 overflow-x-auto pb-1 md:hidden">
                {allMedia.map((media, i) => (
                  <button
                    key={`mob-${media.type}-${i}`}
                    onClick={() => {
                      if (media.type === "video") setSelectedMedia(media);
                      else { setSelectedMedia(null); setColorImage(null); setSelectedImg(i); }
                    }}
                    aria-label={media.type === "video" ? `Play video ${i + 1}` : `Go to image ${i + 1}`}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-card"
                    style={{ borderColor: activeIdx === i ? "#B08D57" : "transparent", opacity: activeIdx === i ? 1 : 0.55 }}
                  >
                    {media.type === "video" ? (
                      <>
                        <video src={media.src} muted preload="metadata" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="h-3 w-3 text-white fill-white" />
                        </div>
                      </>
                    ) : (
                      <img src={media.src} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Details ─── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary">
            {product.brand}{product.collection ? ` · ${product.collection}` : ""}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl lg:text-[2.6rem]">
            {product.name}
          </h1>

          {/* Rating — only if reviews exist */}
          {product.reviews > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5" style={{ color: "#B08D57" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-current" : "opacity-25")} />
                ))}
              </div>
              <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition">
                {product.rating.toFixed(1)} ({product.reviews} reviews)
              </a>
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-serif text-3xl font-semibold" style={{ color: "#B08D57" }}>
              {formatPrice(price)}
            </span>
            {origPrice && origPrice > price && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(origPrice)}</span>
            )}
            {discountPct && (
              <span className="rounded px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: "#dc2626" }}>
                Save {discountPct}%
              </span>
            )}
          </div>

          {/* Short description */}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-lg">
            {product.description}
          </p>

          {/* Inline trust chips — always visible above CTA */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { icon: CreditCard, text: "Cash on Delivery" },
              { icon: ShieldCheck, text: warrantyLabel },
              { icon: Truck, text: "All Pakistan Delivery" },
            ].map((t) => (
              <span
                key={t.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground"
              >
                <t.icon className="h-3.5 w-3.5 text-primary" />
                {t.text}
              </span>
            ))}
          </div>

          {/* Color selector */}
          {product.colors.length > 0 && (
            <div className="mt-7">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Color: <span className="font-medium text-foreground">{color}</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={color === c.name}
                    onMouseEnter={() => { if (c.image) new Image().src = c.image; }}
                    onClick={() => {
                      setColor(c.name);
                      setColorImage(c.image ?? null);
                      navigate({
                        to: "/product/$slug",
                        params: { slug: product.slug },
                        search: { color: colorSlug(c.name) },
                        replace: true,
                      });
                    }}
                    className={cn(
                      "h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition overflow-hidden",
                      color === c.name ? "ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/50",
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {c.image && (
                      <img src={c.image} alt="" width={36} height={36} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {product.sizes.length > 1 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {isPerfume ? "Bottle Size" : "Case Size"}: <span className="font-medium text-foreground">{size}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={cn(
                      "min-w-[60px] px-4 h-10 rounded-lg border text-sm font-medium transition",
                      size === sz
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="mt-5">
            {product.stock > 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                In stock — dispatched within 24 hours
              </p>
            ) : (
              <p className="flex items-center gap-2 text-xs text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Currently out of stock — WhatsApp us for updates
              </p>
            )}
          </div>

          <StockUrgency stock={product.stock} className="mt-3" />
          <LiveVisitors
            className="mt-3"
            label={isPerfume ? "people viewing this fragrance" : "people viewing this watch"}
          />
          <RecentlyBought slug={product.slug} className="mt-3" />
          <DeliveryEstimate className="mt-3" />

          {/* ── Objection Answers — the 5 questions Pakistani customers ask before buying ── */}
          <div className="mt-5 rounded-xl border border-border/50 bg-background/60 divide-y divide-border/40">
            {(isPerfume
              ? [
                  { q: "Is COD available?", a: "Yes — pay cash when delivered." },
                  { q: "How long does delivery take?", a: "2–4 business days across Pakistan." },
                  { q: "Can I return it?", a: "7-day return on defective or wrong items." },
                  { q: "Is it genuine?", a: "Directly sourced — quality checked before dispatch." },
                ]
              : [
                  { q: "Is COD available?", a: "Yes — pay cash when delivered." },
                  { q: "Is there a warranty?", a: warrantyLabel + " included with every watch." },
                  { q: "How long does delivery take?", a: "2–4 business days across Pakistan." },
                  { q: "Can I return it?", a: "7-day return on defective or wrong items." },
                  { q: "Is it genuine?", a: "Quality checked before every dispatch." },
                ]
            ).map(({ q, a }) => (
              <div key={q} className="flex items-start gap-2.5 px-4 py-2.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-foreground">{q}</span>
                  <span className="mx-1.5 text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{a}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="mt-7 flex gap-2.5">
            <div className="flex items-center rounded-lg border border-border bg-background">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-3 text-muted-foreground hover:text-primary transition"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-3 py-3 text-muted-foreground hover:text-primary transition"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-12 text-[11px] uppercase tracking-[0.18em]"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>

            <Button
              size="icon"
              variant="outline"
              className={cn("h-12 w-12 shrink-0", inWish && "text-primary border-primary bg-primary/5")}
              onClick={() => {
                wish.toggle(product.id);
                toast.success(inWish ? "Removed from wishlist" : "Added to wishlist");
              }}
              aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-5 w-5", inWish && "fill-current")} />
            </Button>
          </div>

          {/* Buy Now • Cash on Delivery  — primary CTA with highest visual weight */}
          <div className="mt-3">
            <button
              disabled={product.stock <= 0}
              onClick={handleBuyNow}
              className="w-full flex h-[52px] items-center justify-center gap-2 rounded-lg text-[12px] font-bold uppercase tracking-[0.22em] text-white transition-all disabled:opacity-40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              style={{ background: product.stock > 0 ? "#111111" : "#777" }}
            >
              <Zap className="h-4 w-4 shrink-0" />
              {product.stock > 0 ? "Buy Now • Cash on Delivery " : "Out of Stock"}
            </button>
            {/* COD sub-label — impossible to miss on mobile */}
            {product.stock > 0 && (
              <p className="mt-1.5 text-center text-[10px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-green-600" />
                  Pay cash when delivered · No advance payment
                </span>
              </p>
            )}
          </div>

          {/* WhatsApp help — subtle, below Buy Now • Cash on Delivery , never competing */}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void import("@/lib/tracking").then(({ trackEvent }) =>
                trackEvent("whatsapp_click", { metadata: { source: "product_page", productSlug: product.slug } })
              )}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border/50 py-2.5 text-[11px] text-muted-foreground transition hover:border-[#25D366]/50 hover:text-[#25D366]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Have a question? Chat with us on WhatsApp
            </a>
          )}

          {/* Trust grid — directly under Buy Now • Cash on Delivery  */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, text: warrantyLabel },
              { icon: CreditCard, text: "Cash on Delivery" },
              { icon: Truck, text: "All Pakistan" },
              { icon: HeadphonesIcon, text: "Fast Support" },
            ].map((t) => (
              <div
                key={t.text}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-background/50 p-3 text-center"
              >
                <t.icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] leading-tight text-muted-foreground">{t.text}</span>
              </div>
            ))}
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="specs">
              <AccordionTrigger className="text-xs uppercase tracking-widest">
                {isPerfume ? "Fragrance Details" : "Specifications"}
              </AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {(
                    isPerfume
                      ? ([
                          ["Fragrance family", product.fragranceFamily],
                          ["Concentration", product.concentration],
                          ["Bottle size", product.sizeMl ? `${product.sizeMl} ml` : null],
                          ["Longevity", product.longevity],
                          ["Sillage", product.sillage],
                          ["Best for", product.gender],
                          ["Top notes", product.topNotes.length ? product.topNotes.join(", ") : null],
                          ["Heart notes", product.heartNotes.length ? product.heartNotes.join(", ") : null],
                          ["Base notes", product.baseNotes.length ? product.baseNotes.join(", ") : null],
                          ["Collection", product.collection],
                          ["Brand", product.brand],
                        ] as [string, string | null][])
                      : ([
                          ["Movement", product.movement],
                          ["Case", product.case],
                          ["Strap", product.strap],
                          ["Water Resistance", product.waterResistance],
                          ["Collection", product.collection],
                          ["Brand", product.brand],
                        ] as [string, string | null][])
                  )
                    .filter(([, v]) => !!v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                        <dd className="mt-1 text-sm">{v}</dd>
                      </div>
                    ))}
                </dl>
              </AccordionContent>
            </AccordionItem>

            {product.features.length > 0 && (
              <AccordionItem value="features">
                <AccordionTrigger className="text-xs uppercase tracking-widest">Features</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="shipping">
              <AccordionTrigger className="text-xs uppercase tracking-widest">
                Delivery & Returns
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Cash on Delivery</strong> is available across Pakistan.
                  Pay when your order arrives — no advance payment required.
                </p>
                <p>
                  Orders are dispatched within 24 hours and typically arrive in{" "}
                  <strong className="text-foreground">2–4 business days</strong> depending on your city.
                </p>
                <p>
                  If you receive a defective or incorrect item, contact us within 7 days and we will arrange
                  a replacement or return at no charge.
                </p>
                {warrantyLabel && (
                  <p>
                    <strong className="text-foreground">{warrantyLabel}</strong> is included with every
                    Timera timepiece.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="care">
              <AccordionTrigger className="text-xs uppercase tracking-widest">
                {isPerfume ? "Usage Tips" : "Care"}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(isPerfume
                    ? [
                        "Store the bottle upright, away from direct sunlight and heat.",
                        "Apply to pulse points — wrists, neck, behind the ears.",
                        "Do not rub after spraying; it breaks the top notes.",
                        "Layer with an unscented moisturiser to extend longevity.",
                      ]
                    : [
                        "Rinse with fresh water after exposure to salt water or sweat.",
                        "Avoid strong magnetic fields and sudden shocks.",
                        "Wipe the case and strap with a soft dry cloth regularly.",
                        "Service every 3–5 years to maintain accuracy.",
                      ]
                  ).map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* ─── Below-fold content ─── */}
      <div className="mt-20">
        <TrustBadges />
        <div className="mt-10">
          <BundleUpsell product={product} />
        </div>
      </div>

      {/* ─── Tabs: Description / Reviews / Care ─── */}
      <div id="reviews" className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start border-b border-border/50 bg-transparent rounded-none h-auto p-0 gap-0">
            {["description", "reviews", "care"].map((v) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-5 py-3 text-[11px] uppercase tracking-widest"
              >
                {v === "reviews" ? `Reviews (${product.reviews})` : v.charAt(0).toUpperCase() + v.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="description" className="pt-8">
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </TabsContent>

          <TabsContent value="reviews" className="pt-8">
            <div className="mb-8 max-w-3xl">
              <ReviewSummary productId={product.id} />
            </div>
            <div className="grid gap-8 md:grid-cols-[280px_1fr]">
              <div>
                <div className="font-serif text-5xl" style={{ color: "#B08D57" }}>
                  {product.reviews > 0 ? product.rating.toFixed(1) : "—"}
                </div>
                <div className="mt-2 flex gap-0.5" style={{ color: "#B08D57" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) && "fill-current")} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.reviews > 0
                    ? `Based on ${product.reviews} reviews`
                    : "No reviews yet — be the first."}
                </p>
              </div>

              <div className="space-y-6">
                {productReviews.length === 0 ? (
                  <div className="rounded-xl border border-border/50 p-6 text-center text-sm text-muted-foreground">
                    <p>No written reviews yet.</p>
                    <p className="mt-1 text-xs">
                      Bought this watch? Contact us to share your experience.
                    </p>
                  </div>
                ) : (
                  productReviews.map((r) => (
                    <div key={r.id} className="pb-6 border-b border-border/40 last:border-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">{r.customerName}</p>
                          <div className="flex gap-0.5 mt-1" style={{ color: "#B08D57" }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating && "fill-current")} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-PK") : ""}
                        </span>
                      </div>
                      {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
                      {r.body && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-primary">
                        <Check className="h-3 w-3" /> Verified Purchase
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="care" className="pt-8">
            <ul className="max-w-2xl space-y-3 text-sm text-muted-foreground">
              {(isPerfume
                ? [
                    "Store the bottle upright, away from direct sunlight and heat.",
                    "Apply to pulse points — wrists, neck and behind the ears.",
                    "Do not rub after spraying; it breaks the top notes.",
                    "Layer with an unscented moisturiser to extend longevity on dry skin.",
                  ]
                : [
                    "Rinse with fresh water after exposure to salt water or heavy sweat.",
                    "Avoid strong magnetic fields and sudden shocks.",
                    "Wipe the case and strap with a soft, dry cloth regularly.",
                    "Service every 3–5 years to maintain precision.",
                  ]
              ).map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Related products ─── */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-serif text-2xl md:text-3xl">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      <RecentlyViewed excludeSlug={product.slug} />

      {/* Sticky purchase bar — mobile only */}
      <StickyBuyBar
        product={product}
        color={color}
        size={size}
        qty={qty}
        onAdd={handleAddToCart}
      />
    </div>
  );
}
