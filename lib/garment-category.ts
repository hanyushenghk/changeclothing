import type { GarmentCategory } from "@/lib/types";

export function normalizeCategoryLabel(raw: string): GarmentCategory {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized.includes("dress") || normalized === "dresses") {
    return "dresses";
  }

  if (
    normalized.includes("lower")
    || normalized.includes("bottom")
    || normalized.includes("pants")
    || normalized.includes("skirt")
  ) {
    return "lower_body";
  }

  if (
    normalized.includes("upper")
    || normalized.includes("top")
    || normalized.includes("shirt")
    || normalized.includes("jacket")
  ) {
    return "upper_body";
  }

  throw new Error(`Unknown garment category from model: ${raw}`);
}
