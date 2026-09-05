import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageView, trackScrollDepth, trackTimeOnPage, trackOutboundClick } from "@/lib/tracking/events";

/**
 * Mounts once at the root. Auto-fires:
 *  - page_view on every route change
 *  - scroll_depth at 25/50/75/100%
 *  - time_on_page at 15s, 30s, 60s, 120s
 *  - outbound_click on external link clicks
 */
export function AutoTracker() {
  const location = useRouterState({ select: (s) => s.location });
  const firedDepths = useRef<Set<number>>(new Set());
  const firedTimes = useRef<Set<number>>(new Set());

  // Page view on route change
  useEffect(() => {
    firedDepths.current = new Set();
    firedTimes.current = new Set();
    void trackPageView(location.pathname + (location.searchStr ?? ""));
  }, [location.pathname, location.searchStr]);

  // Scroll depth
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      if (total <= 0) return;
      const pct = Math.round((window.scrollY / total) * 100);
      for (const bucket of [25, 50, 75, 100]) {
        if (pct >= bucket && !firedDepths.current.has(bucket)) {
          firedDepths.current.add(bucket);
          void trackScrollDepth(bucket);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Time on page
  useEffect(() => {
    const timers = [15, 30, 60, 120].map((s) =>
      window.setTimeout(() => {
        if (!firedTimes.current.has(s)) {
          firedTimes.current.add(s);
          void trackTimeOnPage(s);
        }
      }, s * 1000),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [location.pathname]);

  // Outbound clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(href)) return;
      try {
        const url = new URL(href);
        if (url.host !== window.location.host) void trackOutboundClick(href);
      } catch { /* noop */ }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
