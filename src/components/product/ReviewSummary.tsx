import { useQuery } from "@tanstack/react-query";
import { aiReviewSummary } from "@/lib/ai.functions";
import { Sparkles, ThumbsUp, AlertCircle, Loader2 } from "lucide-react";

export function ReviewSummary({ productId }: { productId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ai-review-summary", productId],
    queryFn: () => aiReviewSummary({ data: { productId } }),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  if (isError) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Summarising customer reviews…
      </div>
    );
  }

  if (!data?.available) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary">AI summary of {data.count} reviews</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {data.pros.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" /> Praised for
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {data.pros.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
          </div>
        )}
        {data.cons.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-primary" /> Worth knowing
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {data.cons.map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">Generated from approved customer reviews on this page.</p>
    </div>
  );
}
