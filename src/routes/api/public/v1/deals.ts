import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/deals")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () => {
        const { data, error } = await anonClient()
          .from("deals")
          .select("*")
          .eq("active", true)
          .order("sort_order");
        if (error) return apiError(error.message, 500);
        return json({ ok: true, deals: data ?? [] });
      }),
    },
  },
});
