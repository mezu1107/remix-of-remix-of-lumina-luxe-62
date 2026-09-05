import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Database image URLs are root-relative (`/__l5e/assets-v1/...`) and only
 * resolve on Lovable-hosted domains. Prefix them with the published origin so
 * images also load on external deployments (e.g. Vercel). Override with the
 * VITE_ASSET_BASE_URL env var if the site moves to a custom domain.
 */
const ASSET_BASE =
  (import.meta.env.VITE_ASSET_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://timeras.lovable.app";

export const absUrl = (u: string | null | undefined): string => {
  if (!u) return "";
  const t = u.trim();
  if (t.startsWith("/")) return `${ASSET_BASE}${t}`;
  return t;
};

export type ProductColor = {
  name: string;
  hex: string;
  /** Optional photo of the watch in this colour, shown when the swatch is picked. */
  image?: string;
};

export type ProductType = "watch" | "perfume";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  collection: string;
  category: string | null;
  productType: ProductType;
  price: number;
  salePrice?: number;
  compareAt?: number;
  image: string;
  gallery: string[];
  /** MP4/WebM video URLs for the product gallery — admin-managed */
  videos: string[];
  colors: ProductColor[];
  sizes: string[];
  movement: string;
  case: string;
  strap: string;
  waterResistance: string;
  /** Perfume-only fields */
  fragranceFamily: string | null;
  concentration: string | null;
  sizeMl: number | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longevity: string | null;
  sillage: string | null;
  gender: string | null;
  rating: number;
  reviews: number;
  badge?: string;
  stock: number;
  description: string;
  features: string[];
  featured: boolean;
  sortOrder: number;
  dealId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
};

export type HeroSlide = {
  id: string;
  eyebrow: string | null;
  title: string;
  titleAccent: string | null;
  description: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  image: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
};

export type Deal = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  discountPercent: number;
  code: string | null;
  image: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type Popup = {
  id: string;
  title: string;
  message: string | null;
  image: string | null;
  badge: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  couponCode: string | null;
  delaySeconds: number;
  triggerType: string;
  frequency: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrder: number;
  expiresAt: string | null;
};

export type Review = {
  id: string;
  productId: string | null;
  customerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string;
  category: string;
  image: string | null;
  date: string;
};

/** Normalises jsonb text arrays, recursively unwrapping values double-encoded by imports. */
const asArray = (v: unknown): string[] => {
  const raw = Array.isArray(v) ? v.flat(Infinity) : typeof v === "string" ? [v] : [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const inner = JSON.parse(trimmed);
        if (Array.isArray(inner)) {
          out.push(...asArray(inner));
          continue;
        }
      } catch {
        /* fall through to manual clean-up */
      }
    }
    const cleaned = trimmed.replace(/^\[+|\]+$/g, "").replace(/^"+|"+$/g, "").trim();
    if (cleaned) out.push(cleaned);
  }
  return out;
};

/**
 * Parses admin-entered colour lines. Supported shapes:
 *   `Blue`
 *   `Blue #1e3a8a`
 *   `Blue #1e3a8a | https://…/blue-watch.jpg`   ← swatch swaps the product photo
 */
