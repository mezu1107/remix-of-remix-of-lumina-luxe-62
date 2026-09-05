import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/categories")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () => {
        const { data, error } = await anonClient()
          .from("categories")
          .select("id,name,slug,description,image_url,sort_order")
          .eq("active", true)
          .order("sort_order");
        if (error) return apiError(error.message, 500);
        return json({ ok: true, categories: data ?? [] });
      }),
    },
  },
});
