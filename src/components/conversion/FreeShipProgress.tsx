import { useQuery } from "@tanstack/react-query";
import { Truck, PartyPopper } from "lucide-react";
import { paymentSettingsQuery } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

/**
 * FREE-SHIPPING PROGRESS — the single strongest AOV lever.
 * Threshold always comes from admin payment settings, never hardcoded.
 */
export function FreeShipProgress({ subtotal, className = "" }: { subtotal: number; className?: string }) {
  const { data: settings } = useQuery(paymentSettingsQuery);
  const threshold = Number(settings?.freeDeliveryAbove ?? 5000);
  if (!threshold || subtotal <= 0) return null;

  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className={`rounded-xl border border-border/60 bg-background/60 p-3 backdrop-blur-xl ${className}`}>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {remaining > 0 ? (
          <>
            <Truck className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Add <strong className="font-medium text-primary">{formatPrice(remaining)}</strong> more for free delivery
            </span>
          </>
        ) : (
          <>
            <PartyPopper className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-foreground">You&apos;ve unlocked free delivery.</span>
          </>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--grad-gold)" }} />
      </div>
    </div>
  );
}
