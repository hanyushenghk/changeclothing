import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { callAIImageAPI } from "@/lib/ai-image";
import { uploadToR2 } from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateBody = {
  prompt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody;
    const prompt = body.prompt?.trim() ?? "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const authHeader = request.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    const {
      data: { user: currentUser },
      error: userError,
    } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();

    const isAuthed = !userError && Boolean(currentUser);

    // 1. 调用 AI 接口生成图片，拿到临时链接
    const aiResponse = await callAIImageAPI(prompt);
    const tempImageUrl = aiResponse.imageUrl; // 这是临时链接

    // 2. 下载这张图片
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download generated image: ${imageResponse.status}` },
        { status: 502 },
      );
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 3. 生成一个唯一的文件名
    const fileName = `images/${nanoid()}.png`;

    // 4. 上传到 R2，拿到永久链接
    const permanentUrl = await uploadToR2(imageBuffer, fileName, "image/png");

    // 5. 把永久链接存到数据库（仅登录用户）
    if (isAuthed && currentUser) {
      const { error: insertError } = await supabase.from("generated_images").insert({
        user_id: currentUser.id,
        image_url: permanentUrl, // 存的是永久链接！
        prompt,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // 6. 返回永久链接给前端
    return NextResponse.json({ imageUrl: permanentUrl, saved: isAuthed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate image failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
