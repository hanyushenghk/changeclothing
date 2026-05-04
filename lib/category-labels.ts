import type { Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import type { GarmentCategory } from "@/lib/types";

export function categoryLabel(category: GarmentCategory, locale: Locale): string {
  const { category: labels } = getUi(locale);

  if (category === "dresses") {
    return labels.dress;
  }

  if (category === "lower_body") {
    return labels.lower;
  }

  return labels.upper;
}
