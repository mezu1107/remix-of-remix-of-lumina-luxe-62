/**
 * ATTRIBUTION MODULE — isolated, additive.
 *
 * Captures UTM parameters + Meta click id (fbclid) on the first page a visitor
 * lands on, persists first-touch and last-touch separately in localStorage and
 * exposes the payload for the order API and the Conversions API.
 *
 * Nothing here touches cart, checkout or pricing logic.
 */

const FIRST_KEY = "timera.attr.first";
const LAST_KEY = "timera.attr.last";
const WINDOW_DAYS = 28;

export type Touch = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  at?: string;
};

export type Attribution = {
  first: Touch;
  last: Touch;
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
};

const read = (key: string): Touch | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Touch) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: Touch) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage disabled — attribution is best effort */
  }
};

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function currentTouch(): Touch | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const get = (k: string) => {
    const v = params.get(k);
    return v ? v.slice(0, 300) : null;
  };
  const touch: Touch = {
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_content: get("utm_content"),
    utm_term: get("utm_term"),
    fbclid: get("fbclid"),
    landing_page: `${window.location.pathname}${window.location.search}`.slice(0, 500),
    referrer: (document.referrer || null)?.slice(0, 500) ?? null,
    at: new Date().toISOString(),
  };
  const hasAny = Boolean(
    touch.utm_source || touch.utm_medium || touch.utm_campaign || touch.utm_content || touch.utm_term || touch.fbclid,
  );
  if (hasAny) return touch;

  // No campaign params: only count an external referrer as a new touch.
  if (touch.referrer && !touch.referrer.includes(window.location.host)) {
    return { ...touch, utm_source: hostOf(touch.referrer), utm_medium: "referral" };
  }
  return null;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

/** Meta's fbc cookie value derived from a fresh fbclid, per Meta's spec. */
function fbcFromClickId(fbclid: string | null): string | null {
  if (!fbclid) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}

/** Call once per page load (safe to call more often). */
export function captureAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const touch = currentTouch();
  const first = read(FIRST_KEY);
  const last = read(LAST_KEY);

  if (touch) {
    if (!first) write(FIRST_KEY, touch);
    write(LAST_KEY, touch);
    if (touch.fbclid && !readCookie("_fbc")) {
      try {
        document.cookie = `_fbc=${fbcFromClickId(touch.fbclid)}; path=/; max-age=${WINDOW_DAYS * 86400}`;
      } catch {
        /* ignore */
      }
    }
  }
  return getAttribution() ?? (touch ? { first: touch, last: touch, fbclid: touch.fbclid ?? null, fbp: null, fbc: null } : null);
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const first = read(FIRST_KEY);
  const last = read(LAST_KEY) ?? first;
  const fbp = readCookie("_fbp");
  const fbc = readCookie("_fbc") ?? fbcFromClickId(last?.fbclid ?? null);
  if (!first && !last && !fbp && !fbc) return null;
  return {
    first: first ?? {},
    last: last ?? {},
    fbclid: last?.fbclid ?? first?.fbclid ?? null,
    fbp,
    fbc,
  };
}

/** Flat, backward-compatible shape sent to the order API. */
export function attributionForOrder() {
  const attr = getAttribution();
  if (!attr) return null;
  return {
    first_utm_source: attr.first.utm_source ?? null,
    first_utm_medium: attr.first.utm_medium ?? null,
    first_utm_campaign: attr.first.utm_campaign ?? null,
    first_utm_content: attr.first.utm_content ?? null,
    first_utm_term: attr.first.utm_term ?? null,
    first_landing_page: attr.first.landing_page ?? null,
    first_touch_at: attr.first.at ?? null,
    last_utm_source: attr.last.utm_source ?? null,
    last_utm_medium: attr.last.utm_medium ?? null,
    last_utm_campaign: attr.last.utm_campaign ?? null,
    last_utm_content: attr.last.utm_content ?? null,
    last_utm_term: attr.last.utm_term ?? null,
    last_touch_at: attr.last.at ?? null,
    fbclid: attr.fbclid,
    fbp: attr.fbp,
    fbc: attr.fbc,
    attribution: { first: attr.first, last: attr.last },
  };
}
