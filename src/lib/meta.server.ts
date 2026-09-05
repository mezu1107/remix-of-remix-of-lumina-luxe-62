/**
 * META SERVER MODULE — Conversions API + Marketing API. Server-only.
 * Never imported by a component. Secrets are read inside functions.
 */

export type MetaConfig = {
  pixelId: string | null;
  adAccountId: string | null;
  apiVersion: string;
  testEventCode: string | null;
  capiEnabled: boolean;
  marketingApiEnabled: boolean;
  hasCapiToken: boolean;
  hasMarketingToken: boolean;
};

const DEFAULT_VERSION = "v21.0";

export async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export function capiToken() {
  return process.env["META_CAPI_ACCESS_TOKEN"] ?? process.env["META_ACCESS_TOKEN"] ?? null;
}
export function marketingToken() {
  return process.env["META_MARKETING_ACCESS_TOKEN"] ?? process.env["META_ACCESS_TOKEN"] ?? null;
}

export async function loadMetaConfig(): Promise<MetaConfig> {
  const db = await adminClient();
  const { data } = await db.from("meta_settings").select("*").order("created_at").limit(1).maybeSingle();
  return {
    pixelId: data?.pixel_id ?? process.env["META_PIXEL_ID"] ?? null,
    adAccountId: data?.ad_account_id ?? process.env["META_AD_ACCOUNT_ID"] ?? null,
    apiVersion: data?.api_version || DEFAULT_VERSION,
    testEventCode: data?.test_event_code ?? null,
    capiEnabled: data?.capi_enabled ?? true,
    marketingApiEnabled: data?.marketing_api_enabled ?? true,
    hasCapiToken: Boolean(capiToken()),
    hasMarketingToken: Boolean(marketingToken()),
  };
}

/* ------------------------------------------------------------------ hashing */

const enc = new TextEncoder();

export async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();

/** Meta requires normalised + SHA-256 hashed PII. Raw values never leave here. */
export async function hashUserData(input: {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const out: Record<string, unknown> = {};
  const put = async (key: string, value: string) => {
    if (value) out[key] = [await sha256(value)];
  };
  await put("em", norm(input.email));
  const phone = (input.phone ?? "").replace(/[^\d]/g, "");
  // Pakistani numbers: 03xx… → 923xx…
  const e164 = phone.startsWith("0") ? `92${phone.slice(1)}` : phone;
  if (e164) out["ph"] = [await sha256(e164)];
  await put("fn", norm(input.firstName));
  await put("ln", norm(input.lastName));
  await put("ct", norm(input.city).replace(/\s+/g, ""));
  await put("st", norm(input.state).replace(/\s+/g, ""));
  await put("zp", norm(input.zip).replace(/\s+/g, ""));
  await put("country", norm(input.country) || "pk");
  if (input.externalId) out["external_id"] = [await sha256(norm(input.externalId))];
  if (input.fbp) out["fbp"] = input.fbp;
  if (input.fbc) out["fbc"] = input.fbc;
  if (input.ip) out["client_ip_address"] = input.ip;
  if (input.userAgent) out["client_user_agent"] = input.userAgent;
  return out;
}

/* --------------------------------------------------------------------- CAPI */

export type CapiEvent = {
  event_name: string;
  event_id: string;
  event_time?: number;
  event_source_url?: string | null;
  action_source?: string;
  user_data: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
};

export type CapiResult = {
  ok: boolean;
  status: number;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
};

export async function sendCapiEvent(event: CapiEvent, config?: MetaConfig): Promise<CapiResult> {
  const cfg = config ?? (await loadMetaConfig());
  const token = capiToken();
  if (!cfg.capiEnabled) return { ok: false, status: 0, error: "Conversions API disabled in settings" };
  if (!cfg.pixelId) return { ok: false, status: 0, error: "Meta Pixel ID is not configured" };
  if (!token) return { ok: false, status: 0, error: "META_CAPI_ACCESS_TOKEN is not configured" };

  const body: Record<string, unknown> = {
    data: [
      {
        action_source: event.action_source ?? "website",
        event_time: event.event_time ?? Math.floor(Date.now() / 1000),
        ...event,
      },
    ],
  };
  if (cfg.testEventCode) body["test_event_code"] = cfg.testEventCode;

  try {
    const res = await fetch(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const out: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: out?.error?.message ?? `Meta returned ${res.status}`, fbtraceId: out?.error?.fbtrace_id };
    }
    return { ok: true, status: res.status, eventsReceived: out?.events_received, fbtraceId: out?.fbtrace_id };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message ?? "Network error contacting Meta" };
  }
}

