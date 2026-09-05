-- ============================================================
-- Add product video support and homepage video sections
-- All changes are additive (IF NOT EXISTS / IF NOT EXISTS)
-- ============================================================

-- 1. Product videos — array of MP4/WebM URLs stored as JSONB
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Homepage video sections — stored in site_settings
--    Admin controls these from Settings → Homepage Videos
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS video_wrist_url        text,    -- Watch on Wrist / lifestyle video
  ADD COLUMN IF NOT EXISTS video_wrist_title      text,
  ADD COLUMN IF NOT EXISTS video_showcase_url     text,    -- Product Showcase / hero video
  ADD COLUMN IF NOT EXISTS video_showcase_title   text,
  ADD COLUMN IF NOT EXISTS video_ugc_url          text,    -- Customer / UGC video
  ADD COLUMN IF NOT EXISTS video_ugc_title        text;

-- 3. Also add idempotency_key to orders (needed by order API fix)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
