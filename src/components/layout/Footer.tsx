import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Mail, Phone, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteSettingsQuery } from "@/lib/site-settings";

const WATCH_LINKS = [
  { label: "All Watches", to: "/shop" },
  { label: "Strap Watches", to: "/shop?category=strap" },
  { label: "Chain Watches", to: "/shop?category=chain" },
  { label: "Arabic Dial", to: "/shop?category=arabic" },
  { label: "Best Sellers", to: "/shop?badge=bestseller" },
  { label: "New Arrivals", to: "/shop?badge=new" },
];

const PERFUME_LINKS = [
  { label: "All Perfumes", to: "/perfumes" },
  { label: "Men's Fragrances", to: "/perfumes?gender=men" },
  { label: "Women's Fragrances", to: "/perfumes?gender=women" },
  { label: "Unisex", to: "/perfumes?gender=unisex" },
];

const HELP_LINKS = [
  { label: "Contact Us", to: "/contact" },
  { label: "Track Your Order", to: "/track" },
  { label: "FAQs", to: "/faq" },
  { label: "Shipping Policy", to: "/policies/shipping" },
  { label: "Returns Policy", to: "/policies/refund" },
  { label: "Warranty", to: "/policies/warranty" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/policies/privacy" },
  { label: "Terms of Service", to: "/policies/terms" },
  { label: "Cookie Policy", to: "/policies/cookies" },
];

export function Footer() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const brand = settings?.brandName || "TIMERA";

  const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, "") ?? "";
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Timera! I have a question.")}`
    : null;

  const socials = [
    settings?.instagramUrl && { icon: Instagram, href: settings.instagramUrl, label: "Instagram" },
    settings?.facebookUrl && { icon: Facebook, href: settings.facebookUrl, label: "Facebook" },
    settings?.youtubeUrl && { icon: Youtube, href: settings.youtubeUrl, label: "YouTube" },
  ].filter(Boolean) as { icon: typeof Mail; href: string; label: string }[];

  return (
    <footer className="mt-24 border-t border-border/40 bg-secondary">
      <div className="container-luxe py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2.5fr]">
          {/* Brand column */}
          <div>
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={brand}
                className="h-10 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <span className="font-serif text-2xl text-white">{brand}</span>
            )}
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
              {settings?.brandTagline ||
                "Premium watches with Cash on Delivery across Pakistan. 1-year warranty on every timepiece."}
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-2.5">
              {settings?.contactPhone && (
                <a
                  href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 text-sm text-white/55 hover:text-white transition"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  {settings.contactPhone}
                </a>
              )}
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-white/55 hover:text-white transition"
                >
                  <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                  WhatsApp Us
                </a>
              )}
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-center gap-2.5 text-sm text-white/55 hover:text-white transition"
                >
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  {settings.contactEmail}
                </a>
              )}
            </div>

            {/* Social icons */}
            {socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/50 hover:border-primary/50 hover:text-primary transition"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <div>
              <h4 className="mb-4 text-[10px] uppercase tracking-[0.28em] text-primary">Watches</h4>
              <ul className="space-y-2.5">
                {WATCH_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to as any}
                      className="text-sm text-white/50 hover:text-white transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-[10px] uppercase tracking-[0.28em] text-primary">Perfumes</h4>
              <ul className="space-y-2.5">
                {PERFUME_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to as any}
                      className="text-sm text-white/50 hover:text-white transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-[10px] uppercase tracking-[0.28em] text-primary">Customer Care</h4>
              <ul className="space-y-2.5">
                {HELP_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to as any}
                      className="text-sm text-white/50 hover:text-white transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-[10px] uppercase tracking-[0.28em] text-primary">Legal</h4>
              <ul className="space-y-2.5">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to as any}
                      className="text-sm text-white/50 hover:text-white transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} {brand}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/35">
            <span>Cash on Delivery Available</span>
            <span>·</span>
            <span>1-Year Warranty</span>
            <span>·</span>
            <span>Delivery Across Pakistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
