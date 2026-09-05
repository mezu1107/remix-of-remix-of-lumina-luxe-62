import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/blog/$slug")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ params }) => {
        const { data, error } = await anonClient()
          .from("blog_posts")
          .select("*")
          .eq("slug", params.slug)
          .eq("published", true)
          .maybeSingle();
        if (error) return apiError(error.message, 500);
        if (!data) return apiError("Post not found", 404);
        return json({ ok: true, post: data });
      }),
    },
  },
});