function parseColors(v: unknown): ProductColor[] {
  const rows = asArray(v);
  if (!rows.length) return [];
  const parsed = rows
    .map((row) => {
      const [left, ...rest] = row.split("|");
      const image = rest.join("|").trim();
      const base = left.trim();
      const match = base.match(/(#[0-9a-fA-F]{3,8})\s*$/);
      const hex = match ? match[1] : "#1a1a1a";
      const name = (match ? base.slice(0, match.index).trim() : base) || hex;
      return { name, hex, image: image ? absUrl(image) : undefined };
    })
    .filter((c) => c.name.length > 0);
  return parsed;
}


/** URL-friendly key for a colour name, used by the `?color=` product link. */
export const colorSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function mapProduct(row: Record<string, any>): Product {
  const gallery = asArray(row.gallery).map(absUrl);
  const sizes = asArray(row.sizes);
  const colors = parseColors(row.colors);
  const image = absUrl(typeof row.image_url === "string" ? row.image_url : "");
  // Videos are stored as URL arrays — absUrl handles root-relative paths
  const videos = asArray(row.videos).map(absUrl);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    collection: row.collection,
    category: row.category ?? null,
    productType: (row.product_type === "perfume" ? "perfume" : "watch") as ProductType,
    price: Number(row.price),
    salePrice: row.sale_price != null ? Number(row.sale_price) : undefined,
    compareAt: row.compare_at ? Number(row.compare_at) : undefined,
    image,
    gallery: gallery.length ? gallery : image ? [image] : [],
    videos,
    colors: colors.length ? colors : [{ name: "Default", hex: "#1a1a1a" }],
    sizes,
    movement: row.movement,
    case: row.case_material,
    strap: row.strap,
    waterResistance: row.water_resistance,
    fragranceFamily: row.fragrance_family ?? null,
    concentration: row.concentration ?? null,
    sizeMl: row.size_ml != null ? Number(row.size_ml) : null,
    topNotes: asArray(row.top_notes),
    heartNotes: asArray(row.heart_notes),
    baseNotes: asArray(row.base_notes),
    longevity: row.longevity ?? null,
    sillage: row.sillage ?? null,
    gender: row.gender ?? null,
    rating: Number(row.rating),
    reviews: row.reviews ?? 0,
    badge: row.badge ?? undefined,
    stock: row.stock ?? 0,
    description: row.description ?? "",
    features: asArray(row.features),
    featured: !!row.featured,
    sortOrder: row.sort_order ?? 0,
    dealId: row.deal_id ?? null,
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    seoKeywords: row.seo_keywords ?? null,
  };
}

/** Price a customer actually pays. */
export const effectivePrice = (p: Product) =>
  p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;

/** Struck-through reference price, when there is one. */
export const listPrice = (p: Product) =>
  p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.price : p.compareAt;

/**
 * Listing columns only. `gallery` and the SEO fields are deliberately left out —
 * they can hold large inline images and are only needed on the product page,
 * so skipping them keeps shop/home payloads small and fast.
 */
const LIST_COLUMNS =
  "id,slug,name,brand,collection,category,product_type,price,sale_price,compare_at,image_url,colors,sizes,movement,case_material,strap,water_resistance,fragrance_family,concentration,size_ml,top_notes,heart_notes,base_notes,longevity,sillage,gender,rating,reviews,badge,stock,description,features,featured,sort_order,deal_id,videos";

export const productsQuery = queryOptions({
  queryKey: ["products"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(LIST_COLUMNS)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },
});


/** Split a catalogue list by product type. */
export const isPerfume = (p: Product) => p.productType === "perfume";
export const isWatch = (p: Product) => p.productType !== "perfume";

export const heroSlidesQuery = queryOptions({
  queryKey: ["hero_slides"],
  queryFn: async (): Promise<HeroSlide[]> => {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      eyebrow: r.eyebrow,
      title: r.title,
      titleAccent: r.title_accent,
      description: r.description,
      ctaLabel: r.cta_label,
      ctaHref: r.cta_href,
      image: absUrl(r.image_url),
    }));
  },
});

export const collectionsQuery = queryOptions({
  queryKey: ["collections"],
  queryFn: async (): Promise<Collection[]> => {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      tagline: r.tagline,
      image: r.image_url ? absUrl(r.image_url) : null,
    }));
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      image: r.image_url ? absUrl(r.image_url) : null,
    }));
  },
});

const withinWindow = (startsAt: string | null, endsAt: string | null) => {
  const now = Date.now();
  if (startsAt && new Date(startsAt).getTime() > now) return false;
  if (endsAt && new Date(endsAt).getTime() < now) return false;
  return true;
};

export const dealsQuery = queryOptions({
  queryKey: ["deals"],
  queryFn: async (): Promise<Deal[]> => {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? [])
      .map((r: any) => ({
        id: r.id,
        slug: r.slug ?? r.id,
        title: r.title,
        subtitle: r.subtitle,
        description: r.description,
        badge: r.badge,
        discountPercent: r.discount_percent ?? 0,
        code: r.code,
        image: r.image_url ? absUrl(r.image_url) : null,
        ctaLabel: r.cta_label,
        ctaHref: r.cta_href,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
      }))
      .filter((d) => withinWindow(d.startsAt, d.endsAt));
  },
});

export const popupsQuery = queryOptions({
  queryKey: ["popups"],
  queryFn: async (): Promise<Popup[]> => {
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? [])
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        image: r.image_url ? absUrl(r.image_url) : null,
        badge: r.badge,
        ctaLabel: r.cta_label,
        ctaHref: r.cta_href,
        couponCode: r.coupon_code,
        delaySeconds: r.delay_seconds ?? 6,
        triggerType: r.trigger_type ?? "delay",
        frequency: r.frequency ?? "session",
        startsAt: r.starts_at,
        endsAt: r.ends_at,
      }))
      .filter((p) => withinWindow(p.startsAt, p.endsAt));
  },
});

