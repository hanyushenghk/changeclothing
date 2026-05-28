import type { GarmentCategory } from "@/lib/types";
import { buildTryOnPrompt } from "@/prompts/try-on";

export type TryOnGenerateInput = {
  personBytes: Buffer;
  personMime: string;
  garmentBytes: Buffer;
  garmentMime: string;
  category: GarmentCategory;
};

export type TryOnGenerateResult = {
  imageBase64: string;
  mimeType: string;
  mode: "doubao";
};

const DEFAULT_DOUBAO_MODEL = "doubao-seedream-4-5-251128";

function firstDataItem(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const p = payload as Record<string, unknown>;
  const responseItems = p.data;
  if (!Array.isArray(responseItems) || responseItems.length === 0) {
    return null;
  }
  const first = responseItems[0];
  if (!first || typeof first !== "object") {
    return null;
  }
  return first as Record<string, unknown>;
}

/** Supports `url` or `b64_json` on first `data[]` item (Ark / OpenAI-compatible). */
function extractDoubaoImageData(payload: unknown): { url: string } | { base64: string } | null {
  const first = firstDataItem(payload);
  if (!first) {
    return null;
  }
  const b64 = first.b64_json;
  if (typeof b64 === "string" && b64.length > 0) {
    return { base64: b64 };
  }
  const url = first.url;
  if (typeof url === "string" && url.length > 0) {
    return { url };
  }
  return null;
}

async function generateWithDoubao(input: TryOnGenerateInput): Promise<TryOnGenerateResult> {
  const token = process.env.ARK_API_KEY?.trim();

  if (!token) {
    throw new Error("Missing ARK_API_KEY for try-on generation.");
  }

  const model =
    process.env.DOUBAO_MODEL?.trim() ||
    process.env.AI_IMAGE_MODEL?.trim() ||
    DEFAULT_DOUBAO_MODEL;

  const personDataUrl = `data:${input.personMime};base64,${input.personBytes.toString("base64")}`;
  const garmentDataUrl = `data:${input.garmentMime};base64,${input.garmentBytes.toString("base64")}`;
  // 与界面一致：左/先上传 = 人物，右/后上传 = 服装；数组顺序 [人物, 服装]。
  const prompt = buildTryOnPrompt(input.category);

  const start = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      image: [personDataUrl, garmentDataUrl],
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: true,
    }),
  });

  if (!start.ok) {
    const text = await start.text();

    throw new Error(`Doubao generation failed with status ${start.status}: ${text}`);
  }

  const json = (await start.json()) as unknown;
  const extracted = extractDoubaoImageData(json);

  if (!extracted) {
    throw new Error("Doubao returned no image data: expected data[0].url or data[0].b64_json.");
  }

  if ("base64" in extracted) {
    return {
      imageBase64: extracted.base64,
      mimeType: "image/png",
      mode: "doubao",
    };
  }

  const imageRes = await fetch(extracted.url);

  if (!imageRes.ok) {
    throw new Error(`Failed to download Doubao output from ${extracted.url}: ${imageRes.status}`);
  }

  const buf = Buffer.from(await imageRes.arrayBuffer());

  return {
    imageBase64: buf.toString("base64"),
    mimeType: imageRes.headers.get("content-type") ?? "image/png",
    mode: "doubao",
  };
}

export async function generateTryOnImage(
  input: TryOnGenerateInput,
): Promise<TryOnGenerateResult> {
  return generateWithDoubao(input);
}
