import type { Language } from "@/utils/data";

export const LANGUAGE_COOKIE = "language";
export const LANGUAGE_STORAGE_KEY = "language";
export const DEFAULT_LANGUAGE: Language = "en";

export function parseLanguage(value: string | undefined | null): Language {
  return value === "ch" ? "ch" : "en";
}

export function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function persistLanguage(language: Language) {
  setLanguageCookie(language);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(language));
}
