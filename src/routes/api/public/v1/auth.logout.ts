import { createFileRoute } from "@tanstack/react-router";
import { handle, json, preflight, requireUser } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/auth/logout")({
  server: {
    handlers: {
      OPTIONS: preflight,
      POST: handle(async ({ request }) => {
        const user = await requireUser(request);
        await user.client.auth.signOut();
        return json({ ok: true, message: "Signed out" });
      }),
    },
  },
});
