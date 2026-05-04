import type { GarmentCategory } from "@/lib/types";

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
  mode: "doubao" | "placeholder";
};

const DEFAULT_DOUBAO_MODEL = "doubao-seedream-4-5-251128";

const categoryToGarmentDescription: Record<GarmentCategory, string> = {
  upper_body: "上装（含外套/衬衫/T恤等上半身衣物）",
  lower_body: "下装（裤/裙等下半身衣物）",
  dresses: "连衣裙/连体裙装",
};

function firstDataItem(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const p = payload as Record<string, unknown>;
  const data = p.data;
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  const first = data[0];
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

function buildTryOnPrompt(category: GarmentCategory): string {
  const garment = categoryToGarmentDescription[category];
  return [
    "【任务 / TASK】Virtual try-on (outfit transfer): put the garment from IMAGE 2 onto the person in IMAGE 1.",
    "",
    "【输入顺序 / INPUT ORDER — must match the uploaded UI】",
    "• image[0] (first image in the `image` array) = USER PERSON PHOTO — full-body or upper-body portrait. This is the ONLY source for identity, face, hair, skin tone, body shape, pose, camera angle, background, and global lighting. Do NOT replace this person or scene.",
    "• image[1] (second image) = GARMENT REFERENCE — flat-lay, hanger shot, or e-commerce product photo. Extract ONLY the garment category: 「" +
      garment +
      "」— silhouette, color, pattern, fabric texture, and structure (neckline, sleeves, hem, placket, pockets, etc.). If image[1] shows a model, copy ONLY the clothes, NOT their face, body, or pose.",
    "",
    "【输出 / OUTPUT】",
    "One photorealistic result: the SAME person and scene as image[0], wearing the garment from image[1]. Clothing must fit the body naturally (wrinkles, occlusion, perspective).",
    "",
    "【严禁 / HARD NEGATIVES】",
    "Do NOT output image[0] unchanged as if no swap happened.",
    "Do NOT treat image[1] as the main scene or output a copy of image[1]'s composition/model as the result.",
    "Do NOT swap identities or paste a floating garment without a coherent body.",
  ].join("\n");
}

async function generateWithDoubao(input: TryOnGenerateInput): Promise<TryOnGenerateResult | null> {
  const token = process.env.ARK_API_KEY?.trim();

  if (!token) {
    return null;
  }

  const model =
    process.env.DOUBAO_MODEL?.trim() ||
    process.env.AI_IMAGE_MODEL?.trim() ||
    DEFAULT_DOUBAO_MODEL;

  const personDataUrl = `data:${input.personMime};base64,${input.personBytes.toString("base64")}`;
  const garmentDataUrl = `data:${input.garmentMime};base64,${input.garmentBytes.toString("base64")}`;
  // 与界面一致：左/先上传 = 人物，右/后上传 = 服装；数组顺序 [人物, 服装]。
  const prompt = buildTryOnPrompt(input.category);

  try {
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

      throw new Error(`Doubao generation failed: ${start.status} ${text}`);
    }

    const json = (await start.json()) as unknown;
    const extracted = extractDoubaoImageData(json);

    if (!extracted) {
      throw new Error("Doubao returned no image data (no url or b64_json in response)");
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
      throw new Error(`Failed to download Doubao output: ${imageRes.status}`);
    }

    const buf = Buffer.from(await imageRes.arrayBuffer());

    return {
      imageBase64: buf.toString("base64"),
      mimeType: imageRes.headers.get("content-type") ?? "image/png",
      mode: "doubao",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Doubao error";

    console.warn("Doubao try-on unavailable, falling back to placeholder:", message);
    return null;
  }
}

/**
 * Generates a try-on image. Uses Volcengine Ark (Doubao Seedream) when ARK_API_KEY is set;
 * otherwise echoes the person image as a placeholder for local development.
 */
export async function generateTryOnImage(
  input: TryOnGenerateInput,
): Promise<TryOnGenerateResult> {
  const doubao = await generateWithDoubao(input);

  if (doubao) {
    return doubao;
  }

  return {
    imageBase64: input.personBytes.toString("base64"),
    mimeType: input.personMime,
    mode: "placeholder",
  };
}
