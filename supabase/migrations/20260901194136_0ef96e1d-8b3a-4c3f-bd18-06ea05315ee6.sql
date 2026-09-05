
alter table public.products
  add column if not exists product_type text not null default 'watch',
  add column if not exists fragrance_family text,
  add column if not exists concentration text,
  add column if not exists size_ml integer,
  add column if not exists top_notes jsonb not null default '[]'::jsonb,
  add column if not exists heart_notes jsonb not null default '[]'::jsonb,
  add column if not exists base_notes jsonb not null default '[]'::jsonb,
  add column if not exists longevity text,
  add column if not exists sillage text,
  add column if not exists gender text;

create index if not exists products_product_type_idx on public.products (product_type);

insert into public.collections (name, slug, tagline, image_url, sort_order, active)
values
  ('Signature Parfum', 'signature-parfum', 'Long-lasting eau de parfum for every day', '/__l5e/assets-v1/f9ca7b6b-63c1-4854-b74f-b09d98d7dce8/perfume-2.jpg', 10, true),
  ('Oud & Attar', 'oud-attar', 'Rich oriental oils and pure attars', '/__l5e/assets-v1/6507b143-1fed-4e87-9ca9-e2cd5c2fc920/perfume-5.jpg', 11, true),
  ('Gift Sets', 'gift-sets', 'Ready-to-gift fragrance boxes', '/__l5e/assets-v1/cc58f776-54e7-441c-86ad-01ce5789fad2/perfume-6.jpg', 12, true)
on conflict (slug) do nothing;

insert into public.categories (name, slug, description, image_url, sort_order, active)
values
  ('Strap Watches', 'strap-watches', 'Leather and silicone strap timepieces', null, 1, true),
  ('Chain Watches', 'chain-watches', 'Stainless steel chain timepieces', null, 2, true),
  ('Arabic Dial', 'arabic-dial', 'Arabic numeral dial watches', null, 3, true),
  ('Men''s Perfume', 'mens-perfume', 'Bold, long-lasting fragrances for men', '/__l5e/assets-v1/1fa97b03-4972-4727-9f8f-e19c53e3e127/perfume-1.jpg', 4, true),
  ('Women''s Perfume', 'womens-perfume', 'Floral and sweet fragrances for women', '/__l5e/assets-v1/611ffa1b-abe5-4fc3-a91e-8893d21920d0/perfume-3.jpg', 5, true),
  ('Unisex Perfume', 'unisex-perfume', 'Fragrances everyone can wear', '/__l5e/assets-v1/9f0cb44d-4597-45a4-897d-1f48c36e1762/perfume-4.jpg', 6, true),
  ('Attar & Oud', 'attar-oud', 'Alcohol-free attars and oud oils', '/__l5e/assets-v1/6507b143-1fed-4e87-9ca9-e2cd5c2fc920/perfume-5.jpg', 7, true),
  ('Gift Sets', 'gift-sets', 'Perfume gift boxes', '/__l5e/assets-v1/cc58f776-54e7-441c-86ad-01ce5789fad2/perfume-6.jpg', 8, true)
on conflict (slug) do nothing;

insert into public.products
  (slug, name, brand, collection, category, product_type, price, sale_price, compare_at, image_url, gallery,
   description, features, colors, sizes, rating, reviews, badge, stock, featured, active, sort_order,
   fragrance_family, concentration, size_ml, top_notes, heart_notes, base_notes, longevity, sillage, gender,
   movement, case_material, strap, water_resistance, seo_title, seo_description, seo_keywords)
