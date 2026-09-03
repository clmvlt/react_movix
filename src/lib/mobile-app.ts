import { config } from "./config";

export const APP_STORE_URL = "https://apps.apple.com/us/app/movix/id6748054148";

export const TESTFLIGHT_URL = "https://testflight.apple.com/join/67dySuzF";

export function testFlightAvailable(): boolean {
  return config.betaFeatures && TESTFLIGHT_URL.trim().length > 0;
}

export type MobilePlatform = "ios" | "android" | "other";

export function detectMobilePlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "other";

  const agent = navigator.userAgent;
  if (/android/i.test(agent)) return "android";
  if (/iPad|iPhone|iPod/i.test(agent)) return "ios";
  if (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1) return "ios";

  return "other";
}
