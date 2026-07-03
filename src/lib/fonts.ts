/** Google Fonts China mirror — works in mainland China and worldwide. */
export const FONT_CDN_ORIGIN =
  process.env.NEXT_PUBLIC_FONT_CDN === "global"
    ? "https://fonts.googleapis.com"
    : "https://fonts.googleapis.cn";

export const NOTO_SANS_SC_STYLESHEET = `${FONT_CDN_ORIGIN}/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap`;

export const FONT_PRECONNECT_ORIGIN = FONT_CDN_ORIGIN.replace(
  "fonts.googleapis",
  "fonts.gstatic",
);
