import { ShieldCheck, Truck, CreditCard, Package, HeadphonesIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { paymentSettingsQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Pakistan-specific trust strip.
 * Warranty label is read from payment_settings so it always matches
 * whatever the admin has configured — never hard-coded.
 */
export function TrustBadges({ className }: { className?: string }) {
  const { data: settings } = useQuery(paymentSettingsQuery);
  const months = settings?.warrantyMonths ?? 12;
  const warrantyLabel =
    months >= 12 ? `${Math.round(months / 12)}-Year Warranty` : `${months}-Month Warranty`;

  const items = [
    { icon: CreditCard, label: "Cash on Delivery" },
    { icon: ShieldCheck, label: warrantyLabel },
    { icon: Truck, label: "All Pakistan Delivery" },
    { icon: Package, label: "Premium Packaging" },
    { icon: HeadphonesIcon, label: "Same-Day Support" },
  ];

  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-5", className)}>
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-[11px] leading-tight text-muted-foreground backdrop-blur transition hover:border-primary/30 hover:text-foreground"
        >
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">{label}</span>
        </li>
      ))}
    </ul>
  );
}
