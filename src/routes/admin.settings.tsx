import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "@/components/admin/ImageField";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

type Row = Record<string, any>;

const linesToJson = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const jsonToLines = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").join("\n") : "");

const linksToJson = (v: string) =>
  linesToJson(v).map((line) => {
    const [label, href] = line.split("|");
    return { label: (label ?? "").trim(), href: (href ?? "/").trim() };
  });

const jsonToLinkLines = (v: unknown) =>
  Array.isArray(v) ? v.map((l: any) => `${l?.label ?? ""} | ${l?.href ?? "/"}`).join("\n") : "";

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Row | null;
    },
  });

  const [f, setF] = useState<Row>({});
  const [marquee, setMarquee] = useState("");
  const [featuredIn, setFeaturedIn] = useState("");
  const [navLinks, setNavLinks] = useState("");
  const [footerLinks, setFooterLinks] = useState("");

  useEffect(() => {
    if (!data) return;
    setF(data);
    setMarquee(jsonToLines(data.marquee_items));
    setFeaturedIn(jsonToLines(data.featured_in));
    setNavLinks(jsonToLinkLines(data.nav_links));
    setFooterLinks(jsonToLinkLines(data.footer_links));
  }, [data]);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        brand_name: f.brand_name || "TIMERA",
        brand_suffix: f.brand_suffix || null,
        logo_url: f.logo_url || null,
        brand_tagline: f.brand_tagline || null,
        marquee_enabled: !!f.marquee_enabled,
        marquee_items: linesToJson(marquee),
        featured_in: linesToJson(featuredIn),
        warranty_years: Number(f.warranty_years || 1),
        nav_links: linksToJson(navLinks),
        footer_links: linksToJson(footerLinks),
        contact_email: f.contact_email || null,
        contact_phone: f.contact_phone || null,
        whatsapp_number: f.whatsapp_number || null,
        address: f.address || null,
        contact_hours: f.contact_hours || null,
        instagram_url: f.instagram_url || null,
        facebook_url: f.facebook_url || null,
        tiktok_url: f.tiktok_url || null,
        youtube_url: f.youtube_url || null,
        tracking_enabled: !!f.tracking_enabled,
        meta_pixel_id: f.meta_pixel_id || null,
        google_tag_id: f.google_tag_id || null,
        google_ads_purchase_label: f.google_ads_purchase_label || null,
        feature_enabled: !!f.feature_enabled,
        feature_eyebrow: f.feature_eyebrow || null,
        feature_title: f.feature_title || null,
        feature_title_accent: f.feature_title_accent || null,
        feature_description: f.feature_description || null,
        feature_cta_label: f.feature_cta_label || null,
        feature_cta_href: f.feature_cta_href || "/shop",
        feature_image_url: f.feature_image_url || null,
        feature_ends_at: f.feature_ends_at ? new Date(f.feature_ends_at).toISOString() : null,
      };
      if (f.id) {
        const { error } = await supabase.from("site_settings" as any).update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved — live on the storefront.");
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading settings…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl">Site Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Brand name, logo, navigation links, the scrolling ticker and the limited-edition banner — all controlled here.
        </p>
      </div>

      <Card title="Brand">
        <Row2>
          <Field label="Brand name" help="Shown in the header, footer and mobile menu.">
            <Input value={f.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} />
          </Field>
          <Field label="Brand sub-label" help="Small text beside the logo, e.g. Timepieces.">
            <Input value={f.brand_suffix ?? ""} onChange={(e) => set("brand_suffix", e.target.value)} />
          </Field>
        </Row2>
        <Field label="Logo image" help="Leave empty to show the brand name as text.">
          <ImageField value={f.logo_url ?? ""} onChange={(v) => set("logo_url", v)} />
        </Field>
        <Field label="Short brand description (footer)">
          <Textarea rows={3} value={f.brand_tagline ?? ""} onChange={(e) => set("brand_tagline", e.target.value)} />
        </Field>
        <Field label="Warranty length (years)" help="Used everywhere warranty is mentioned on the site.">
          <Input type="number" value={f.warranty_years ?? 1} onChange={(e) => set("warranty_years", e.target.value)} />
        </Field>
      </Card>

      <Card title="Scrolling ticker (top strip)">
        <Toggle checked={!!f.marquee_enabled} onChange={(v) => set("marquee_enabled", v)} label="Show the always-running ticker" />
        <Field label="Ticker messages" help="One message per line. They run continuously in a single line.">
          <Textarea rows={7} value={marquee} onChange={(e) => setMarquee(e.target.value)} />
        </Field>
        <Field label="Featured-in names" help="One per line. Added to the same single-line ticker.">
          <Textarea rows={5} value={featuredIn} onChange={(e) => setFeaturedIn(e.target.value)} />
        </Field>
      </Card>

      <Card title="Navigation & footer links">
        <Field label="Header menu links" help="One per line, format: Label | /path. Leave empty for the default menu.">
          <Textarea rows={5} value={navLinks} onChange={(e) => setNavLinks(e.target.value)} placeholder={"Shop | /shop\nJournal | /blog"} />
        </Field>
        <Field label="Extra footer links" help="One per line, format: Label | /path.">
          <Textarea rows={4} value={footerLinks} onChange={(e) => setFooterLinks(e.target.value)} />
        </Field>
      </Card>

      <Card title="Contact & social">
        <Row2>
          <Field label="Email"><Input value={f.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} /></Field>
          <Field label="Phone"><Input value={f.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} /></Field>
          <Field label="WhatsApp number" help="International format without +, e.g. 923001234567">
            <Input value={f.whatsapp_number ?? ""} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </Field>
          <Field label="Address"><Input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Opening hours" help="Shown on the contact page, e.g. Mon–Sun · 10:00–22:00 PKT">
            <Input value={f.contact_hours ?? ""} onChange={(e) => set("contact_hours", e.target.value)} />
          </Field>
          <Field label="Instagram URL"><Input value={f.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)} /></Field>
          <Field label="Facebook URL"><Input value={f.facebook_url ?? ""} onChange={(e) => set("facebook_url", e.target.value)} /></Field>
          <Field label="TikTok URL"><Input value={f.tiktok_url ?? ""} onChange={(e) => set("tiktok_url", e.target.value)} /></Field>
          <Field label="YouTube URL"><Input value={f.youtube_url ?? ""} onChange={(e) => set("youtube_url", e.target.value)} /></Field>
        </Row2>
      </Card>

      <Card title="Pixels & tracking">
        <Toggle checked={!!f.tracking_enabled} onChange={(v) => set("tracking_enabled", v)} label="Enable tracking on the storefront" />
        <Row2>
          <Field label="Meta Pixel ID" help="Example: 123456789012345">
            <Input value={f.meta_pixel_id ?? ""} onChange={(e) => set("meta_pixel_id", e.target.value)} placeholder="Meta Pixel ID" />
          </Field>
          <Field label="Google tag / GA4 ID" help="Example: G-XXXXXXXXXX or AW-XXXXXXXXXX">
            <Input value={f.google_tag_id ?? ""} onChange={(e) => set("google_tag_id", e.target.value)} placeholder="G- or AW- tag ID" />
          </Field>
          <Field label="Google Ads purchase label" help="Optional conversion label for order purchases.">
            <Input value={f.google_ads_purchase_label ?? ""} onChange={(e) => set("google_ads_purchase_label", e.target.value)} placeholder="Conversion label" />
          </Field>
          <Field label="TikTok Pixel ID" help="Example: D7IA94BC77U8DEPHHKSG">
            <Input value={f.tiktok_pixel_id ?? ""} onChange={(e) => set("tiktok_pixel_id", e.target.value)} placeholder="TikTok Pixel ID" />
          </Field>
          <Field label="LinkedIn Partner ID" help="Insight Tag partner id, example: 1234567">
            <Input value={f.linkedin_partner_id ?? ""} onChange={(e) => set("linkedin_partner_id", e.target.value)} placeholder="Partner ID" />
          </Field>
          <Field label="Snapchat Pixel ID" help="Snap Pixel id from Snapchat Ads Manager.">
            <Input value={f.snapchat_pixel_id ?? ""} onChange={(e) => set("snapchat_pixel_id", e.target.value)} placeholder="Snap Pixel ID" />
          </Field>
          <Field label="Pinterest Tag ID" help="Example: 2612345678901">
            <Input value={f.pinterest_tag_id ?? ""} onChange={(e) => set("pinterest_tag_id", e.target.value)} placeholder="Pinterest Tag ID" />
          </Field>
          <Field label="Microsoft / Bing UET Tag ID" help="From Microsoft Ads → UET tag, example: 123456789">
            <Input value={f.bing_uet_tag_id ?? ""} onChange={(e) => set("bing_uet_tag_id", e.target.value)} placeholder="UET Tag ID" />
          </Field>
        </Row2>
      </Card>

      <Card title="Search engine verification">
        <Row2>
          <Field label="Bing Webmaster (msvalidate.01)" help="Paste only the content value of the meta tag.">
            <Input value={f.bing_site_verification ?? ""} onChange={(e) => set("bing_site_verification", e.target.value)} placeholder="ABC123..." />
          </Field>
          <Field label="Google Search Console" help="google-site-verification content value.">
            <Input value={f.google_site_verification ?? ""} onChange={(e) => set("google_site_verification", e.target.value)} placeholder="abc123..." />
          </Field>
          <Field label="Pinterest domain verify" help="p:domain_verify content value.">
            <Input value={f.pinterest_site_verification ?? ""} onChange={(e) => set("pinterest_site_verification", e.target.value)} placeholder="abc123..." />
          </Field>
        </Row2>
      </Card>


      <Card title="Limited-edition banner (home page)">
        <Toggle checked={!!f.feature_enabled} onChange={(v) => set("feature_enabled", v)} label="Show the banner with countdown" />
        <Row2>
          <Field label="Eyebrow"><Input value={f.feature_eyebrow ?? ""} onChange={(e) => set("feature_eyebrow", e.target.value)} /></Field>
          <Field label="Title"><Input value={f.feature_title ?? ""} onChange={(e) => set("feature_title", e.target.value)} /></Field>
          <Field label="Title accent (gold italic)"><Input value={f.feature_title_accent ?? ""} onChange={(e) => set("feature_title_accent", e.target.value)} /></Field>
          <Field label="Button label"><Input value={f.feature_cta_label ?? ""} onChange={(e) => set("feature_cta_label", e.target.value)} /></Field>
          <Field label="Button link"><Input value={f.feature_cta_href ?? ""} onChange={(e) => set("feature_cta_href", e.target.value)} placeholder="/shop" /></Field>
          <Field label="Countdown ends at">
            <Input
              type="datetime-local"
              value={f.feature_ends_at ? toLocalInput(f.feature_ends_at) : ""}
              onChange={(e) => set("feature_ends_at", e.target.value)}
            />
          </Field>
        </Row2>
        <Field label="Description">
          <Textarea rows={3} value={f.feature_description ?? ""} onChange={(e) => set("feature_description", e.target.value)} />
        </Field>
        <Field label="Background image">
          <ImageField value={f.feature_image_url ?? ""} onChange={(v) => set("feature_image_url", v)} />
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
      <span className="min-w-0 text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </label>
  );
}
