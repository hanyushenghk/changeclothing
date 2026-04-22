import { NextResponse } from "next/server";

import { sendWelcomeEmail } from "@/lib/email";

type Body = {
  email?: string;
  name?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();

  if (!email || !name) {
    return NextResponse.json({ error: "缺少 email 或 name。" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "RESEND_API_KEY 未配置，跳过欢迎邮件发送。",
    });
  }

  try {
    await sendWelcomeEmail(email, name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "发送欢迎邮件失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
