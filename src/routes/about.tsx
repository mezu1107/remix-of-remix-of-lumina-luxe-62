import { createFileRoute } from "@tanstack/react-router";
import atelierImg from "@/assets/atelier.jpg";
import heroImg from "@/assets/hero-1.jpg";

import { Award, Gem, Globe2, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Timera — Precision Quartz Watches in Pakistan" },
      {
        name: "description",
        content:
          "Timera builds precision quartz timepieces for everyday luxury — accurate, durable and honestly priced, with warranty and nationwide delivery in Pakistan.",
      },
      { property: "og:title", content: "About Timera — Precision Quartz Watches" },
      { property: "og:description", content: "Everyday luxury, powered by precision quartz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img src={atelierImg} alt="Timera watch atelier" className="h-full w-full object-cover animate-[fade-in_1s_ease-out]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-onyx/40 to-transparent" />
        <div className="container-luxe absolute inset-x-0 bottom-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Our Story</p>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
            Precision you can wear <span className="italic gold-text">every single day</span>.
          </h1>
        </div>
      </section>

      <section className="container-luxe max-w-3xl py-24">
        <p className="font-serif text-2xl leading-relaxed text-muted-foreground">
          Timera exists for one reason: a beautiful watch should keep perfect time, survive real life,
          and still feel like a luxury object on your wrist — without a luxury price tag.
        </p>
        <p className="mt-8 leading-relaxed text-muted-foreground">
          Every Timera runs on a precision <strong className="text-foreground">quartz movement</strong>.
          We are not a Swiss house and we never claim to be. Quartz is a deliberate choice: it is more
          accurate than a mechanical calibre, needs almost no servicing, handles heat and travel, and
          keeps our prices honest. What we do obsess over is the part you actually touch — case finishing,
          dial printing, strap quality, crystal clarity and the weight in your hand.
        </p>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Each piece is inspected by hand before it is boxed, ships with a warranty card, and is backed by
          a team you can reach on WhatsApp the same day.
        </p>
      </section>

      <section className="container-luxe grid gap-4 py-12 md:grid-cols-4">
        {[
          { icon: Award, n: "100%", l: "Hand-checked" },
        { icon: Users, n: "⭐ 4.8", l: "Customer rating" },
        { icon: Globe2, n: "All PK", l: "Cash on delivery" },
        { icon: Gem, n: "1 yr", l: "Warranty included" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-xl p-6 text-center transition duration-500 hover:-translate-y-1">
            <s.icon className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-4 font-serif text-4xl gold-text">{s.n}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="container-luxe grid gap-12 py-24 lg:grid-cols-2 lg:items-center">
        <img src={heroImg} alt="Timera signature timepiece" className="aspect-square rounded-2xl object-cover" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Our Craft</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">
            Built around <span className="italic gold-text">quartz accuracy</span>
          </h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            A quartz calibre drifts by seconds a month, not minutes a week. That means your Timera is right
            when you glance at it in a meeting, at a wedding, or at the airport — no winding, no setting, no
            expensive service every few years. We pair that movement with stainless steel cases, hardened
            crystal and straps chosen to age well, then check every unit before it leaves us.
          </p>
        </div>
      </section>
    </div>
  );
}
