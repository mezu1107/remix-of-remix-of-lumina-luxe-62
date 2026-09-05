import { CalendarClock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { paymentSettingsQuery } from "@/lib/catalog";

/**
 * Delivery estimate strip — Pakistan-specific.
 *
 * Shows "Estimated delivery Mon, 8 Sep – Wed, 10 Sep" based on today's date
 * in Pakistan Standard Time (UTC+5). The 2–4 business-day window matches what
 * we tell customers on the checkout page and in policies.
 *
 * No "order within X hours" claim — we don't know the actual dispatch cut-off
 * from here, and a wrong cut-off time destroys trust.
 */
export function DeliveryEstimate({ className = "" }: { className?: string }) {
  const { data: settings } = useQuery(paymentSettingsQuery);

  // Pakistan Standard Time offset in ms
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

  // Current date in PKT
  const nowUTC = Date.now();
  const nowPKT = new Date(nowUTC + PKT_OFFSET_MS);

  // Helper: advance by n calendar days (PKT)
  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  // Helper: skip to next weekday if on weekend (Friday = 5 is a working day in PK)
  function nextWorkday(date: Date): Date {
    const d = new Date(date);
    // Sunday = 0 in JS UTC
    while (d.getUTCDay() === 0) {
      // skip Sunday only; Friday & Saturday are typically working days in PK
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return d;
  }

  const from = nextWorkday(addDays(nowPKT, 2));
  const to = nextWorkday(addDays(nowPKT, 4));

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-PK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Karachi",
    });

  // Delivery charge text for context
  const freeAbove = settings?.freeDeliveryAbove;
  const deliveryCharge = settings?.deliveryCharge;
  const shippingNote =
    freeAbove && deliveryCharge
      ? `Free delivery above Rs ${freeAbove.toLocaleString("en-PK")} · Rs ${deliveryCharge} otherwise`
      : null;

  return (
    <div className={`rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 backdrop-blur ${className}`}>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          Estimated delivery:{" "}
          <strong className="font-medium text-foreground">
            {fmt(from)} – {fmt(to)}
          </strong>
        </span>
      </p>
      {shippingNote && (
        <p className="mt-1 pl-[1.375rem] text-[10px] text-muted-foreground">
          {shippingNote}
        </p>
      )}
    </div>
  );
}
