"use client";

import { TextLanguage } from "@/context/TextContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TextLanguage>{children}</TextLanguage>;
}
