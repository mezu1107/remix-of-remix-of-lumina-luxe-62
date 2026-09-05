/**
 * Browser-side bridge to the Meta Conversions API endpoint.
 * Fire-and-forget: it never blocks the UI and never throws into the caller.
 */
import { getAttribution } from "@/lib/attribution";

export const newEventId = (name: string) =>
  `${name.toLowerCase()}_${(crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`)}`;

type ServerEventInput = {
  eventName: string;
  eventId: string;
  customData?: Record<string, unknown>;
  userData?: Record<string, unknown>;
  orderNumber?: string;
  browserSent?: boolean;
};

export function sendServerEvent(input: ServerEventInput) {
  if (typeof window === "undefined") return;
  const attr = getAttribution();
  const payload = {
    event_name: input.eventName,
    event_id: input.eventId,
    event_source_url: window.location.href,
    order_number: input.orderNumber,
    browser_sent: input.browserSent ?? true,
    custom_data: input.customData ?? {},
    user_data: { ...(input.userData ?? {}), fbp: attr?.fbp ?? undefined, fbc: attr?.fbc ?? undefined },
    attribution: attr ? { first: attr.first, last: attr.last } : {},
  };
  try {
    void fetch("/api/public/v1/meta/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* tracking must never break the store */
  }
}
