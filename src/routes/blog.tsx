import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { blogPostsQuery } from "@/lib/catalog";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Watch Journal — Guides & Stories | Timera" },
      { name: "description", content: "Timera's watch journal: buying guides, movement explainers, styling notes and stories from our Timera atelier." },
      { name: "keywords", content: "watch journal, watch buying guide, automatic movement guide, luxury watch blog, Timera" },
      { property: "og:title", content: "Watch Journal — Timera" },
      { property: "og:description", content: "Buying guides, movement explainers and stories from the Timera atelier." },
      { property: "og:url", content: "https://timera.store/blog" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { data: posts = [], isLoading } = useQuery(blogPostsQuery);
  const [featured, ...rest] = posts;

  return (
    <div className="container-luxe py-12">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">The Journal</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">Notes from the <span className="italic gold-text">atelier</span></h1>

      {isLoading && <p className="mt-12 text-muted-foreground">Loading stories…</p>}

      {featured && (
        <Link to="/blog" className="group grid gap-8 lg:grid-cols-2 mt-16 mb-16">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-card">
            {featured.image && (
              <img src={featured.image} alt={featured.title} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest text-primary">{featured.category} · {featured.date}</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl group-hover:text-primary transition">{featured.title}</h2>
            <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
            <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">By {featured.author}</p>
          </div>
        </Link>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {rest.map((post) => (
          <Link key={post.id} to="/blog" className="group">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-card">
              {post.image && (
                <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              )}
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-primary">{post.category} · {post.date}</p>
            <h3 className="mt-2 font-serif text-xl group-hover:text-primary transition">{post.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
