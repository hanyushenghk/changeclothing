"use client";

import type { DetectionSource } from "@/context/game-context-types";
import type { GarmentCategory } from "@/lib/types";

type DetectCategoryResponse = {
  category?: GarmentCategory;
  source?: DetectionSource;
  error?: string;
};

type TryOnResponse = {
  imageBase64?: string;
  mimeType?: string;
  mode?: "doubao";
  error?: string;
};

export async function detectGarmentFile(
  garmentFile: File,
  locale: string,
): Promise<{ category: GarmentCategory; source: DetectionSource }> {
  const body = new FormData();
  body.append("garment", garmentFile);
  body.append("locale", locale);

  const res = await fetch("/api/detect-category", {
    method: "POST",
    body,
  });
  const json = (await res.json()) as DetectCategoryResponse;

  if (!res.ok) {
    throw new Error(json.error ?? "Failed to classify garment.");
  }

  if (!json.category) {
    throw new Error("Missing category from server.");
  }

  return {
    category: json.category,
    source: json.source ?? "gemini",
  };
}

export async function generateTryOnPreview(args: {
  personFile: File;
  garmentFile: File;
  category: GarmentCategory;
}): Promise<{ dataUrl: string }> {
  const body = new FormData();
  body.append("person", args.personFile);
  body.append("garment", args.garmentFile);
  body.append("category", args.category);

  const res = await fetch("/api/try-on", {
    method: "POST",
    body,
  });
  const json = (await res.json()) as TryOnResponse;

  if (!res.ok) {
    throw new Error(json.error ?? "Try-on failed.");
  }

  if (!json.imageBase64 || !json.mimeType) {
    throw new Error("Malformed try-on response.");
  }

  return {
    dataUrl: `data:${json.mimeType};base64,${json.imageBase64}`,
  };
}
