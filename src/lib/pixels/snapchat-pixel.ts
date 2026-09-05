/**
 * SNAPCHAT PIXEL MODULE — Snap Pixel (snaptr) and nothing else.
 */
type SnapFn = ((...args: unknown[]) => void) & {
  handleRequest?: (...args: unknown[]) => void;
  queue?: unknown[];
};
type SnapWindow = Window & { snaptr?: SnapFn };

const w = () => window as unknown as SnapWindow;
const clean = (v: unknown) => String(v ?? "").trim();
const active = new Set<string>();

function ensureStub(): SnapFn | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (w().snaptr) return w().snaptr!;
  const a: SnapFn = function (...args: unknown[]) {
    if (a.handleRequest) a.handleRequest.apply(a, args);
    else a.queue?.push(args);
  } as SnapFn;
  a.queue = [];
  w().snaptr = a;

  if (!document.getElementById("snap-pixel-script")) {
    const s = document.createElement("script");
    s.id = "snap-pixel-script";
    s.async = true;
    s.src = "https://sc-static.net/scevent.min.js";
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) first.parentNode.insertBefore(s, first);
    else document.head.appendChild(s);
  }
  return a;
}

export function initSnapchatPixel(pixelId?: string | null, email?: string | null) {
  if (typeof window === "undefined") return null;
  const id = clean(pixelId);
  if (!id) return null;
  const snaptr = ensureStub();
  if (!snaptr) return null;
  if (!active.has(id)) {
    active.add(id);
    snaptr("init", id, email ? { user_email: email } : {});
    snaptr("track", "PAGE_VIEW");
  }
  return id;
}

export const isSnapchatPixelReady = () => active.size > 0;

export function snapTrack(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !active.size) return;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  w().snaptr?.("track", event, out);
}
