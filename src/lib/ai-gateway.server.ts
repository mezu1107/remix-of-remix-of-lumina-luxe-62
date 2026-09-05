import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Lovable AI Gateway provider. Server-only — never import from client code. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const CHAT_MODEL = "google/gemini-3.6-flash";

export function requireApiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured (missing key).");
  return key;
}
