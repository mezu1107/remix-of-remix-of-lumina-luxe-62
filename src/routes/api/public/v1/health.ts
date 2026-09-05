import { createFileRoute } from "@tanstack/react-router";
import { anonClient, handle, json, preflight } from "@/lib/api.server";

export const Route = createFileRoute("/api/public/v1/health")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () => {
        const { error } = await anonClient().from("products").select("id").limit(1);
        return json({ ok: !error, service: "timera-api", database: error ? "unreachable" : "ok", time: new Date().toISOString() });
      }),
    },
  },
});
