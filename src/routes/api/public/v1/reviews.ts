import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight, readJson, requireUser, searchParams } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/reviews")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const q = searchParams(request);
        let query = anonClient()
          .from("reviews")
          .select("id,product_id,customer_name,customer_role,rating,title,body,featured,created_at")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(Math.min(Number(q.get("limit") ?? 50) || 50, 200));
        const productId = q.get("product_id");
        if (productId) query = query.eq("product_id", productId);
        if (q.get("featured") === "true") query = query.eq("featured", true);
        const { data, error } = await query;
        if (error) return apiError(error.message, 500);
        return json({ ok: true, reviews: data ?? [] });
      }),

      POST: handle(async ({ request }) => {
        const user = await requireUser(request);
        const body = await readJson<{
          product_id?: string;
          customer_name?: string;
          rating?: number;
          title?: string;
          body?: string;
        }>(request);

        const rating = Number(body.rating);
        if (!body.customer_name?.trim()) return apiError("customer_name is required");
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) return apiError("rating must be between 1 and 5");

        const { data, error } = await (user.client.from("reviews") as any)
          .insert({
            product_id: body.product_id ?? null,
            customer_name: body.customer_name.trim().slice(0, 80),
            rating: Math.round(rating),
            title: body.title?.trim().slice(0, 120) ?? null,
            body: body.body?.trim().slice(0, 2000) ?? null,
            approved: false,
          })
          .select("id")
          .maybeSingle();
        if (error) return apiError(error.message, 400);
        return json({ ok: true, id: data?.id, status: "pending_approval" }, 201);
      }),
    },
  },
});
