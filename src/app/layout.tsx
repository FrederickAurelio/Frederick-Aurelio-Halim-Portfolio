import type { Metadata } from "next";
import Script from "next/script";
import JsonLd from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { FONT_CDN_ORIGIN } from "@/lib/fonts";
import { rootMetadata } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = rootMetadata;

const fontLangInit = `(function(){var o=${JSON.stringify(FONT_CDN_ORIGIN)};var i="noto-sans-sc-font";var l="ch";try{var s=localStorage.getItem("language");l=s?JSON.parse(s):"ch"}catch(e){}document.documentElement.classList.add(l==="en"?"lang-en":"lang-ch");document.documentElement.lang=l==="en"?"en":"zh-CN";if(l==="en"||document.getElementById(i))return;var p=document.createElement("link");p.rel="preconnect";p.href=o.replace("fonts.googleapis","fonts.gstatic");p.crossOrigin="anonymous";document.head.appendChild(p);var n=document.createElement("link");n.id=i;n.rel="stylesheet";n.href=o+"/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap";document.head.appendChild(n)})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full">
        <JsonLd />
        <Script id="font-lang-init" strategy="beforeInteractive">
          {fontLangInit}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
