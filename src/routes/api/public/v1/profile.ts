import { createFileRoute } from "@tanstack/react-router";
import { apiError, handle, json, preflight, readJson, requireUser } from "@/lib/api.server";

const FIELDS = ["full_name", "email", "phone", "address", "city", "postal_code", "avatar_url"] as const;

export const Route = createFileRoute("/api/public/v1/profile")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async ({ request }) => {
        const user = await requireUser(request);
        const { data, error } = await user.client.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (error) return apiError(error.message, 500);
        return json({ ok: true, profile: data ?? { id: user.id, email: user.email } });
      }),
      PUT: handle(async ({ request }) => {
        const user = await requireUser(request);
        const body = await readJson<Record<string, unknown>>(request);
        const patch: Record<string, unknown> = { id: user.id };
        for (const key of FIELDS) if (body[key] !== undefined) patch[key] = body[key];
        const { data, error } = await (user.client.from("profiles") as any)
          .upsert(patch, { onConflict: "id" })
          .select("*")
          .maybeSingle();
        if (error) return apiError(error.message, 400);
        return json({ ok: true, profile: data });
      }),
    },
  },
});
