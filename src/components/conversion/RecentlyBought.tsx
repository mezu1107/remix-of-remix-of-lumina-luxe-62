/**
 * RecentlyBought — intentionally a no-op.
 *
 * The previous implementation displayed seeded-random "34 sold in the last
 * 7 days / Last shipped to Lahore" numbers that were NOT based on real order
 * data. That constitutes fake social proof and erodes customer trust once
 * discovered. The component is kept as a named export so existing imports
 * don't break, but it renders nothing until real order analytics are wired in.
 *
 * To re-enable: query the `orders` table for actual per-product sales counts
 * and render only when the count is meaningful (e.g. >= 5 verified orders).
 */
export function RecentlyBought({ slug: _slug, className: _className }: { slug: string; className?: string }) {
  return null;
}
