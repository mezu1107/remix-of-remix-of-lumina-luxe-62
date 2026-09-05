/**
 * COUPON MODULE — one place where a code is checked.
 * Always asks the server (authoritative, respects usage limits + expiry) and
 * falls back to the public coupons list if the API is unreachable.
 */
import type { Coupon } from "@/lib/catalog";

export type CouponResult =
  | { valid: true; code: string; discount: number }
  | { valid: false; reason: string };

export async function validateCoupon(
  rawCode: string,
  subtotal: number,
  fallback: Coupon[] = [],
): Promise<CouponResult> {
  const code = rawCode.trim();
  if (!code) return { valid: false, reason: "Enter a code first." };

  try {
    const res = await fetch("/api/public/v1/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    const data = (await res.json()) as {
      valid?: boolean;
      reason?: string;
      code?: string;
      discount?: number;
    };
    if (data?.valid && data.code) {
      return { valid: true, code: data.code, discount: Number(data.discount ?? 0) };
    }
    if (data?.reason) return { valid: false, reason: data.reason };
  } catch {
    /* network hiccup — fall through to the local list */
  }

  const found = fallback.find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!found) return { valid: false, reason: `"${code.toUpperCase()}" is not an active code.` };
  if (subtotal < found.minOrder)
    return { valid: false, reason: `This code needs a minimum order of Rs ${found.minOrder.toLocaleString("en-PK")}.` };
  const discount =
    found.discountType === "percent"
      ? Math.round((subtotal * found.discountValue) / 100)
      : Math.min(found.discountValue, subtotal);
  return { valid: true, code: found.code, discount };
}
