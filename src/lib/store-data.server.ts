import { createClient } from "@supabase/supabase-js";

/** Server-side publishable Supabase client (RLS applies as anon). */
export function publicSupabase() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init?: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type CatalogueRow = {
  slug: string;
  name: string;
  brand: string;
  collection: string;
  category: string | null;
  price: number;
  sale_price: number | null;
  movement: string;
  case_material: string;
  strap: string;
  water_resistance: string;
  stock: number;
  rating: number;
  badge: string | null;
  description: string;
};

/** Compact, public catalogue snapshot used as grounding context for AI features. */
export async function loadCatalogue(limit = 60): Promise<CatalogueRow[]> {
  const { data, error } = await publicSupabase()
    .from("products")
    .select(
      "slug, name, brand, collection, category, price, sale_price, movement, case_material, strap, water_resistance, stock, rating, badge, description",
    )
    .eq("active", true)
    .order("sort_order")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CatalogueRow[];
}

export function catalogueToText(rows: CatalogueRow[]) {
  return rows
    .map(
      (p) =>
        `- ${p.name} (slug: ${p.slug}) | brand ${p.brand} | collection ${p.collection} | category ${p.category ?? "—"} | price Rs ${
          p.sale_price ?? p.price
        }${p.sale_price ? ` (was Rs ${p.price})` : ""} | ${p.movement} | ${p.case_material} case | ${p.strap} strap | ${p.water_resistance} | rating ${p.rating} | ${
          p.stock > 0 ? "in stock" : "out of stock"
        } | ${(p.description ?? "").slice(0, 220)}`,
    )
    .join("\n");
}
