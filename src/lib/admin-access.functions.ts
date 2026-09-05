import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns true when the signed-in user is an admin.
 * If no admin exists yet, the first authenticated caller claims the role.
 *
 * This runs with the service role on the server only, so the browser can never
 * influence the answer — it just receives a yes/no for the verified session.
 */
export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    if (!userId) return { isAdmin: false };

    const mine = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (mine.error) throw new Error("Unable to verify access");
    if (mine.data) return { isAdmin: true };

    // Bootstrap: the very first signed-in user becomes the owner.
    const existing = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    if (existing.error) throw new Error("Unable to verify access");
    if ((existing.data ?? []).length > 0) return { isAdmin: false };

    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) throw new Error("Unable to verify access");
    return { isAdmin: true };
  });
