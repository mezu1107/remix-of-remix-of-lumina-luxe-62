import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { popupsQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

const seenKey = (id: string) => `timera_popup_${id}`;

/** Pages where a marketing overlay would block the task the visitor came to do. */
const MUTED_PATHS = ["/auth", "/admin", "/checkout", "/account"];

export function PromoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const muted = MUTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const { data: popups = [] } = useQuery(popupsQuery);
  const popup = muted ? undefined : popups[0];
  const [open, setOpen] = useState(false);


  useEffect(() => {
    if (!popup || typeof window === "undefined") return;
    const key = seenKey(popup.id);
    if (popup.frequency === "once" && localStorage.getItem(key)) return;
    if (popup.frequency === "session" && sessionStorage.getItem(key)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setOpen(true);
      if (popup.frequency === "once") localStorage.setItem(key, "1");
      if (popup.frequency === "session") sessionStorage.setItem(key, "1");
      cleanup();
    };
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };

    if (popup.triggerType === "delay" || popup.triggerType === "both") {
      timer = setTimeout(show, Math.max(0, popup.delaySeconds) * 1000);
    }
    if (popup.triggerType === "exit" || popup.triggerType === "both") {
      document.addEventListener("mouseout", onLeave);
      // Mobile has no exit intent — fall back to a delay so the offer is still seen.
      if (popup.triggerType === "exit") timer = setTimeout(show, 15000);
    }
    return cleanup;
  }, [popup]);

  if (!popup || !open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-luxe sm:max-w-lg">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close offer"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        {popup.image && (
          <img src={popup.image} alt="" className="h-40 w-full object-cover sm:h-52" />
        )}
        <div className="p-6 sm:p-8">
          {popup.badge && (
            <span className="inline-block rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-primary">
              {popup.badge}
            </span>
          )}
          <h2 className="mt-4 font-serif text-2xl leading-tight sm:text-3xl">{popup.title}</h2>
          {popup.message && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{popup.message}</p>}
          {popup.couponCode && (
            <p className="mt-5 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-center text-sm">
              Use code <span className="font-semibold tracking-[0.2em] text-primary">{popup.couponCode}</span>
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="h-11 flex-1 text-xs uppercase tracking-[0.22em]" onClick={() => setOpen(false)}>
              <Link to={(popup.ctaHref as any) || "/shop"}>{popup.ctaLabel || "Shop now"}</Link>
            </Button>
            <Button variant="outline" className="h-11" onClick={() => setOpen(false)}>
              No thanks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
