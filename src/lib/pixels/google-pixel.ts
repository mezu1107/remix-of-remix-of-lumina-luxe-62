/**
 * GOOGLE PIXEL MODULE — Google tag (GA4) + Google Ads conversions, nothing else.
 */

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

const clean = (v: unknown) => String(v ?? "").trim();

let tagId = "";
let purchaseLabel = "";
const booted = new Set<string>();

export function initGooglePixel(id?: string | null, adsPurchaseLabel?: string | null) {
  if (typeof window === "undefined") return null;
  const gid = clean(id);
  purchaseLabel = clean(adsPurchaseLabel);
  if (!gid) return null;
  tagId = gid;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: unknown[]) => void window.dataLayer?.push(args));

  if (booted.has(gid)) return gid;
  booted.add(gid);

  if (!document.getElementById("google-tag-script")) {
    const script = document.createElement("script");
    script.id = "google-tag-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gid)}`;
    document.head.appendChild(script);
  }
  window.gtag("js", new Date());
  window.gtag("config", gid, { send_page_view: false });
  return gid;
}

export const isGooglePixelReady = () => booted.size > 0;

export function googleTrack(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

export function googleAdsConversion(params: { value?: number; currency?: string; transactionId?: string }) {
  if (!tagId || !purchaseLabel || typeof window === "undefined") return;
  window.gtag?.("event", "conversion", {
    send_to: `${tagId}/${purchaseLabel}`,
    value: params.value,
    currency: params.currency ?? "PKR",
    transaction_id: params.transactionId,
  });
}
