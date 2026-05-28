import type { GarmentCategory } from "@/lib/types";

import { normalizeCategoryLabel } from "@/lib/garment-category";
import { GARMENT_DETECTION_PROMPT } from "@/prompts/garment-detection";

async function detectWithGemini(
  garmentBytes: Buffer,
  mimeType: string,
): Promise<GarmentCategory> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY for garment detection.");
  }

  const model = process.env.GEMINI_TRYON_MODEL ?? "gemini-1.5-flash";
  const b64 = garmentBytes.toString("base64");

  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: b64,
            },
          },
          {
            text: GARMENT_DETECTION_PROMPT,
          },
        ],
      },
    ],
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();

    throw new Error(`Gemini garment detection failed with status ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

  return normalizeCategoryLabel(text);
}

export type DetectGarmentInput = {
  garmentBytes: Buffer;
  mimeType: string;
};

/**
 * Attempts Gemini and fails when the classifier cannot produce a valid category.
 */
export async function detectGarmentCategory(input: DetectGarmentInput): Promise<{
  category: GarmentCategory;
  source: "gemini";
}> {
  return {
    category: await detectWithGemini(input.garmentBytes, input.mimeType),
    source: "gemini",
  };
}
