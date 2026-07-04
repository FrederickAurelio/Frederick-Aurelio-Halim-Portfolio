"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NOTO_SANS_SC_STYLESHEET } from "@/lib/fonts";
import { persistLanguage } from "@/lib/language";
import type { Language } from "@/utils/data";

type TextContextValue = {
  language: Language;
  changeLanguage: () => void;
};

const TextContext = createContext<TextContextValue | undefined>(undefined);
const FONT_LINK_ID = "noto-sans-sc-font";

function syncDocumentLanguage(language: Language) {
  const root = document.documentElement;
  root.classList.remove("lang-en", "lang-ch");
  root.classList.add(language === "en" ? "lang-en" : "lang-ch");
  root.lang = language === "en" ? "en" : "zh-CN";
}

function ensureChineseFontLoaded() {
  if (document.getElementById(FONT_LINK_ID)) return;

  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = NOTO_SANS_SC_STYLESHEET;
  document.head.appendChild(link);
}

type TextLanguageProps = {
  children: React.ReactNode;
  initialLanguage: Language;
};

export function TextLanguage({
  children,
  initialLanguage,
}: TextLanguageProps) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    syncDocumentLanguage(language);
    persistLanguage(language);
    if (language === "ch") {
      ensureChineseFontLoaded();
    }
  }, [language]);

  const changeLanguage = () =>
    setLanguage((lg) => (lg === "en" ? "ch" : "en"));

  return (
    <TextContext.Provider value={{ language, changeLanguage }}>
      {children}
    </TextContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(TextContext);
  if (context === undefined) {
    throw new Error("TextContext is used outside Provider");
  }
  return context;
}
