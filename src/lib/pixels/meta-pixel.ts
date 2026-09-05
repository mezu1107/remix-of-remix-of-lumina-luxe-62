/**
 * META PIXEL MODULE — this file contains the Meta (Facebook) Pixel and nothing else.
 *
 * It is a faithful TypeScript port of the official Meta base-code snippet, so the
 * pixel behaves exactly the same as pasting the <script> tag in <head>:
 *   - creates the fbq stub with a queue (events fired before load are replayed)
 *   - loads https://connect.facebook.net/en_US/fbevents.js
 *   - calls fbq('init', PIXEL_ID) then fbq('track', 'PageView')
 *   - injects the <noscript> tracking image fallback
 */

/** Hard-coded fallback pixel. Admin → Settings can override it at any time. */
export const DEFAULT_META_PIXEL_ID = "1758262658709610";

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

type PixelWindow = Window & { fbq?: FbqFn; _fbq?: FbqFn };

const w = () => window as unknown as PixelWindow;

/** Standard Meta events we use across the storefront. */
export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Contact"
  | "Subscribe";

const activePixels = new Set<string>();

const clean = (v: unknown) => String(v ?? "").trim();

/** Creates the fbq stub exactly as the official snippet does. */
function ensureStub() {
  if (typeof window === "undefined") return null;
  if (w().fbq) return w().fbq!;

  const fbq: FbqFn = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue?.push(args);
  } as FbqFn;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  w().fbq = fbq;
  if (!w()._fbq) w()._fbq = fbq;
  return fbq;
}

function loadPixelScript() {
  if (typeof document === "undefined") return;
  if (document.getElementById("meta-pixel-script")) return;
  const script = document.createElement("script");
  script.id = "meta-pixel-script";
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  if (first?.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);
}

function injectNoscript(pixelId: string) {
  if (typeof document === "undefined") return;
  const id = `meta-pixel-noscript-${pixelId}`;
  if (document.getElementById(id)) return;
  const ns = document.createElement("noscript");
  ns.id = id;
  ns.innerHTML = `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${encodeURIComponent(
    pixelId,
  )}&ev=PageView&noscript=1" />`;
  document.body?.appendChild(ns);
}

/**
 * Boots the pixel. Safe to call repeatedly — each pixel id is only initialised once.
 * Falls back to DEFAULT_META_PIXEL_ID when no id is configured in the admin.
 */
export function initMetaPixel(pixelId?: string | null) {
  if (typeof window === "undefined") return null;
  const id = clean(pixelId) || DEFAULT_META_PIXEL_ID;
  const fbq = ensureStub();
  if (!fbq) return null;
  loadPixelScript();
  if (!activePixels.has(id)) {
    fbq("init", id);
    activePixels.add(id);
    injectNoscript(id);
    fbq("track", "PageView");
  }
  return id;
}

/** True once at least one pixel has been initialised. */
export const isMetaPixelReady = () => activePixels.size > 0;

export const metaPixelIds = () => [...activePixels];

/**
 * Fires a standard Meta event (auto-boots the pixel if it is not up yet).
 * `eventId` is Meta's deduplication key — pass the same id to the Conversions
 * API so browser + server events collapse into one conversion.
 */
export function metaTrack(event: MetaStandardEvent, params: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === "undefined") return;
  if (!activePixels.size) initMetaPixel();
  if (eventId) w().fbq?.("track", event, prune(params), { eventID: eventId });
  else w().fbq?.("track", event, prune(params));
}

/** Fires a custom (non-standard) Meta event. */
export function metaTrackCustom(event: string, params: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === "undefined") return;
  if (!activePixels.size) initMetaPixel();
  if (eventId) w().fbq?.("trackCustom", event, prune(params), { eventID: eventId });
  else w().fbq?.("trackCustom", event, prune(params));
}

function prune(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
