/**
 * PIXELS — single entry point for every marketing pixel on the site.
 * Each pixel lives in its own module; nothing else belongs in this folder.
 */
export {
  DEFAULT_META_PIXEL_ID,
  initMetaPixel,
  isMetaPixelReady,
  metaPixelIds,
  metaTrack,
  metaTrackCustom,
  type MetaStandardEvent,
} from "./meta-pixel";

export { initGooglePixel, isGooglePixelReady, googleTrack, googleAdsConversion } from "./google-pixel";

export {
  DEFAULT_TIKTOK_PIXEL_ID,
  initTiktokPixel,
  isTiktokPixelReady,
  tiktokPixelIds,
  tiktokPage,
  tiktokTrack,
} from "./tiktok-pixel";

export { initLinkedInPixel, isLinkedInPixelReady, linkedInTrack } from "./linkedin-pixel";
export { initSnapchatPixel, isSnapchatPixelReady, snapTrack } from "./snapchat-pixel";
export { initPinterestPixel, isPinterestPixelReady, pinterestPage, pinterestTrack } from "./pinterest-pixel";
export { initBingPixel, isBingPixelReady, bingTrack, setVerificationMeta } from "./bing-pixel";
