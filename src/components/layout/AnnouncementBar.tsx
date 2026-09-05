import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery } from "@/lib/site-settings";

const FALLBACK = [
  "Cash on Delivery available across all of Pakistan",
  "1-Year warranty on every timepiece",
  "Fast delivery — 2 to 4 business days",
  "Premium gift packaging with every order",
  "Call or WhatsApp us for help placing your order",
];

export function AnnouncementBar() {
  const { data: settings } = useQuery(siteSettingsQuery);
  if (settings && !settings.marqueeEnabled) return null;

  const adminItems = settings?.marqueeItems ?? [];
  const featured = settings?.featuredIn ?? [];
  const isFeaturedLine = (t: string) => /^featured in/i.test(t.trim());

  const items = adminItems.length
    ? [
        ...adminItems.filter((t) => !isFeaturedLine(t)),
        ...featured.map((n) => `Featured in ${n}`),
      ]
    : FALLBACK;

  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border/40 bg-secondary">
      <div className="flex w-max whitespace-nowrap marquee">
        {loop.map((text, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 px-6 py-2 text-[10px] uppercase tracking-[0.22em] text-white/60 sm:px-8 sm:py-2.5 sm:text-[11px]"
          >
            <span>{text}</span>
            <span style={{ color: "#B08D57" }}>◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
