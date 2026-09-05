import { createFileRoute } from "@tanstack/react-router";
import { anonClient, apiError, handle, json, preflight, readJson } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/auth/refresh")({
  server: {
    handlers: {
      OPTIONS: preflight,
      POST: handle(async ({ request }) => {
        const body = await readJson<{ refresh_token?: string }>(request);
        if (!body.refresh_token) return apiError("refresh_token is required");
        const { data, error } = await anonClient().auth.refreshSession({ refresh_token: body.refresh_token });
        if (error) return apiError(error.message, 401);
        return json({
          ok: true,
          session: data.session
            ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token, expires_at: data.session.expires_at }
            : null,
        });
      }),
    },
  },
});
