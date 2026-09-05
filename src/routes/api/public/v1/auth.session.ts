import { createFileRoute } from "@tanstack/react-router";
import { getUser, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/auth/session")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const user = await getUser(request);
        if (!user) return json({ ok: true, signed_in: false, user: null });
        const { data } = await user.client.from("user_roles").select("role").eq("user_id", user.id);
        return json({
          ok: true,
          signed_in: true,
          user: { id: user.id, email: user.email },
          roles: (data ?? []).map((r: any) => r.role),
        });
      }),
    },
  },
});
