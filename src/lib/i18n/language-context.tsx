"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { translate, type Locale } from "./dictionaries";

const LanguageContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string }>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "trackflow.locale";

export function LanguageProvider({ initialLocale, children }: { initialLocale?: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");
  const supabase = createClient();

  useEffect(() => {
    if (initialLocale) return;
    const stored = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Locale | null) : null;
    if (stored) setLocaleState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void supabase.from("profiles").update({ locale: next }).eq("id", data.user.id);
    });
  }

  const value = useMemo(() => ({ locale, setLocale, t: (key: string) => translate(locale, key) }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
