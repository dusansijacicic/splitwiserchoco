import { cookies } from "next/headers";
import { defaultLocale, dictionaries, locales, type Locale } from "@/lib/i18n/dictionaries";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return (locales as string[]).includes(value ?? "") ? (value as Locale) : defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

// Server Components can't pass functions as props to Client Components
// (RSC serialization only allows plain data), so dictionary slices that
// mix functions (for server-side interpolation) with plain strings need
// the functions stripped before being handed to a "use client" component.
export function omitFns<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const copy = { ...obj };
  for (const k of keys) delete copy[k];
  return copy;
}
