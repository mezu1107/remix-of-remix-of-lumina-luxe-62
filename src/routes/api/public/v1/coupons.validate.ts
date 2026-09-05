import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight, readJson } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/coupons/validate")({
  server: {
    handlers: {
      OPTIONS: preflight,
      POST: handle(async ({ request }) => {
        const body = await readJson<{ code?: string; subtotal?: number }>(request);
        const code = body.code?.trim().toUpperCase();
        const subtotal = Number(body.subtotal ?? 0);
        if (!code) return apiError("code is required");

        const { data, error } = await anonClient()
          .from("coupons")
          .select("*")
          .eq("code", code)
          .eq("active", true)
          .maybeSingle();
        if (error) return apiError(error.message, 500);
        if (!data) return json({ ok: false, valid: false, reason: "This code is not valid." }, 200);

        const c = data as any;
        if (c.expires_at && new Date(c.expires_at).getTime() < Date.now())
          return json({ ok: true, valid: false, reason: "This code has expired." });
        if (c.usage_limit != null && c.used_count >= c.usage_limit)
          return json({ ok: true, valid: false, reason: "This code has been fully redeemed." });
        if (subtotal < Number(c.min_order ?? 0))
          return json({
            ok: true,
            valid: false,
            reason: `Spend at least Rs ${Number(c.min_order).toLocaleString("en-PK")} to use this code.`,
          });

        const discount =
          c.discount_type === "percent"
            ? Math.round((subtotal * Number(c.discount_value)) / 100)
            : Math.min(Number(c.discount_value), subtotal);

        return json({
          ok: true,
          valid: true,
          currency: "PKR",
          code: c.code,
          description: c.description,
          discount_type: c.discount_type,
          discount_value: Number(c.discount_value),
          discount,
        });
      }),
    },
  },
});
