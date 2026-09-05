/**
 * Per-event tracking helpers.
 * Each event is a dedicated function that wraps trackEvent with
 * the correct payload shape — one "pixel module" per user action.
 */
import { trackEvent, type TrackingPayload } from "@/lib/tracking";

export const trackPageView = (path?: string) =>
  trackEvent("page_view", { pagePath: path });

export const trackViewItem = (p: TrackingPayload) => trackEvent("view_item", p);
export const trackViewItemList = (p: TrackingPayload) => trackEvent("view_item_list", p);
export const trackQuickView = (p: TrackingPayload) => trackEvent("quick_view", p);

export const trackAddToCart = (p: TrackingPayload) => trackEvent("add_to_cart", p);
export const trackRemoveFromCart = (p: TrackingPayload) => trackEvent("remove_from_cart", p);
export const trackViewCart = (p: TrackingPayload) => trackEvent("view_cart", p);
export const trackAddToWishlist = (p: TrackingPayload) => trackEvent("add_to_wishlist", p);

export const trackBeginCheckout = (p: TrackingPayload) => trackEvent("begin_checkout", p);
export const trackAddPaymentInfo = (p: TrackingPayload) => trackEvent("add_payment_info", p);
export const trackPurchase = (p: TrackingPayload) => trackEvent("purchase", p);
export const trackCouponApplied = (code: string, value?: number) =>
  trackEvent("coupon_applied", { metadata: { code }, value });

export const trackSearch = (query: string) =>
  trackEvent("search", { metadata: { query } });
export const trackFilterApply = (filters: Record<string, unknown>) =>
  trackEvent("filter_apply", { metadata: { filters } });
export const trackSortChange = (sort: string) =>
  trackEvent("sort_change", { metadata: { sort } });

export const trackShare = (channel: string, url?: string) =>
  trackEvent("share", { metadata: { channel, url } });
export const trackContact = (method: string) =>
  trackEvent("contact", { metadata: { method } });
export const trackWhatsappClick = (context?: string) =>
  trackEvent("whatsapp_click", { metadata: { context: context ?? "generic" } });
export const trackNewsletterSignup = (email?: string) =>
  trackEvent("newsletter_signup", { metadata: { hasEmail: Boolean(email) } });

export const trackSignUp = (method: string) =>
  trackEvent("sign_up", { metadata: { method } });
export const trackLogin = (method: string) =>
  trackEvent("login", { metadata: { method } });

export const trackScrollDepth = (percent: number) =>
  trackEvent("scroll_depth", { metadata: { percent } });
export const trackTimeOnPage = (seconds: number) =>
  trackEvent("time_on_page", { metadata: { seconds } });
export const trackOutboundClick = (url: string) =>
  trackEvent("outbound_click", { metadata: { url } });
export const trackVideoPlay = (videoId: string) =>
  trackEvent("video_play", { metadata: { videoId } });
