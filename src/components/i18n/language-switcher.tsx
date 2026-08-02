"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { locales } from "@/lib/i18n/dictionaries";
import { Card, Label } from "@/components/ui/primitives";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <Card>
      <h2 className="mb-3 font-medium">Language</h2>
      <Label htmlFor="locale">App language</Label>
      <select
        id="locale"
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-ink/40">
        Applied to navigation and key screens now; full in-app translation coverage is expanding.
      </p>
    </Card>
  );
}