values
  ('timera-noir-oud', 'Timera Noir Oud', 'Timera', 'Oud & Attar', 'Men''s Perfume', 'perfume', 5500, 3900, 6500,
   '/__l5e/assets-v1/1fa97b03-4972-4727-9f8f-e19c53e3e127/perfume-1.jpg',
   '["/__l5e/assets-v1/1fa97b03-4972-4727-9f8f-e19c53e3e127/perfume-1.jpg"]'::jsonb,
   'A deep, smoky oud built for Pakistani evenings — resinous agarwood, warm spice and a leathery amber trail that stays on your clothes till the next morning.',
   '["Projects 8-10 hours on skin","Alcohol-free oud accord","Perfect for weddings and winter nights","Comes in a luxury magnetic box"]'::jsonb,
   '["Noir #1a1a1a"]'::jsonb, '["50ml","100ml"]'::jsonb, 4.9, 46, 'Bestseller', 40, true, true, 1,
   'Woody Oriental', 'Extrait de Parfum', 100,
   '["Saffron","Bergamot","Pink Pepper"]'::jsonb, '["Rose","Patchouli","Cinnamon"]'::jsonb, '["Agarwood (Oud)","Amber","Leather","Musk"]'::jsonb,
   '8-10 hours', 'Heavy', 'Men', 'Quartz', 'Stainless Steel', 'Leather', '50m',
   'Timera Noir Oud — Long Lasting Oud Perfume for Men', 'Smoky agarwood, saffron and amber with 8-10 hour longevity. Cash on delivery across Pakistan.', 'oud perfume, long lasting perfume for men, attar, Timera perfume'),

  ('timera-onyx-intense', 'Timera Onyx Intense', 'Timera', 'Signature Parfum', 'Men''s Perfume', 'perfume', 4800, 3500, 5600,
   '/__l5e/assets-v1/f9ca7b6b-63c1-4854-b74f-b09d98d7dce8/perfume-2.jpg',
   '["/__l5e/assets-v1/f9ca7b6b-63c1-4854-b74f-b09d98d7dce8/perfume-2.jpg"]'::jsonb,
   'A sharp, confident office signature — crisp bergamot opening that dries down to vetiver, tonka and clean woods. Compliment-magnet without being loud.',
   '["6-8 hour wear","Great for office and daily use","Crisp fresh-woody opening","Travel-friendly 50ml also available"]'::jsonb,
   '["Onyx #0f0f10"]'::jsonb, '["50ml","100ml"]'::jsonb, 4.8, 38, 'New', 45, true, true, 2,
   'Aromatic Fougere', 'Eau de Parfum', 100,
   '["Bergamot","Grapefruit","Cardamom"]'::jsonb, '["Lavender","Geranium","Sage"]'::jsonb, '["Vetiver","Tonka Bean","Cedarwood"]'::jsonb,
   '6-8 hours', 'Moderate', 'Men', 'Quartz', 'Stainless Steel', 'Leather', '50m',
   'Timera Onyx Intense — Fresh Woody Perfume for Men', 'Bergamot, lavender and vetiver in a 100ml eau de parfum. 6-8 hours wear, COD available.', 'perfume for men, eau de parfum Pakistan, office perfume'),

  ('timera-rose-elixir', 'Timera Rose Elixir', 'Timera', 'Signature Parfum', 'Women''s Perfume', 'perfume', 4800, 3500, 5600,
   '/__l5e/assets-v1/611ffa1b-abe5-4fc3-a91e-8893d21920d0/perfume-3.jpg',
   '["/__l5e/assets-v1/611ffa1b-abe5-4fc3-a91e-8893d21920d0/perfume-3.jpg"]'::jsonb,
   'Turkish rose wrapped in vanilla and soft musk — romantic, warm and made for special evenings. The kind of scent people ask you about.',
   '["7-9 hour wear","Rose, vanilla and musk","Beautiful gifting bottle","Skin-friendly, dermatologically safe"]'::jsonb,
   '["Rose Gold #b76e79"]'::jsonb, '["50ml","100ml"]'::jsonb, 4.9, 52, 'Bestseller', 38, true, true, 3,
   'Floral Amber', 'Eau de Parfum', 100,
   '["Lychee","Bergamot","Raspberry"]'::jsonb, '["Turkish Rose","Peony","Jasmine"]'::jsonb, '["Vanilla","White Musk","Sandalwood"]'::jsonb,
   '7-9 hours', 'Moderate', 'Women', 'Quartz', 'Stainless Steel', 'Leather', '50m',
   'Timera Rose Elixir — Rose & Vanilla Perfume for Women', 'Turkish rose, jasmine and vanilla. 100ml eau de parfum with 7-9 hour longevity. COD in Pakistan.', 'perfume for women, rose perfume, vanilla perfume Pakistan'),

  ('timera-blanc-aqua', 'Timera Blanc Aqua', 'Timera', 'Signature Parfum', 'Unisex Perfume', 'perfume', 4200, 3200, 5000,
   '/__l5e/assets-v1/9f0cb44d-4597-45a4-897d-1f48c36e1762/perfume-4.jpg',
   '["/__l5e/assets-v1/9f0cb44d-4597-45a4-897d-1f48c36e1762/perfume-4.jpg"]'::jsonb,
   'Clean, airy and fresh — sea salt, white musk and citrus. The everyday summer fragrance that works on anyone, any time.',
   '["Light and fresh — perfect for summer","Unisex, office safe","5-7 hour wear","Non-staining formula"]'::jsonb,
   '["Blanc #f2f0ea"]'::jsonb, '["50ml","100ml"]'::jsonb, 4.7, 29, null, 50, false, true, 4,
   'Fresh Aquatic', 'Eau de Parfum', 100,
   '["Sea Salt","Lemon","Mint"]'::jsonb, '["Marine Accord","Neroli"]'::jsonb, '["White Musk","Driftwood","Ambergris"]'::jsonb,
   '5-7 hours', 'Soft', 'Unisex', 'Quartz', 'Stainless Steel', 'Leather', '50m',
   'Timera Blanc Aqua — Fresh Unisex Perfume 100ml', 'Sea salt, neroli and white musk. A light everyday unisex perfume with cash on delivery.', 'unisex perfume, fresh perfume, summer perfume Pakistan'),

  ('timera-royal-attar', 'Timera Royal Attar', 'Timera', 'Oud & Attar', 'Attar & Oud', 'perfume', 3200, 2400, 3800,
   '/__l5e/assets-v1/6507b143-1fed-4e87-9ca9-e2cd5c2fc920/perfume-5.jpg',
   '["/__l5e/assets-v1/6507b143-1fed-4e87-9ca9-e2cd5c2fc920/perfume-5.jpg"]'::jsonb,
   'Pure alcohol-free attar oil in a hand-finished bottle — amber, musk and oud concentrate. One dab lasts the whole day, perfect for Jumma and namaz.',
   '["100% alcohol-free — namaz friendly","12+ hours from a single dab","Concentrated oil, 12ml lasts months","Traditional ornate bottle"]'::jsonb,
   '["Gold #c8a24a"]'::jsonb, '["6ml","12ml"]'::jsonb, 5.0, 61, 'Limited', 30, true, true, 5,
   'Oriental Attar', 'Concentrated Oil (Attar)', 12,
   '["Amber","Saffron"]'::jsonb, '["Rose","Oud"]'::jsonb, '["Musk","Sandalwood"]'::jsonb,
   '12+ hours', 'Heavy', 'Unisex', 'Quartz', 'Stainless Steel', 'Leather', '50m',
   'Timera Royal Attar — Alcohol Free Oud Attar Oil', 'Alcohol-free concentrated attar with amber, rose and oud. 12+ hours from one dab. COD available.', 'attar, alcohol free perfume, oud oil, namaz perfume'),

  ('timera-trio-gift-set', 'Timera Trio Gift Set', 'Timera', 'Gift Sets', 'Gift Sets', 'perfume', 9500, 6900, 11000,
   '/__l5e/assets-v1/cc58f776-54e7-441c-86ad-01ce5789fad2/perfume-6.jpg',
   '["/__l5e/assets-v1/cc58f776-54e7-441c-86ad-01ce5789fad2/perfume-6.jpg"]'::jsonb,
   'Three of our best-selling fragrances in a black magnetic gift box with gold ribbon — Noir Oud, Rose Elixir and Blanc Aqua in 30ml each. The easiest gift you will ever give.',
   '["3 × 30ml full-strength perfumes","Luxury magnetic gift box included","Free gift wrapping and card","Saves Rs 4,100 vs buying separately"]'::jsonb,
   '["Gift Box #101010"]'::jsonb, '["3 × 30ml"]'::jsonb, 4.9, 24, 'Sale', 25, true, true, 6,
   'Mixed Set', 'Eau de Parfum', 90,
   '["Bergamot","Saffron","Lychee"]'::jsonb, '["Rose","Marine Accord"]'::jsonb, '["Oud","Vanilla","Musk"]'::jsonb,
   '6-10 hours', 'Varies', 'Unisex', 'Quartz', 'Stainless Steel', 'Leather', '50m',
   'Timera Trio Perfume Gift Set — 3 × 30ml', 'Three best-selling Timera perfumes in a luxury gift box. Free wrapping, cash on delivery.', 'perfume gift set, gift box Pakistan, perfume bundle')
on conflict (slug) do nothing;
