import { createFileRoute } from "@tanstack/react-router";
import { CURRENCY, handle, json, preflight } from "@/lib/api.server";

/** API directory — lists every available endpoint. */
export const Route = createFileRoute("/api/public/v1/")({
  server: {
    handlers: {
      OPTIONS: preflight,
      GET: handle(async () =>
        json({
          ok: true,
          name: "Timera Store API",
          version: "1",
          currency: CURRENCY,
          base: "/api/public/v1",
          auth: "Send `Authorization: Bearer <supabase access token>` for the endpoints marked auth.",
          endpoints: {
            catalogue: {
              "GET /products": "List active products (query: search, category, collection, featured, deal, limit, offset)",
              "GET /products/:slug": "One product with gallery, colours and reviews",
              "GET /categories": "Active categories",
              "GET /collections": "Active collections",
              "GET /deals": "Live deals",
              "GET /hero-slides": "Home page hero slides",
              "GET /blog": "Published blog posts",
              "GET /blog/:slug": "One blog post",
              "GET /reviews": "Approved reviews (query: product_id, featured)",
              "POST /reviews": "auth — submit a review",
              "GET /settings": "Brand, marquee, warranty and public payment settings",
            },
            shopping: {
              "POST /coupons/validate": "Check a coupon code against an order subtotal",
              "POST /orders": "Place an order (guest or signed in)",
              "GET /orders": "auth — the signed-in customer's orders",
              "GET /orders/:orderNumber": "Track an order (query: email for guests)",
            },
            account: {
              "POST /auth/signup": "Create an account",
              "POST /auth/login": "Sign in and receive an access token",
              "POST /auth/refresh": "Exchange a refresh token for a new session",
              "POST /auth/logout": "auth — end the session",
              "GET /auth/session": "auth — the current user",
              "GET /profile": "auth — the customer profile",
              "PUT /profile": "auth — update the customer profile",
            },
            admin: {
              "GET /admin/stats": "admin — dashboard totals",
              "GET /admin/orders": "admin — every order",
              "PATCH /admin/orders": "admin — update an order status",
              "GET /admin/products": "admin — every product incl. drafts",
              "POST /admin/products": "admin — create a product",
              "PUT /admin/products": "admin — update a product",
              "DELETE /admin/products": "admin — delete a product (query: id)",
              "GET /admin/customers": "admin — customer profiles",
            },
            system: { "GET /health": "Service heartbeat" },
          },
        }),
      ),
    },
  },
});
