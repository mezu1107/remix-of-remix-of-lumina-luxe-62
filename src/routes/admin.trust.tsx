import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/trust")({ component: TrustAdmin });

function TrustAdmin() {
  return (
    <CrudModule
      table="trust_sections"
      title="Trust Centre"
      description="Every block on the public Trust & Security page. Only publish claims you can stand behind."
      orderBy={{ column: "sort_order" }}
      invalidate={["trust_sections"]}
      columns={[
        { key: "heading", label: "Heading", primary: true },
        { key: "group_name", label: "Area" },
        { key: "sort_order", label: "Order" },
        { key: "active", label: "Live", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        {
          key: "group_name",
          label: "Area of the page",
          type: "select",
          required: true,
          default: "section",
          options: [
            { label: "Page intro (hero)", value: "hero" },
            { label: "Commitment card", value: "commitment" },
            { label: "Main section", value: "section" },
            { label: "FAQ entry", value: "faq" },
          ],
          help: "Hero is the page intro — keep only one active.",
        },
        { key: "heading", label: "Heading / question", type: "text", required: true },
        { key: "body", label: "Body text", type: "textarea" },
        { key: "bullets", label: "Bullet points", type: "list", help: "One per line. Used by main sections." },
        {
          key: "icon",
          label: "Icon",
          type: "select",
          options: ["shield", "lock", "key", "credit-card", "database", "workflow", "timer", "network", "sparkles", "bug"],
        },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "active", label: "Live on site", type: "switch", default: true },
      ]}
    />
  );
}
