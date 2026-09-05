import { createFileRoute } from "@tanstack/react-router";
import { CrudModule } from "@/components/admin/CrudModule";

export const Route = createFileRoute("/admin/popups")({ component: PopupsAdmin });

function PopupsAdmin() {
  return (
    <CrudModule
      table="popups"
      title="Popups"
      description="Offer and sale popups that appear to visitors on the public site."
      orderBy={{ column: "sort_order" }}
      invalidate={["popups"]}
      columns={[
        { key: "image_url", label: "Image", render: (r) => (r.image_url ? <img src={r.image_url} alt="" className="h-12 w-20 rounded object-cover" /> : "—") },
        { key: "title", label: "Title", primary: true },
        { key: "trigger_type", label: "Trigger" },
        { key: "frequency", label: "Frequency" },
        { key: "coupon_code", label: "Code" },
        { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "message", label: "Message", type: "textarea" },
        { key: "badge", label: "Badge", type: "text", default: "Offer" },
        { key: "image_url", label: "Image", type: "image" },
        { key: "cta_label", label: "Button label", type: "text", default: "Shop now" },
        { key: "cta_href", label: "Button link", type: "text", default: "/deals" },
        { key: "coupon_code", label: "Coupon code to show", type: "text" },
        {
          key: "trigger_type",
          label: "Trigger",
          type: "select",
          default: "delay",
          options: [
            { label: "After a delay", value: "delay" },
            { label: "Exit intent (mouse leaves / back gesture)", value: "exit" },
            { label: "Delay or exit intent", value: "both" },
          ],
        },
        { key: "delay_seconds", label: "Delay (seconds)", type: "number", default: 6 },
        {
          key: "frequency",
          label: "How often",
          type: "select",
          default: "session",
          options: [
            { label: "Once per visit", value: "session" },
            { label: "Once per device (until dismissed)", value: "once" },
            { label: "Every page load", value: "always" },
          ],
        },
        { key: "starts_at", label: "Starts", type: "datetime" },
        { key: "ends_at", label: "Ends", type: "datetime" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "active", label: "Active", type: "switch", default: true },
      ]}
    />
  );
}
