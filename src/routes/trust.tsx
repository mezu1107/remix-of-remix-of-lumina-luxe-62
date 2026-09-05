import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  Lock,
  Key,
  CreditCard,
  Database,
  Workflow,
  Timer,
  Network,
  Sparkles,
  Bug,
  FileCheck,
} from "lucide-react";

export type TrustSection = {
  id: string;
  group_name: string;
  heading: string;
  body: string | null;
  bullets: string[];
  icon: string | null;
  sort_order: number;
};

export const trustSectionsQuery = queryOptions({
  queryKey: ["trust_sections"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("trust_sections")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      ...r,
      bullets: Array.isArray(r.bullets) ? (r.bullets as string[]) : [],
    })) as TrustSection[];
  },
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  lock: Lock,
  key: Key,
  "credit-card": CreditCard,
  database: Database,
  workflow: Workflow,
  timer: Timer,
  network: Network,
  sparkles: Sparkles,
  bug: Bug,
};

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Security — How Timera Protects You" },
      {
        name: "description",
        content:
          "How Timera handles your data, secures the store, uses AI responsibly, and how to report a security issue. Maintained by the Timera team.",
      },
      { property: "og:title", content: "Trust & Security — Timera" },
      { property: "og:description", content: "Our data handling, security practices and responsible AI use, in plain English." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/trust" }],
  }),
  component: TrustPage,
});

function TrustPage() {
  const { data: sections = [], isLoading } = useQuery(trustSectionsQuery);
  const hero = sections.find((s) => s.group_name === "hero");
  const commitments = sections.filter((s) => s.group_name === "commitment");
  const blocks = sections.filter((s) => s.group_name === "section");
  const faqs = sections.filter((s) => s.group_name === "faq");

  return (
    <div className="container-luxe py-12 lg:py-20">
      <header className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Trust Centre</p>
        <h1 className="mt-3 font-serif text-4xl md:text-6xl">{hero?.heading ?? "Trust & Security"}</h1>
        {hero?.body && <p className="mt-5 text-muted-foreground leading-relaxed">{hero.body}</p>}
        <div className="mt-6 inline-flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            This page is app-owner maintained content describing our own practices. It is not an independent audit,
            certification, or a guarantee against every possible risk.
          </p>
        </div>
      </header>

      {isLoading && <p className="mt-16 text-muted-foreground">Loading…</p>}

      {commitments.length > 0 && (
        <section className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {commitments.map((c) => {
            const Icon = ICONS[c.icon ?? ""] ?? Shield;
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 font-serif text-xl">{c.heading}</h2>
                {c.body && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>}
              </div>
            );
          })}
        </section>
      )}

      {blocks.length > 0 && (
        <section className="mt-16 grid gap-10 md:grid-cols-2">
          {blocks.map((b) => {
            const Icon = ICONS[b.icon ?? ""] ?? Shield;
            return (
              <article key={b.id} className="border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <h2 className="font-serif text-2xl">{b.heading}</h2>
                </div>
                {b.body && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.body}</p>}
                {b.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {b.bullets.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mt-20 max-w-3xl">
          <h2 className="font-serif text-3xl">Common questions</h2>
          <dl className="mt-8 space-y-8">
            {faqs.map((f) => (
              <div key={f.id}>
                <dt className="font-medium">{f.heading}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
