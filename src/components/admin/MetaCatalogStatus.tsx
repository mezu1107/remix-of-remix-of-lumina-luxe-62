import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

/**
 * MetaCatalogStatus — shows the catalog feed URL and a quick health check.
 * Displayed at the top of the admin products page so the admin can easily
 * copy the feed URL into Meta Commerce Manager.
 *
 * The feed endpoint is /api/public/v1/meta/catalog
 */
export function MetaCatalogStatus() {
  const [copied, setCopied] = useState(false);
  const feedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/public/v1/meta/catalog`
    : "https://timera.store/api/public/v1/meta/catalog";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["meta-catalog-health"],
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      const res = await fetch("/api/public/v1/meta/catalog");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { count: Array.isArray(json.data) ? json.data.length : 0 };
    },
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meta Product Catalog</p>
          <p className="mt-1 font-semibold text-sm flex items-center gap-2">
            {isLoading && <span className="text-muted-foreground">Checking feed…</span>}
            {isError && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Feed unavailable — check logs</span>
              </>
            )}
            {data && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-700">{data.count} products ready to sync</span>
              </>
            )}
          </p>
        </div>

        <a
          href="https://business.facebook.com/commerce/catalogs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-primary transition"
        >
          Open Meta Commerce Manager
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Feed URL */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
        <code className="flex-1 truncate text-xs text-muted-foreground font-mono">{feedUrl}</code>
        <button
          onClick={copy}
          className="shrink-0 text-muted-foreground hover:text-primary transition"
          aria-label="Copy feed URL"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        In Meta Commerce Manager → Catalog → Data sources → Add → Scheduled feed → paste the URL above.
        Meta will crawl it automatically. Product IDs match the pixel events exactly.
      </p>
    </div>
  );
}
