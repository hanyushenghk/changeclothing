import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { uploadToR2 } from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type StoreImageBody = {
  prompt?: string;
  tempImageUrl?: string;
};

function extensionFromContentType(contentType: string | null): string {
  if (!contentType) {
    return "png";
  }

  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return "jpg";
  }

  if (contentType.includes("webp")) {
    return "webp";
  }

  if (contentType.includes("gif")) {
    return "gif";
  }

  return "png";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StoreImageBody;
    const prompt = body.prompt?.trim() ?? "";
    const tempImageUrl = body.tempImageUrl?.trim() ?? "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    if (!tempImageUrl) {
      return NextResponse.json({ error: "Missing tempImageUrl." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(tempImageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid tempImageUrl." }, { status: 400 });
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "tempImageUrl must use http or https." }, { status: 400 });
    }

    const imageResponse = await fetch(parsed.toString());
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch temp image: ${imageResponse.status}` },
        { status: 502 },
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";
    const ext = extensionFromContentType(contentType);
    const fileName = `images/${nanoid()}.${ext}`;

    const uploadedUrl = await uploadToR2(imageBuffer, fileName, contentType);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { error: insertError } = await supabase.from("generated_images").insert({
      user_id: user.id,
      image_url: uploadedUrl,
      prompt,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: uploadedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Store image failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
