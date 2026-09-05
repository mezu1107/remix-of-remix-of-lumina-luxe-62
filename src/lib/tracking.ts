import { supabase } from "@/integrations/supabase/client";
import { initMetaPixel, metaTrack, metaTrackCustom, type MetaStandardEvent } from "@/lib/pixels/meta-pixel";
import { googleAdsConversion, googleTrack, initGooglePixel } from "@/lib/pixels/google-pixel";
import { tiktokTrack } from "@/lib/pixels/tiktok-pixel";
import { snapTrack } from "@/lib/pixels/snapchat-pixel";
import { pinterestTrack } from "@/lib/pixels/pinterest-pixel";
import { bingTrack } from "@/lib/pixels/bing-pixel";
import { linkedInTrack } from "@/lib/pixels/linkedin-pixel";

export type TrackingEventName =
  | "page_view"
  | "view_item"
  | "view_item_list"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase"
  | "search"
  | "view_cart"
  | "add_to_wishlist"
  | "share"
  | "sign_up"
  | "login"
  | "contact"
  | "whatsapp_click"
  | "scroll_depth"
  | "time_on_page"
  | "outbound_click"
  | "video_play"
  | "newsletter_signup"
  | "coupon_applied"
  | "quick_view"
  | "filter_apply"
  | "sort_change"
  | "exit_intent_offer"
  | "upsell_add"
  | "sticky_buy_click";

