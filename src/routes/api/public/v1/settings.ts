import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/settings")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () => {
        const supabase = anonClient();
        const [site, payment] = await Promise.all([
          supabase.from("site_settings").select("*").limit(1).maybeSingle(),
          supabase.from("payment_settings_public" as any).select("*").limit(1).maybeSingle(),
        ]);
        if (site.error) return apiError(site.error.message, 500);
        return json({
          ok: true,
          currency: "PKR",
          site: site.data ?? null,
          payment: payment.error ? null : (payment.data ?? null),
        });
      }),
    },
  },
});
