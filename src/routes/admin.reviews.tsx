import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CrudModule } from "@/components/admin/CrudModule";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsAdmin });

function ReviewsAdmin() {
  const { data: products = [] } = useQuery({
    queryKey: ["admin", "product-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const productMap = new Map(products.map((p: any) => [p.id, p.name]));

  return (
    <CrudModule
      table="reviews"
      title="Reviews"
      description="Customer reviews. Approve one to publish it on the product page."
      orderBy={{ column: "created_at", ascending: false }}
      invalidate={["reviews", "products"]}
      columns={[
        { key: "customer_name", label: "Customer", primary: true },
        { key: "product_id", label: "Product", render: (r) => productMap.get(r.product_id) ?? "—" },
        { key: "rating", label: "Rating", render: (r) => `${r.rating}/5` },
        { key: "title", label: "Title" },
        { key: "approved", label: "Approved", render: (r) => (r.approved ? "Yes" : "Pending") },
      ]}
      fields={[
        {
          key: "product_id",
          label: "Product",
          type: "select",
          options: products.map((p: any) => ({ label: p.name, value: p.id })),
        },
        { key: "customer_name", label: "Customer name", type: "text", required: true },
        { key: "rating", label: "Rating (1-5)", type: "number", default: 5 },
        { key: "title", label: "Title", type: "text" },
        { key: "customer_role", label: "Customer role / city", type: "text" },
        { key: "body", label: "Review", type: "textarea" },
        { key: "approved", label: "Approved (visible publicly)", type: "switch" },
        { key: "featured", label: "Show as testimonial on home page", type: "switch" },

      ]}
    />
  );
}
