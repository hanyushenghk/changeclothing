import { getR2PublicUrl, r2Client, uploadToR2 as uploadToR2Internal } from "@/lib/s3";

export { r2Client, getR2PublicUrl };

/**
 * Compatibility wrapper:
 * uploadToR2(imageBuffer, fileName, "image/png") => permanent public URL
 */
export async function uploadToR2(
  body: Buffer | Uint8Array | string,
  key: string,
  contentType?: string,
): Promise<string> {
  const uploaded = await uploadToR2Internal({
    body,
    key,
    contentType,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return uploaded.url;
}
