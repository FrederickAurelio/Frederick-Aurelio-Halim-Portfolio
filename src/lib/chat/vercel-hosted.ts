/** Client-side: site is served from Vercel (not VPS Docker). */
export function isVercelHostedSite(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith(".vercel.app");
}