/* ---------------------------------------------------------- Marketing API */

export type InsightRow = {
  date_start?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  link_clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  landing_page_views: number;
  view_content: number;
  add_to_cart: number;
  initiate_checkout: number;
  purchases: number;
  purchase_value: number;
  currency: string;
};

const actionValue = (actions: any[] | undefined, type: string) =>
  Number(actions?.find((a) => a?.action_type === type)?.value ?? 0) || 0;

function mapInsight(row: any): InsightRow {
  const spend = Number(row.spend) || 0;
  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  return {
    date_start: row.date_start,
    campaign_id: row.campaign_id,
    campaign_name: row.campaign_name,
    adset_id: row.adset_id,
    adset_name: row.adset_name,
    ad_id: row.ad_id,
    ad_name: row.ad_name,
    spend,
    impressions,
    reach: Number(row.reach) || 0,
    frequency: Number(row.frequency) || 0,
    clicks,
    link_clicks: actionValue(row.actions, "link_click"),
    cpm: Number(row.cpm) || (impressions ? (spend / impressions) * 1000 : 0),
    cpc: Number(row.cpc) || (clicks ? spend / clicks : 0),
    ctr: Number(row.ctr) || (impressions ? (clicks / impressions) * 100 : 0),
    landing_page_views: actionValue(row.actions, "landing_page_view"),
    view_content: actionValue(row.actions, "offsite_conversion.fb_pixel_view_content"),
    add_to_cart: actionValue(row.actions, "offsite_conversion.fb_pixel_add_to_cart"),
    initiate_checkout: actionValue(row.actions, "offsite_conversion.fb_pixel_initiate_checkout"),
    purchases: actionValue(row.actions, "offsite_conversion.fb_pixel_purchase") || actionValue(row.actions, "purchase"),
    purchase_value:
      actionValue(row.action_values, "offsite_conversion.fb_pixel_purchase") || actionValue(row.action_values, "purchase"),
    currency: row.account_currency ?? "PKR",
  };
}

const FIELDS = [
  "spend",
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "cpm",
  "cpc",
  "ctr",
  "actions",
  "action_values",
  "account_currency",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
].join(",");

export async function fetchInsights(opts: {
  level: "account" | "campaign" | "adset" | "ad";
  since: string;
  until: string;
  config?: MetaConfig;
}): Promise<{ ok: true; rows: InsightRow[] } | { ok: false; error: string }> {
  const cfg = opts.config ?? (await loadMetaConfig());
  const token = marketingToken();
  if (!cfg.marketingApiEnabled) return { ok: false, error: "Marketing API disabled in settings" };
  if (!cfg.adAccountId) return { ok: false, error: "Meta Ad Account ID is not configured" };
  if (!token) return { ok: false, error: "META_MARKETING_ACCESS_TOKEN is not configured" };

  const account = cfg.adAccountId.startsWith("act_") ? cfg.adAccountId : `act_${cfg.adAccountId}`;
  const url =
    `https://graph.facebook.com/${cfg.apiVersion}/${account}/insights` +
    `?level=${opts.level}&fields=${encodeURIComponent(FIELDS)}` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since: opts.since, until: opts.until }))}` +
    `&limit=200&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url);
    const out: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: out?.error?.message ?? `Meta returned ${res.status}` };
    return { ok: true, rows: (out?.data ?? []).map(mapInsight) };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Network error contacting Meta" };
  }
}
