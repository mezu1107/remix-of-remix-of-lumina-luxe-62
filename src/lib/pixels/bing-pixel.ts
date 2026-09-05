/**
 * MICROSOFT / BING UET MODULE — Bing Ads Universal Event Tracking (uetq) and nothing else.
 * Also handles the Bing Webmaster / Google / Pinterest site-verification meta tags.
 */
type UetWindow = Window & { uetq?: unknown[]; UET?: new (opts: Record<string, unknown>) => { push: (...a: unknown[]) => void } };

const w = () => window as unknown as UetWindow;
const clean = (v: unknown) => String(v ?? "").trim();
const active = new Set<string>();

export function initBingPixel(tagId?: string | null) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const id = clean(tagId);
  if (!id || active.has(id)) return id || null;
  active.add(id);

  const win = w();
  win.uetq = win.uetq ?? [];

  const boot = () => {
    if (!win.UET) return;
    const o = { ti: id, enableAutoSpaTracking: true, q: win.uetq } as Record<string, unknown>;
    const uet = new win.UET(o);
    (win as any).uetq = uet;
    uet.push("pageLoad");
  };

  if (!document.getElementById("bing-uet-script")) {
    const s = document.createElement("script");
    s.id = "bing-uet-script";
    s.async = true;
    s.src = "https://bat.bing.com/bat.js";
    s.onload = boot;
    const first = document.getElementsByTagName("script")[0];
    if (first?.parentNode) first.parentNode.insertBefore(s, first);
    else document.head.appendChild(s);
  } else {
    boot();
  }
  return id;
}

export const isBingPixelReady = () => active.size > 0;

export function bingTrack(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !active.size) return;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  (w().uetq as any)?.push?.("event", event, out);
}

/** Adds/updates a <meta name="..." content="..."> verification tag. */
export function setVerificationMeta(name: string, content?: string | null) {
  if (typeof document === "undefined") return;
  const value = clean(content);
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!value) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = value;
}
