import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { siteSettingsQuery } from "@/lib/site-settings";
import { initMetaPixel } from "@/lib/pixels/meta-pixel";
import { initGooglePixel } from "@/lib/pixels/google-pixel";
import { initTiktokPixel, tiktokPage } from "@/lib/pixels/tiktok-pixel";
import { initLinkedInPixel } from "@/lib/pixels/linkedin-pixel";
import { initSnapchatPixel, snapTrack } from "@/lib/pixels/snapchat-pixel";
import { initPinterestPixel, pinterestPage } from "@/lib/pixels/pinterest-pixel";
import { initBingPixel, setVerificationMeta } from "@/lib/pixels/bing-pixel";

export function TrackingPixels() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const location = useRouterState({ select: (s) => s.location });

  // Meta Pixel always boots (falls back to the built-in pixel id).
  useEffect(() => {
    initMetaPixel(settings?.metaPixelId);
  }, [settings?.metaPixelId]);

  // TikTok always boots too (built-in pixel id fallback).
  useEffect(() => {
    initTiktokPixel(settings?.tiktokPixelId);
  }, [settings?.tiktokPixelId]);

  useEffect(() => {
    if (!settings?.googleTagId) return;
    initGooglePixel(settings.googleTagId, settings.googleAdsPurchaseLabel);
  }, [settings?.googleTagId, settings?.googleAdsPurchaseLabel]);

  useEffect(() => {
    initLinkedInPixel(settings?.linkedinPartnerId);
  }, [settings?.linkedinPartnerId]);

  useEffect(() => {
    initSnapchatPixel(settings?.snapchatPixelId);
  }, [settings?.snapchatPixelId]);

  useEffect(() => {
    initPinterestPixel(settings?.pinterestTagId);
  }, [settings?.pinterestTagId]);

  useEffect(() => {
    initBingPixel(settings?.bingUetTagId);
  }, [settings?.bingUetTagId]);

  // Search-engine ownership verification tags (Bing Webmaster / Google / Pinterest).
  useEffect(() => {
    setVerificationMeta("msvalidate.01", settings?.bingSiteVerification);
    setVerificationMeta("google-site-verification", settings?.googleSiteVerification);
    setVerificationMeta("p:domain_verify", settings?.pinterestSiteVerification);
  }, [settings?.bingSiteVerification, settings?.googleSiteVerification, settings?.pinterestSiteVerification]);

  // Route changes → page views on auxiliary networks. Meta + internal analytics
  // are fired once by AutoTracker/trackEvent to avoid duplicate conversion data.
  useEffect(() => {
    tiktokPage();
    pinterestPage();
    snapTrack("PAGE_VIEW", {});
  }, [location.pathname, location.searchStr]);

  return null;
}
