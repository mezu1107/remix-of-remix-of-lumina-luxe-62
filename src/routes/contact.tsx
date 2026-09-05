import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone, Clock, MessageCircle, Instagram, Facebook, Youtube } from "lucide-react";
import { toast } from "sonner";
import { siteSettingsQuery } from "@/lib/site-settings";
import { trackContact, trackWhatsappClick } from "@/lib/tracking/events";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Timera — Customer Support Pakistan" },
      { name: "description", content: "Talk to the Timera team by phone, WhatsApp or email. Real support seven days a week for orders, delivery and warranty." },
      { property: "og:title", content: "Contact Timera" },
      { property: "og:description", content: "Phone, WhatsApp and email support for Timera customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://timera.store/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useQuery(siteSettingsQuery);

  const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, "") ?? "";
  const details = [
    settings?.contactEmail && { icon: Mail, label: "Email", value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    settings?.contactPhone && { icon: Phone, label: "Phone", value: settings.contactPhone, href: `tel:${settings.contactPhone.replace(/\s/g, "")}` },
    whatsapp && { icon: MessageCircle, label: "WhatsApp", value: `+${whatsapp}`, href: `https://wa.me/${whatsapp}` },
    settings?.address && { icon: MapPin, label: "Address", value: settings.address, href: undefined },
    settings?.contactHours && { icon: Clock, label: "Hours", value: settings.contactHours, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  const socials = [
    settings?.instagramUrl && { icon: Instagram, href: settings.instagramUrl, label: "Instagram" },
    settings?.facebookUrl && { icon: Facebook, href: settings.facebookUrl, label: "Facebook" },
    settings?.youtubeUrl && { icon: Youtube, href: settings.youtubeUrl, label: "YouTube" },
  ].filter(Boolean) as { icon: typeof Mail; href: string; label: string }[];

  return (
    <div className="container-luxe py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">
          Talk to a <span className="italic gold-text">real person.</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          {settings?.brandTagline ?? "We reply quickly on WhatsApp, phone and email."}
        </p>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          {details.length === 0 && (
            <p className="text-sm text-muted-foreground"></p>
          )}
          {details.map((i) => {
            const Body = (
              <div className="flex gap-4">
                <div className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                  <i.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{i.label}</p>
                  <p className="mt-1 font-serif text-lg">{i.value}</p>
                </div>
              </div>
            );
            return i.href ? (
              <a
                key={i.label}
                href={i.href}
                target={i.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                onClick={() => (i.label === "WhatsApp" ? trackWhatsappClick("contact-page") : trackContact(i.label.toLowerCase()))}
                className="block transition-opacity hover:opacity-80"
              >
                {Body}
              </a>
            ) : (
              <div key={i.label}>{Body}</div>
            );
          })}

          {socials.length > 0 && (
            <div className="flex gap-3 pt-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="glass flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-primary"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const message = [
              `Name: ${(form.elements.namedItem("fn") as HTMLInputElement)?.value} ${(form.elements.namedItem("ln") as HTMLInputElement)?.value}`,
              `Email: ${(form.elements.namedItem("em") as HTMLInputElement)?.value}`,
              `Subject: ${(form.elements.namedItem("sub") as HTMLInputElement)?.value}`,
              (form.elements.namedItem("msg") as HTMLTextAreaElement)?.value,
            ].join("\n");
            void trackContact("form");
            if (whatsapp) {
              window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
              toast.success("Opening WhatsApp with your message.");
            } else if (settings?.contactEmail) {
              window.location.href = `mailto:${settings.contactEmail}?subject=${encodeURIComponent(
                (form.elements.namedItem("sub") as HTMLInputElement)?.value || "Website enquiry",
              )}&body=${encodeURIComponent(message)}`;
            } else {
              toast.error("No contact channel is configured yet.");
            }
            form.reset();
          }}
          className="glass space-y-5 rounded-2xl p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name" id="fn" required />
            <Field label="Last name" id="ln" required />
          </div>
          <Field label="Email" id="em" type="email" required />
          <Field label="Subject" id="sub" />
          <div>
            <Label htmlFor="msg" className="text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
            <Textarea id="msg" name="msg" rows={6} className="mt-1.5" required />
          </div>
          <Button type="submit" size="lg" className="h-12 w-full">Send message</Button>
        </form>
      </div>
    </div>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string; id: string }) {
  const { label, id, ...rest } = props;
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input id={id} name={id} className="mt-1.5 h-11" {...rest} />
    </div>
  );
}
