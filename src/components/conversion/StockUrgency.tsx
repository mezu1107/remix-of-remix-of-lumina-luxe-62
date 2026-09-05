import { AlertCircle } from "lucide-react";

/**
 * StockUrgency — shows a genuine low-stock warning.
 *
 * Rules:
 *  - Only renders when real DB stock is > 0 and <= 12
 *  - States the exact stock count (real data)
 *  - Does NOT say "selling fast" — that claim would be fabricated
 *  - Does NOT use countdown timers or false scarcity
 *  - The progress bar is proportional to actual stock remaining
 */
export function StockUrgency({ stock, className = "" }: { stock: number; className?: string }) {
  if (!Number.isFinite(stock) || stock <= 0 || stock > 12) return null;

  const pct = Math.max(8, Math.min(100, (stock / 12) * 100));

  const label =
    stock === 1
      ? "Only 1 left in stock"
      : stock <= 3
      ? `Only ${stock} left in stock`
      : `${stock} remaining in stock`;

  return (
    <div
      className={`rounded-xl border border-amber-200/60 bg-amber-50/60 px-3 py-2.5 backdrop-blur ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-xs">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span className="text-amber-800">{label}</span>
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={12}
        aria-valuenow={stock}
      >
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
