import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://frederick-aurelio-halim.vercel.app";

export const SITE_NAME = "Frederick Aurelio Halim";
export const SITE_SHORT_NAME = "Frederick Halim";
export const SITE_ALTERNATE_NAME = "林健昌";
export const SITE_JOB_TITLE = "Full-Stack Developer";

export const SITE_DESCRIPTION =
  "Full-stack developer who builds and deploys web apps with React, Next.js, NestJS, and Express. Open to frontend and full-stack roles.";

export const SITE_EMAIL = "frederick.ah88@gmail.com";
export const SITE_GITHUB = "https://github.com/FrederickAurelio";

export const SITE_KEYWORDS = [
  "Frederick Aurelio Halim",
  "full-stack developer",
  "web developer",
  "frontend developer",
  "React",
  "Next.js",
  "NestJS",
  "Express",
  "TypeScript",
  "Hangzhou",
  "portfolio",
];

export const SITE_SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "NestJS",
  "Express",
  "PostgreSQL",
  "MongoDB",
];

export function absoluteUrl(path = ""): string {
  return new URL(path, SITE_URL).toString();
}

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_JOB_TITLE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_JOB_TITLE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_JOB_TITLE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/avatar.jpg",
    apple: "/avatar.jpg",
  },
  category: "technology",
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};
