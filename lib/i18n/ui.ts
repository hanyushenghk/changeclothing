import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/ui-en";
import { zh } from "@/lib/i18n/ui-zh";
import type { UiDictionary } from "@/lib/i18n/ui-types";

export type { UiDictionary } from "@/lib/i18n/ui-types";

export function getUi(locale: Locale): UiDictionary {
  return locale === "zh" ? zh : en;
}
