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
  // 方舟多图生成往往以「数组中靠后的图」为构图/人物基底。界面：左=user person photo，右=clothing item。
  // 请求顺序设为 [服装, 人物]，使人物处在第二位，更符合「以人物图为底、只换装」的效果。
  // 下述「图1/图2」均指本请求里的顺序，对应界面「服装图 / 人物图」。
  const prompt = `图1：clothing item 服装参考图（可能含模特）。图2：用户的 person photo 人物照片。
必须以图2为唯一编辑基底：完整保留图2中人物的脸部、发型、姿势、体型、构图、光线与背景，只做换装。
把图1里的${categoryToGarmentDescription[input.category]}穿到图2人物身上：只从图1提取款式、颜色、面料纹理与结构细节，不要采用图1中人物的体态或场景。
服装细节必须与图1中那件衣服严格一致（袖长长袖/短袖/七分、衣长、下摆、领口、袖口与下摆收口、帽子/拉链/纽扣等）；禁止把长袖改成短袖、禁止缩短袖子或衣长、禁止简化版型。
禁止输出看起来像「以图1为主角或主场景」；结果必须是图2里那个人在同一场景，仅衣着换成图1那套衣服。`;
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
