import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery, isPerfume, isWatch } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { aiSearchProducts } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Luxury Watches & Perfumes Online | Timera" },
      { name: "description", content: "Browse every Timera watch and fragrance: precision quartz timepieces plus long-lasting perfumes, attars and gift sets. Filter by type, family, gender and price." },
      { name: "keywords", content: "buy luxury watches online, precision quartz watch, perfume for men, perfume for women, attar, oud, gift set, Timera shop" },
      { property: "og:title", content: "Shop Luxury Watches & Perfumes — Timera" },
      { property: "og:description", content: "Every Timera timepiece and fragrance — watches, perfumes, attars and gift sets." },
      { property: "og:url", content: "https://timera.store/shop" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { data: allProducts = [], isLoading } = useQuery(productsQuery);
  const [tab, setTab] = useState<"all" | "watch" | "perfume">("all");
  const products = useMemo(
    () => (tab === "all" ? allProducts : allProducts.filter((p) => (tab === "perfume" ? isPerfume(p) : isWatch(p)))),
    [allProducts, tab],
  );
  const showPerfumeFilters = tab !== "watch" && allProducts.some(isPerfume);
  const showWatchFilters = tab !== "perfume";
  const collections = useMemo(() => [...new Set(products.map((p) => p.collection))], [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);
  const movements = useMemo(() => [...new Set(products.map((p) => p.movement).filter(Boolean))], [products]);
  const cases = useMemo(() => [...new Set(products.map((p) => p.case).filter(Boolean))], [products]);
  const families = useMemo(
    () => [...new Set(products.map((p) => p.fragranceFamily).filter(Boolean) as string[])],
    [products],
  );
  const genders = useMemo(
    () => [...new Set(products.map((p) => p.gender).filter(Boolean) as string[])],
    [products],
  );
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<{ summary: string; slugs: string[] } | null>(null);

  const aiSearch = useMutation({
    mutationFn: (query: string) => aiSearchProducts({ data: { query } }),
    onSuccess: (r) => setAiResult(r),
    onError: () => toast.error("AI search is unavailable right now — please use the filters."),
  });

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.price >= priceRange[0] &&
        p.price <= priceRange[1] &&
        (selectedCollections.length === 0 || selectedCollections.includes(p.collection)) &&
        (selectedBrands.length === 0 || selectedBrands.includes(p.brand)) &&
        (selectedMovements.length === 0 || selectedMovements.includes(p.movement)) &&
        (selectedCases.length === 0 || selectedCases.includes(p.case)) &&
        (selectedFamilies.length === 0 || (p.fragranceFamily != null && selectedFamilies.includes(p.fragranceFamily))) &&
        (selectedGenders.length === 0 || (p.gender != null && selectedGenders.includes(p.gender))),
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (aiResult) {
      const order = new Map(aiResult.slugs.map((s, i) => [s, i]));
      list = list.filter((p) => order.has(p.slug)).sort((a, b) => order.get(a.slug)! - order.get(b.slug)!);
    }
    return list;
  }, [products, priceRange, selectedCollections, selectedBrands, selectedMovements, selectedCases, selectedFamilies, selectedGenders, sort, aiResult]);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) =>
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const clearAll = () => {
    setPriceRange([0, 25000]);
    setSelectedCollections([]);
    setSelectedBrands([]);
    setSelectedMovements([]);
    setSelectedCases([]);
    setSelectedFamilies([]);
    setSelectedGenders([]);
    setAiResult(null);
    setAiQuery("");
  };

  const Filters = (
    <div className="space-y-8">
      <h2 className="font-serif text-xl">Filter the collection</h2>
      <FilterGroup title="Price">
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            min={0}
            max={25000}
            step={500}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}+</span>
          </div>
        </div>
      </FilterGroup>
      <FilterGroup title="Collection">
        {collections.map((c) => (
          <FilterCheckbox key={c} label={c} checked={selectedCollections.includes(c)} onChange={() => toggle(selectedCollections, c, setSelectedCollections)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Brand">
        {brands.map((b) => (
          <FilterCheckbox key={b} label={b} checked={selectedBrands.includes(b)} onChange={() => toggle(selectedBrands, b, setSelectedBrands)} />
        ))}
      </FilterGroup>
      {showWatchFilters && (
        <>
          <FilterGroup title="Movement">
            {movements.map((m) => (
              <FilterCheckbox key={m} label={m} checked={selectedMovements.includes(m)} onChange={() => toggle(selectedMovements, m, setSelectedMovements)} />
            ))}
          </FilterGroup>
          <FilterGroup title="Case Material">
            {cases.map((c) => (
              <FilterCheckbox key={c} label={c} checked={selectedCases.includes(c)} onChange={() => toggle(selectedCases, c, setSelectedCases)} />
            ))}
          </FilterGroup>
        </>
      )}
      {showPerfumeFilters && families.length > 0 && (
        <FilterGroup title="Fragrance Family">
          {families.map((f) => (
            <FilterCheckbox key={f} label={f} checked={selectedFamilies.includes(f)} onChange={() => toggle(selectedFamilies, f, setSelectedFamilies)} />
          ))}
        </FilterGroup>
      )}
      {showPerfumeFilters && genders.length > 0 && (
        <FilterGroup title="For">
          {genders.map((g) => (
            <FilterCheckbox key={g} label={g} checked={selectedGenders.includes(g)} onChange={() => toggle(selectedGenders, g, setSelectedGenders)} />
          ))}
        </FilterGroup>
      )}
      <Button variant="outline" onClick={clearAll} className="w-full">
        <X className="h-4 w-4 mr-2" /> Clear all filters
      </Button>
    </div>
  );

  return (
    <div className="container-luxe py-12">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">The Collection</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">
          {tab === "perfume" ? "All Perfumes" : tab === "watch" ? "All Timepieces" : "Watches & Perfumes"}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          {tab === "perfume"
            ? "Concentrated eau de parfum and pure attars — 8 to 12 hours of wear, cash on delivery and insured shipping across Pakistan."
            : "Every Timera piece — quality-checked in-house, delivered with a signed authenticity card, warranty and insured delivery across Pakistan."}
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {([
          { key: "all", label: "All" },
          { key: "watch", label: "Watches" },
          { key: "perfume", label: "Perfumes" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "rounded-full border px-5 py-2 text-xs uppercase tracking-[0.2em] transition " +
              (tab === t.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-5">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI search
        </p>
        <form
          className="mt-3 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (aiQuery.trim().length > 1) aiSearch.mutate(aiQuery.trim());
          }}
        >
          <Input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Describe what you want — e.g. a gold dress watch under Rs 500,000 for evenings"
            className="h-11"
          />
          <Button type="submit" className="h-11 sm:w-40" disabled={aiSearch.isPending || aiQuery.trim().length < 2}>
            {aiSearch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find my watch"}
          </Button>
        </form>
        {aiResult && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <p className="text-muted-foreground">{aiResult.summary || "Here is what matches best."}</p>
            <Button variant="ghost" size="sm" onClick={() => { setAiResult(null); setAiQuery(""); }}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear AI results
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block sticky top-32 self-start max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
          {Filters}
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{filtered.length}</span> pieces
            </p>
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
                  <div className="mt-8">{Filters}</div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-x-6 gap-y-12 grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-2xl">No timepieces match your filters</p>
              <p className="mt-2 text-muted-foreground">Adjust or clear filters to see more.</p>
              <Button onClick={clearAll} className="mt-6">Clear filters</Button>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-12 grid-cols-2 md:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] uppercase tracking-[0.28em] text-primary">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition">{label}</span>
    </label>
  );
}
