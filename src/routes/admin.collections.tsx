import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/collections")({ component: CollectionsAdmin });

function CollectionsAdmin() {
  return (
    <CrudModule
      table="collections"
      title="Collections"
      description="Curated collection tiles shown on the homepage."
      orderBy={{ column: "sort_order" }}
      invalidate={["collections"]}
      columns={[
        { key: "image_url", label: "Image", render: (r) => (r.image_url ? <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" /> : "—") },
        { key: "name", label: "Name" },
        { key: "tagline", label: "Tagline" },
        { key: "sort_order", label: "Order" },
        { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "slug", label: "Slug", type: "text", required: true, help: "Lowercase, hyphenated — used in links." },
        { key: "tagline", label: "Tagline", type: "text" },
        { key: "image_url", label: "Image URL", type: "image" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "active", label: "Active", type: "switch", default: true },
      ]}
    />
  );
}
