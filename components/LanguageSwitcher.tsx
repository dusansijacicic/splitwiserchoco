"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { sr: string; en: string };
}) {
  const [pending, startTransition] = useTransition();

  function pick(l: Locale) {
    if (l === locale || pending) return;
    startTransition(() => setLocale(l));
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => pick("sr")}
        className={locale === "sr" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}
      >
        {labels.sr}
      </button>
      <span className="text-muted">/</span>
      <button
        type="button"
        onClick={() => pick("en")}
        className={locale === "en" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}
      >
        {labels.en}
      </button>
    </div>
  );
}
