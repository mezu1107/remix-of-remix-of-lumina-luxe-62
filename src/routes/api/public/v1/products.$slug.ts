import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/products/$slug")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ params }) => {
        const supabase = anonClient();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("slug", params.slug)
          .eq("active", true)
          .maybeSingle();
        if (error) return apiError(error.message, 500);
        if (!data) return apiError("Product not found", 404);

        const { data: reviews } = await supabase
          .from("reviews")
          .select("id,customer_name,customer_role,rating,title,body,created_at")
          .eq("product_id", (data as any).id)
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(20);

        return json({ ok: true, currency: "PKR", product: data, reviews: reviews ?? [] });
      }),
    },
  },
});
