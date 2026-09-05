import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User, Menu, X, ChevronDown, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart, useWishlist } from "@/store/shop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { siteSettingsQuery } from "@/lib/site-settings";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* Navigation structure — aligned with Pakistan watch market categories */
/* ------------------------------------------------------------------ */
const WATCH_SUB = [
  { label: "All Watches", href: "/shop" },
  { label: "Strap Watches", href: "/shop?category=strap" },
  { label: "Chain Watches", href: "/shop?category=chain" },
  { label: "Arabic Dial Watches", href: "/shop?category=arabic" },
  { label: "Automatic", href: "/shop?movement=automatic" },
  { label: "Quartz", href: "/shop?movement=quartz" },
  { label: "Manual Wind", href: "/shop?movement=manual" },
];

const PERFUME_SUB = [
  { label: "All Perfumes", href: "/perfumes" },
  { label: "Men", href: "/perfumes?gender=men" },
  { label: "Women", href: "/perfumes?gender=women" },
  { label: "Unisex", href: "/perfumes?gender=unisex" },
];

const DEFAULT_NAV = [
  { label: "Watches", href: "/shop", sub: WATCH_SUB },
  { label: "Perfumes", href: "/perfumes", sub: PERFUME_SUB },
  { label: "Best Sellers", href: "/shop?badge=bestseller" },
  { label: "New Arrivals", href: "/shop?badge=new" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

type NavItem = { label: string; href: string; sub?: { label: string; href: string }[] };

/* ------------------------------------------------------------------ */
/* Desktop mega-dropdown for a top-level nav item                       */
/* ------------------------------------------------------------------ */
function DropdownMenu({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!item.sub?.length) {
    return (
      <Link
        to={item.href as any}
        className="relative text-[12px] font-medium uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-primary group"
      >
        {item.label}
        <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-primary"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Arrow */}
          <div className="mx-auto h-2 w-3 overflow-hidden relative">
            <div className="absolute inset-x-0 top-1 h-2 w-2 rotate-45 border border-border bg-card mx-auto" />
          </div>
          <div className="min-w-[180px] rounded-xl border border-border bg-card shadow-luxe overflow-hidden">
            {item.sub.map((s) => (
              <Link
                key={s.href}
                to={s.href as any}
                onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-[12px] text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search bar — inline on desktop, sheet on mobile                      */
/* ------------------------------------------------------------------ */
function SearchBar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    onClose?.();
    navigate({ to: "/shop", search: { q: term } as any });
  }

  return (
    <form onSubmit={submit} className="relative flex w-full items-center">
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search watches, perfumes…"
        className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
      />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Main Header                                                          */
/* ------------------------------------------------------------------ */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [mobileWatchOpen, setMobileWatchOpen] = useState(false);
  const [mobilePerfumeOpen, setMobilePerfumeOpen] = useState(false);

  const cartCount = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const toggleCart = useCart((s) => s.toggle);
  const { data: settings } = useQuery(siteSettingsQuery);

  /* Build nav — start from admin-set links, inject sub-menus */
  const adminNav: NavItem[] = (settings?.navLinks ?? []).map((n) => ({ label: n.label, href: n.href }));
  const nav: NavItem[] = adminNav.length
    ? adminNav.map((n) => {
        if (/watch/i.test(n.label) && !n.sub) return { ...n, sub: WATCH_SUB };
        if (/perfume/i.test(n.label) && !n.sub) return { ...n, sub: PERFUME_SUB };
        return n;
      })
    : DEFAULT_NAV;

  const brand = settings?.brandName || "TIMERA";
  const whatsapp = settings?.whatsappNumber ?? settings?.contactPhone ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const BrandLogo = (
    <>
      {settings?.logoUrl ? (
        <img
          src={settings.logoUrl}
          alt={brand}
          className="h-9 w-auto max-w-[160px] object-contain sm:h-10"
        />
      ) : (
        <span className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "#111111" }}>
          {brand}
        </span>
      )}
    </>
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/95 backdrop-blur-xl shadow-sm"
            : "bg-background/98 border-b border-border/40",
        )}
      >
        <div className="container-luxe">
          {/* ── Main bar ── */}
          <div className="flex h-14 items-center gap-3 sm:h-16 lg:h-[60px]">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden shrink-0 rounded-md p-1.5 text-foreground/70 hover:text-primary transition"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand */}
            <Link to="/" className="mr-auto flex items-baseline gap-1.5 lg:mr-0">
              {BrandLogo}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 xl:gap-10" aria-label="Main navigation">
              {nav.map((item) => (
                <DropdownMenu key={item.label} item={item} />
              ))}
            </nav>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-0.5">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>

              {/* Account */}
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link to={signedIn ? "/account" : "/auth"} aria-label={signedIn ? "My account" : "Sign in"}>
                  <User className="h-4 w-4" />
                </Link>
              </Button>

              {/* Wishlist — hidden on smallest screens */}
              <Button variant="ghost" size="icon" asChild className="relative hidden sm:inline-flex h-9 w-9">
                <Link to="/wishlist" aria-label="Wishlist">
                  <Heart className="h-4 w-4" />
                  {wishCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[15px] min-w-[15px] rounded-full bg-primary px-1 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {wishCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCart}
                className="relative h-9 w-9"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingBag className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-[15px] min-w-[15px] rounded-full bg-primary px-1 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* ── Inline search bar (slides down) ── */}
          {searchOpen && (
            <div className="border-t border-border/40 py-3 animate-in slide-in-from-top-1 duration-150">
              <SearchBar onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[320px] overflow-y-auto p-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Link to="/" onClick={() => setMobileOpen(false)}>
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={brand} className="h-7 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="font-serif text-xl" style={{ color: "#111111" }}>{brand}</span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search in drawer */}
          <div className="border-b border-border px-4 py-3">
            <SearchBar onClose={() => setMobileOpen(false)} />
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 py-2">
            {/* Watches with accordion */}
            <div>
              <button
                className="flex w-full items-center justify-between rounded-md px-3 py-3 font-serif text-base text-foreground transition hover:bg-muted hover:text-primary"
                onClick={() => setMobileWatchOpen((v) => !v)}
              >
                <span>Watches</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", mobileWatchOpen && "rotate-180")} />
              </button>
              {mobileWatchOpen && (
                <div className="ml-3 mb-1 border-l border-border/60 pl-3">
                  {WATCH_SUB.map((s) => (
                    <Link
                      key={s.href}
                      to={s.href as any}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-muted-foreground hover:text-primary transition"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Perfumes with accordion */}
            <div>
              <button
                className="flex w-full items-center justify-between rounded-md px-3 py-3 font-serif text-base text-foreground transition hover:bg-muted hover:text-primary"
                onClick={() => setMobilePerfumeOpen((v) => !v)}
              >
                <span>Perfumes</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", mobilePerfumeOpen && "rotate-180")} />
              </button>
              {mobilePerfumeOpen && (
                <div className="ml-3 mb-1 border-l border-border/60 pl-3">
                  {PERFUME_SUB.map((s) => (
                    <Link
                      key={s.href}
                      to={s.href as any}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-muted-foreground hover:text-primary transition"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other links */}
            {[
              { label: "Best Sellers", href: "/shop?badge=bestseller" },
              { label: "New Arrivals", href: "/shop?badge=new" },
              { label: "Collections", href: "/collections" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "Track Order", href: "/track" },
            ].map((n) => (
              <Link
                key={n.label}
                to={n.href as any}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-3 font-serif text-base text-foreground transition hover:bg-muted hover:text-primary"
              >
                {n.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-border" />

            <Link
              to={signedIn ? "/account" : "/auth"}
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {signedIn ? "My Account" : "Sign In / Register"}
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Wishlist
            </Link>
          </nav>

          {/* COD trust strip at bottom of drawer */}
          <div className="border-t border-border/40 px-5 py-4 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Why Timera?</p>
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">✓ Cash on Delivery</span>
              <span className="flex items-center gap-1">✓ 1-Year Warranty</span>
              <span className="flex items-center gap-1">✓ Delivery All Pakistan</span>
            </div>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Timera! I need help choosing a watch.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
