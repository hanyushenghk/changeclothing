type AIImageResponse = {
  imageUrl: string;
};

type AIErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
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

/**
 * Calls AI image API and returns a temporary image URL.
 */
export async function callAIImageAPI(prompt: string): Promise<AIImageResponse> {
  const token = process.env.ARK_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing ARK_API_KEY.");
  }

  const model = process.env.AI_IMAGE_MODEL?.trim() || process.env.DOUBAO_MODEL?.trim() || "doubao-seedream-4-5-251128";

  const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let parsed: AIErrorPayload | null = null;

    try {
      parsed = JSON.parse(text) as AIErrorPayload;
    } catch {
      // keep raw text fallback
    }

    const code = parsed?.error?.code ?? "";
    const message = parsed?.error?.message ?? text;

    if (code === "InputTextSensitiveContentDetected") {
      throw new Error(
        "提示词触发内容安全策略，请改写后重试（避免敏感、暴力、成人、政治等词汇，改用中性服饰描述）。",
      );
    }

    throw new Error(`AI image generation failed: ${res.status} ${message}`);
  }

  const json = (await res.json()) as unknown;
  const imageUrl = extractDoubaoOutputUrl(json);
  if (!imageUrl) {
    throw new Error("AI image API returned no image URL.");
  }

  return { imageUrl };
}
