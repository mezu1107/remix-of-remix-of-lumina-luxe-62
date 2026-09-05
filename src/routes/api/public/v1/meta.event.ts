import { createFileRoute } from "@tanstack/react-router";
import { apiError, handle, json, preflight, readJson } from "@/lib/api.server";
import { adminClient, hashUserData, loadMetaConfig, sendCapiEvent } from "@/lib/meta.server";

/**
 * Meta Conversions API bridge. Additive — no existing endpoint was changed.
 *
 * POST /api/public/v1/meta/event
 *  - Purchase events are ONLY accepted with a real order_number that exists in
 *    the database; value/currency are recomputed from the stored order, never
 *    trusted from the browser.
 *  - Every event is written to meta_event_log first. A unique index on
 *    (event_name, event_id, event_source) makes a repeated call a no-op, so a
 *    refreshed success page can never produce a second Purchase.
 */

const ALLOWED = new Set([
  "ViewContent",
  "Search",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Lead",
  "Purchase",
]);

type Body = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  order_number?: string;
  browser_sent?: boolean;
  custom_data?: Record<string, unknown>;
  user_data?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    external_id?: string;
    fbp?: string;
    fbc?: string;
  };
  attribution?: Record<string, unknown>;
};

const clientIp = (request: Request) =>
  request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

export const Route = createFileRoute("/api/public/v1/meta/event")({
  server: {
    handlers: {
      OPTIONS: preflight,
      POST: handle(async ({ request }) => {
        const body = await readJson<Body>(request);
        const eventName = String(body.event_name ?? "").trim();
        if (!ALLOWED.has(eventName)) return apiError("Unsupported event_name");

        const db = await adminClient();
        const config = await loadMetaConfig();

        let eventId = String(body.event_id ?? "").slice(0, 120);
        let value: number | null = Number(body.custom_data?.["value"] ?? 0) || null;
        let currency = String(body.custom_data?.["currency"] ?? "PKR");
        let customData: Record<string, unknown> = { ...(body.custom_data ?? {}) };
        let userData = body.user_data ?? {};
        let orderId: string | null = null;
        let orderNumber: string | null = null;

        if (eventName === "Purchase") {
          orderNumber = String(body.order_number ?? "").trim().slice(0, 60);
          if (!orderNumber) return apiError("order_number is required for Purchase");

          const { data: order, error } = await db
            .from("orders")
            .select("id, order_number, total, status, items, customer_email, customer_phone, customer_name, shipping_address, fbp, fbc, user_id")
            .eq("order_number", orderNumber)
            .maybeSingle();
          if (error) return apiError(error.message, 500);
          if (!order) return apiError("Order not found", 404);
          if (["cancelled", "failed", "refunded"].includes(String(order.status))) {
            return json({ ok: true, skipped: "Order is not a valid conversion", status: order.status });
          }

          orderId = order.id;
          eventId = `purchase_${order.id}`;
          value = Number(order.total) || 0;
          currency = "PKR";

          const items: any[] = Array.isArray(order.items) ? order.items : [];
          customData = {
            value,
            currency,
            order_id: order.order_number,
            num_items: items.reduce((n, i) => n + (Number(i?.quantity) || 1), 0),
            content_type: "product",
            content_ids: items.map((i) => String(i?.product_id ?? i?.slug ?? "")).filter(Boolean),
            contents: items.map((i) => ({
              id: String(i?.product_id ?? i?.slug ?? ""),
              quantity: Number(i?.quantity) || 1,
              item_price: Number(i?.price) || 0,
            })),
          };

          const [firstName, ...rest] = String(order.customer_name ?? "").split(" ");
          userData = {
            email: order.customer_email ?? undefined,
            phone: order.customer_phone ?? undefined,
            first_name: firstName || undefined,
            last_name: rest.join(" ") || undefined,
            city: String(order.shipping_address ?? "").split(",")[1]?.trim() || undefined,
            country: "pk",
            external_id: order.user_id ?? order.order_number,
            fbp: order.fbp ?? body.user_data?.fbp,
            fbc: order.fbc ?? body.user_data?.fbc,
          };

          // Record that the browser pixel already fired this exact event id.
          if (body.browser_sent) {
            await db
              .from("meta_event_log")
              .upsert(
                {
                  event_name: "Purchase",
                  event_id: eventId,
                  event_source: "browser",
                  order_number: order.order_number,
                  order_id: order.id,
                  value,
                  currency,
                  status: "sent",
                },
                { onConflict: "event_name,event_id,event_source", ignoreDuplicates: true },
              );
          }

          await db.from("orders").update({ purchase_event_id: eventId }).eq("id", order.id).is("purchase_event_id", null);
        }

        if (!eventId) eventId = `${eventName.toLowerCase()}_${crypto.randomUUID()}`;

        // Claim the server-side slot. A duplicate means we already sent it.
        const { data: claim, error: claimError } = await db
          .from("meta_event_log")
          .insert({
            event_name: eventName,
            event_id: eventId,
            event_source: "server",
            order_number: orderNumber,
            order_id: orderId,
            value,
            currency,
            status: "pending",
            test_event: Boolean(config.testEventCode),
            attribution: body.attribution ?? {},
          })
          .select("id")
          .maybeSingle();

        if (claimError) {
          const duplicate = String(claimError.code) === "23505" || /duplicate key/i.test(claimError.message ?? "");
          if (duplicate) return json({ ok: true, deduplicated: true, event_id: eventId });
          return apiError(claimError.message, 500);
        }

        const hashed = await hashUserData({
          email: userData.email ?? null,
          phone: userData.phone ?? null,
          firstName: userData.first_name ?? null,
          lastName: userData.last_name ?? null,
          city: userData.city ?? null,
          state: userData.state ?? null,
          zip: userData.zip ?? null,
          country: userData.country ?? "pk",
          externalId: userData.external_id ?? null,
          fbp: userData.fbp ?? null,
          fbc: userData.fbc ?? null,
          ip: clientIp(request),
          userAgent: request.headers.get("user-agent"),
        });

        const result = await sendCapiEvent(
          {
            event_name: eventName,
            event_id: eventId,
            event_source_url: body.event_source_url ?? null,
            user_data: hashed,
            custom_data: customData,
          },
          config,
        );

        await db
          .from("meta_event_log")
          .update({
            status: result.ok ? "sent" : "failed",
            error: result.ok ? null : (result.error ?? "unknown").slice(0, 400),
            fbtrace_id: result.fbtraceId ?? null,
            events_received: result.eventsReceived ?? null,
          })
          .eq("id", claim?.id);

        return json({ ok: true, event_id: eventId, capi: result.ok, error: result.ok ? undefined : result.error });
      }),
    },
  },
});
