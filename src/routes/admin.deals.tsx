import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/deals")({ component: DealsAdmin });

function DealsAdmin() {
  return (
    <CrudModule
      table="deals"
      title="Deals"
      description="Sales and offers shown on the Deals page and across the storefront."
      orderBy={{ column: "sort_order" }}
      invalidate={["deals", "products"]}
      columns={[
        { key: "image_url", label: "Image", render: (r) => (r.image_url ? <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" /> : "—") },
        { key: "title", label: "Title", primary: true },
        { key: "discount_percent", label: "Discount", render: (r) => `${r.discount_percent ?? 0}%` },
        { key: "code", label: "Code" },
        { key: "ends_at", label: "Ends", render: (r) => (r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "—") },
        { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "subtitle", label: "Subtitle", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "badge", label: "Badge", type: "text", help: "Small label, e.g. Limited." },
        { key: "discount_percent", label: "Discount %", type: "number" },
        { key: "code", label: "Promo code", type: "text" },
        { key: "image_url", label: "Image", type: "image" },
        { key: "cta_label", label: "Button label", type: "text", default: "Shop the sale" },
        { key: "cta_href", label: "Button link", type: "text", default: "/shop" },
        { key: "starts_at", label: "Starts", type: "datetime" },
        { key: "ends_at", label: "Ends", type: "datetime", help: "Powers the countdown on the storefront." },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "active", label: "Active", type: "switch", default: true },
      ]}
    />
  );
}
