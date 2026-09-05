/**
 * LINKEDIN INSIGHT TAG MODULE — LinkedIn partner id + conversions, nothing else.
 */
type LiWindow = Window & {
  _linkedin_partner_id?: string;
  _linkedin_data_partner_ids?: string[];
  lintrk?: ((action: string, data?: Record<string, unknown>) => void) & { q?: unknown[] };
};

const w = () => window as unknown as LiWindow;
const clean = (v: unknown) => String(v ?? "").trim();
const active = new Set<string>();

export function initLinkedInPixel(partnerId?: string | null) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const id = clean(partnerId);
  if (!id || active.has(id)) return id || null;
  active.add(id);

  const win = w();
  win._linkedin_partner_id = id;
  win._linkedin_data_partner_ids = win._linkedin_data_partner_ids ?? [];
  win._linkedin_data_partner_ids.push(id);

  if (!win.lintrk) {
    const l: LiWindow["lintrk"] = function (a: string, b?: Record<string, unknown>) {
      l!.q!.push([a, b]);
    } as NonNullable<LiWindow["lintrk"]>;
    l.q = [];
    win.lintrk = l;
  }

  if (!document.getElementById("linkedin-insight-script")) {
    const s = document.createElement("script");
    s.id = "linkedin-insight-script";
    s.async = true;
    s.type = "text/javascript";
    s.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    document.head.appendChild(s);
  }

  const nsId = `linkedin-insight-noscript-${id}`;
  if (!document.getElementById(nsId)) {
    const ns = document.createElement("noscript");
    ns.id = nsId;
    ns.innerHTML = `<img height="1" width="1" style="display:none" alt="" src="https://px.ads.linkedin.com/collect/?pid=${encodeURIComponent(
      id,
    )}&fmt=gif" />`;
    document.body?.appendChild(ns);
  }
  return id;
}

export const isLinkedInPixelReady = () => active.size > 0;

/** LinkedIn only supports conversion ids; pass one to record a conversion. */
export function linkedInTrack(conversionId?: string | number) {
  if (typeof window === "undefined" || !active.size) return;
  if (conversionId) w().lintrk?.("track", { conversion_id: conversionId });
}
