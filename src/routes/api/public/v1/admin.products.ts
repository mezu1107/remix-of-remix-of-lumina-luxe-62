import { createFileRoute } from "@tanstack/react-router";
import { apiError, handle, json, preflight, readJson, requireAdmin, searchParams } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/admin/products")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const { data, error } = await admin.client.from("products").select("*").order("sort_order");
        if (error) return apiError(error.message, 500);
        return json({ ok: true, currency: "PKR", products: data ?? [] });
      }),
      POST: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const body = await readJson<Record<string, unknown>>(request);
        if (!body.name || !body.slug) return apiError("name and slug are required");
        const { data, error } = await (admin.client.from("products") as any).insert(body).select("*").maybeSingle();
        if (error) return apiError(error.message, 400);
        return json({ ok: true, product: data }, 201);
      }),
      PUT: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const { id, ...patch } = await readJson<Record<string, any>>(request);
        if (!id) return apiError("id is required");
        const { data, error } = await (admin.client.from("products") as any).update(patch).eq("id", id).select("*").maybeSingle();
        if (error) return apiError(error.message, 400);
        return json({ ok: true, product: data });
      }),
      DELETE: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const id = searchParams(request).get("id");
        if (!id) return apiError("id query parameter is required");
        const { error } = await admin.client.from("products").delete().eq("id", id);
        if (error) return apiError(error.message, 400);
        return json({ ok: true, deleted: id });
      }),
    },
  },
});
