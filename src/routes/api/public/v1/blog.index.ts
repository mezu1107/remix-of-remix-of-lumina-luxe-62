import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight, searchParams } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/blog/")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const q = searchParams(request);
        const limit = Math.min(Number(q.get("limit") ?? 24) || 24, 100);
        let query = anonClient()
          .from("blog_posts")
          .select("id,slug,title,excerpt,author,category,image_url,published_at")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(limit);
        const category = q.get("category");
        if (category) query = query.eq("category", category);
        const { data, error } = await query;
        if (error) return apiError(error.message, 500);
        return json({ ok: true, posts: data ?? [] });
      }),
    },
  },
});
