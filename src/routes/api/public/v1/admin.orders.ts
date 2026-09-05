import { createFileRoute } from "@tanstack/react-router";
import { apiError, handle, json, preflight, readJson, requireAdmin } from "@/lib/api.server";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export const Route = createFileRoute("/api/public/v1/admin/orders")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const { data, error } = await admin.client.from("orders").select("*").order("created_at", { ascending: false });
        if (error) return apiError(error.message, 500);
        return json({ ok: true, currency: "PKR", orders: data ?? [] });
      }),
      PATCH: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const body = await readJson<{ id?: string; status?: string; notes?: string }>(request);
        if (!body.id) return apiError("id is required");
        if (body.status && !STATUSES.includes(body.status)) return apiError(`status must be one of: ${STATUSES.join(", ")}`);
        const patch: Record<string, unknown> = {};
        if (body.status) patch.status = body.status;
        if (body.notes !== undefined) patch.notes = body.notes;
        const { data, error } = await (admin.client.from("orders") as any).update(patch).eq("id", body.id).select("*").maybeSingle();
        if (error) return apiError(error.message, 400);
        return json({ ok: true, order: data });
      }),
    },
  },
});
