/** Recently-viewed products, stored per browser (no account needed). */
const KEY = "timera.recently-viewed";
const MAX = 8;

export function pushRecentlyViewed(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  try {
    const list = readRecentlyViewed().filter((s) => s !== slug);
    list.unshift(slug);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* private mode */
  }
}

export function readRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
