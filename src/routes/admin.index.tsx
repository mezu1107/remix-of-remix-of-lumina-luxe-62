import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function useCount(table: "products" | "hero_slides" | "collections" | "blog_posts" | "orders") {
  return useQuery({
    queryKey: ["admin", "count", table],
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function AdminOverview() {
  const products = useCount("products");
  const slides = useCount("hero_slides");
  const collections = useCount("collections");
  const posts = useCount("blog_posts");
  const orders = useCount("orders");

  const revenue = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("total");
      if (error) throw error;
      return (data ?? []).reduce((a, o) => a + Number(o.total ?? 0), 0);
    },
  });

  const analytics = useQuery({
    queryKey: ["admin", "analytics", "overview"],
    refetchInterval: 15000,
    queryFn: async () => {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const liveSince = Date.now() - 5 * 60 * 1000;
      const hourSince = Date.now() - 60 * 60 * 1000;
      const { data, error } = await (supabase.from("analytics_events" as any) as any)
        .select("event_name,session_id,page_path,product_slug,product_name,created_at")
        .gte("created_at", since24h)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const rows = (data ?? []) as Record<string, any>[];
      const count = (name: string) => rows.filter((r) => r.event_name === name).length;
      const countSince = (name: string, ts: number) =>
        rows.filter((r) => r.event_name === name && new Date(r.created_at).getTime() >= ts).length;
      const liveVisitors = new Set(
        rows.filter((r) => r.session_id && new Date(r.created_at).getTime() >= liveSince).map((r) => String(r.session_id)),
      ).size;
      const activeCarts = new Set(
        rows.filter((r) => r.event_name === "add_to_cart" && r.session_id && new Date(r.created_at).getTime() >= hourSince).map((r) => String(r.session_id)),
      ).size;
      const topProducts = Object.values(
        rows.filter((r) => r.event_name === "view_item" && r.product_name).reduce<Record<string, { name: string; slug: string; views: number }>>((acc, r) => {
          const slug = String(r.product_slug ?? r.product_name);
          acc[slug] = acc[slug] ?? { name: String(r.product_name), slug, views: 0 };
          acc[slug].views += 1;
          return acc;
        }, {}),
      ).sort((a, b) => b.views - a.views).slice(0, 5);
      const topPages = Object.entries(
        rows.filter((r) => r.event_name === "page_view" && r.page_path).reduce<Record<string, number>>((acc, r) => {
          const path = String(r.page_path);
          acc[path] = (acc[path] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 5);
      return {
        liveVisitors,
        activeCarts,
        addToCartHour: countSince("add_to_cart", hourSince),
        checkoutsHour: countSince("begin_checkout", hourSince),
        purchasesHour: countSince("purchase", hourSince),
        pageViewsHour: countSince("page_view", hourSince),
        pageViews: count("page_view"),
        productViews: count("view_item"),
        checkouts: count("begin_checkout"),
        purchases: count("purchase"),
        topProducts,
        topPages,
      };
    },
  });


  const cards = [
    { label: "Products", value: products.data ?? 0, to: "/admin/products" },
    { label: "Hero Slides", value: slides.data ?? 0, to: "/admin/hero" },
    { label: "Collections", value: collections.data ?? 0, to: "/admin/collections" },
    { label: "Journal Posts", value: posts.data ?? 0, to: "/admin/blog" },
    { label: "Orders", value: orders.data ?? 0, to: "/admin/orders" },
    { label: "Revenue", value: formatPrice(revenue.data ?? 0), to: "/admin/orders" },
    { label: "Live Visitors", value: analytics.data?.liveVisitors ?? 0, to: "/admin" },
    { label: "Page Views 24h", value: analytics.data?.pageViews ?? 0, to: "/admin" },
    { label: "Checkouts 24h", value: analytics.data?.checkouts ?? 0, to: "/admin/orders" },
    { label: "Purchases 24h", value: analytics.data?.purchases ?? 0, to: "/admin/orders" },
  ];

  const live = [
    { label: "Live visitors (5m)", value: analytics.data?.liveVisitors ?? 0, hot: true },
    { label: "Active carts (1h)", value: analytics.data?.activeCarts ?? 0 },
    { label: "Add to cart (1h)", value: analytics.data?.addToCartHour ?? 0 },
    { label: "Checkouts (1h)", value: analytics.data?.checkoutsHour ?? 0 },
    { label: "Purchases (1h)", value: analytics.data?.purchasesHour ?? 0 },
    { label: "Page views (1h)", value: analytics.data?.pageViewsHour ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl">Overview</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every change you make here appears on the public storefront immediately. Live stats refresh every 15s.
      </p>
      <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-[11px] uppercase tracking-[0.25em] text-primary">Live now</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {live.map((l) => (
            <div key={l.label} className="rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{l.label}</p>
              <p className={`mt-1 font-serif text-2xl ${l.hot ? "gold-text" : ""}`}>{l.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to as any} className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-serif text-4xl gold-text">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Top products viewed today">
          {(analytics.data?.topProducts.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No product views tracked yet.</p>
          ) : (
            analytics.data?.topProducts.map((p) => (
              <div key={p.slug} className="flex items-center justify-between gap-3 border-b border-border/50 py-2 text-sm last:border-0">
                <span className="min-w-0 truncate">{p.name}</span>
                <span className="shrink-0 text-muted-foreground">{p.views} views</span>
              </div>
            ))
          )}
        </Panel>
        <Panel title="Top pages today">
          {(analytics.data?.topPages.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No page views tracked yet.</p>
          ) : (
            analytics.data?.topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between gap-3 border-b border-border/50 py-2 text-sm last:border-0">
                <span className="min-w-0 truncate">{p.path}</span>
                <span className="shrink-0 text-muted-foreground">{p.views} views</span>
              </div>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
