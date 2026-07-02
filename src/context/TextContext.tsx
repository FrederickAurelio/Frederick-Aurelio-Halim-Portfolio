"use client";

import { createContext, useContext } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import type { Language } from "@/utils/data";

type TextContextValue = {
  language: Language;
  changeLanguage: () => void;
};

const TextContext = createContext<TextContextValue | undefined>(undefined);

export function TextLanguage({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useLocalStorageState<Language>("ch", "language");
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
