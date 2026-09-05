import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminAccess as claimAdmin } from "@/lib/admin-access.functions";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Images,
  Layers,
  Watch,
  Newspaper,
  Package,
  LogOut,
  ShieldAlert,
  Tags,
  BadgePercent,
  MessageSquareQuote,
  Ticket,
  Megaphone,
  Menu,
  ShieldCheck,
  Wallet,
  Settings,
  HelpCircle,
  UserSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store Admin | Timera" },
      {
        name: "description",
        content:
          "Private Timera store dashboard for managing products, orders, deals, coupons, reviews and site settings. Staff access only.",
      },
      { property: "og:title", content: "Store Admin | Timera" },
      {
        property: "og:description",
        content:
          "Private Timera store dashboard for managing products, orders, deals, coupons, reviews and site settings. Staff access only.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/hero", label: "Hero Slides", icon: Images },
  { to: "/admin/collections", label: "Collections", icon: Layers },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/products", label: "Products", icon: Watch },
  { to: "/admin/deals", label: "Deals", icon: BadgePercent },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/popups", label: "Popups", icon: Megaphone },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/blog", label: "Journal", icon: Newspaper },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/orders", label: "Orders", icon: Package },
  { to: "/admin/leads", label: "Shopper Leads", icon: UserSearch },
  { to: "/admin/payments", label: "Payments & Delivery", icon: Wallet },
  { to: "/admin/trust", label: "Trust Centre", icon: ShieldCheck },
  { to: "/admin/settings", label: "Site Settings", icon: Settings },
];


function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<"loading" | "ok" | "denied" | "anon">("loading");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setState("anon");
        return;
      }
      try {
        const { isAdmin } = await claimAdmin({});
        if (cancelled) return;
        setState(isAdmin ? "ok" : "denied");
      } catch {
        if (!cancelled) setState("denied");
      }

    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (state === "loading") {
    return <div className="container-luxe py-32 text-center text-muted-foreground">Checking your access…</div>;
  }

  if (state !== "ok") {
    return (
      <div className="container-luxe py-20 sm:py-32">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center sm:p-10">
          <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-6 font-serif text-2xl sm:text-3xl">
            {state === "anon" ? "Sign in to continue" : "Admin access required"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {state === "anon"
              ? "The store dashboard is private. Sign in with your owner account to manage the storefront."
              : "This account doesn't have admin rights. Ask the store owner to grant you access."}
          </p>
          <Button asChild className="mt-8">
            <Link to={state === "anon" ? "/auth" : "/"}>{state === "anon" ? "Sign in" : "Back to store"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const NavList = (
    <nav className="space-y-1">
      {links.map((l) => {
        const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
        return (
          <Link
            key={l.to}
            to={l.to as any}
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <l.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const current = links.find((l) => (l.exact ? pathname === l.to : pathname.startsWith(l.to)));

  return (
    <div className="container-luxe py-6 lg:py-10">
      {/* Mobile bar */}
      <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 lg:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open admin menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto">
            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-primary">Timera</p>
            <h2 className="mt-1 font-serif text-2xl">Store Admin</h2>
            <div className="mt-6">{NavList}</div>
            <Button variant="outline" size="sm" className="mt-8 w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </SheetContent>
        </Sheet>
        <p className="min-w-0 truncate text-sm font-medium">{current?.label ?? "Store Admin"}</p>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Timera</p>
          <h2 className="mt-1 font-serif text-2xl">Store Admin</h2>
          <div className="mt-6">{NavList}</div>
          <Button variant="outline" size="sm" className="mt-8 w-full" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
