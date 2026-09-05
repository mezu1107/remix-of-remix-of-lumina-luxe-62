import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Countdown timer.
 *
 * Rules:
 *  - ONLY renders when a real, explicit `endsAt` prop is provided
 *  - NEVER generates a fake rolling daily deadline as a fallback
 *  - If `endsAt` is null/undefined or already in the past, renders nothing
 *
 * Usage: only pass `endsAt` when there is a genuine limited-time offer
 * stored in the database (e.g. from the deals or coupons table).
 */
export function Countdown({
  endsAt,
  label = "Offer ends in",
  className = "",
}: {
  endsAt?: string | Date | null;
  label?: string;
  className?: string;
}) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    // No real end date → never show. This is the critical change:
    // the old code generated a fake "today at 23:59" fallback.
    if (!endsAt) return;

    const target = new Date(endsAt).getTime();
    if (isNaN(target)) return;

    const tick = () => {
      const remaining = target - Date.now();
      setLeft(remaining > 0 ? remaining : 0);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  // Don't render if no real deadline, or if expired
  if (left === null || left <= 0) return null;

  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs backdrop-blur-xl ${className}`}
      role="timer"
      aria-label={`${label}: ${pad(h)} hours ${pad(m)} minutes ${pad(s)} seconds remaining`}
    >
      <Timer className="h-3.5 w-3.5 text-primary" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}
