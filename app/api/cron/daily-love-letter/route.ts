import { NextResponse } from "next/server";

import { sendDailyLoveLetter } from "@/lib/email";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type MemberRow = {
  email: string | null;
  name: string | null;
  userid: string | null;
};

function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const expected = process.env.CRON_SECRET?.trim();
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (expected && bearer === expected) {
    return true;
  }

  return isVercelCron;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.DAILY_LOVE_LETTER_ENABLED === "false") {
    return NextResponse.json({ ok: true, skipped: true, reason: "disabled" });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true, reason: "missing RESEND_API_KEY" });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("email,name,userid")
      .not("email", "is", null);

    if (error) {
      throw new Error(error.message);
    }

    const members = ((data ?? []) as MemberRow[]).filter((u) => !!u.email);
    let sent = 0;
    let failed = 0;

    for (const member of members) {
      const userEmail = member.email!.trim().toLowerCase();
      const userName = member.name?.trim() || member.userid?.trim() || "friend";

      try {
        await sendDailyLoveLetter(userEmail, userName);
        sent += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : "unknown error";
        console.error("[daily-love-letter] send failed", { userEmail, userName, message });
      }
    }

    return NextResponse.json({
      ok: true,
      total: members.length,
      sent,
      failed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
