# Full Store Upgrade Plan

Bohat bara scope hai — pehle plan approve karo, phir ek-ek karke ship karta hun. Har phase alag migration/commit hoga taake kuch break na ho.

## Phase 1 — Data & Content (DB s wired, instantly visible)

1. **Products import (CSV)** — 90 products aap ki uploaded CSV se `products` table me insert. Existing rows update, new rows insert (upsert on `slug`). Images CSV k `image_url`/`gallery` fields se as-is use hongi (already `/__l5e/assets-v1/...` CDN pointers hain).
2. **Pakistani reviews (English + Urdu mix)** — ~40 reviews AI se generate karke `reviews` table me insert. Realistic PK names (Ahmed, Fatima, Bilal, Sana…), cities (Karachi, Lahore, Islamabad), Roman-Urdu + English mix. `approved=true`, kuch `featured=true`.
3. **Trust page content** — `trust_sections` me proper groups seed karunga: Warranty, Authentic, Fast Delivery, Secure Payments, Returns, Customer Care.

## Phase 2 — Meta Pixel: Advanced Tracking (module per event)

Current single `tracking.ts` ko split karunga per-event modules me:
```
src/lib/tracking/
  index.ts           (init + shared helpers)
  pageView.ts
  viewContent.ts
  addToCart.ts
  removeFromCart.ts
  viewCart.ts
  beginCheckout.ts
  addPaymentInfo.ts
  purchase.ts
  search.ts
  addToWishlist.ts
  contact.ts
  lead.ts            (newsletter/signup)
  scrollDepth.ts     (25/50/75/100%)
  timeOnPage.ts
  outboundClick.ts
  whatsappClick.ts
```
Each event fires: Meta Pixel + GA4 + `analytics_events` DB row → admin me full user journey dikhega. Meta Pixel ID aap admin/settings me daaloge — pehle se field bana hua hai, bas toggle on karna hai.

## Phase 3 — AI Features (Lovable AI Gateway, no key needed)

1. **AI product recommendations** — home + product page pe "You might like" carousel jo user history/current product se semantic match kare.
2. **AI search** — search bar me natural language ("blue diver watch under 8000") → filtered results.
3. **AI style advisor chat** — floating widget (already `AiAssistant.tsx` hai, upgrade karunga tools ke saath — product lookup, order status, size guide).
4. **AI-generated SEO** — product save karte waqt auto `seo_title`/`description`/`keywords` fill (admin button).
5. **AI review summary** — product page pe reviews ka 2-line AI summary.

## Phase 4 — SEO (target: high score)

- Har route pe unique `head()` — title, description, canonical, OG, twitter, JSON-LD (Product, Organization, BreadcrumbList, Review, FAQ).
- `public/robots.txt` + dynamic `sitemap.xml` (already hai, verify).
- `public/llms.txt` for AI crawlers.
- Alt text on all images, semantic HTML, single H1 per page.
- Preload LCP hero image, lazy-load below-fold.

## Phase 5 — Speed Optimization

- Route-level code splitting already active (TanStack) — verify.
- Image `loading="lazy"` + `decoding="async"` + `fetchpriority="high"` on LCP.
- Query cache tuning (staleTime 5min for catalog).
- Remove unused deps if any; verify bundle sizes.

## Phase 6 — 30 New Features (latest, not old)

1. Wishlist with heart animation + shareable link
2. Recently viewed products strip
3. Compare products (up to 3)
4. Quick view modal
5. Stock urgency badge ("Only 3 left")
6. Live visitor counter per product ("12 viewing now")
7. Countdown timer on deals
8. Free shipping progress bar in cart
9. Trust badges strip on checkout
10. Multi-currency display (PKR base, USD/AED convert)
11. Size/wrist guide with visual
12. 360° image viewer (if multi-gallery)
13. Zoom-on-hover product images
14. Bundle & save offers
15. Loyalty points display in header
16. Referral share ("Give 500 PKR, Get 500 PKR")
17. Order tracking with visual timeline
18. WhatsApp order confirmation button
19. Save-for-later in cart
20. Guest checkout + optional account create post-purchase
21. Coupon auto-apply from URL
22. Newsletter popup with discount
23. Exit-intent popup
24. Product FAQ accordion (AI-generated per product)
25. Video reviews section
26. Instagram feed embed on home
27. Sticky "Add to Cart" bar on product page (mobile)
28. Search with autocomplete + product thumbnails
29. Recently purchased notifications ("Ali from Lahore bought this 2 min ago")
30. PWA install prompt + offline cart

## Phase 7 — Vercel Build QA

- `.vercelignore` fix already done (build passes locally).
- Run full `VERCEL=1 vite build` after each phase to catch regressions.
- Verify no `process.env` leaks, no `client.server` imports in client graph.
- Confirm all migrations run cleanly.

## Technical Notes

- **DB migrations**: 3-4 migrations total (products upsert, reviews seed, trust content, new-features tables like `wishlists`, `recently_viewed`, `loyalty_points`, `referrals`, `product_faqs`, `product_videos`).
- **Meta Pixel ID**: aap admin/settings me daaloge. Sab tracking us se auto-init hogi. Aap Meta Events Manager me sab dekh sakenge (page views, add-to-cart, purchase with values, custom events like scroll depth).
- **AI**: `LOVABLE_API_KEY` already provisioned — no config needed from aap ki side.
- **Effort estimate**: yeh ~15-25 turns lega. Har phase ke baad preview me verify karenge.

## Approval

Approve karo to Phase 1 se start karta hun. Ya agar kuch drop/adjust karna hai (e.g., "skip loyalty points", "sirf 15 features chahiye", "reviews main hi likhun ga") to abhi bata do.
