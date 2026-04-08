import type { GarmentCategory } from "@/lib/types";

export function categoryLabel(category: GarmentCategory): string {
  if (category === "dresses") {
    return "Dress";
  }

  if (category === "lower_body") {
    return "Lower body";
  }

  return "Upper body";
}