export const couponsQuery = queryOptions({
  queryKey: ["coupons"],
  queryFn: async (): Promise<Coupon[]> => {
    const { data, error } = await supabase.from("coupons").select("*").eq("active", true);
    if (error) throw error;
    return (data ?? [])
      .map((r: any) => ({
        id: r.id,
        code: r.code,
        description: r.description,
        discountType: r.discount_type,
        discountValue: Number(r.discount_value ?? 0),
        minOrder: Number(r.min_order ?? 0),
        expiresAt: r.expires_at,
      }))
      .filter((c) => !c.expiresAt || new Date(c.expiresAt).getTime() > Date.now());
  },
});

export const reviewsQuery = (productId?: string) =>
  queryOptions({
    queryKey: ["reviews", productId ?? "all"],
    queryFn: async (): Promise<Review[]> => {
      let q = supabase.from("reviews").select("*").eq("approved", true);
      if (productId) q = q.eq("product_id", productId);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        productId: r.product_id,
        customerName: r.customer_name,
        rating: r.rating ?? 5,
        title: r.title,
        body: r.body,
        createdAt: r.created_at,
      }));
    },
  });

export type Testimonial = { id: string; name: string; role: string | null; quote: string; rating: number };

/** Approved reviews marked as "featured" — shown as testimonials on the home page. */
export const testimonialsQuery = queryOptions({
  queryKey: ["reviews", "featured"],
  queryFn: async (): Promise<Testimonial[]> => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.customer_name,
      role: r.customer_role ?? null,
      quote: r.body ?? r.title ?? "",
      rating: r.rating ?? 5,
    }));
  },
});



export const blogPostsQuery = queryOptions({
  queryKey: ["blog_posts"],
  queryFn: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      content: r.content,
      author: r.author,
      category: r.category,
      image: r.image_url ? absUrl(r.image_url) : null,
      date: new Date(r.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      }),
    }));
  },
});

export type PaymentSettings = {
  id: string;
  currency: string;
  currencySymbol: string;
  codEnabled: boolean;
  codCharge: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  easypaisaEnabled: boolean;
  easypaisaNumber: string | null;
  easypaisaAccountName: string | null;
  jazzcashEnabled: boolean;
  jazzcashNumber: string | null;
  jazzcashAccountName: string | null;
  bankEnabled: boolean;
  bankName: string | null;
  bankAccountTitle: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  warrantyMonths: number;
  warrantyNote: string;
  paymentNote: string | null;
};

export const paymentSettingsQuery = queryOptions({
  queryKey: ["payment_settings"],
  staleTime: 60_000,
  queryFn: async (): Promise<PaymentSettings> => {
    // Signed-in shoppers can read the full row (incl. account details).
    // Guests only get the safe public view — account numbers stay private.
    const { data: sessionData } = await supabase.auth.getSession();
    const source = sessionData.session ? "payment_settings" : "payment_settings_public";
    const { data, error } = await supabase
      .from(source as any)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const r: any = data ?? {};

    return {
      id: r.id ?? "",
      currency: r.currency ?? "PKR",
      currencySymbol: r.currency_symbol ?? "Rs",
      codEnabled: r.cod_enabled ?? true,
      codCharge: Number(r.cod_charge ?? 0),
      deliveryCharge: Number(r.delivery_charge ?? 250),
      freeDeliveryAbove: Number(r.free_delivery_above ?? 5000),
      easypaisaEnabled: r.easypaisa_enabled ?? false,
      easypaisaNumber: r.easypaisa_number ?? null,
      easypaisaAccountName: r.easypaisa_account_name ?? null,
      jazzcashEnabled: r.jazzcash_enabled ?? false,
      jazzcashNumber: r.jazzcash_number ?? null,
      jazzcashAccountName: r.jazzcash_account_name ?? null,
      bankEnabled: r.bank_enabled ?? false,
      bankName: r.bank_name ?? null,
      bankAccountTitle: r.bank_account_title ?? null,
      bankAccountNumber: r.bank_account_number ?? null,
      bankIban: r.bank_iban ?? null,
      warrantyMonths: r.warranty_months ?? 12,
      warrantyNote: r.warranty_note ?? "",
      paymentNote: r.payment_note ?? null,
    };
  },
});


export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

export const faqsQuery = queryOptions({
  queryKey: ["faqs"],
  staleTime: 60_000,
  queryFn: async (): Promise<Faq[]> => {
    const { data, error } = await supabase
      .from("faqs" as any)
      .select("id,question,answer,category,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      category: r.category ?? null,
    }));
  },
});
