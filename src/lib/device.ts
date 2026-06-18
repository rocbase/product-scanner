export type DevicePlatform = "ios" | "mac" | "desktop" | "unknown";

export function getPlatform(): DevicePlatform {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isMac =
    /Macintosh|Mac OS X/.test(ua) &&
    !("ontouchend" in document) &&
    navigator.maxTouchPoints <= 1;
  const isAndroid = /Android/.test(ua);

  if (isIOS) return "ios";
  if (isMac) return "mac";
  if (isAndroid || /Windows|Linux/.test(ua)) return "desktop";
  return "unknown";
}

export function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function canNativeInstall(): boolean {
  return typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;
}