export type TrackingPayload = {
  pagePath?: string;
  referrer?: string;
  productId?: string;
  productSlug?: string;
  productName?: string;
  orderNumber?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

/** Standard Meta event per app event; `null` means send it as a custom event. */
const metaEventName: Record<TrackingEventName, MetaStandardEvent | null> = {
  page_view: "PageView",
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  add_to_cart: "AddToCart",
  remove_from_cart: null,
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
  view_cart: "ViewContent",
  add_to_wishlist: "AddToWishlist",
  share: null,
  sign_up: "CompleteRegistration",
  login: null,
  contact: "Contact",
  whatsapp_click: "Contact",
  scroll_depth: null,
  time_on_page: null,
  outbound_click: null,
  video_play: null,
  newsletter_signup: "Subscribe",
  coupon_applied: null,
  quick_view: "ViewContent",
  filter_apply: null,
  sort_change: null,
  exit_intent_offer: null,
  upsell_add: "AddToCart",
  sticky_buy_click: null,
};

const googleEventName: Record<TrackingEventName, string> = {
  page_view: "page_view",
  view_item: "view_item",
  view_item_list: "view_item_list",
  add_to_cart: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  begin_checkout: "begin_checkout",
  add_payment_info: "add_payment_info",
  purchase: "purchase",
  search: "search",
  view_cart: "view_cart",
  add_to_wishlist: "add_to_wishlist",
  share: "share",
  sign_up: "sign_up",
  login: "login",
  contact: "generate_lead",
  whatsapp_click: "whatsapp_click",
  scroll_depth: "scroll",
  time_on_page: "user_engagement",
  outbound_click: "click",
  video_play: "video_start",
  newsletter_signup: "sign_up",
  coupon_applied: "select_promotion",
  quick_view: "view_item",
  filter_apply: "filter",
  sort_change: "sort",
  exit_intent_offer: "view_promotion",
  upsell_add: "add_to_cart",
  sticky_buy_click: "select_item",
};

/** TikTok standard events. */
const tiktokEventName: Partial<Record<TrackingEventName, string>> = {
  page_view: "Pageview",
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  quick_view: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "CompletePayment",
  search: "Search",
  sign_up: "CompleteRegistration",
  contact: "Contact",
  whatsapp_click: "Contact",
  newsletter_signup: "Subscribe",
  upsell_add: "AddToCart",
  sticky_buy_click: "ClickButton",
};

/** Snapchat standard events. */
const snapEventName: Partial<Record<TrackingEventName, string>> = {
  page_view: "PAGE_VIEW",
  view_item: "VIEW_CONTENT",
  view_item_list: "VIEW_CONTENT",
  quick_view: "VIEW_CONTENT",
  add_to_cart: "ADD_CART",
  add_to_wishlist: "ADD_TO_WISHLIST",
  begin_checkout: "START_CHECKOUT",
  add_payment_info: "ADD_BILLING",
  purchase: "PURCHASE",
  search: "SEARCH",
  sign_up: "SIGN_UP",
  login: "LOGIN",
  contact: "CUSTOM_EVENT_2",
  whatsapp_click: "CUSTOM_EVENT_2",
  newsletter_signup: "SUBSCRIBE",
  upsell_add: "ADD_CART",
};

/** Pinterest standard events. */
const pinterestEventName: Partial<Record<TrackingEventName, string>> = {
  page_view: "pagevisit",
  view_item: "pagevisit",
  view_item_list: "viewcategory",
  quick_view: "pagevisit",
  add_to_cart: "addtocart",
  begin_checkout: "checkout",
  purchase: "checkout",
  search: "search",
  sign_up: "signup",
  newsletter_signup: "lead",
  contact: "lead",
  whatsapp_click: "lead",
  upsell_add: "addtocart",
};

/** Kept for backwards compatibility with existing imports. */
export { initMetaPixel };
export const initGoogleTag = initGooglePixel;

function fireBrowserPixels(name: TrackingEventName, payload: TrackingPayload) {
  const value = Number(payload.value ?? 0) || undefined;
  const currency = payload.currency ?? "PKR";

  const metaParams = {
    content_ids: payload.productId ? [payload.productId] : undefined,
    content_name: payload.productName,
    content_type: payload.productId ? "product" : undefined,
    value,
    currency,
    ...(payload.metadata ?? {}),
  };
  const standard = metaEventName[name];
  if (standard) metaTrack(standard, metaParams);
  else metaTrackCustom(name, metaParams);

  googleTrack(googleEventName[name], {
    page_path: payload.pagePath ?? window.location.pathname,
    currency,
    value,
    transaction_id: payload.orderNumber,
    items: payload.metadata?.items,
    item_id: payload.productId,
    item_name: payload.productName,
  });

  // TikTok
  tiktokTrack(tiktokEventName[name] ?? "ClickButton", {
    content_id: payload.productId,
    content_name: payload.productName,
    content_type: payload.productId ? "product" : undefined,
    value,
    currency,
  });

  // Snapchat
  snapTrack(snapEventName[name] ?? "CUSTOM_EVENT_1", {
    item_ids: payload.productId ? [payload.productId] : undefined,
    item_category: payload.productName,
    price: value,
    currency,
    transaction_id: payload.orderNumber,
  });

  // Pinterest
  pinterestTrack(pinterestEventName[name] ?? "custom", {
    product_id: payload.productId,
    product_name: payload.productName,
    value,
    currency,
    order_id: payload.orderNumber,
  });

  // Microsoft / Bing UET
  bingTrack(googleEventName[name], {
    ecomm_prodid: payload.productId,
    revenue_value: value,
    currency,
    transaction_id: payload.orderNumber,
  });

  if (name === "purchase") {
    googleAdsConversion({ value, currency, transactionId: payload.orderNumber });
    linkedInTrack(payload.metadata?.linkedInConversionId as string | undefined);
  }
}


function getSessionId() {
  const key = "timera-analytics-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const random = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, random);
  return random;
}

export async function trackEvent(name: TrackingEventName, payload: TrackingPayload = {}) {
  if (typeof window === "undefined") return;
  fireBrowserPixels(name, payload);
  const pagePath = payload.pagePath ?? `${window.location.pathname}${window.location.search}`;
  const { error } = await (supabase.from("analytics_events" as any) as any).insert({
    event_name: name,
    session_id: getSessionId(),
    page_path: pagePath,
    referrer: payload.referrer ?? document.referrer ?? null,
    product_id: payload.productId ?? null,
    product_slug: payload.productSlug ?? null,
    product_name: payload.productName ?? null,
    order_number: payload.orderNumber ?? null,
    value: payload.value ?? null,
    currency: payload.currency ?? "PKR",
    metadata: payload.metadata ?? {},
    user_agent: navigator.userAgent,
  });
  if (error) console.warn("Tracking event was not saved", error.message);
}
