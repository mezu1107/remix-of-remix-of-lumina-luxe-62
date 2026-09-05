import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/faqs")({ component: FaqsAdmin });

function FaqsAdmin() {
  return (
    <CrudModule
      table="faqs"
      title="FAQs"
      description="Questions shown on the public FAQ page. Only active questions appear on the site."
      orderBy={{ column: "sort_order" }}
      invalidate={["faqs"]}
      columns={[
        { key: "question", label: "Question", primary: true },
        { key: "category", label: "Category" },
        { key: "sort_order", label: "Order" },
        { key: "active", label: "Live", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        { key: "question", label: "Question", type: "text", required: true },
        { key: "answer", label: "Answer", type: "textarea", required: true },
        { key: "category", label: "Category", type: "text", help: "Groups questions on the page, e.g. Shipping, Payment, Warranty." },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "active", label: "Live on site", type: "switch", default: true },
      ]}
    />
  );
}
