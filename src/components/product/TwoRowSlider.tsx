import { useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

/**
 * TwoRowProductSlider
 *
 * Displays products in 2 horizontal rows that the customer can swipe/drag
 * left-to-right on mobile and desktop.
 *
 * Layout:
 *   [col 0]  [col 1]  [col 2]  [col 3] …
 *   row 0:   p0       p2       p4       p6
 *   row 1:   p1       p3       p5       p7
 *
 * Each "column" is a flex child inside Embla's container, so a single swipe
 * moves both rows together — they scroll as one unit.
 *
 * Responsive card widths:
 *   mobile   → 2 cards visible  (44vw each)
 *   tablet   → 3 cards visible  (~30vw each)
 *   desktop  → 4 cards visible  (~23vw each)
 */
export function TwoRowSlider({
  products,
  priority = false,
  className,
}: {
  products: Product[];
  priority?: boolean;
  className?: string;
}) {
  // Split products into column pairs: col i = [products[i*2], products[i*2+1]]
  const columns: [Product, Product | undefined][] = [];
  for (let i = 0; i < products.length; i += 2) {
    columns.push([products[i], products[i + 1]]);
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    // Gap between columns handled by CSS gap, so no slidesToScroll needed
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Track which columns are partially/fully visible for the fade mask
  const containerRef = useRef<HTMLDivElement>(null);

  // Dots state
  const canScrollPrev = useRef(false);
  const canScrollNext = useRef(true);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      canScrollPrev.current = emblaApi.canScrollPrev();
      canScrollNext.current = emblaApi.canScrollNext();
    };
    emblaApi.on("select", update);
    update();
    return () => { emblaApi.off("select", update); };
  }, [emblaApi]);

  if (products.length === 0) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Left fade mask — hides overflow on left */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent sm:w-12" />
      {/* Right fade mask */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent sm:w-12" />

      {/* Embla viewport */}
      <div
        ref={emblaRef}
        className="overflow-hidden"
        aria-label="Product slider — swipe to see more"
      >
        <div className="flex gap-3 sm:gap-4">
          {columns.map(([top, bottom], colIdx) => (
            <div
              key={top.id}
              className="flex shrink-0 flex-col gap-3 sm:gap-4"
              style={{
                // Responsive column widths:
                // mobile: 2 visible → ~46% each, tablet: 3 → ~31%, desktop: 4 → ~23.5%
                width: "clamp(44vw, calc((100vw - 2 * 1.25rem - 3 * 0.75rem) / 2), 340px)",
              }}
            >
              {/* Top row card */}
              <ProductCard product={top} index={colIdx * 2} priority={priority && colIdx < 2} />

              {/* Bottom row card — only rendered when it exists */}
              {bottom && (
                <ProductCard product={bottom} index={colIdx * 2 + 1} priority={false} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop prev/next controls — hidden on touch devices, shown on hover */}
      <button
        onClick={scrollPrev}
        aria-label="Scroll left"
        className="absolute -left-4 top-1/2 z-20 hidden -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition hover:border-primary hover:text-primary md:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={scrollNext}
        aria-label="Scroll right"
        className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition hover:border-primary hover:text-primary md:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
