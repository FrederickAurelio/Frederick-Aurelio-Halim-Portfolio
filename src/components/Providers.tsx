"use client";

import { TextLanguage } from "@/context/TextContext";
import type { Language } from "@/utils/data";

type ProvidersProps = {
  children: React.ReactNode;
  initialLanguage: Language;
};

export function Providers({ children, initialLanguage }: ProvidersProps) {
  return (
    <TextLanguage initialLanguage={initialLanguage}>{children}</TextLanguage>
  );
}
