import { createFileRoute } from "@tanstack/react-router";
import { apiError, handle, json, preflight } from "@/lib/api.server";

/**
 * Checkout payment instructions.
 *
 * The storefront needs the wallet/bank details a customer must send money to.
 * They are read server-side and only the *enabled* methods are returned, so the
 * full settings row (including disabled/unused accounts) never leaves the server.
 */
export const Route = createFileRoute("/api/public/v1/payment-instructions")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await (supabaseAdmin as any)
          .from("payment_settings")
          .select(
            "easypaisa_enabled,easypaisa_number,easypaisa_account_name,jazzcash_enabled,jazzcash_number,jazzcash_account_name,bank_enabled,bank_name,bank_account_title,bank_account_number,bank_iban",
          )
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) return apiError(error.message, 500);

        const r: any = data ?? {};
        return json({
          ok: true,
          easypaisa: r.easypaisa_enabled
            ? { number: r.easypaisa_number ?? null, accountName: r.easypaisa_account_name ?? null }
            : null,
          jazzcash: r.jazzcash_enabled
            ? { number: r.jazzcash_number ?? null, accountName: r.jazzcash_account_name ?? null }
            : null,
          bank: r.bank_enabled
            ? {
                bankName: r.bank_name ?? null,
                accountTitle: r.bank_account_title ?? null,
                accountNumber: r.bank_account_number ?? null,
                iban: r.bank_iban ?? null,
              }
            : null,
        });
      }),
    },
  },
});
