CREATE TABLE public.cart_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid,
  name text,
  email text,
  phone text,
  address text,
  city text,
  stage text NOT NULL DEFAULT 'add_to_cart',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0,
  cart_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  order_number text,
  page_path text,
  referrer text,
  user_agent text,
  contacted boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT, UPDATE ON public.cart_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_leads TO authenticated;
GRANT ALL ON public.cart_leads TO service_role;

ALTER TABLE public.cart_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a cart lead"
  ON public.cart_leads FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update their cart lead"
  ON public.cart_leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins read cart leads"
  ON public.cart_leads FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete cart leads"
  ON public.cart_leads FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER cart_leads_touch BEFORE UPDATE ON public.cart_leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX cart_leads_created_idx ON public.cart_leads (created_at DESC);
CREATE INDEX cart_leads_stage_idx ON public.cart_leads (stage);

CREATE TABLE public.order_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  order_number text,
  recipient text NOT NULL,
  customer_name text,
  template text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.order_emails TO authenticated;
GRANT ALL ON public.order_emails TO service_role;

ALTER TABLE public.order_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read order emails"
  ON public.order_emails FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX order_emails_created_idx ON public.order_emails (created_at DESC);