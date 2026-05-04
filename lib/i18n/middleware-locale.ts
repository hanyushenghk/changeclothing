import type { NextRequest } from "next/server";

import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

export function detectLocaleFromRequest(request: NextRequest): Locale {
  const raw = request.cookies.get(LOCALE_COOKIE)?.value;
  if (raw && isLocale(raw)) {
    return raw;
  }
  const accept = request.headers.get("accept-language") ?? "";
  const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("zh")) {
    return "zh";
  }
  return defaultLocale;
}
