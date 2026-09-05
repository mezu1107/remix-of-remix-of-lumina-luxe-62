import { useEffect, useState } from "react";

/** Slim gold reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setPct(max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" aria-hidden>
      <div
        className="h-full origin-left transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%`, background: "var(--grad-gold)" }}
      />
    </div>
  );
}
