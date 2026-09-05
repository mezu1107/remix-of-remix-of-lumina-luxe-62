import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Package, Heart, MapPin, Settings, LogOut, Loader2 } from "lucide-react";
import { useWishlist } from "@/store/shop";
import { cn, formatPrice } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Timera" },
      { name: "description", content: "Your Timera account: orders, wishlist, addresses, and settings." },
      { property: "og:title", content: "My Account — Timera" },
      { property: "og:description", content: "Your Timera account dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/account" }],
  }),
  component: AccountPage,
});

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "settings", label: "Settings", icon: Settings },
];

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
};

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) navigate({ to: "/auth" });
  }, [session, navigate]);

  const userId = session?.user?.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Profile | null;
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const wishIds = useWishlist((s) => s.ids);
  const { data: products = [] } = useQuery(productsQuery);
  const wishItems = products.filter((p) => wishIds.includes(p.id));

  const [form, setForm] = useState<Partial<Profile>>({});
  useEffect(() => {
    if (profile) setForm(profile);
    else if (session?.user)
      setForm({
        full_name: (session.user.user_metadata as any)?.full_name ?? "",
        email: session.user.email ?? "",
      });
  }, [profile, session]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles" as any).upsert({
        id: userId,
        full_name: form.full_name || null,
        email: form.email || session?.user?.email || null,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Details saved");
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save your details"),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (session === undefined) {
    return <div className="container-luxe py-24 text-center text-muted-foreground">Loading your account…</div>;
  }
  if (!session) return null;

  const firstName = (form.full_name || session.user.email || "there").split(" ")[0];
  const totalSpent = orders.reduce((a, o) => a + Number(o.total || 0), 0);

  return (
    <div className="container-luxe py-10 sm:py-14">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">My Account</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h1 className="truncate font-serif text-3xl sm:text-4xl lg:text-5xl">Hello, {firstName}</h1>
        <Button variant="outline" size="sm" className="shrink-0" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
      <p className="mt-2 truncate text-sm text-muted-foreground">{session.user.email}</p>

      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Tabs: horizontal scroller on mobile, sidebar on desktop */}
        <aside className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex gap-2 lg:flex-col lg:gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm transition lg:w-full lg:justify-start lg:border-transparent lg:px-4 lg:py-3",
                  active === t.id
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          {active === "dashboard" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Orders" value={String(orders.length)} />
              <Stat label="Total spent" value={formatPrice(totalSpent)} />
              <Stat label="Wishlist" value={String(wishItems.length)} />
            </div>
          )}

          {active === "orders" && (
            <div className="space-y-4">
              {ordersLoading && <p className="text-muted-foreground">Loading orders…</p>}
              {!ordersLoading && orders.length === 0 && (
                <Empty text="You haven't placed an order yet." cta={{ to: "/shop", label: "Start shopping" }} />
              )}
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.order_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()} · {(o.items?.length ?? 0)} item(s)
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="font-serif text-lg">{formatPrice(Number(o.total || 0))}</p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/track">Track</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {active === "wishlist" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {wishItems.length === 0 && <Empty text="Your wishlist is empty." cta={{ to: "/shop", label: "Browse watches" }} />}
              {wishItems.map((p) => (
                <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} className="group rounded-xl border border-border bg-card p-3">
                  <img src={p.image} alt={p.name} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
                  <p className="mt-3 truncate text-sm">{p.name}</p>
                  <p className="text-sm text-primary">{formatPrice(p.salePrice ?? p.price)}</p>
                </Link>
              ))}
            </div>
          )}

          {(active === "addresses" || active === "settings") && (
            <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name">
                  <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </FormField>
                <FormField label="Phone">
                  <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </FormField>
              </div>
              <FormField label="Address">
                <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="City">
                  <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </FormField>
                <FormField label="Postal code">
                  <Input value={form.postal_code ?? ""} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
                </FormField>
              </div>
              <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                {saveProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save details
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-serif text-2xl">{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta: { to: string; label: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-muted-foreground">{text}</p>
      <Button asChild className="mt-4">
        <Link to={cta.to as any}>{cta.label}</Link>
      </Button>
    </div>
  );
}
