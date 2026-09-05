import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://timera-stores.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/faq", changefreq: "monthly", priority: "0.5" },
          { path: "/track", changefreq: "monthly", priority: "0.4" },
          { path: "/wishlist", changefreq: "monthly", priority: "0.3" },
          { path: "/cart", changefreq: "monthly", priority: "0.3" },
          { path: "/policies/shipping", changefreq: "yearly", priority: "0.3" },
          { path: "/policies/refund", changefreq: "yearly", priority: "0.3" },
          { path: "/policies/warranty", changefreq: "yearly", priority: "0.3" },
          { path: "/policies/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/policies/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/policies/cookies", changefreq: "yearly", priority: "0.3" },
        ];

        try {
          const supabase = createClient(
            process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );
          const { data } = await supabase.from("products").select("slug").eq("active", true);
          for (const row of data ?? []) {
            entries.push({ path: `/product/${row.slug}`, changefreq: "weekly", priority: "0.8" });
          }
        } catch {
          // product URLs are omitted if the catalog cannot be read
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
