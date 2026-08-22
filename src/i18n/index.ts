// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./pt-BR.json";
import en from "./en.json";

export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

const STORAGE_KEY = "agora.locale";

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "pt-BR") return stored;
  return "pt-BR";
}

export function persistLocale(locale: Locale): void {
  window.localStorage.setItem(STORAGE_KEY, locale);
}

export async function changeLocale(locale: Locale): Promise<void> {
  persistLocale(locale);
  await i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
}

export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
  },
  lng: readStoredLocale(),
  fallbackLng: "pt-BR",
  showSupportNotice: false,
  interpolation: { escapeValue: false },
});

export default i18n;
