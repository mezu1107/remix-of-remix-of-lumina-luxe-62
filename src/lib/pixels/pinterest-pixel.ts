/**
 * PINTEREST TAG MODULE — Pinterest tag (pintrk) and nothing else.
 */
type PinFn = ((...args: unknown[]) => void) & { queue?: unknown[]; version?: string };
type PinWindow = Window & { pintrk?: PinFn };

const w = () => window as unknown as PinWindow;
const clean = (v: unknown) => String(v ?? "").trim();
const active = new Set<string>();

function ensureStub(): PinFn | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (w().pintrk) return w().pintrk!;
  const pintrk: PinFn = function (...args: unknown[]) {
    pintrk.queue?.push(args);
  } as PinFn;
  pintrk.queue = [];
  pintrk.version = "3.0";
  w().pintrk = pintrk;

  if (!document.getElementById("pinterest-tag-script")) {
    const s = document.createElement("script");
    s.id = "pinterest-tag-script";
    s.async = true;
    s.src = "https://s.pinimg.com/ct/core.js";
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) first.parentNode.insertBefore(s, first);
    else document.head.appendChild(s);
  }
  return pintrk;
}

export function initPinterestPixel(tagId?: string | null, email?: string | null) {
  if (typeof window === "undefined") return null;
  const id = clean(tagId);
  if (!id) return null;
  const pintrk = ensureStub();
  if (!pintrk) return null;
  if (!active.has(id)) {
    active.add(id);
    pintrk("load", id, email ? { em: email } : {});
    pintrk("page");

    const nsId = `pinterest-noscript-${id}`;
    if (!document.getElementById(nsId)) {
      const ns = document.createElement("noscript");
      ns.id = nsId;
      ns.innerHTML = `<img height="1" width="1" style="display:none" alt="" src="https://ct.pinterest.com/v3/?event=init&tid=${encodeURIComponent(
        id,
      )}&noscript=1" />`;
      document.body?.appendChild(ns);
    }
  }
  return id;
}

export const isPinterestPixelReady = () => active.size > 0;

export function pinterestPage() {
  if (typeof window === "undefined" || !active.size) return;
  w().pintrk?.("page");
}

export function pinterestTrack(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !active.size) return;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  w().pintrk?.("track", event, out);
}
