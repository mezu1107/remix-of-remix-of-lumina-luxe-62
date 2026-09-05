import { createFileRoute } from "@tanstack/react-router";
import { anonClient, handle, json, preflight, searchParams } from "@/lib/api.server";

const LIST_COLUMNS =
  "id,slug,name,brand,collection,category,price,sale_price,compare_at,image_url,colors,sizes,movement,case_material,strap,water_resistance,rating,reviews,badge,stock,description,featured,sort_order,deal_id";

export const Route = createFileRoute("/api/public/v1/products/")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const q = searchParams(request);
        const limit = Math.min(Number(q.get("limit") ?? 60) || 60, 200);
        const offset = Math.max(Number(q.get("offset") ?? 0) || 0, 0);

        let query = anonClient()
          .from("products")
          .select(LIST_COLUMNS, { count: "exact" })
          .eq("active", true)
          .order("sort_order", { ascending: true })
          .range(offset, offset + limit - 1);

        const category = q.get("category");
        const collection = q.get("collection");
        const deal = q.get("deal");
        const search = q.get("search");
        if (category) query = query.eq("category", category);
        if (collection) query = query.eq("collection", collection);
        if (deal) query = query.eq("deal_id", deal);
        if (q.get("featured") === "true") query = query.eq("featured", true);
        if (search) query = query.ilike("name", `%${search}%`);

        const { data, error, count } = await query;
        if (error) return json({ ok: false, error: error.message }, 500);

        return json({
          ok: true,
          currency: "PKR",
          count: count ?? data?.length ?? 0,
          limit,
          offset,
          products: data ?? [],
        });
      }),
    },
  },
});
