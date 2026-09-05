import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/coupons")({ component: CouponsAdmin });

function CouponsAdmin() {
  return (
    <CrudModule
      table="coupons"
      title="Coupons"
      description="Discount codes customers can apply at checkout."
      orderBy={{ column: "created_at", ascending: false }}
      invalidate={["coupons"]}
      columns={[
        { key: "code", label: "Code", primary: true },
        { key: "discount_type", label: "Type" },
        { key: "discount_value", label: "Value" },
        { key: "min_order", label: "Min order" },
        { key: "used_count", label: "Used" },
        { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        { key: "code", label: "Code", type: "text", required: true, help: "Customers type this at checkout." },
        { key: "description", label: "Description", type: "text" },
        {
          key: "discount_type",
          label: "Discount type",
          type: "select",
          default: "percent",
          options: [
            { label: "Percentage off", value: "percent" },
            { label: "Fixed amount off", value: "fixed" },
          ],
        },
        { key: "discount_value", label: "Discount value", type: "number", required: true },
        { key: "min_order", label: "Minimum order", type: "number" },
        { key: "usage_limit", label: "Usage limit", type: "number" },
        { key: "expires_at", label: "Expires", type: "datetime" },
        { key: "active", label: "Active", type: "switch", default: true },
      ]}
    />
  );
}
