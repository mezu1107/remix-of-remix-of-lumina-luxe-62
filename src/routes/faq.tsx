import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { faqsQuery } from "@/lib/catalog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Shipping, Warranty & Payment | Timera" },
      { name: "description", content: "Answers about Timera delivery across Pakistan, cash on delivery, warranty, returns and watch care." },
      { property: "og:title", content: "Timera FAQ" },
      { property: "og:description", content: "Shipping, payment, warranty and returns answered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { data: faqs = [], isLoading } = useQuery(faqsQuery);

  const groups = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const key = f.category?.trim() || "General";
    (acc[key] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="container-luxe max-w-3xl py-16">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Help Centre</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">Frequently asked</h1>

      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            }),
          }}
        />
      )}

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Loading…</p>
      ) : faqs.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No questions published yet.</p>
      ) : (
        Object.entries(groups).map(([category, list]) => (
          <section key={category} className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{category}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {list.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left font-serif text-lg">{f.question}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground whitespace-pre-line">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))
      )}
    </div>
  );
}
