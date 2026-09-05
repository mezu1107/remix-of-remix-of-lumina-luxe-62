/**
 * TIKTOK PIXEL MODULE — TikTok Events (ttq) and nothing else.
 * Faithful port of the official TikTok base snippet.
 */

/** Hard-coded fallback pixel. Admin → Settings can override it. */
export const DEFAULT_TIKTOK_PIXEL_ID = "D7IA94BC77U8DEPHHKSG";

type Ttq = ((...args: unknown[]) => void) & {
  methods?: string[];
  setAndDefer?: (t: any, e: string) => void;
  instance?: (id: string) => unknown;
  load?: (id: string, opts?: Record<string, unknown>) => void;
  page?: (...a: unknown[]) => void;
  track?: (...a: unknown[]) => void;
  identify?: (...a: unknown[]) => void;
  push?: (...a: unknown[]) => void;
  _i?: Record<string, unknown>;
  _t?: Record<string, unknown>;
  _o?: Record<string, unknown>;
};

type TtWindow = Window & { TiktokAnalyticsObject?: string; ttq?: Ttq };

const w = () => window as unknown as TtWindow;
const clean = (v: unknown) => String(v ?? "").trim();
const active = new Set<string>();

/** Creates the ttq stub exactly as the official snippet does. */
function ensureStub(): Ttq | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const win = w();
  if (win.ttq) return win.ttq;

  win.TiktokAnalyticsObject = "ttq";
  const ttq: Ttq = [] as unknown as Ttq;
  win.ttq = ttq;

  ttq.methods = [
    "page", "track", "identify", "instances", "debug", "on", "off", "once",
    "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent",
    "revokeConsent", "grantConsent",
  ];
  ttq.setAndDefer = function (t: any, e: string) {
    t[e] = function (...args: unknown[]) {
      t.push([e as unknown, ...args]);
    };
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
  ttq.instance = function (id: string) {
    const e = (ttq._i?.[id] ?? []) as any[];
    for (const m of ttq.methods!) ttq.setAndDefer!(e, m);
    return e;
  };
  ttq.load = function (id: string, opts?: Record<string, unknown>) {
    const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i ?? {};
    (ttq._i as any)[id] = [];
    (ttq._i as any)[id]._u = url;
    ttq._t = ttq._t ?? {};
    (ttq._t as any)[id] = +new Date();
    ttq._o = ttq._o ?? {};
    (ttq._o as any)[id] = opts ?? {};
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `${url}?sdkid=${encodeURIComponent(id)}&lib=ttq`;
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) first.parentNode.insertBefore(script, first);
    else document.head.appendChild(script);
  };
  return ttq;
}

/** Boots the TikTok pixel. Safe to call repeatedly. */
export function initTiktokPixel(pixelId?: string | null) {
  if (typeof window === "undefined") return null;
  const id = clean(pixelId) || DEFAULT_TIKTOK_PIXEL_ID;
  const ttq = ensureStub();
  if (!ttq) return null;
  if (!active.has(id)) {
    active.add(id);
    ttq.load?.(id);
    ttq.page?.();
  }
  return id;
}

export const isTiktokPixelReady = () => active.size > 0;
export const tiktokPixelIds = () => [...active];

export function tiktokPage() {
  if (typeof window === "undefined") return;
  if (!active.size) initTiktokPixel();
  w().ttq?.page?.();
}

export function tiktokTrack(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (!active.size) initTiktokPixel();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  w().ttq?.track?.(event, out);
}
