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
  mode: "replicate" | "placeholder";
};

const DEFAULT_REPLICATE_VERSION =
  "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

const categoryToGarmentDescription: Record<GarmentCategory, string> = {
  upper_body: "upper body garment",
  lower_body: "lower body garment",
  dresses: "one-piece dress",
};

type ReplicatePrediction = {
  id: string;
  status: string;
  error?: string;
  urls?: { get?: string };
  output?: unknown;
};

function extractOutputUrl(output: unknown): string | null {
  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0];
  }

  return null;
}

async function generateWithReplicate(
  input: TryOnGenerateInput,
): Promise<TryOnGenerateResult | null> {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return null;
  }

  const version = process.env.REPLICATE_TRYON_VERSION ?? DEFAULT_REPLICATE_VERSION;
  const personDataUrl = `data:${input.personMime};base64,${input.personBytes.toString("base64")}`;
  const garmentDataUrl = `data:${input.garmentMime};base64,${input.garmentBytes.toString("base64")}`;

  const start = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        human_img: personDataUrl,
        garm_img: garmentDataUrl,
        garment_des: categoryToGarmentDescription[input.category],
      },
    }),
  });

  if (!start.ok) {
    const text = await start.text();

    throw new Error(`Replicate start failed: ${start.status} ${text}`);
  }

  let prediction = (await start.json()) as ReplicatePrediction;
  const getUrl = prediction.urls?.get;

  if (!getUrl) {
    throw new Error("Replicate response missing poll URL");
  }

  while (prediction.status === "starting" || prediction.status === "processing") {
    await new Promise((r) => {
      setTimeout(r, 1500);
    });

    const poll = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!poll.ok) {
      const text = await poll.text();

      throw new Error(`Replicate poll failed: ${poll.status} ${text}`);
    }

    prediction = (await poll.json()) as ReplicatePrediction;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(prediction.error ?? `Replicate failed: ${prediction.status}`);
  }

  const url = extractOutputUrl(prediction.output);

  if (!url) {
    throw new Error("Replicate returned no image URL");
  }

  const imageRes = await fetch(url);

  if (!imageRes.ok) {
    throw new Error(`Failed to download Replicate output: ${imageRes.status}`);
  }

  const buf = Buffer.from(await imageRes.arrayBuffer());

  return {
    imageBase64: buf.toString("base64"),
    mimeType: imageRes.headers.get("content-type") ?? "image/png",
    mode: "replicate",
  };
}

/**
 * Generates a try-on image. Uses Replicate when REPLICATE_API_TOKEN is set;
 * otherwise echoes the person image as a placeholder for local development.
 */
export async function generateTryOnImage(
  input: TryOnGenerateInput,
): Promise<TryOnGenerateResult> {
  const replicate = await generateWithReplicate(input);

  if (replicate) {
    return replicate;
  }

  return {
    imageBase64: input.personBytes.toString("base64"),
    mimeType: input.personMime,
    mode: "placeholder",
  };
}
