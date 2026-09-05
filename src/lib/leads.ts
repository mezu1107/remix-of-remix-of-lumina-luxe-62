import { supabase } from "@/integrations/supabase/client";

/**
 * LEADS — captures every shopper who adds to cart or reaches checkout,
 * so the store can reach out to people who never completed the order.
 * One row per browser session, upserted as the shopper moves forward.
 */

export type LeadStage = "add_to_cart" | "checkout_started" | "checkout_details" | "purchased";

const STORAGE_KEY = "timera-lead-session";

export function leadSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

export type LeadItem = { name: string; slug?: string; quantity: number; price: number };

export type LeadInput = {
  stage: LeadStage;
  items?: LeadItem[];
  cartValue?: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  orderNumber?: string | null;
};

/** Stage ranking so a later stage never gets overwritten by an earlier one. */
const RANK: Record<LeadStage, number> = {
  add_to_cart: 1,
  checkout_started: 2,
  checkout_details: 3,
  purchased: 4,
};

let lastStage: LeadStage | null = null;

export async function captureLead(input: LeadInput) {
  if (typeof window === "undefined") return;
  const session_id = leadSessionId();
  if (!session_id) return;

  const stage = lastStage && RANK[lastStage] > RANK[input.stage] ? lastStage : input.stage;
  lastStage = stage;

  const items = input.items ?? [];
  const row: Record<string, unknown> = {
    session_id,
    stage,
    items,
    item_count: items.reduce((a, i) => a + (i.quantity || 0), 0),
    cart_value: Math.round((input.cartValue ?? items.reduce((a, i) => a + i.price * i.quantity, 0)) * 100) / 100,
    currency: "PKR",
    page_path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  };
  if (input.name) row.name = input.name;
  if (input.email) row.email = input.email;
  if (input.phone) row.phone = input.phone;
  if (input.address) row.address = input.address;
  if (input.city) row.city = input.city;
  if (input.orderNumber) row.order_number = input.orderNumber;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user?.id) row.user_id = sessionData.session.user.id;
  } catch {
    /* guest checkout */
  }

  const { error } = await (supabase.from("cart_leads" as any) as any).upsert(row, { onConflict: "session_id" });
  if (error) console.warn("Lead was not captured", error.message);
}
