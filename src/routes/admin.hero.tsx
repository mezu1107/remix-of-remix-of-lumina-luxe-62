import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/hero")({ component: HeroAdmin });

function HeroAdmin() {
  return (
    <CrudModule
      table="hero_slides"
      title="Hero Slides"
      description="The homepage slider. Each slide uses a full-bleed background image."
      orderBy={{ column: "sort_order" }}
      invalidate={["hero_slides"]}
      columns={[
        { key: "image_url", label: "Image", render: (r) => <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" /> },
        { key: "title", label: "Title" },
        { key: "eyebrow", label: "Eyebrow" },
        { key: "sort_order", label: "Order" },
        { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        { key: "image_url", label: "Background image URL", type: "image", required: true },
        { key: "eyebrow", label: "Eyebrow", type: "text" },
        { key: "title", label: "Title", type: "text", required: true },
        { key: "title_accent", label: "Accent words (italic gold)", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "cta_label", label: "Button label", type: "text", default: "Shop Now" },
        { key: "cta_href", label: "Button link", type: "text", default: "/shop" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "active", label: "Active", type: "switch", default: true },
      ]}
    />
  );
}
