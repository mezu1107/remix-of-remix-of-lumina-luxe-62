/**
 * LiveSalesToast — DISABLED.
 *
 * The previous implementation displayed fabricated "Ali from Lahore just
 * ordered…" toasts with randomly-seeded buyer names, cities and timestamps.
 * None of that data came from real orders. It is a dark pattern that:
 *
 *   1. Manufactures social proof that does not exist
 *   2. Erodes customer trust when noticed
 *   3. Violates the project rule: "DO NOT USE FAKE SOCIAL PROOF"
 *
 * The component is kept as a named export so existing imports compile.
 *
 * TO RE-ENABLE CORRECTLY:
 *   - Query the `orders` table for real recent orders (last 48 h)
 *   - Show only city and product name (never fabricate buyer names)
 *   - Only display when ≥ 3 real orders exist for that product
 *   - Add an admin toggle in site_settings: show_sales_toast: boolean
 */
export function LiveSalesToast() {
  return null;
}
