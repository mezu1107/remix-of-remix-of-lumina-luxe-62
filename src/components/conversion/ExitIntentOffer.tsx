import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { X, Gift, Copy, Check } from "lucide-react";
import { couponsQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";

const KEY = "timera.exit-offer";
const MUTED = ["/auth", "/admin", "/checkout", "/account"];

/**
 * EXIT-INTENT OFFER — last-chance discount when the visitor is about to leave.
 * Uses a real active coupon from the database; silent when none exists.
 */
export function ExitIntentOffer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const muted = MUTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const { data: coupons = [] } = useQuery(couponsQuery);
  const coupon = coupons[0];
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (muted || !coupon || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setOpen(true);
      try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ }
      void trackEvent("exit_intent_offer", { metadata: { code: coupon.code } });
      cleanup();
    };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };

    document.addEventListener("mouseout", onLeave);
    // Touch devices have no exit intent — use a long dwell instead.
    if (window.matchMedia("(max-width: 768px)").matches) timer = setTimeout(show, 45000);
    return cleanup;
  }, [coupon, muted]);

  if (!open || !coupon) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const value = coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `Rs ${coupon.discountValue} off`;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-7 shadow-luxe backdrop-blur-2xl">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close offer"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur transition hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Gift className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-serif text-2xl leading-tight">Wait — take {value} with you</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {coupon.description || "Use this code at checkout before you go. Cash on Delivery available across Pakistan."}
        </p>
        <button
          onClick={copy}
          className="mt-5 flex w-full items-center justify-between rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm transition hover:bg-primary/10"
        >
          <span className="font-semibold tracking-[0.2em] text-primary">{coupon.code}</span>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
        <Button asChild className="mt-4 h-11 w-full text-xs uppercase tracking-[0.22em]" onClick={() => setOpen(false)}>
          <Link to="/shop">Claim &amp; shop now</Link>
        </Button>
        <button onClick={() => setOpen(false)} className="mt-3 w-full text-xs text-muted-foreground underline-offset-4 hover:underline">
          No thanks, I&apos;ll pay full price
        </button>
      </div>
    </div>
  );
}
