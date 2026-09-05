import { createFileRoute } from "@tanstack/react-router";
import { apiError, getUser, handle, json, preflight, searchParams } from "@/lib/api.server";

const ORDER_FIELDS =
  "order_number,customer_name,customer_phone,shipping_address,items,subtotal,discount,shipping,total,status,status_history,tracking_number,courier,estimated_delivery,created_at,updated_at";

/** Track a single order. Signed-in customers get their own orders; guests pass ?email=. */
export const Route = createFileRoute("/api/public/v1/orders/$orderNumber")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request, params }) => {
        const orderNumber = params.orderNumber.trim().toUpperCase();
        const email = searchParams(request).get("email")?.trim().toLowerCase();
        const user = await getUser(request);

        if (user) {
          const { data, error } = await user.client
            .from("orders")
            .select(ORDER_FIELDS)
            .eq("order_number", orderNumber)
            .eq("user_id", user.id)
            .maybeSingle();
          if (error) return apiError(error.message, 500);
          if (!data) return apiError("Order not found", 404);
          return json({ ok: true, currency: "PKR", order: data });
        }

        if (!email) return apiError("Add ?email= your order email, or sign in.", 400);

        // Guests cannot read the orders table directly. The order number plus the
        // exact order email acts as the lookup secret, verified here server-side.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await (supabaseAdmin as any)
          .from("orders")
          .select(ORDER_FIELDS)
          .eq("order_number", orderNumber)
          .ilike("customer_email", email)
          .is("user_id", null)
          .maybeSingle();
        if (error) return apiError(error.message, 500);
        if (!data) return apiError("Order not found", 404);
        return json({ ok: true, currency: "PKR", order: data });
      }),
    },
  },
});
