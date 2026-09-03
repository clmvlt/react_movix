import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: "fr",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "movix.lang",
    },
  });

export function currentLanguage(): string {
  return i18n.resolvedLanguage ?? i18n.language ?? "fr";
}

if (typeof document !== "undefined") {
  document.documentElement.lang = currentLanguage();
  i18n.on("languageChanged", () => {
    document.documentElement.lang = currentLanguage();
  });
}

export default i18n;
