-- 1. Additive attribution columns on orders (all nullable, backward compatible)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS first_utm_source text,
  ADD COLUMN IF NOT EXISTS first_utm_medium text,
  ADD COLUMN IF NOT EXISTS first_utm_campaign text,
  ADD COLUMN IF NOT EXISTS first_utm_content text,
  ADD COLUMN IF NOT EXISTS first_utm_term text,
  ADD COLUMN IF NOT EXISTS first_landing_page text,
  ADD COLUMN IF NOT EXISTS first_touch_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_utm_source text,
  ADD COLUMN IF NOT EXISTS last_utm_medium text,
  ADD COLUMN IF NOT EXISTS last_utm_campaign text,
  ADD COLUMN IF NOT EXISTS last_utm_content text,
  ADD COLUMN IF NOT EXISTS last_utm_term text,
  ADD COLUMN IF NOT EXISTS last_touch_at timestamptz,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS meta_campaign_id text,
  ADD COLUMN IF NOT EXISTS meta_adset_id text,
  ADD COLUMN IF NOT EXISTS meta_ad_id text,
  ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS purchase_event_id text;

-- 2. Meta event log
CREATE TABLE IF NOT EXISTS public.meta_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_id text NOT NULL,
  event_source text NOT NULL DEFAULT 'server',
  order_number text,
  order_id uuid,
  value numeric,
  currency text NOT NULL DEFAULT 'PKR',
  status text NOT NULL DEFAULT 'pending',
  error text,
  fbtrace_id text,
  events_received integer,
  test_event boolean NOT NULL DEFAULT false,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.meta_event_log TO authenticated;
GRANT ALL ON public.meta_event_log TO service_role;
ALTER TABLE public.meta_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read meta event log"
  ON public.meta_event_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS meta_event_log_unique_event
  ON public.meta_event_log (event_name, event_id, event_source);
CREATE INDEX IF NOT EXISTS meta_event_log_created_idx ON public.meta_event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS meta_event_log_order_idx ON public.meta_event_log (order_number);

-- 3. Meta settings (no tokens stored here)
CREATE TABLE IF NOT EXISTS public.meta_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id text,
  ad_account_id text,
  api_version text NOT NULL DEFAULT 'v21.0',
  test_event_code text,
  capi_enabled boolean NOT NULL DEFAULT true,
  marketing_api_enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.meta_settings TO authenticated;
GRANT ALL ON public.meta_settings TO service_role;
ALTER TABLE public.meta_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read meta settings"
  ON public.meta_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can write meta settings"
  ON public.meta_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER meta_settings_touch BEFORE UPDATE ON public.meta_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.meta_settings (pixel_id) VALUES ('1758262658709610');

-- 4. Cached Meta Ads insights
CREATE TABLE IF NOT EXISTS public.meta_insights_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_start date NOT NULL,
  level text NOT NULL,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  spend numeric NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  reach bigint NOT NULL DEFAULT 0,
  frequency numeric NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  link_clicks bigint NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  cpc numeric NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  landing_page_views bigint NOT NULL DEFAULT 0,
  view_content bigint NOT NULL DEFAULT 0,
  add_to_cart bigint NOT NULL DEFAULT 0,
  initiate_checkout bigint NOT NULL DEFAULT 0,
  purchases bigint NOT NULL DEFAULT 0,
  purchase_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.meta_insights_daily TO authenticated;
GRANT ALL ON public.meta_insights_daily TO service_role;
ALTER TABLE public.meta_insights_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read meta insights"
  ON public.meta_insights_daily FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS meta_insights_daily_unique
  ON public.meta_insights_daily (date_start, level, COALESCE(campaign_id,''), COALESCE(adset_id,''), COALESCE(ad_id,''));
CREATE INDEX IF NOT EXISTS meta_insights_daily_date_idx ON public.meta_insights_daily (date_start DESC);