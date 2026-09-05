import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHAT_MODEL, createLovableAiGatewayProvider, requireApiKey } from "@/lib/ai-gateway.server";
import { catalogueToText, loadCatalogue, publicSupabase } from "@/lib/store-data.server";

function parseJson<T>(text: string, fallback: T): T {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start < 0) return fallback;
  try {
    return JSON.parse(cleaned.slice(start)) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* AI semantic search — public                                         */
/* ------------------------------------------------------------------ */
export const aiSearchProducts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(300) }).parse(input))
  .handler(async ({ data }) => {
    const gateway = createLovableAiGatewayProvider(requireApiKey());
    const rows = await loadCatalogue();
    if (rows.length === 0) return { slugs: [] as string[], summary: "" };

    const { text } = await generateText({
      model: gateway(CHAT_MODEL),
      system:
        "You match a shopper's natural-language request to watches in a catalogue. " +
        "Only use slugs that appear in the catalogue. Return at most 8 matches, best first. " +
        'Reply with strict JSON only: {"summary":"one short sentence","slugs":["slug-1","slug-2"]}. ' +
        "If nothing fits, return an empty slugs array and explain briefly in summary.",
      prompt: `Shopper request: "${data.query}"\n\nCATALOGUE:\n${catalogueToText(rows)}`,
    });

    const parsed = parseJson<{ summary?: string; slugs?: string[] }>(text, {});
    const valid = new Set(rows.map((r) => r.slug));
    return {
      summary: String(parsed.summary ?? "").slice(0, 240),
      slugs: (parsed.slugs ?? []).filter((s) => typeof s === "string" && valid.has(s)).slice(0, 8),
    };
  });

/* ------------------------------------------------------------------ */
/* AI review summary — public                                          */
/* ------------------------------------------------------------------ */
export const aiReviewSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: reviews, error } = await publicSupabase()
      .from("reviews")
      .select("rating, title, body, customer_name")
      .eq("product_id", data.productId)
      .eq("approved", true)
      .limit(60);
    if (error) throw error;
    const list = reviews ?? [];
    if (list.length < 2) return { available: false, summary: "", pros: [] as string[], cons: [] as string[], count: list.length };

    const gateway = createLovableAiGatewayProvider(requireApiKey());
    const { text } = await generateText({
      model: gateway(CHAT_MODEL),
      system:
        "You summarise customer reviews for a watch. Be factual and only use what reviewers actually wrote. " +
        'Reply with strict JSON only: {"summary":"2 short sentences","pros":["..."],"cons":["..."]}. ' +
        "Give at most 4 pros and 3 cons, each under 12 words. If reviewers raised no negatives, return an empty cons array.",
      prompt: list
        .map((r: any) => `★${r.rating} ${r.title ?? ""} — ${r.body ?? ""}`.trim())
        .join("\n")
        .slice(0, 8000),
    });

    const parsed = parseJson<{ summary?: string; pros?: string[]; cons?: string[] }>(text, {});
    return {
      available: true,
      count: list.length,
      summary: String(parsed.summary ?? "").slice(0, 400),
      pros: (parsed.pros ?? []).filter((s) => typeof s === "string").slice(0, 4),
      cons: (parsed.cons ?? []).filter((s) => typeof s === "string").slice(0, 3),
    };
  });

/* ------------------------------------------------------------------ */
/* AI product copywriter — admins only                                 */
/* ------------------------------------------------------------------ */
const CopyInput = z.object({
  name: z.string().max(200).optional(),
  brief: z.string().max(1000).optional(),
  brand: z.string().max(120).optional(),
  collection: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  movement: z.string().max(120).optional(),
  case_material: z.string().max(120).optional(),
  strap: z.string().max(120).optional(),
  water_resistance: z.string().max(120).optional(),
  price: z.union([z.string(), z.number()]).optional(),
});

export const aiWriteProductCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CopyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Forbidden");


    const gateway = createLovableAiGatewayProvider(requireApiKey());
    const { text } = await generateText({
      model: gateway(CHAT_MODEL),
      system:
        "You are a senior copywriter for a luxury quartz watch house (Timera watches are all quartz movement, never Swiss-made). Write elegant, concrete, non-cliché copy. " +
        'Reply with strict JSON only: {"name":"","description":"","features":["",""],"seo_title":"","seo_description":"","seo_keywords":""}. ' +
        "description: 60-120 words, no bullet points. features: 4-6 short phrases. seo_title under 60 characters and includes the product name. " +
        "seo_description under 155 characters. seo_keywords: 5-8 comma separated phrases. Never invent certifications or awards.",
      prompt: JSON.stringify(data),
    });

    const parsed = parseJson<Record<string, any>>(text, {});
    const clamp = (v: unknown, n: number) => String(v ?? "").slice(0, n);
    return {
      name: clamp(parsed.name, 200),
      description: clamp(parsed.description, 1500),
      features: (parsed.features ?? []).filter((s: unknown) => typeof s === "string").slice(0, 6) as string[],
      seo_title: clamp(parsed.seo_title, 60),
      seo_description: clamp(parsed.seo_description, 160),
      seo_keywords: clamp(parsed.seo_keywords, 300),
    };
  });

/* ------------------------------------------------------------------ */
/* AI product extractor — admins only (PDF / free-text imports)        */
/* ------------------------------------------------------------------ */
export const aiExtractProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ text: z.string().min(20).max(120_000), source: z.string().max(200).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Forbidden");

    const gateway = createLovableAiGatewayProvider(requireApiKey());
    const { text } = await generateText({
      model: gateway(CHAT_MODEL),
      system:
        "You extract a product catalogue from raw text (PDF exports, price lists, spreadsheets pasted as text). " +
        'Reply with strict JSON only: {"products":[{"name":"","price":0,"sale_price":null,"description":"","brand":"",' +
        '"collection":"","category":"","stock":null,"movement":"","case_material":"","strap":"","water_resistance":"",' +
        '"colors":[""],"sizes":[""],"features":[""],"image_url":""}]}. ' +
        "price is a plain number in PKR without symbols or commas. Use null when a value is genuinely absent — never invent prices. " +
        "Write a 25-45 word description when the source has none. Extract EVERY product you can find, in source order.",
      prompt: `Source: ${data.source ?? "upload"}\n\n${data.text}`.slice(0, 120_000),
    });

    const parsed = parseJson<{ products?: any[] }>(text, {});
    const rows = Array.isArray(parsed.products) ? parsed.products : [];
    const str = (v: unknown, n = 300) => (v == null ? "" : String(v).slice(0, n));
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 12) : []);
    const numOrNull = (v: unknown) => {
      const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    return {
      products: rows
        .map((r) => ({
          name: str(r.name, 200),
          price: numOrNull(r.price),
          sale_price: numOrNull(r.sale_price),
          description: str(r.description, 1500),
          brand: str(r.brand, 120),
          collection: str(r.collection, 120),
          category: str(r.category, 120),
          stock: numOrNull(r.stock),
          movement: str(r.movement, 120),
          case_material: str(r.case_material, 120),
          strap: str(r.strap, 120),
          water_resistance: str(r.water_resistance, 120),
          colors: arr(r.colors),
          sizes: arr(r.sizes),
          features: arr(r.features),
          image_url: str(r.image_url, 1000),
        }))
        .filter((r) => r.name.length > 1)
        .slice(0, 300),
    };
  });
