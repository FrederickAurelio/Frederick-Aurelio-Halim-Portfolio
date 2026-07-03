"use client";

import { createContext, useContext, useEffect } from "react";
import { NOTO_SANS_SC_STYLESHEET } from "@/lib/fonts";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
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

export function TextLanguage({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useLocalStorageState<Language>("ch", "language");
  const changeLanguage = () =>
    setLanguage((lg) => (lg === "en" ? "ch" : "en"));

  useEffect(() => {
    syncDocumentLanguage(language);
    if (language === "ch") {
      ensureChineseFontLoaded();
    }
  }, [language]);

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
