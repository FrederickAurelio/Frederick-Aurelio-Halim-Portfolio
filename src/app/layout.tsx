import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import JsonLd from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { FONT_CDN_ORIGIN } from "@/lib/fonts";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  parseLanguage,
} from "@/lib/language";
import { rootMetadata } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = rootMetadata;

const fontLangInit = `(function(){var o=${JSON.stringify(FONT_CDN_ORIGIN)};var i="noto-sans-sc-font";var c=${JSON.stringify(LANGUAGE_COOKIE)};var d=${JSON.stringify(DEFAULT_LANGUAGE)};var l=d;try{var m=document.cookie.match(new RegExp("(?:^|; )"+c+"=([^;]*)"));if(m){l=decodeURIComponent(m[1])}if(l!=="en"&&l!=="ch")l=d}catch(e){l=d}document.documentElement.classList.remove("lang-en","lang-ch");document.documentElement.classList.add(l==="en"?"lang-en":"lang-ch");document.documentElement.lang=l==="en"?"en":"zh-CN";if(l==="en"||document.getElementById(i))return;var p=document.createElement("link");p.rel="preconnect";p.href=o.replace("fonts.googleapis","fonts.gstatic");p.crossOrigin="anonymous";document.head.appendChild(p);var n=document.createElement("link");n.id=i;n.rel="stylesheet";n.href=o+"/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap";document.head.appendChild(n)})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = parseLanguage(
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );

  return (
    <html
      lang={initialLanguage === "en" ? "en" : "zh-CN"}
      className={initialLanguage === "en" ? "lang-en" : "lang-ch"}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <JsonLd />
        <Script id="font-lang-init" strategy="beforeInteractive">
          {fontLangInit}
        </Script>
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
