import { createFileRoute } from "@tanstack/react-router";
import { apiError, handle, json, preflight, requireAdmin } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/admin/customers")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const { data, error } = await admin.client
          .from("profiles")
          .select("id,full_name,email,phone,city,created_at")
          .order("created_at", { ascending: false });
        if (error) return apiError(error.message, 500);
        return json({ ok: true, customers: data ?? [] });
      }),
    },
  },
});
