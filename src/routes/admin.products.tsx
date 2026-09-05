import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CrudModule } from "@/components/admin/CrudModule";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import { aiWriteProductCopy } from "@/lib/ai.functions";
import { parseColorsText } from "@/components/admin/ColorsField";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { MetaCatalogStatus } from "@/components/admin/MetaCatalogStatus";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

function ProductsAdmin() {
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "category-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name").order("sort_order");
      if (error) throw error;
      return (data ?? []).map((c: any) => c.name as string);
    },
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["admin", "collection-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("name").order("sort_order");
      if (error) throw error;
      return (data ?? []).map((c: any) => c.name as string);
    },
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["admin", "deal-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("id, title").order("sort_order");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ label: d.title as string, value: d.id as string }));
    },
  });

  return (
    <div className="space-y-6">
      <MetaCatalogStatus />
      <ProductCsvImport />
      <CrudModule
      table="products"
      title="Products"
      description="Your catalogue. New and edited products appear in the shop instantly."
      orderBy={{ column: "sort_order" }}
      bulkFieldKeys={["deal_id", "badge", "category", "collection", "sale_price", "stock", "featured", "active"]}
      invalidate={["products", "categories", "deals"]}
      aiAssist={{
        label: "Write this product with AI",
        help: "Fill in the name (and any specs you know), then generate the description, features and SEO fields.",
        run: async (form) =>
          aiWriteProductCopy({
            data: {
              name: String(form.name ?? ""),
              brief: String(form.description ?? ""),
              brand: String(form.brand ?? ""),
              collection: String(form.collection ?? ""),
              category: String(form.category ?? ""),
              movement: String(form.movement ?? ""),
              case_material: String(form.case_material ?? ""),
              strap: String(form.strap ?? ""),
              water_resistance: String(form.water_resistance ?? ""),
              price: String(form.price ?? ""),
            },
          }),
      }}
      columns={[
        { key: "image_url", label: "Image", render: (r) => <img src={r.image_url} alt="" className="h-14 w-11 rounded object-cover" /> },
        { key: "name", label: "Name", primary: true },
        { key: "category", label: "Category" },
        {
          key: "price",
          label: "Price",
          render: (r) =>
            r.sale_price ? (
              <span className="whitespace-nowrap">
                {formatPrice(Number(r.sale_price))}{" "}
                <span className="text-muted-foreground line-through">{formatPrice(Number(r.price))}</span>
              </span>
            ) : (
              formatPrice(Number(r.price))
            ),
        },
        {
          key: "colors",
          label: "Colours",
          render: (r) => {
            const list = parseColorsText(Array.isArray(r.colors) ? r.colors.join("\n") : String(r.colors ?? ""));
            if (!list.length) return <span className="text-muted-foreground">—</span>;
            return (
              <span className="flex flex-wrap items-center gap-1.5">
                {list.slice(0, 6).map((c, i) => (
                  <span
                    key={i}
                    title={c.name}
                    className="h-5 w-5 overflow-hidden rounded-full ring-1 ring-border"
                    style={{ backgroundColor: c.hex }}
                  >
                    {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : null}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">{list.map((c) => c.name).join(", ")}</span>
              </span>
            );
          },
        },
        { key: "stock", label: "Stock" },
        { key: "active", label: "Live", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        {
          section: "Basics",
          key: "product_type",
          label: "Product type",
          type: "select",
          options: [
            { label: "Watch", value: "watch" },
            { label: "Perfume", value: "perfume" },
          ],
          default: "watch",
          help: "Perfume products show fragrance notes instead of watch specifications on the site.",
        },
        { section: "Basics", key: "name", label: "Name", type: "text", required: true },
        { section: "Basics", key: "slug", label: "Slug", type: "text", required: true, help: "Used in the product URL." },
        { section: "Basics", key: "brand", label: "Brand", type: "text", default: "Timera" },
        {
          section: "Basics",
          key: "collection",
          label: "Collection",
          type: collections.length ? "select" : "text",
          options: collections,
          required: true,
        },
        {
          section: "Basics",
          key: "category",
          label: "Category",
          type: categories.length ? "select" : "text",
          options: categories,
        },
        { section: "Basics", key: "description", label: "Description", type: "textarea", required: true },

        { section: "Pricing & deal", key: "price", label: "Regular price (PKR)", type: "number", required: true },
        { section: "Pricing & deal", key: "sale_price", label: "Sale price (PKR)", type: "number", help: "Leave empty for no sale. Shown instead of the regular price." },
        { section: "Pricing & deal", key: "compare_at", label: "Compare-at price (PKR)", type: "number" },
        { section: "Pricing & deal", key: "deal_id", label: "Part of deal", type: "select", options: deals },
        { section: "Pricing & deal", key: "badge", label: "Badge", type: "select", options: ["New", "Bestseller", "Limited", "Sale"] },
        { section: "Pricing & deal", key: "stock", label: "Stock", type: "number", default: 10 },

        { section: "Images", key: "image_url", label: "Main image", type: "image", required: true },
        { section: "Images", key: "gallery", label: "Gallery images", type: "images", help: "Upload from your device or paste URLs." },
        {
          section: "Images",
          key: "videos",
          label: "Product videos",
          type: "videos" as any,
          help: "Watch on wrist, dial close-up, movement, unboxing. Upload to Supabase Storage or Cloudinary first, then paste the URL. Max 1 video shows in the gallery initially — others shown in a tab.",
        },

        {
          section: "Variants",
          key: "colors",
          label: "Colours of this watch",
          type: "colors",
          help: "Add every colour you sell. Give each one a name, pick the swatch colour and upload the photo of that exact colour — customers can then open it directly with its own link.",
        },
        { section: "Variants", key: "sizes", label: "Sizes", type: "list", help: "One per line, e.g. 40mm" },

        { section: "Specification", key: "movement", label: "Movement", type: "text", default: "Quartz" },
        { section: "Specification", key: "case_material", label: "Case material", type: "text", default: "Stainless Steel" },
        { section: "Specification", key: "strap", label: "Strap", type: "text", default: "Leather" },
        { section: "Specification", key: "water_resistance", label: "Water resistance", type: "text", default: "50m" },
        { section: "Specification", key: "features", label: "Features", type: "list", help: "One feature per line." },
        { section: "Specification", key: "rating", label: "Rating", type: "number", default: 4.8 },
        { section: "Specification", key: "reviews", label: "Review count", type: "number" },

        {
          section: "Fragrance (perfumes only)",
          key: "fragrance_family",
          label: "Fragrance family",
          type: "select",
          options: ["Woody", "Oud", "Floral", "Amber", "Fresh", "Aquatic", "Citrus", "Oriental", "Musk"],
        },
        {
          section: "Fragrance (perfumes only)",
          key: "concentration",
          label: "Concentration",
          type: "select",
          options: ["Parfum", "Eau de Parfum", "Eau de Toilette", "Attar Oil", "Body Mist"],
        },
        { section: "Fragrance (perfumes only)", key: "size_ml", label: "Bottle size (ml)", type: "number" },
        { section: "Fragrance (perfumes only)", key: "gender", label: "Best for", type: "select", options: ["Men", "Women", "Unisex"] },
        { section: "Fragrance (perfumes only)", key: "top_notes", label: "Top notes", type: "list", help: "One note per line." },
        { section: "Fragrance (perfumes only)", key: "heart_notes", label: "Heart notes", type: "list", help: "One note per line." },
        { section: "Fragrance (perfumes only)", key: "base_notes", label: "Base notes", type: "list", help: "One note per line." },
        { section: "Fragrance (perfumes only)", key: "longevity", label: "Longevity", type: "text", help: "e.g. 8–10 hours" },
        { section: "Fragrance (perfumes only)", key: "sillage", label: "Sillage", type: "text", help: "e.g. Moderate to strong" },

        { section: "SEO", key: "seo_title", label: "SEO title", type: "text", help: "Under 60 characters. Falls back to the product name." },
        { section: "SEO", key: "seo_description", label: "SEO description", type: "textarea", help: "Under 160 characters." },
        { section: "SEO", key: "seo_keywords", label: "SEO keywords", type: "text", help: "Comma separated." },

        { section: "Visibility", key: "sort_order", label: "Sort order", type: "number" },
        { section: "Visibility", key: "featured", label: "Featured on homepage", type: "switch" },
        { section: "Visibility", key: "active", label: "Live on site", type: "switch", default: true },
      ]}
      />
    </div>
  );
}
