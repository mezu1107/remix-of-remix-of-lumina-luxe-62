import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { absUrl } from "@/lib/catalog";

export type NavLink = { label: string; href: string };

export type SiteSettings = {
  id: string;
  brandName: string;
  brandSuffix: string | null;
  logoUrl: string | null;
  brandTagline: string | null;
  marqueeEnabled: boolean;
  marqueeItems: string[];
  featuredIn: string[];
  warrantyYears: number;
  navLinks: NavLink[];
  footerLinks: NavLink[];
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  contactHours: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  featureEnabled: boolean;
  featureEyebrow: string | null;
  featureTitle: string | null;
  featureTitleAccent: string | null;
  featureDescription: string | null;
  featureCtaLabel: string | null;
  featureCtaHref: string | null;
  featureImageUrl: string | null;
  featureEndsAt: string | null;
  trackingEnabled: boolean;
  metaPixelId: string | null;
  googleTagId: string | null;
  googleAdsPurchaseLabel: string | null;
  tiktokPixelId: string | null;
  linkedinPartnerId: string | null;
  snapchatPixelId: string | null;
  pinterestTagId: string | null;
  bingUetTagId: string | null;
  bingSiteVerification: string | null;
  googleSiteVerification: string | null;
  pinterestSiteVerification: string | null;
};

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];

const asLinks = (v: unknown): NavLink[] =>
  Array.isArray(v)
    ? (v as any[])
        .map((x) =>
          typeof x === "string"
            ? { label: x.split("|")[0]?.trim() ?? x, href: (x.split("|")[1] ?? "/").trim() }
            : { label: String(x?.label ?? ""), href: String(x?.href ?? "/") },
        )
        .filter((l) => l.label.length > 0)
    : [];

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "",
  brandName: "TIMERA",
  brandSuffix: "Timepieces",
  logoUrl: null,
  brandTagline: "Luxury timepieces, delivered across Pakistan.",
  marqueeEnabled: true,
  marqueeItems: ["1 year international warranty on every timepiece"],
  featuredIn: [],
  warrantyYears: 1,
  navLinks: [],
  footerLinks: [],
  contactEmail: null,
  contactPhone: null,
  whatsappNumber: null,
  address: null,
  contactHours: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  featureEnabled: false,
  featureEyebrow: null,
  featureTitle: null,
  featureTitleAccent: null,
  featureDescription: null,
  featureCtaLabel: null,
  featureCtaHref: "/shop",
  featureImageUrl: null,
  featureEndsAt: null,
  trackingEnabled: false,
  metaPixelId: null,
  googleTagId: null,
  googleAdsPurchaseLabel: null,
  tiktokPixelId: null,
  linkedinPartnerId: null,
  snapchatPixelId: null,
  pinterestTagId: null,
  bingUetTagId: null,
  bingSiteVerification: null,
  googleSiteVerification: null,
  pinterestSiteVerification: null,
};

export function mapSiteSettings(r: Record<string, any> | null | undefined): SiteSettings {
  if (!r) return DEFAULT_SETTINGS;
  return {
    id: r.id ?? "",
    brandName: r.brand_name || "TIMERA",
    brandSuffix: r.brand_suffix ?? null,
    logoUrl: r.logo_url ? absUrl(r.logo_url) : null,
    brandTagline: r.brand_tagline ?? null,
    marqueeEnabled: r.marquee_enabled ?? true,
    marqueeItems: asStrings(r.marquee_items),
    featuredIn: asStrings(r.featured_in),
    warrantyYears: Number(r.warranty_years ?? 1),
    navLinks: asLinks(r.nav_links),
    footerLinks: asLinks(r.footer_links),
    contactEmail: r.contact_email ?? null,
    contactPhone: r.contact_phone ?? null,
    whatsappNumber: r.whatsapp_number ?? null,
    address: r.address ?? null,
    contactHours: r.contact_hours ?? null,
    instagramUrl: r.instagram_url ?? null,
    facebookUrl: r.facebook_url ?? null,
    tiktokUrl: r.tiktok_url ?? null,
    youtubeUrl: r.youtube_url ?? null,
    featureEnabled: r.feature_enabled ?? false,
    featureEyebrow: r.feature_eyebrow ?? null,
    featureTitle: r.feature_title ?? null,
    featureTitleAccent: r.feature_title_accent ?? null,
    featureDescription: r.feature_description ?? null,
    featureCtaLabel: r.feature_cta_label ?? null,
    featureCtaHref: r.feature_cta_href ?? "/shop",
    featureImageUrl: r.feature_image_url ? absUrl(r.feature_image_url) : null,
    featureEndsAt: r.feature_ends_at ?? null,
    trackingEnabled: r.tracking_enabled ?? false,
    metaPixelId: r.meta_pixel_id ?? null,
    googleTagId: r.google_tag_id ?? null,
    googleAdsPurchaseLabel: r.google_ads_purchase_label ?? null,
    tiktokPixelId: r.tiktok_pixel_id ?? null,
    linkedinPartnerId: r.linkedin_partner_id ?? null,
    snapchatPixelId: r.snapchat_pixel_id ?? null,
    pinterestTagId: r.pinterest_tag_id ?? null,
    bingUetTagId: r.bing_uet_tag_id ?? null,
    bingSiteVerification: r.bing_site_verification ?? null,
    googleSiteVerification: r.google_site_verification ?? null,
    pinterestSiteVerification: r.pinterest_site_verification ?? null,
  };
}

export const siteSettingsQuery = queryOptions({
  queryKey: ["site_settings"],
  staleTime: 60_000,
  queryFn: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase
      .from("site_settings" as any)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return mapSiteSettings(data as any);
  },
});

/** "1 year" / "2 years" — used across the storefront so warranty copy stays in one place. */
export const warrantyLabel = (years: number) => `${years} ${years === 1 ? "year" : "years"}`;
