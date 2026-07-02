import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frederick Aurelio Halim - Frontend Developer",
  description: "Portfolio of Frederick Aurelio Halim - Frontend Developer",
  icons: {
    icon: "/avatar.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
