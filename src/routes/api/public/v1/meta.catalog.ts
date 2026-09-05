import { createFileRoute } from "@tanstack/react-router";
import { anonClient, handle, preflight } from "@/lib/api.server";

/**
 * Meta Product Catalog feed.
 * GET /api/public/v1/meta/catalog
 *
 * Returns a JSON product feed in the format Meta Commerce Manager expects
 * when you set a "Scheduled feed" data source. Point your Meta catalog to:
 *   https://timera.store/api/public/v1/meta/catalog
 *
 * Meta documentation: https://developers.facebook.com/docs/marketing-api/catalog/reference
 *
 * Field mapping:
 *  id            → product UUID (stable identifier across website + pixel + catalog)
 *  title         → product name
 *  description   → product description (first 5000 chars)
 *  availability  → "in stock" | "out of stock"
 *  condition     → "new"
 *  price         → sale_price ?? price, formatted as "NNNN PKR"
 *  link          → canonical product URL
 *  image_link    → main product image (must be https)
 *  additional_image_link → gallery images (up to 10)
 *  brand         → product brand
 *  product_type  → "Watches" | "Perfumes"
 *  custom_label_0 → collection name (for campaign targeting)
 *  custom_label_1 → badge (Bestseller, New, etc.)
 *  sale_price    → only set when there is a genuine sale price
 *  inventory     → real stock count
 */

const SITE = "https://timera.store";

export const Route = createFileRoute("/api/public/v1/meta/catalog")({
  server: {
    handlers: {
      OPTIONS: preflight,

      GET: handle(async () => {
        const db = anonClient();

        const { data: products, error } = await db
          .from("products")
          .select(
            "id, slug, name, description, brand, collection, product_type, price, sale_price, image_url, gallery, stock, badge, active",
          )
          .eq("active", true)
          .order("sort_order", { ascending: true })
          .limit(2000);

        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const items = (products ?? []).map((p: any) => {
          const price = Number(p.sale_price ?? p.price) || 0;
          const originalPrice = p.sale_price ? Number(p.price) : null;
          const inStock = Number(p.stock) > 0;

          // Gallery images — must be absolute https URLs
          const gallery: string[] = Array.isArray(p.gallery)
            ? (p.gallery as string[])
                .filter((img: string) => typeof img === "string" && /^https:\/\//i.test(img))
                .slice(0, 10)
            : [];

          // Main image — must be https for Meta to accept it
          const imageUrl =
            typeof p.image_url === "string" && /^https:\/\//i.test(p.image_url)
              ? p.image_url
              : null;

          const item: Record<string, unknown> = {
            id: String(p.id),
            title: String(p.name ?? "").slice(0, 200),
            description: String(p.description ?? p.name ?? "").slice(0, 5000),
            availability: inStock ? "in stock" : "out of stock",
            condition: "new",
            price: `${price.toFixed(0)} PKR`,
            link: `${SITE}/product/${p.slug}`,
            brand: String(p.brand ?? "Timera"),
            product_type: p.product_type === "perfume" ? "Perfumes" : "Watches",
            inventory: Number(p.stock) || 0,
          };

          if (imageUrl) item.image_link = imageUrl;
          if (gallery.length > 0) item.additional_image_link = gallery;
          if (p.collection) item.custom_label_0 = String(p.collection);
          if (p.badge) item.custom_label_1 = String(p.badge);

          // Only set sale_price when there is a genuine markdown
          if (p.sale_price && Number(p.sale_price) < Number(p.price)) {
            item.sale_price = `${Number(p.sale_price).toFixed(0)} PKR`;
            item.original_price = `${Number(p.price).toFixed(0)} PKR`;
          }

          return item;
        });

        // Meta accepts both JSON and CSV feeds. We use the JSON "batch" format.
        const feed = { data: items };

        return new Response(JSON.stringify(feed, null, 2), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            // Allow Meta's crawler to access this endpoint
            "access-control-allow-origin": "*",
            // Cache for 1 hour — Meta typically crawls daily but this helps dev
            "cache-control": "public, max-age=3600",
          },
        });
      }),
    },
  },
});
