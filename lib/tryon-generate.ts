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
  upper_body: "上装",
  lower_body: "下装",
  dresses: "连衣裙",
};

function extractDoubaoOutputUrl(payload: unknown): string | null {
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

  const url = (first as Record<string, unknown>).url;

  return typeof url === "string" ? url : null;
}

async function generateWithDoubao(
  input: TryOnGenerateInput,
): Promise<TryOnGenerateResult | null> {
  const token = process.env.ARK_API_KEY;

  if (!token) {
    return null;
  }

  const model = process.env.DOUBAO_MODEL ?? DEFAULT_DOUBAO_MODEL;
  const personDataUrl = `data:${input.personMime};base64,${input.personBytes.toString("base64")}`;
  const garmentDataUrl = `data:${input.garmentMime};base64,${input.garmentBytes.toString("base64")}`;
  // API 对多图编辑常以「第二张图」为编辑基底；故顺序为 [服装参考, 用户人物照]，保证以 person photo 为底图。
  const prompt = `必须以图2（第二张图）为唯一编辑基底：图2是用户的 person photo，保留图2里人物的脸部、发型、姿势、体型、构图和背景完全不变。
图1是 clothing item 参考图（可能含模特），只从图1提取${categoryToGarmentDescription[input.category]}的款式、颜色、面料纹理与结构细节，把这套衣服穿到图2人物身上。
服装结构必须与图1严格一致：袖长（长袖/短袖/七分袖等）、衣长、下摆长度、领口形状、袖口与下摆收口方式、是否有帽子或拉链纽扣等细节都要与图1相同；禁止擅自把长袖改成短袖、禁止缩短袖子或衣长、禁止简化版型。
不要以图1为构图或场景基底；输出应与图2同场景、同人物，仅换装。`;
  const start = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      image: [garmentDataUrl, personDataUrl],
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
  const url = extractDoubaoOutputUrl(json);

  if (!url) {
    throw new Error("Doubao returned no image URL");
  }

  const imageRes = await fetch(url);

  if (!imageRes.ok) {
    throw new Error(`Failed to download Doubao output: ${imageRes.status}`);
  }

  const buf = Buffer.from(await imageRes.arrayBuffer());

  return {
    imageBase64: buf.toString("base64"),
    mimeType: imageRes.headers.get("content-type") ?? "image/png",
    mode: "doubao",
  };
}

/**
 * Generates a try-on image. Uses Doubao when ARK_API_KEY is set;
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
