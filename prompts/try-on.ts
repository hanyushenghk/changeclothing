import type { GarmentCategory } from "@/lib/types";

const categoryToGarmentDescription: Record<GarmentCategory, string> = {
  upper_body: "上装（含外套/衬衫/T恤等上半身衣物）",
  lower_body: "下装（裤/裙等下半身衣物）",
  dresses: "连衣裙/连体裙装",
};

export function buildTryOnPrompt(category: GarmentCategory): string {
  const garment = categoryToGarmentDescription[category];

  return [
    "【任务 / TASK】Virtual try-on (outfit transfer): put the garment from IMAGE 2 onto the person in IMAGE 1.",
    "",
    "【输入顺序 / INPUT ORDER — must match the uploaded UI】",
    "• image[0] (first image in the `image` array) = USER PERSON PHOTO — full-body or upper-body portrait. This is the ONLY source for identity, face, hair, skin tone, body shape, pose, camera angle, background, and global lighting. Do NOT replace this person or scene.",
    "• image[1] (second image) = GARMENT REFERENCE — flat-lay, hanger shot, or e-commerce product photo. Extract ONLY the garment category: 「"
      + garment
      + "」— silhouette, color, pattern, fabric texture, and structure (neckline, sleeves, hem, placket, pockets, etc.). If image[1] shows a model, copy ONLY the clothes, NOT their face, body, or pose.",
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
