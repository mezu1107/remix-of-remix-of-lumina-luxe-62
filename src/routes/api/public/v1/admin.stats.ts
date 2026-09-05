import { createFileRoute } from "@tanstack/react-router";
import { handle, json, preflight, requireAdmin } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/admin/stats")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const admin = await requireAdmin(request);
        const [orders, products, customers, reviews] = await Promise.all([
          admin.client.from("orders").select("total,status,created_at"),
          admin.client.from("products").select("id", { count: "exact", head: true }),
          admin.client.from("profiles").select("id", { count: "exact", head: true }),
          admin.client.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        ]);
        const rows = (orders.data ?? []) as any[];
        return json({
          ok: true,
          currency: "PKR",
          stats: {
            orders: rows.length,
            revenue: rows.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
            pending_orders: rows.filter((o) => o.status === "pending").length,
            products: products.count ?? 0,
            customers: customers.count ?? 0,
            reviews_awaiting_approval: reviews.count ?? 0,
          },
        });
      }),
    },
  },
});
