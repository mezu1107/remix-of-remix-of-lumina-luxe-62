import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { CHAT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { catalogueToText, loadCatalogue } from "@/lib/store-data.server";

/**
 * The concierge must never show a red error to a shopper. When the AI is not
 * reachable we stream a helpful hand-written reply in the same UI-message
 * stream format, so the chat keeps working on every deployment.
 */
function fallbackStream(text: string) {
  const events: unknown[] = [
    { type: "start" },
    { type: "start-step" },
    { type: "text-start", id: "fallback" },
    { type: "text-delta", id: "fallback", delta: text },
    { type: "text-end", id: "fallback" },
    { type: "finish-step" },
    { type: "finish" },
  ];
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}

const OFFLINE_REPLY =
  "I'm briefly offline, but I can still point you the right way: browse every precision-quartz Timera at /shop, current offers at /deals, and track an order at /track. Complimentary insured shipping over Rs 5,000 and 30-day returns on unworn pieces. For an instant human answer, tap the green WhatsApp button.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) return new Response("Messages are required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return fallbackStream(OFFLINE_REPLY);

        let catalogue = "";
        try {
          catalogue = catalogueToText(await loadCatalogue());
        } catch {
          catalogue = "";
        }

        const gateway = createLovableAiGatewayProvider(key);
        let result;
        try {
          result = streamText({
          model: gateway(CHAT_MODEL),
          system: [
            "You are the Timera Concierge, a warm and precise shopping assistant for the Timera watch store (Pakistan).",
            "Every Timera watch uses a precision QUARTZ movement. Timera is NOT Swiss-made and never claim otherwise — if asked, explain quartz is more accurate, service-free and keeps prices honest.",
            "Your job is to close the sale: always end with a clear next step (a product link, /shop, or /checkout).",
            "Answer only using the catalogue and store policies below. If something is not covered, say so and suggest contacting the team via the Contact page.",
            "Recommend at most 3 watches at a time. Always mention the price in Pakistani Rupees (Rs) and link the product as a markdown link like [Name](/product/slug).",
            "Never invent products, prices, discount codes, delivery dates or specifications.",
            "Never ask for card numbers, passwords or any payment details. If a customer offers them, tell them to use the secure checkout instead.",
            "Keep replies short — 2 to 5 sentences or a short bullet list.",
            "",
            "Store policies: complimentary insured shipping over Rs 5,000, 30-day returns on unworn pieces, every watch ships with an authenticity dossier. Orders can be tracked at /track. Security and privacy information lives at /trust.",
            "",
            "CATALOGUE:",
            catalogue || "(catalogue unavailable right now — apologise and suggest browsing /shop)",
          ].join("\n"),
            messages: await convertToModelMessages(body.messages as UIMessage[]),
          });
        } catch {
          return fallbackStream(OFFLINE_REPLY);
        }

        try {
          return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
        } catch {
          return fallbackStream(OFFLINE_REPLY);
        }
      },
    },
  },
});
