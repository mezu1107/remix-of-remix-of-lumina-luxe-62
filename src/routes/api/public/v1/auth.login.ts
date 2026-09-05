import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight, readJson } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/auth/login")({
  server: {
    handlers: {
      OPTIONS: preflight,
      POST: handle(async ({ request }) => {
        const body = await readJson<{ email?: string; password?: string }>(request);
        if (!body.email?.trim() || !body.password) return apiError("email and password are required");

        const { data, error } = await anonClient().auth.signInWithPassword({
          email: body.email.trim(),
          password: body.password,
        });
        if (error) return apiError(error.message, 401);

        return json({
          ok: true,
          user: data.user ? { id: data.user.id, email: data.user.email } : null,
          session: data.session
            ? {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
              }
            : null,
        });
      }),
    },
  },
});
