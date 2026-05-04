export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "CC_LOCALE";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefix a path with locale, e.g. `/try` → `/en/try` */
export function withLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function parseLocalePath(pathname: string): { locale: Locale; restPath: string } | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const first = segments[0];
  if (!isLocale(first)) {
    return null;
  }
  const rest = segments.slice(1).join("/");
  return { locale: first, restPath: rest ? `/${rest}` : "/" };
}
