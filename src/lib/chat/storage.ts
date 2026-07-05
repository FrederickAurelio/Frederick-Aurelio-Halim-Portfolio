const SEEN_DESKTOP_KEY = "portfolio-chat-seen-desktop-v1";
const OPEN_DESKTOP_KEY = "portfolio-chat-open-desktop-v1";
const OPEN_MOBILE_KEY = "portfolio-chat-open-mobile-v1";

const DESKTOP_MEDIA = "(min-width: 768px)";

export function isDesktopViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(DESKTOP_MEDIA).matches;
}

export function getDesktopChatSeen(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SEEN_DESKTOP_KEY) === "1";
}

export function setDesktopChatSeen(): void {
  localStorage.setItem(SEEN_DESKTOP_KEY, "1");
}

export function getChatOpenPreference(): boolean | null {
  if (typeof window === "undefined") return null;
  const key = isDesktopViewport() ? OPEN_DESKTOP_KEY : OPEN_MOBILE_KEY;
  const value = localStorage.getItem(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function setChatOpenPreference(open: boolean): void {
  const key = isDesktopViewport() ? OPEN_DESKTOP_KEY : OPEN_MOBILE_KEY;
  localStorage.setItem(key, open ? "true" : "false");
}

export function getInitialChatOpen(): boolean {
  if (typeof window === "undefined") return false;

  if (isDesktopViewport()) {
    const seen = getDesktopChatSeen();
    if (!seen) {
      setDesktopChatSeen();
      setChatOpenPreference(true);
      return true;
    }
    return getChatOpenPreference() ?? false;
  }

  return getChatOpenPreference() ?? false;
}
