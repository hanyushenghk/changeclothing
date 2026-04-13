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
  // 界面：左=第一张=person photo，右=第二张=clothing item。请求顺序与界面一致：[人物, 服装]。
  // 若此前 [服装,人物] 导致成片像「第二张服装图」，多为模型更重视数组首图；人物放首位以锁定构图与身份。
  const prompt = `图1：用户的 person photo（界面「第一张」上传的人物照片）。图2：clothing item 服装参考图（界面「第二张」，可能是平铺或模特图）。
任务：以图1为唯一成片基底——镜头、背景、人物脸型、发型、体态、姿势、光线必须与图1一致，仅替换衣着。
从图2中只识别并提取${categoryToGarmentDescription[input.category]}的款式、颜色、面料与结构（袖长、衣长、领口、下摆等），把这套衣服穿到图1人物身上。服装细节必须与图2中那件衣服一致。
严禁：把图2当作成片输出、让成片看起来像在复刻图2的构图/场景/模特身体；禁止用图2的背景或人物取代图1；禁止输出与图2几乎相同的画面。
若图2含模特，只拷贝衣服，不拷贝模特的脸、身材或站姿。`;
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
