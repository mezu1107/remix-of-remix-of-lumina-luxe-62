import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight, readJson } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/auth/signup")({
  server: {
    handlers: {
      OPTIONS: preflight,
      POST: handle(async ({ request }) => {
        const body = await readJson<{ email?: string; password?: string; full_name?: string }>(request);
        if (!body.email?.trim() || !body.password) return apiError("email and password are required");

        const { data, error } = await anonClient().auth.signUp({
          email: body.email.trim(),
          password: body.password,
          options: { data: { full_name: body.full_name?.trim() ?? null } },
        });
        if (error) return apiError(error.message, 400);

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
          message: data.session ? "Account created." : "Account created — confirm your email to sign in.",
        }, 201);
      }),
    },
  },
});
